import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shoppingRepo } from "../../services/repositories/ShoppingRepo";
import type {
    ShoppingItemRowInsert,
    ShoppingItemRowUpdate,
} from "../../models/types/ShoppingTypes";

const useShoppingMutations = () => {
    const qc = useQueryClient();

    const insert = useMutation({
        mutationKey: ["shopping_item", "insert"],
        mutationFn: (payload: ShoppingItemRowInsert) => shoppingRepo.insert(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["shopping_items"] });
        },
    });

    const update = useMutation({
        mutationKey: ["shopping_item", "update"],
        mutationFn: (payload: Partial<ShoppingItemRowUpdate>) =>
            shoppingRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["shopping_item", data?.id] });
            qc.invalidateQueries({ queryKey: ["shopping_items"] });
        },
    });

    const upsert = useMutation({
        mutationKey: ["shopping_item", "upsert"],
        mutationFn: (payload: ShoppingItemRowInsert) => shoppingRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["shopping_item", data?.id] });
            qc.invalidateQueries({ queryKey: ["shopping_items"] });
        },
    });

    const remove = useMutation({
        mutationKey: ["shopping_item", "remove"],
        mutationFn: (id: string) => shoppingRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["shopping_item", id] });
            qc.invalidateQueries({ queryKey: ["shopping_items"] });
        },
    });

    const toggleComplete = useMutation({
        mutationKey: ["shopping_item", "toggle"],
        mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
            shoppingRepo.update({ id, is_completed: isCompleted }),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["shopping_item", data?.id] });
            qc.invalidateQueries({ queryKey: ["shopping_items"] });
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
