import { supabaseClient } from "../SupabaseClient";
import type { PaymentMethodRow, PaymentMethodRowInsert, PaymentMethodRowUpdate } from "../../models/types/PaymentMethodTypes";
import IRepo from "./IRepo";

export const paymentMethodRepo: IRepo<PaymentMethodRow, PaymentMethodRowInsert, PaymentMethodRowUpdate, string> = {
    async getById(id: string | undefined): Promise<PaymentMethodRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("payment_methods")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined): Promise<PaymentMethodRow[]> {
        if (parentId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("payment_methods")
            .select("*")
            .eq("trip_id", parentId)
            .order("order", { ascending: true, });
        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: PaymentMethodRowInsert): Promise<PaymentMethodRow | null> {
        const { data, error } = await supabaseClient
            .from("payment_methods")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<PaymentMethodRowUpdate>): Promise<PaymentMethodRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const { data, error } = await supabaseClient
            .from("payment_methods")
            .update(patch)
            .eq("id", patch.id)
            .select("*")
            .single();

        if (error) throw error;
        return data;
    },
    async upsert(payload: PaymentMethodRowInsert): Promise<PaymentMethodRow | null> {
        const { data, error } = await supabaseClient
            .from("payment_methods")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("payment_methods")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
