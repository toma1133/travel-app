export type ShoppingRecord = {
    id?: string;
    store: string;
    price: number;
    quantity: number;
    date?: string;
    note?: string;
};

export type ShoppingItemRow = {
    id: string;
    trip_id: string;
    user_id: string;
    name: string;
    local_name: string | null;
    image_url: string | null;
    store: string | null;
    place_id: string | null;
    recipients: string[] | null;
    recipient_allocations?: Record<string, number> | null;
    target_quantity?: number | null;
    is_completed: boolean;
    category: string | null;
    target_specs: string | null;
    records: ShoppingRecord[] | null;
    tax_free_threshold: number | null;
    currency: string | null;
    note: string | null;
    priority: number | null;
    created_at: string | null;
    updated_at: string | null;
};

export type ShoppingItemRowInsert = {
    id?: string;
    trip_id: string;
    user_id?: string;
    name: string;
    local_name?: string | null;
    image_url?: string | null;
    store?: string | null;
    place_id?: string | null;
    recipients?: string[] | null;
    recipient_allocations?: Record<string, number> | null;
    target_quantity?: number | null;
    is_completed?: boolean;
    category?: string | null;
    target_specs?: string | null;
    records?: ShoppingRecord[] | null;
    tax_free_threshold?: number | null;
    currency?: string | null;
    note?: string | null;
    priority?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
};

export type ShoppingItemRowUpdate = Partial<ShoppingItemRowInsert> & {
    id: string;
};

export type ShoppingItemVM = ShoppingItemRow;

export type ShoppingCategory = {
    id: string;
    label: string;
    emoji: string;
};

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
    { id: "cosmetics", label: "美妝保養", emoji: "💄" },
    { id: "medicine", label: "醫藥保健", emoji: "💊" },
    { id: "snacks", label: "零食點心", emoji: "🍪" },
    { id: "souvenirs", label: "特產伴手禮", emoji: "🎁" },
    { id: "electronics", label: "3C電器", emoji: "🔌" },
    { id: "fashion", label: "服飾配件", emoji: "👗" },
    { id: "grocery", label: "生活日用", emoji: "🧴" },
    { id: "other", label: "其他商品", emoji: "🛍️" },
];

export const getCategoryEmoji = (categoryId: string | null | undefined): string => {
    const item = SHOPPING_CATEGORIES.find((c) => c.id === categoryId);
    return item ? item.emoji : "🛍️";
};

export const RECIPIENT_COLORS = [
    { bg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30", hex: "#f43f5e" },
    { bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", hex: "#f59e0b" },
    { bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", hex: "#10b981" },
    { bg: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", hex: "#0ea5e9" },
    { bg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30", hex: "#6366f1" },
    { bg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30", hex: "#a855f7" },
    { bg: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30", hex: "#ec4899" },
    { bg: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30", hex: "#14b8a6" },
];

export const getRecipientColorStyle = (recipient: string) => {
    let hash = 0;
    for (let i = 0; i < recipient.length; i++) {
        hash = recipient.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % RECIPIENT_COLORS.length;
    return RECIPIENT_COLORS[index];
};
