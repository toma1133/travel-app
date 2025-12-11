import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { budgetRepo } from "../../services/repositories/BudgetRepo";
import type { BudgetRow } from "../../models/types/BudgetTypes";

const useBudgets = (tripId: string | undefined) => {
    return useQuery<BudgetRow[]>({
        queryKey: ["budget_items", tripId],
        queryFn: async () => {
            return await budgetRepo.list(tripId);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useBudgets;
