import { useState, useEffect, useCallback } from "react";
import { ImageVaultDB, StorageUsageSummary } from "../../services/storage/ImageVaultDB";
import { ChecklistDB, ChecklistStorageUsage } from "../../services/storage/ChecklistDB";

export function useStorageManager() {
    const [usage, setUsage] = useState<StorageUsageSummary | null>(null);
    const [checklistUsage, setChecklistUsage] = useState<ChecklistStorageUsage | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isActionPending, setIsActionPending] = useState<boolean>(false);

    const refreshUsage = useCallback(async () => {
        setIsLoading(true);
        try {
            const [imgSummary, chkSummary] = await Promise.all([
                ImageVaultDB.getStorageUsage(),
                ChecklistDB.getStorageUsage(),
            ]);
            setUsage(imgSummary);
            setChecklistUsage(chkSummary);
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

    const clearChecklists = useCallback(async () => {
        setIsActionPending(true);
        try {
            const count = await ChecklistDB.clearAllChecklists();
            await refreshUsage();
            return count;
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
        checklistUsage,
        isLoading,
        isActionPending,
        refreshUsage,
        clearReceipts,
        clearAll,
        clearChecklists,
        deleteImage,
    };
}

