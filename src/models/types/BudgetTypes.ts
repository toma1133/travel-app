import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";
import type { ReceiptLineItem } from "./ReceiptScannerTypes";

export type BudgetSubItem = ReceiptLineItem;

export type BudgetRow = Omit<Tables<"budget_items">, "receipt_items"> & {
    receipt_items?: BudgetSubItem[] | null;
};

export type BudgetRowInsert = Omit<TablesInsert<"budget_items">, "receipt_items"> & {
    receipt_items?: BudgetSubItem[] | null;
};

export type BudgetRowUpdate = Omit<TablesUpdate<"budget_items">, "receipt_items"> & {
    receipt_items?: BudgetSubItem[] | null;
};

