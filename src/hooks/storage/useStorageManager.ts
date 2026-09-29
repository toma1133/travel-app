import { useState, useEffect, useCallback } from "react";
import { ImageVaultDB, StorageUsageSummary } from "../../services/storage/ImageVaultDB";

export function useStorageManager() {
    const [usage, setUsage] = useState<StorageUsageSummary | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isActionPending, setIsActionPending] = useState<boolean>(false);

    const refreshUsage = useCallback(async () => {
        setIsLoading(true);
        try {
            const summary = await ImageVaultDB.getStorageUsage();
            setUsage(summary);
        } catch (err) {
            console.error("讀取儲存空間用量失敗:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUsage();
    }, [refreshUsage]);

    const clearReceipts = useCallback(async () => {
        setIsActionPending(true);
        try {
            const count = await ImageVaultDB.clearReceipts();
            await refreshUsage();
            return count;
        } finally {
            setIsActionPending(false);
        }
    }, [refreshUsage]);

    const clearAll = useCallback(async () => {
        setIsActionPending(true);
        try {
            await ImageVaultDB.clearAllImages();
            await refreshUsage();
        } finally {
            setIsActionPending(false);
        }
    }, [refreshUsage]);

    const deleteImage = useCallback(
        async (id: string) => {
            setIsActionPending(true);
            try {
                await ImageVaultDB.deleteImage(id);
                await refreshUsage();
            } finally {
                setIsActionPending(false);
            }
        },
        [refreshUsage]
    );

    return {
        usage,
        isLoading,
        isActionPending,
        refreshUsage,
        clearReceipts,
        clearAll,
        deleteImage,
    };
}
