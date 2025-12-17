import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type TripMemberRow = Tables<"trip_members">;
export type TripMemberRowInsert = TablesInsert<"trip_members">;
export type TripMemberRowUpdate = TablesUpdate<"trip_members">;
