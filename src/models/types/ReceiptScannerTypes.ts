export interface ReceiptLineItem {
    id: string;
    name: string;
    original_name?: string;
    amount: number;
    quantity?: number;
    category: string;
    split_with: string[]; // User IDs sharing this line item
    is_payer_included: boolean;
    selected: boolean;
}

export interface ParsedReceiptData {
    store_name: string;
    original_store_name?: string;
    category?: string;
    category_reason?: string;
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
    knownStores?: ReceiptStoreContext[];
}

export interface ReceiptStoreContext {
    name: string;
    original_name?: string;
    category?: string;
    address?: string;
    phone?: string;
}
