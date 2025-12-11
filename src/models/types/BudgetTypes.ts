import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type BudgetRow = Tables<"budget_items">;
export type BudgetRowInsert = TablesInsert<"budget_items">;
export type BudgetRowUpdate = TablesUpdate<"budget_items">;
