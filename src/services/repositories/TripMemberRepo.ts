import { supabaseClient } from "../SupabaseClient";
import {
    TripMemberRow,
    TripMemberRowInsert,
    TripMemberRowUpdate,
    TripMemberVM,
} from "../../models/types/TripMemberTypes";
import IRepo from "./IRepo";

export const tripMemberRepo: IRepo<
    TripMemberRow,
    TripMemberRowInsert,
    TripMemberRowUpdate,
    string
> = {
    async getById(id: string | undefined): Promise<TripMemberRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("trip_members")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined): Promise<TripMemberVM[]> {
        if (parentId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("trip_members")
            .select(`
                *,
                profiles (
                    username,
                    email
                )
            `)
            .eq("trip_id", parentId)
            .order("joined_at", { ascending: true });
        if (error) throw error;
        return (data as unknown as TripMemberVM[]) ?? [];
    },
    async insert(payload: TripMemberRowInsert): Promise<TripMemberRow | null> {
        const { data, error } = await supabaseClient
            .from("trip_members")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(
        patch: Partial<TripMemberRowUpdate>,
    ): Promise<TripMemberRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const { data, error } = await supabaseClient
            .from("trip_members")
            .update(patch)
            .eq("id", patch.id)
            .select("*")
            .single();
        if (error) throw error;
        return data;
    },
    async upsert(payload: TripMemberRowInsert): Promise<TripMemberRow | null> {
        const { data, error } = await supabaseClient
            .from("trip_members")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("trip_members")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
