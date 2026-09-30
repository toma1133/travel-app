import { useState, useEffect, useCallback, useRef } from "react";
import type { ChecklistItem } from "../../models/types/ChecklistTypes";
import { DEFAULT_CHECKLIST_ITEMS } from "../../models/types/ChecklistTypes";
import { ChecklistDB } from "../../services/storage/ChecklistDB";

export function useChecklist(tripId: string) {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isInitialLoaded = useRef<boolean>(false);

    // 載入清單 (從 IndexedDB 載入，包含 localStorage 自動遷移)
    useEffect(() => {
        let isMounted = true;
        isInitialLoaded.current = false;

        ChecklistDB.getChecklist(tripId)
            .then((stored) => {
                if (!isMounted) return;
                if (stored && stored.length > 0) {
                    setItems(stored);
                } else {
                    // 若無任何紀錄，產生系統預設項目
                    const defaults = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
                        ...item,
                        id: crypto.randomUUID(),
                    }));
                    setItems(defaults);
                    ChecklistDB.saveChecklist(tripId, defaults).catch(console.error);
                }
            })
            .catch((err) => {
                console.error("載入行李打包清單失敗:", err);
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                    isInitialLoaded.current = true;
                }
            });

        return () => {
            isMounted = false;
        };
    }, [tripId]);

    // 當 items 改變且已初次載入時，自動非同步寫入 IndexedDB
    useEffect(() => {
        if (!isInitialLoaded.current || isLoading) return;
        ChecklistDB.saveChecklist(tripId, items).catch((err) => {
            console.error("自動保存行李清單至 IndexedDB 失敗:", err);
        });
    }, [items, tripId, isLoading]);

    const toggleItem = useCallback((id: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
            )
        );
    }, []);

    const addItem = useCallback(
        (title: string, category: ChecklistItem["category"]) => {
            if (!title.trim()) return;
            const newItem: ChecklistItem = {
                id: crypto.randomUUID(),
                category,
                title: title.trim(),
                isCompleted: false,
            };
            setItems((prev) => [...prev, newItem]);
        },
        []
    );

    const deleteItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const resetToDefault = useCallback(() => {
        const defaults = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
        }));
        setItems(defaults);
        ChecklistDB.saveChecklist(tripId, defaults).catch(console.error);
    }, [tripId]);

    return {
        items,
        isLoading,
        toggleItem,
        addItem,
        deleteItem,
        resetToDefault,
        setItems,
    };
}
