import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type FlightRow = Tables<"flights"> & {
    /** Presentation metadata only; never persisted to the database. */
    display_time_zone?: string;
};
export type FlightRowInsert = TablesInsert<"flights">;
export type FlightRowUpdate = TablesUpdate<"flights">;
