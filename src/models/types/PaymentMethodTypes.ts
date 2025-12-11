import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type PaymentMethodRow = Tables<"payment_methods">;
export type PaymentMethodRowInsert = TablesInsert<"payment_methods">;
export type PaymentMethodRowUpdate = TablesUpdate<"payment_methods">;
