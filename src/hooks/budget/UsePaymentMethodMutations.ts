import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentMethodRepo } from "../../services/repositories/PaymentMethodRepo";
import type { PaymentMethodRowInsert, PaymentMethodRowUpdate } from "../../models/types/PaymentMethodTypes";

const usePaymentMethodMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["payment_method", "insert"],
        mutationFn: (payload: PaymentMethodRowInsert) => paymentMethodRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["payment_method", data?.id] });
            qc.invalidateQueries({ queryKey: ["payment_methods"] });
        },
    });
    const update = useMutation({
        mutationKey: ["payment_method", "update"],
        mutationFn: (payload: PaymentMethodRowUpdate) => paymentMethodRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["payment_method", data?.id] });
            qc.invalidateQueries({ queryKey: ["payment_methods"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["payment_method", "upsert"],
        mutationFn: (payload: PaymentMethodRowInsert) => paymentMethodRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["payment_method", data?.id] });
            qc.invalidateQueries({ queryKey: ["payment_methods"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["payment_method", "remove"],
        mutationFn: (id: string) => paymentMethodRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["payment_method", id] });
            qc.invalidateQueries({ queryKey: ["payment_methods"] });
        },
    });
    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default usePaymentMethodMutations;
