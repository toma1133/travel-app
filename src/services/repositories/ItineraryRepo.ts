import { supabaseClient } from "../SupabaseClient";
import { toItineraryInsert, toItineraryUpdate } from "../mappers/ItineraryMapper";
import { ItineraryRow, ItineraryVM } from "../../models/types/ItineraryTypes";
import IRepo from "./IRepo";

export const itineraryRepo: IRepo<ItineraryRow, ItineraryVM, ItineraryVM, string> = {
    async getById(id: string | undefined): Promise<ItineraryRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("itinerary_days")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined): Promise<ItineraryRow[]> {
        if (parentId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("itinerary_days")
            .select("*")
            .eq("trip_id", parentId)
            .order("date", { ascending: true, })
            .order("day_num", { ascending: true, });
        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: ItineraryVM): Promise<ItineraryRow | null> {
        const restoredPayload = toItineraryInsert(payload);
        const { data, error } = await supabaseClient
            .from("itinerary_days")
            .insert(restoredPayload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<ItineraryVM>): Promise<ItineraryRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const restoredPatch = toItineraryUpdate(patch);
        const { data, error } = await supabaseClient
            .from("itinerary_days")
            .update(restoredPatch)
            .eq("id", patch.id)
            .select("*")
            .single();
        if (error) throw error;
        return data as ItineraryVM;
    },
    async upsert(payload: ItineraryVM): Promise<ItineraryRow | null> {
        const restoredPayload = toItineraryInsert(payload);
        const { data, error } = await supabaseClient
            .from("itinerary_days")
            .upsert(restoredPayload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("itinerary_days")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
