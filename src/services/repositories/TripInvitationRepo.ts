import { supabaseClient } from "../SupabaseClient";
import type {
    TripInvitationRow,
    TripInvitationRowInsert,
    TripInvitationVM,
} from "../../models/types/TripInvitationTypes";

export const tripInvitationRepo = {
    async getByTripId(tripId: string | undefined): Promise<TripInvitationVM[]> {
        if (!tripId) return [];
        const { data, error } = await supabaseClient
            .from("trip_invitations")
            .select(`
                *,
                inviter:profiles!trip_invitations_inviter_id_fkey(username, email)
            `)
            .eq("trip_id", tripId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data as unknown as TripInvitationVM[]) ?? [];
    },

    async getByInviteeEmail(email: string | undefined): Promise<TripInvitationVM[]> {
        if (!email) return [];
        const { data, error } = await supabaseClient
            .from("trip_invitations")
            .select(`
                *,
                inviter:profiles!trip_invitations_inviter_id_fkey(username, email)
            `)
            .eq("invitee_email", email.toLowerCase())
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data as unknown as TripInvitationVM[]) ?? [];
    },

    async checkEmailExists(email: string): Promise<boolean> {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    async createInvitation(payload: TripInvitationRowInsert): Promise<TripInvitationRow> {
        const { data, error } = await supabaseClient
            .from("trip_invitations")
            .insert({
                ...payload,
                invitee_email: payload.invitee_email.toLowerCase(),
            })
            .select("*")
            .single();

        if (error) throw error;
        return data;
    },

    async deleteInvitation(id: string): Promise<void> {
        const { error } = await supabaseClient
            .from("trip_invitations")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },
};
