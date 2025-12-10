import { supabaseClient } from "../SupabaseClient";
import { toTripInsert, toTripUpdate } from "../mappers/TripMapper";
import type { TripRow, TripVM } from "../../models/types/TripsTypes";
import IRepo from "./IRepo";

export const tripRepo: IRepo<TripRow, TripVM, TripVM, string> = {
    async getById(id: string | undefined): Promise<TripRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("trips")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined): Promise<TripRow[]> {
        const { data, error } = await supabaseClient.from("trips").select("*");
        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: TripVM): Promise<TripRow | null> {
        const restoredPayload = toTripInsert(payload);
        const { data, error } = await supabaseClient
            .from("trips")
            .insert(restoredPayload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<TripVM>): Promise<TripRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const restoredPatch = toTripUpdate(patch);
        const { data, error } = await supabaseClient
            .from("trips")
            .update(restoredPatch)
            .eq("id", patch.id)
            .select("*")
            .single();

        if (error) throw error;
        return data as TripRow;
    },
    async upsert(payload: TripVM): Promise<TripRow | null> {
        const restoredPayload = toTripInsert(payload);
        const { data, error } = await supabaseClient
            .from("trips")
            .upsert(restoredPayload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("trips")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
