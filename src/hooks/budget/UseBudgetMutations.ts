import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetRepo } from "../../services/repositories/BudgetRepo";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type { BudgetRowInsert, BudgetRowUpdate } from "../../models/types/BudgetTypes";

export const useBudgetMutations = (tripId?: string, userId?: string) => {
    const qc = useQueryClient();

    const invalidateBudgetData = (targetTripId?: string, itemId?: string) => {
        if (itemId) {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.budget.detail(itemId) });
        }
        if (targetTripId || userId) {
            qc.invalidateQueries({
                queryKey: QUERY_KEYS.budget.list(targetTripId ?? tripId, userId),
            });
        }
        qc.invalidateQueries({ queryKey: QUERY_KEYS.budget.all });
    };

    const insert = useMutation({
        mutationKey: ["budget_item", "insert"],
        mutationFn: (payload: BudgetRowInsert) => budgetRepo.insert(payload),
        onSuccess: (data, variables) => {
            invalidateBudgetData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const update = useMutation({
        mutationKey: ["budget_item", "update"],
        mutationFn: (payload: BudgetRowUpdate) => budgetRepo.update(payload),
        onSuccess: (data, variables) => {
            invalidateBudgetData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const upsert = useMutation({
        mutationKey: ["budget_item", "upsert"],
        mutationFn: (payload: BudgetRowInsert) => budgetRepo.upsert(payload),
        onSuccess: (data, variables) => {
            invalidateBudgetData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const remove = useMutation({
        mutationKey: ["budget_item", "remove"],
        mutationFn: (id: string) => budgetRepo.delete(id),
        onSuccess: (_, id) => {
            invalidateBudgetData(tripId, id);
        },
    });

    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default useBudgetMutations;
