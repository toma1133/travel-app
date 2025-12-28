import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { budgetRepo } from "../../services/repositories/BudgetRepo";
import type { BudgetRow } from "../../models/types/BudgetTypes";

const useBudgets = (tripId: string | undefined, userId: string | undefined) => {
    return useQuery<BudgetRow[]>({
        queryKey: ["budget_items", tripId, userId],
        queryFn: async () => {
            return await budgetRepo.list(tripId);
        },
        enabled: !!tripId && !!userId,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useBudgets;
