import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetRepo } from "../../services/repositories/BudgetRepo";
import type { BudgetRowInsert, BudgetRowUpdate } from "../../models/types/BudgetTypes";

const useBudgetMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["budget_item", "insert"],
        mutationFn: (payload: BudgetRowInsert) => budgetRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["budget_item", data?.id] });
            qc.invalidateQueries({ queryKey: ["budget_items"] });
        },
    });
    const update = useMutation({
        mutationKey: ["budget_item", "update"],
        mutationFn: (payload: BudgetRowUpdate) => budgetRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["budget_item", data?.id] });
            qc.invalidateQueries({ queryKey: ["budget_items"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["budget_item", "upsert"],
        mutationFn: (payload: BudgetRowInsert) => budgetRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["budget_item", data?.id] });
            qc.invalidateQueries({ queryKey: ["budget_items"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["budget_item", "remove"],
        mutationFn: (id: string) => budgetRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["budget_item", id] });
            qc.invalidateQueries({ queryKey: ["budget_items"] });
        },
    });
    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default useBudgetMutations;
