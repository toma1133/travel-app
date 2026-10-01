import type { BudgetRow } from "../models/types/BudgetTypes";

/** Preserve OCR metadata while making the saved participants agree with the selected split mode. */
export function prepareBudgetForSave(form: BudgetRow, splitMode?: "simple" | "itemized"): BudgetRow {
    const row = { ...form, amount: Number(form.amount) };
    if (!row.receipt_items?.length) return row;
    if (splitMode === "simple") {
        const participants = Array.from(new Set([...(row.split_with || []), ...(row.is_payer_included !== false ? [row.user_id] : [])]));
        row.receipt_items = row.receipt_items.map((item) => ({
            ...item, split_with: participants, is_payer_included: row.is_payer_included !== false,
        }));
    }
    row.split_with = Array.from(new Set(row.receipt_items.flatMap((item) => item.split_with || []))).filter((id) => id !== row.user_id);
    row.is_payer_included = row.receipt_items.some((item) => item.is_payer_included !== false || item.split_with.includes(row.user_id));
    return row;
}
