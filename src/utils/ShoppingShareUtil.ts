import type { ShoppingItemRow } from "../models/types/ShoppingTypes";

/**
 * Compresses an array of shopping items into a safe base64 URL string
 */
export const encodeShoppingListToUrl = (items: ShoppingItemRow[]): string => {
    try {
        const minimalItems = items.map((item) => ({
            id: item.id,
            name: item.name,
            local_name: item.local_name,
            image_url: item.image_url,
            store: item.store,
            recipients: item.recipients,
            is_completed: item.is_completed,
            category: item.category,
            target_specs: item.target_specs,
            records: item.records,
            tax_free_threshold: item.tax_free_threshold,
            currency: item.currency,
            note: item.note,
        }));
        const json = JSON.stringify(minimalItems);
        // UTF-8 safe base64 encoding
        const base64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        }));
        return base64;
    } catch (err) {
        console.error("Failed to encode shopping items to URL:", err);
        return "";
    }
};

/**
 * Decodes shopping items from a base64 URL string
 */
export const decodeShoppingListFromUrl = (encoded: string): ShoppingItemRow[] => {
    try {
        const json = decodeURIComponent(
            Array.prototype.map
                .call(atob(encoded), (c: string) => {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
        );
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
            return parsed.map((item) => ({
                id: item.id || crypto.randomUUID(),
                trip_id: "",
                user_id: "",
                name: item.name || "未命名商品",
                local_name: item.local_name || null,
                image_url: item.image_url || null,
                store: item.store || null,
                place_id: null,
                recipients: Array.isArray(item.recipients) ? item.recipients : [],
                is_completed: Boolean(item.is_completed),
                category: item.category || "other",
                target_specs: item.target_specs || null,
                records: Array.isArray(item.records) ? item.records : [],
                tax_free_threshold: item.tax_free_threshold || 5000,
                currency: item.currency || "JPY",
                note: item.note || null,
                priority: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));
        }
        return [];
    } catch (err) {
        console.error("Failed to decode shopping items from URL:", err);
        return [];
    }
};
