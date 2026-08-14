import { supabaseClient } from "../SupabaseClient";
import { toPlaceInsert, toPlaceUpdate } from "../mappers/PlaceMapper";
import type { PlaceRow, PlaceVM } from "../../models/types/PlaceTypes";
import IRepo from "./IRepo";

const placeCache = new Map<string, PlaceRow>();

export const placeRepo: IRepo<PlaceRow, PlaceVM, PlaceVM, string> = {
    async getById(id: string | undefined): Promise<PlaceRow | null> {
        if (id === undefined || id === null) return null;
        if (placeCache.has(id)) {
            return placeCache.get(id)!;
        }
        const { data, error } = await supabaseClient
            .from("places")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        if (data) {
            placeCache.set(id, data);
        }
        return data ?? null;
    },
    async getByIds(ids: string[]): Promise<PlaceRow[]> {
        if (!ids || ids.length === 0) return [];
        const missingIds = ids.filter(id => !placeCache.has(id));
        if (missingIds.length > 0) {
            // Split into chunks if too many, but Supabase handles reasonably sized arrays well.
            const { data, error } = await supabaseClient
                .from("places")
                .select("*")
                .in("id", missingIds);
            if (error) throw error;
            if (data) {
                data.forEach(p => placeCache.set(p.id, p));
            }
        }
        return ids.map(id => placeCache.get(id)).filter(Boolean) as PlaceRow[];
    },
    async list(parentId: string | undefined): Promise<PlaceRow[]> {
        if (parentId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("places")
            .select("*")
            .eq("trip_id", parentId)
            .order("type", { ascending: true, })
            .order("id", { ascending: true, });
        if (error) throw error;
        if (data) {
            data.forEach((p) => placeCache.set(p.id, p));
        }
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
        if (data) placeCache.set(data.id, data);
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
        if (data) placeCache.set(data.id, data);
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
        if (data) placeCache.set(data.id, data);
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("places")
            .delete()
            .eq("id", id);
        if (error) throw error;
        placeCache.delete(id);
    },
};
