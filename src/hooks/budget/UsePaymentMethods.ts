import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { paymentMethodRepo } from "../../services/repositories/PaymentMethodRepo";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";

const usePaymentMethods = (
    tripId: string | undefined,
    userId: string | undefined
) => {
    return useQuery<PaymentMethodRow[]>({
        queryKey: ["payment_methods", tripId, userId],
        queryFn: async () => {
            return await paymentMethodRepo.list(tripId);
        },
        enabled: !!tripId && !!userId,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default usePaymentMethods;
