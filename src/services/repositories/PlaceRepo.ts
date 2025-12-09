import { supabaseClient } from "../SupabaseClient";
import { toPlaceInsert, toPlaceUpdate } from "../mappers/PlaceMapper";
import type { PlaceRow, PlaceVM } from "../../models/types/PlacesTypes";

export const placeRepo = {
    async getPlace(id: string | undefined): Promise<PlaceRow | null> {
        if (id === undefined) return null;
        const { data, error } = await supabaseClient
            .from("places")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async listPlaces(tripId: string | undefined): Promise<PlaceRow[]> {
        if (tripId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("places")
            .select("*")
            .eq("trip_id", tripId);
        if (error) throw error;
        return data ?? [];
    },
    async insertPlace(vm: PlaceVM) {
        const payload = toPlaceInsert(vm);
        const { data, error } = await supabaseClient
            .from("places")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async updatePlace(id: string, vmPatch: Partial<PlaceVM>) {
        const patch = toPlaceUpdate(vmPatch);
        const { data, error } = await supabaseClient
            .from("places")
            .update(patch)
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw error;
        return data as PlaceRow;
    },
    async upsertPlace(vm: PlaceVM) {
        const payload = toPlaceInsert(vm);
        const { data, error } = await supabaseClient
            .from("places")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async deletePlace(id: string) {
        const { error } = await supabaseClient
            .from("places")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
