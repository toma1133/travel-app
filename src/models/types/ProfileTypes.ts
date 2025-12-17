import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type ProfileRow = Tables<"profiles">;
export type ProfileRowInsert = TablesInsert<"profiles">;
export type ProfileRowUpdate = TablesUpdate<"profiles">;
