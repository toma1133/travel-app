import { supabaseClient } from "../SupabaseClient";
import type {
    ShoppingItemRow,
    ShoppingItemRowInsert,
    ShoppingItemRowUpdate,
} from "../../models/types/ShoppingTypes";
import IRepo from "./IRepo";

const getLocalKey = (tripId: string) => `travel_shopping_${tripId}`;

const getLocalItems = (tripId: string): ShoppingItemRow[] => {
    try {
        const data = localStorage.getItem(getLocalKey(tripId));
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveLocalItems = (tripId: string, items: ShoppingItemRow[]) => {
    try {
        localStorage.setItem(getLocalKey(tripId), JSON.stringify(items));
    } catch (e) {
        console.warn("Failed to save to localStorage:", e);
    }
};

export interface IShoppingRepo
    extends IRepo<
        ShoppingItemRow,
        ShoppingItemRowInsert,
        ShoppingItemRowUpdate,
        string
    > {
    updateStoreThreshold(
        tripId: string,
        storeName: string,
        threshold: number
    ): Promise<void>;
}

export const shoppingRepo: IShoppingRepo = {
    async getById(id: string | undefined): Promise<ShoppingItemRow | null> {
        if (!id) return null;
        try {
            const { data, error } = await supabaseClient
                .from("shopping_items")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            return (data as unknown as ShoppingItemRow) ?? null;
        } catch {
            // Local fallback search
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("travel_shopping_")) {
                    try {
                        const items: ShoppingItemRow[] = JSON.parse(
                            localStorage.getItem(key) || "[]"
                        );
                        const match = items.find((item) => item.id === id);
                        if (match) return match;
                    } catch {
                        // ignore
                    }
                }
            }
            return null;
        }
    },

    async list(tripId: string | undefined): Promise<ShoppingItemRow[]> {
        if (!tripId) return [];
        try {
            const { data, error } = await supabaseClient
                .from("shopping_items")
                .select("*")
                .eq("trip_id", tripId)
                .order("is_completed", { ascending: true })
                .order("created_at", { ascending: false });
            if (error) throw error;
            if (data) {
                // Keep local mirror updated
                saveLocalItems(tripId, data as unknown as ShoppingItemRow[]);
                return data as unknown as ShoppingItemRow[];
            }
        } catch (err) {
            console.warn("Supabase fetch failed, using local storage fallback:", err);
        }
        return getLocalItems(tripId);
    },

    async insert(payload: ShoppingItemRowInsert): Promise<ShoppingItemRow | null> {
        const newId = payload.id || crypto.randomUUID();
        const now = new Date().toISOString();
        const fullItem: ShoppingItemRow = {
            id: newId,
            trip_id: payload.trip_id,
            user_id: payload.user_id || "",
            name: payload.name,
            local_name: payload.local_name ?? null,
            image_url: payload.image_url ?? null,
            store: payload.store ?? null,
            place_id: payload.place_id ?? null,
            recipients: payload.recipients ?? [],
            recipient_allocations: payload.recipient_allocations ?? {},
            target_quantity: payload.target_quantity ?? 1,
            is_completed: payload.is_completed ?? false,
            category: payload.category ?? "other",
            target_specs: payload.target_specs ?? null,
            records: (payload.records as any) ?? [],
            tax_free_threshold: payload.tax_free_threshold ?? 5000,
            currency: payload.currency ?? "JPY",
            note: payload.note ?? null,
            priority: payload.priority ?? 0,
            created_at: now,
            updated_at: now,
        };

        // Always update local cache
        const local = getLocalItems(payload.trip_id);
        saveLocalItems(payload.trip_id, [fullItem, ...local]);

        try {
            const { data, error } = await supabaseClient
                .from("shopping_items")
                .insert(fullItem as any)
                .select("*")
                .single();
            if (error) throw error;
            return (data as unknown as ShoppingItemRow) ?? fullItem;
        } catch (err) {
            console.warn("Supabase insert failed, saved to local storage:", err);
            return fullItem;
        }
    },

    async update(patch: Partial<ShoppingItemRowUpdate>): Promise<ShoppingItemRow | null> {
        if (!patch.id) throw new Error("ID is required for update");
        const now = new Date().toISOString();

        // Update local items
        let updatedLocal: ShoppingItemRow | null = null;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("travel_shopping_")) {
                try {
                    const items: ShoppingItemRow[] = JSON.parse(
                        localStorage.getItem(key) || "[]"
                    );
                    const idx = items.findIndex((item) => item.id === patch.id);
                    if (idx !== -1) {
                        items[idx] = {
                            ...items[idx],
                            ...patch,
                            updated_at: now,
                        } as ShoppingItemRow;
                        localStorage.setItem(key, JSON.stringify(items));
                        updatedLocal = items[idx];
                        break;
                    }
                } catch {
                    // ignore
                }
            }
        }

        try {
            const { data, error } = await supabaseClient
                .from("shopping_items")
                .update({ ...patch, updated_at: now } as any)
                .eq("id", patch.id)
                .select("*")
                .single();
            if (error) throw error;
            return (data as unknown as ShoppingItemRow) ?? updatedLocal;
        } catch (err) {
            console.warn("Supabase update failed, updated in local storage:", err);
            return updatedLocal;
        }
    },

    async upsert(payload: ShoppingItemRowInsert): Promise<ShoppingItemRow | null> {
        if (payload.id) {
            return this.update(payload as any);
        }
        return this.insert(payload);
    },

    async delete(id: string): Promise<void> {
        // Delete from local
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("travel_shopping_")) {
                try {
                    const items: ShoppingItemRow[] = JSON.parse(
                        localStorage.getItem(key) || "[]"
                    );
                    const filtered = items.filter((item) => item.id !== id);
                    if (filtered.length !== items.length) {
                        localStorage.setItem(key, JSON.stringify(filtered));
                    }
                } catch {
                    // ignore
                }
            }
        }

        try {
            const { error } = await supabaseClient
                .from("shopping_items")
                .delete()
                .eq("id", id);
            if (error) throw error;
        } catch (err) {
            console.warn("Supabase delete failed, deleted from local storage:", err);
        }
    },

    async updateStoreThreshold(
        tripId: string,
        storeName: string,
        threshold: number
    ): Promise<void> {
        if (!tripId) return;

        // 1. Update localStorage threshold cache
        try {
            const cacheKey = `tax_free_thresholds_${tripId}`;
            const currentCache = JSON.parse(
                localStorage.getItem(cacheKey) || "{}"
            );
            currentCache[storeName] = threshold;
            localStorage.setItem(cacheKey, JSON.stringify(currentCache));
        } catch {
            // ignore
        }

        // 2. Update all items for this store in localStorage item list
        try {
            const localItems = getLocalItems(tripId);
            let hasChanged = false;
            const updatedItems = localItems.map((item) => {
                const itemStore = item.store || "未指定店家";
                if (itemStore === storeName) {
                    hasChanged = true;
                    return { ...item, tax_free_threshold: threshold };
                }
                return item;
            });
            if (hasChanged) {
                saveLocalItems(tripId, updatedItems);
            }
        } catch {
            // ignore
        }

        // 3. Update Supabase shopping_items table
        try {
            let query = supabaseClient
                .from("shopping_items")
                .update({
                    tax_free_threshold: threshold,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq("trip_id", tripId);

            if (storeName === "未指定店家") {
                query = query.or("store.is.null,store.eq.''");
            } else {
                query = query.eq("store", storeName);
            }

            const { error } = await query;
            if (error) {
                console.warn("Supabase updateStoreThreshold failed:", error);
            }
        } catch (err) {
            console.warn("Supabase updateStoreThreshold error:", err);
        }
    },
};
