import { supabaseClient } from "../SupabaseClient";
import { toPlaceInsert, toPlaceUpdate } from "../mappers/PlaceMapper";
import type { PlaceRow, PlaceVM } from "../../models/types/PlaceTypes";
import IRepo from "./IRepo";

export const placeRepo: IRepo<PlaceRow, PlaceVM, PlaceVM, string> = {
    async getById(id: string | undefined): Promise<PlaceRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("places")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined, query: string | undefined): Promise<PlaceRow[]> {
        if (parentId === undefined) return [];

        let queryBuilder = supabaseClient
            .from("places")
            .select("*")
            .eq("trip_id", parentId)
            .order("type", { ascending: true, })
            .order("id", { ascending: true, });

        if (query) {
            queryBuilder = queryBuilder
                .ilike("name", `%${query}%`)
                .limit(10);
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: PlaceVM): Promise<PlaceRow | null> {
        const restoredPayload = toPlaceInsert(payload);
        const { data, error } = await supabaseClient
            .from("places")
            .insert(restoredPayload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<PlaceVM>): Promise<PlaceRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const restoredPatch = toPlaceUpdate(patch);
        const { data, error } = await supabaseClient
            .from("places")
            .update(restoredPatch)
            .eq("id", patch.id)
            .select("*")
            .single();
        if (error) throw error;
        return data;
    },
    async upsert(payload: PlaceVM): Promise<PlaceRow | null> {
        const restoredPayload = toPlaceInsert(payload);
        const { data, error } = await supabaseClient
            .from("places")
            .upsert(restoredPayload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("places")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
