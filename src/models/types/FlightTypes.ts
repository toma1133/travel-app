import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type FlightRow = Tables<"flights">;
export type FlightRowInsert = TablesInsert<"flights">;
export type FlightRowUpdate = TablesUpdate<"flights">;
