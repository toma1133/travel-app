import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type TripInvitationRow = Tables<"trip_invitations">;
export type TripInvitationRowInsert = TablesInsert<"trip_invitations">;
export type TripInvitationRowUpdate = TablesUpdate<"trip_invitations">;

export interface TripInvitationVM extends TripInvitationRow {
    trips?: {
        title: string;
        cover_image: string | null;
    } | null;
    inviter?: {
        username: string | null;
        email: string;
    } | null;
}
