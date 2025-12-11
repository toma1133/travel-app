import { supabaseClient } from "../SupabaseClient";
import { AccommodationRow, AccommodationRowInsert, AccommodationRowUpdate } from "../../models/types/AccommodationTypes";
import IRepo from "./IRepo";

export const accommodationRepo: IRepo<AccommodationRow, AccommodationRowInsert, AccommodationRowUpdate, string>
    = {
    async getById(id: string | undefined): Promise<AccommodationRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("accommodations")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined): Promise<AccommodationRow[]> {
        if (!parentId) return [];
        const { data, error } = await supabaseClient
            .from("accommodations")
            .select("*")
            .eq("trip_id", parentId)
            .order("check_in_date", { ascending: true, })
            .order("id", { ascending: true, });

        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: AccommodationRowInsert): Promise<AccommodationRow | null> {
        const { data, error } = await supabaseClient
            .from("accommodations")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<AccommodationRowUpdate>): Promise<AccommodationRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const { data, error } = await supabaseClient
            .from("accommodations")
            .update(patch)
            .eq("id", patch.id)
            .select("*")
            .single();

        if (error) throw error;
        return data;
    },
    async upsert(payload: AccommodationRowInsert): Promise<AccommodationRow | null> {
        const { data, error } = await supabaseClient
            .from("accommodations")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("accommodations")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
