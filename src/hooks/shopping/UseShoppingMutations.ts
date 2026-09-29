import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shoppingRepo } from "../../services/repositories/ShoppingRepo";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type {
    ShoppingItemRowInsert,
    ShoppingItemRowUpdate,
    ShoppingItemVM,
} from "../../models/types/ShoppingTypes";

export const useShoppingMutations = (tripId?: string) => {
    const qc = useQueryClient();

    const invalidateShoppingData = (targetTripId?: string, itemId?: string) => {
        if (itemId) {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.shopping.detail(itemId) });
        }
        if (targetTripId) {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.shopping.list(targetTripId) });
        }
        qc.invalidateQueries({ queryKey: QUERY_KEYS.shopping.all });
    };

    const insert = useMutation({
        mutationKey: ["shopping_item", "insert"],
        mutationFn: (payload: ShoppingItemRowInsert) => shoppingRepo.insert(payload),
        onSuccess: (data, variables) => {
            invalidateShoppingData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const update = useMutation({
        mutationKey: ["shopping_item", "update"],
        mutationFn: (payload: Partial<ShoppingItemRowUpdate>) =>
            shoppingRepo.update(payload),
        onSuccess: (data, variables) => {
            invalidateShoppingData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const upsert = useMutation({
        mutationKey: ["shopping_item", "upsert"],
        mutationFn: (payload: ShoppingItemRowInsert) => shoppingRepo.upsert(payload),
        onSuccess: (data, variables) => {
            invalidateShoppingData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const remove = useMutation({
        mutationKey: ["shopping_item", "remove"],
        mutationFn: (id: string) => shoppingRepo.delete(id),
        onSuccess: (_, id) => {
            invalidateShoppingData(tripId, id);
        },
    });

    // 支援樂觀更新的快速勾選/取消完成狀態
    const toggleComplete = useMutation({
        mutationKey: ["shopping_item", "toggle"],
        mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
            shoppingRepo.update({ id, is_completed: isCompleted }),
        onMutate: async ({ id, isCompleted }) => {
            if (!tripId) return;

            const queryKey = QUERY_KEYS.shopping.list(tripId);
            await qc.cancelQueries({ queryKey });
            const previousItems = qc.getQueryData<ShoppingItemVM[]>(queryKey);

            if (previousItems) {
                qc.setQueryData<ShoppingItemVM[]>(queryKey, (old) =>
                    old?.map((item) =>
                        item.id === id ? { ...item, is_completed: isCompleted } : item
                    )
                );
            }

            return { previousItems, queryKey };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousItems && context?.queryKey) {
                qc.setQueryData(context.queryKey, context.previousItems);
            }
        },
        onSettled: (data) => {
            invalidateShoppingData(tripId, data?.id);
        },
    });

    const anyPending =
        insert.isPending ||
        update.isPending ||
        upsert.isPending ||
        remove.isPending ||
        toggleComplete.isPending;

    return { insert, update, upsert, remove, toggleComplete, anyPending };
};

export default useShoppingMutations;
