import { useState, useEffect, useCallback } from "react";
import { VoucherItem } from "../../models/types/VoucherTypes";
import { ImageVaultDB } from "../../services/storage/ImageVaultDB";

export function useVouchers(tripId: string | undefined) {
    const storageKey = tripId ? `travel_vouchers_${tripId}` : "travel_vouchers_default";
    const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    // 載入票券列表
    const loadVouchers = useCallback(() => {
        setIsLoading(true);
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed: VoucherItem[] = JSON.parse(raw);
                setVouchers(parsed);
            } else {
                setVouchers([]);
            }
        } catch (e) {
            console.error("Failed to load vouchers from localStorage:", e);
            setVouchers([]);
        } finally {
            setIsLoading(false);
        }
    }, [storageKey]);

    useEffect(() => {
        loadVouchers();
    }, [loadVouchers]);

    // 載入票券圖檔 Object URL
    useEffect(() => {
        const imageIds = vouchers
            .map((v) => v.image_id)
            .filter((id): id is string => Boolean(id));

        const missingIds = imageIds.filter((id) => !imageUrls[id]);

        if (missingIds.length === 0) return;

        let isMounted = true;
        const promises = missingIds.map(async (id) => {
            const url = await ImageVaultDB.getImageBlobUrl(id);
            return { id, url };
        });

        Promise.all(promises).then((results) => {
            if (!isMounted) return;
            setImageUrls((prev) => {
                const next = { ...prev };
                results.forEach(({ id, url }) => {
                    if (url) next[id] = url;
                });
                return next;
            });
        });

        return () => {
            isMounted = false;
        };
    }, [vouchers, imageUrls]);

    // 儲存至 LocalStorage 並更新狀態
    const saveVouchers = useCallback(
        (items: VoucherItem[]) => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(items));
                setVouchers(items);
            } catch (e) {
                console.error("Failed to save vouchers to localStorage:", e);
            }
        },
        [storageKey]
    );

    // 新增票券
    const addVoucher = useCallback(
        async (
            itemData: Omit<VoucherItem, "id" | "trip_id" | "created_at" | "updated_at">
        ): Promise<VoucherItem> => {
            const now = new Date().toISOString();
            const newVoucher: VoucherItem = {
                ...itemData,
                id: crypto.randomUUID(),
                trip_id: tripId || "default",
                created_at: now,
                updated_at: now,
            };

            const updated = [newVoucher, ...vouchers];
            saveVouchers(updated);
            return newVoucher;
        },
        [tripId, vouchers, saveVouchers]
    );

    // 更新票券
    const updateVoucher = useCallback(
        async (voucher: VoucherItem): Promise<void> => {
            const now = new Date().toISOString();
            const updated = vouchers.map((v) =>
                v.id === voucher.id ? { ...voucher, updated_at: now } : v
            );
            saveVouchers(updated);
        },
        [vouchers, saveVouchers]
    );

    // 刪除票券 (同時刪除 IndexedDB 中的圖檔)
    const deleteVoucher = useCallback(
        async (voucherId: string): Promise<void> => {
            const target = vouchers.find((v) => v.id === voucherId);
            if (target?.image_id) {
                try {
                    await ImageVaultDB.deleteImage(target.image_id);
                    setImageUrls((prev) => {
                        const copy = { ...prev };
                        if (copy[target.image_id!]) {
                            URL.revokeObjectURL(copy[target.image_id!]);
                            delete copy[target.image_id!];
                        }
                        return copy;
                    });
                } catch (e) {
                    console.error("Failed to delete voucher image from IndexedDB:", e);
                }
            }

            const updated = vouchers.filter((v) => v.id !== voucherId);
            saveVouchers(updated);
        },
        [vouchers, saveVouchers]
    );

    return {
        vouchers,
        isLoading,
        imageUrls,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        reload: loadVouchers,
    };
}
