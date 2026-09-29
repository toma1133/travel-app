import { useState, useEffect, useCallback } from "react";
import { ImageVaultDB, StoredImageRecord } from "../../services/storage/ImageVaultDB";

export function useTripReceipts(tripId: string | undefined) {
    const [receipts, setReceipts] = useState<StoredImageRecord[]>([]);
    const [receiptMap, setReceiptMap] = useState<Record<string, StoredImageRecord>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshReceipts = useCallback(async () => {
        if (!tripId) {
            setReceipts([]);
            setReceiptMap({});
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const list = await ImageVaultDB.getImagesByTrip(tripId, "receipt");
            setReceipts(list);

            const map: Record<string, StoredImageRecord> = {};
            list.forEach((rec) => {
                const budgetIds: string[] = rec.meta?.budget_ids || [];
                budgetIds.forEach((bId) => {
                    map[bId] = rec;
                });
            });
            setReceiptMap(map);
        } catch (err) {
            console.error("載入收據清單失敗:", err);
        } finally {
            setIsLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        refreshReceipts();
    }, [refreshReceipts]);

    return {
        receipts,
        receiptMap,
        isLoading,
        refreshReceipts,
    };
}
