export interface ReceiptLineItem {
    id: string;
    name: string;
    amount: number;
    quantity?: number;
    category: string;
    split_with: string[]; // User IDs sharing this line item
    is_payer_included: boolean;
    selected: boolean;
}

export interface ParsedReceiptData {
    store_name: string;
    date: string;
    currency: string;
    total_amount: number;
    items: ReceiptLineItem[];
    raw_text?: string;
    confidence?: number;
    source: "gemini_vision" | "mock_engine" | "manual";
}

export interface ReceiptScanOptions {
    apiKey?: string;
    tripCurrency?: string;
    defaultPayerId?: string;
    allMemberIds?: string[];
}
