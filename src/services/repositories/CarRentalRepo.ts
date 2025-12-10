import { supabaseClient } from "../SupabaseClient";
import { CarRentalRow, CarRentalRowInsert, CarRentalRowUpdate } from "../../models/types/CarRentalTypes";
import IRepo from "./IRepo";

export const carRentalRepo: IRepo<CarRentalRow, CarRentalRowInsert, CarRentalRowUpdate, string> = {
    async getById(id: string | undefined): Promise<CarRentalRow | null> {
        if (id === undefined || id === null) return null;
        const { data, error } = await supabaseClient
            .from("car_rentals")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data ?? null;
    },
    async list(parentId: string | undefined): Promise<CarRentalRow[]> {
        if (parentId === undefined) return [];
        const { data, error } = await supabaseClient
            .from("car_rentals")
            .select("*")
            .eq("trip_id", parentId)
            .order("pickup_datetime", { ascending: true, });
        if (error) throw error;
        return data ?? [];
    },
    async insert(payload: CarRentalRowInsert): Promise<CarRentalRow | null> {
        const { data, error } = await supabaseClient
            .from("car_rentals")
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async update(patch: Partial<CarRentalRowUpdate>): Promise<CarRentalRow | null> {
        if (patch.id === null || patch.id === undefined) throw "ID is null";
        const { data, error } = await supabaseClient
            .from("car_rentals")
            .update(patch)
            .eq("id", patch.id)
            .select("*")
            .single();
        if (error) throw error;
        return data as CarRentalRow;
    },
    async upsert(payload: CarRentalRowInsert): Promise<CarRentalRow | null> {
        const { data, error } = await supabaseClient
            .from("car_rentals")
            .upsert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data!;
    },
    async delete(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("car_rentals")
            .delete()
            .eq("id", id);
        if (error) throw error;
    },
};
