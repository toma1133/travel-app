import type { ParsedReceiptData, ReceiptLineItem } from "../../models/types/ReceiptScannerTypes";
import { CATEGORY_DEFINITIONS } from "../../constants/Categories";

/**
 * 根據品項名稱推測分類
 */
export function guessCategoryByName(name: string): string {
    const lower = name.toLowerCase();
    if (/(咖啡|拿鐵|紅茶|綠茶|點心|甜點|蛋糕|抹茶|珍珠|麵包|cafe|coffee|tea|dessert|bakery)/i.test(lower)) {
        return "cafe";
    }
    if (/(定食|拉麵|壽司|燒肉|便當|火鍋|餐|飯|麵|居酒屋|串燒|麥當勞|肯德基|丼|beer|food|meal|dinner|lunch|breakfast)/i.test(lower)) {
        return "food";
    }
    if (/(車票|地鐵|巴士|電車|計程車|suica|pasmo|icoca|ticket|train|bus|metro|taxi)/i.test(lower)) {
        return "transport";
    }
    if (/(門票|入場券|展覽|影城|水族館|迪士尼|環球|museum|aquarium|park)/i.test(lower)) {
        return "activity";
    }
    if (/(藥妝|面膜|合利他命|eve|保養|伴手禮|餅乾|巧克力|衣服|襯衫|免稅|duty\s*free|donki|唐吉訶德|松本清|uniqlo|gu)/i.test(lower)) {
        return "shopping";
    }
    return "other"; // 無明確線索時不強制分類為購物
}

export function normalizeReceipt(parsed: any, fallbackCurrency: string, allMemberIds: string[]): ParsedReceiptData {
    const category = (value: unknown, name: string): string => {
        const normalized = value === "ticket" ? "activity" : value;
        return CATEGORY_DEFINITIONS.some((c) => c.id === normalized)
            ? String(normalized) : guessCategoryByName(name);
    };
    const number = (value: unknown, fallback: number): number => {
        if (value === null || value === undefined || value === "") return fallback;
        const result = Number(value);
        return Number.isFinite(result) ? result : fallback;
    };
    const items: ReceiptLineItem[] = (Array.isArray(parsed.items) ? parsed.items : [])
        .filter((item: any) => item && typeof item === "object")
        .map((item: any) => ({
            id: crypto.randomUUID(),
            name: item.name || item.original_name || "消費項目",
            original_name: item.original_name || item.name || "",
            amount: number(item.amount, 0),
            quantity: (number(item.quantity, 1) > 0 ? number(item.quantity, 1) : 1),
            category: category(item.category, item.name || ""),
            split_with: [...allMemberIds],
            is_payer_included: true,
            selected: true,
        }));
    return {
        store_name: parsed.store_name || parsed.original_store_name || "",
        original_store_name: parsed.original_store_name || parsed.store_name || "",
        category: category(parsed.category, parsed.store_name || ""),
        category_reason: typeof parsed.category_reason === "string" ? parsed.category_reason : undefined,
        date: parsed.date || new Date().toISOString().slice(0, 10),
        currency: parsed.currency || fallbackCurrency,
        total_amount: number(parsed.total_amount, items.reduce((sum, item) => sum + item.amount, 0)),
        items, confidence: 0.95, source: "gemini_vision",
    };
}

