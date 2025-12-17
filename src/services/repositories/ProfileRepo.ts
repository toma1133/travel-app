import { supabaseClient } from "../SupabaseClient";
import {
    ProfileRow,
    ProfileRowInsert,
    ProfileRowUpdate,
} from "../../models/types/ProfileTypes";
import IRepo from "./IRepo";

export const profileRepo: IRepo<
    ProfileRow,
    ProfileRowInsert,
    ProfileRowUpdate,
    string
> = {
    async getById(id: string | undefined): Promise<ProfileRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(): Promise<ProfileRow[]> {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: true });
        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: ProfileRowInsert): Promise<ProfileRow | null> {
        const { data, error } = await supabaseClient
            .from("profiles")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<ProfileRowUpdate>): Promise<ProfileRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const { data, error } = await supabaseClient
            .from("profiles")
            .update(patch)
            .eq("id", patch.id)
            .select("*")
            .single();
        if (error) throw error;
        return data;
    },
    async upsert(payload: ProfileRowInsert): Promise<ProfileRow | null> {
        const { data, error } = await supabaseClient
            .from("profiles")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("profiles")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
