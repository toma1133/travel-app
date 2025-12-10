import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type CarRentalRow = Tables<"car_rentals">;
export type CarRentalRowInsert = TablesInsert<"car_rentals">;
export type CarRentalRowUpdate = TablesUpdate<"car_rentals">;
