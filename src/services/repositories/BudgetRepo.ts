import { supabaseClient } from "../SupabaseClient";
import type { BudgetRow, BudgetRowInsert, BudgetRowUpdate } from "../../models/types/BudgetTypes";
import IRepo from "./IRepo";

export const budgetRepo: IRepo<BudgetRow, BudgetRowInsert, BudgetRowUpdate, string> = {
    async getById(id: string | undefined): Promise<BudgetRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("budget_items")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return (data as unknown as BudgetRow) ?? null;
    },
    async list(parentId: string | undefined): Promise<BudgetRow[]> {
        if (parentId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("budget_items")
            .select("*")
            .eq("trip_id", parentId)
            .order("expense_date", { ascending: false, })
            .order("updated_at", { ascending: false, })
            .order("category", { ascending: true, });
        if (error) throw error;
        return (data as unknown as BudgetRow[]) ?? [];
    },
    async insert(payload: BudgetRowInsert): Promise<BudgetRow | null> {
        try {
            const { data, error } = await supabaseClient
                .from("budget_items")
                .insert(payload as any)
                .select("*")
                .single();
            if (error) throw error;
            return data as unknown as BudgetRow;
        } catch (error: any) {
            if (payload.receipt_items && (error.message?.includes("receipt_items") || error.details?.includes("receipt_items") || error.code === "PGRST204" || error.code === "42703")) {
                console.warn("Supabase 尚未新增 receipt_items 欄位，略過該欄位重試。請記得在 Supabase 執行 migration。");
                const { receipt_items, ...rest } = payload;
                const { data, error: retryErr } = await supabaseClient
                    .from("budget_items")
                    .insert(rest as any)
                    .select("*")
                    .single();
                if (retryErr) throw retryErr;
                return data as unknown as BudgetRow;
            }
            throw error;
        }
    },
    async update(patch: Partial<BudgetRowUpdate>): Promise<BudgetRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        try {
            const { data, error } = await supabaseClient
                .from("budget_items")
                .update(patch as any)
                .eq("id", patch.id)
                .select("*")
                .single();

            if (error) throw error;
            return data as unknown as BudgetRow;
        } catch (error: any) {
            if (patch.receipt_items && (error.message?.includes("receipt_items") || error.details?.includes("receipt_items") || error.code === "PGRST204" || error.code === "42703")) {
                console.warn("Supabase 尚未新增 receipt_items 欄位，略過該欄位重試更新。");
                const { receipt_items, ...rest } = patch;
                const { data, error: retryErr } = await supabaseClient
                    .from("budget_items")
                    .update(rest as any)
                    .eq("id", patch.id)
                    .select("*")
                    .single();
                if (retryErr) throw retryErr;
                return data as unknown as BudgetRow;
            }
            throw error;
        }
    },
    async upsert(payload: BudgetRowInsert): Promise<BudgetRow | null> {
        try {
            const { data, error } = await supabaseClient
                .from("budget_items")
                .upsert(payload as any)
                .select("*")
                .single();
            if (error) throw error;
            return data as unknown as BudgetRow;
        } catch (error: any) {
            if (payload.receipt_items && (error.message?.includes("receipt_items") || error.details?.includes("receipt_items") || error.code === "PGRST204" || error.code === "42703")) {
                console.warn("Supabase 尚未新增 receipt_items 欄位，略過該欄位重試 upsert。");
                const { receipt_items, ...rest } = payload;
                const { data, error: retryErr } = await supabaseClient
                    .from("budget_items")
                    .upsert(rest as any)
                    .select("*")
                    .single();
                if (retryErr) throw retryErr;
                return data as unknown as BudgetRow;
            }
            throw error;
        }
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("budget_items")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
