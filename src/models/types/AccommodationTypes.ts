import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type AccommodationRow = Tables<"accommodations">;
export type AccommodationRowInsert = TablesInsert<"accommodations">;
export type AccommodationRowUpdate = TablesUpdate<"accommodations">;
