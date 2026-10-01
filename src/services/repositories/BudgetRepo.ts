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
        const { data, error } = await supabaseClient
            .from("budget_items")
            .insert(payload as any)
            .select("*")
            .single();
        if (error) throw error;
        return data as unknown as BudgetRow;
    },
    async update(patch: Partial<BudgetRowUpdate>): Promise<BudgetRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const { data, error } = await supabaseClient
            .from("budget_items")
            .update(patch as any)
            .eq("id", patch.id)
            .select("*")
            .single();

        if (error) throw error;
        return data as unknown as BudgetRow;
    },
    async upsert(payload: BudgetRowInsert): Promise<BudgetRow | null> {
        const { data, error } = await supabaseClient
            .from("budget_items")
            .upsert(payload as any)
            .select("*")
            .single();
        if (error) throw error;
        return data as unknown as BudgetRow;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("budget_items")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
