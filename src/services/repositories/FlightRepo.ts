import { supabaseClient } from "../SupabaseClient";
import { FlightRow, FlightRowInsert, FlightRowUpdate } from "../../models/types/FlightTypes";
import IRepo from "./IRepo";

export const flightRepo: IRepo<FlightRow, FlightRowInsert, FlightRowUpdate, string> = {
    async getById(id: string | undefined): Promise<FlightRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("flights")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined): Promise<FlightRow[]> {
        if (parentId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("flights")
            .select("*")
            .eq("trip_id", parentId)
            .order("flight_date", { ascending: true, })
            .order("departure_time", { ascending: true, });
        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: FlightRowInsert): Promise<FlightRow | null> {
        const { data, error } = await supabaseClient
            .from("flights")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<FlightRowUpdate>): Promise<FlightRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const { data, error } = await supabaseClient
            .from("flights")
            .update(patch)
            .eq("id", patch.id)
            .select("*")
            .single();
        if (error) throw error;
        return data as FlightRow;
    },
    async upsert(payload: FlightRowInsert): Promise<FlightRow | null> {
        const { data, error } = await supabaseClient
            .from("flights")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("flights")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
