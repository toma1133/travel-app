import { supabaseClient } from "../SupabaseClient";
import { toTripInsert, toTripUpdate } from "../mappers/TripMapper";
import type { TripRow, TripVM } from "../../models/types/TripsTypes";

export const tripRepo = {
    async getTrip(id: string | undefined): Promise<TripRow | null> {
        if (id === undefined) return null;

        const { data, error } = await supabaseClient
            .from("trips")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async listTrips(): Promise<TripRow[]> {
        const { data, error } = await supabaseClient.from("trips").select("*");
        if (error) throw error;
        return data ?? [];
    },
    async insertTrip(vm: TripVM) {
        const payload = toTripInsert(vm);
        const { data, error } = await supabaseClient
            .from("trips")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async updateTrip(id: string, vmPatch: Partial<TripVM>) {
        const patch = toTripUpdate(vmPatch);
        const { data, error } = await supabaseClient
            .from("trips")
            .update(patch)
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw error;
        return data as TripRow;
    },
    async upsertTrip(vm: TripVM) {
        const payload = toTripInsert(vm);
        const { data, error } = await supabaseClient
            .from("trips")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async deleteTrip(id: string) {
        const { error } = await supabaseClient.from("trips").delete().eq("id", id);
        if (error) throw error;
    },
};
