import { formatBytes } from "../../utils/ImageCompressor";

export type ImageVaultType = "receipt" | "voucher" | "misc";

export interface StoredImageRecord {
    id: string;
    trip_id: string;
    type: ImageVaultType;
    name: string;
    blob: Blob;
    mime_type: string;
    size_bytes: number;
    created_at: string;
    meta?: Record<string, any>; // 關聯交易 ID、票券代碼等中繼資料
}

export interface StorageUsageSummary {
    total_bytes: number;
    total_mb: string;
    total_count: number;
    receipt_count: number;
    receipt_bytes: number;
    voucher_count: number;
    voucher_bytes: number;
    misc_count: number;
    misc_bytes: number;
}

const DB_NAME = "travel_app_image_vault";
const DB_VERSION = 1;
const STORE_NAME = "images";

class ImageVaultDBService {
    private dbPromise: Promise<IDBDatabase> | null = null;

    private getDB(): Promise<IDBDatabase> {
        if (typeof window === "undefined" || !window.indexedDB) {
            return Promise.reject(new Error("當前環境不支援 IndexedDB"));
        }

        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: "id",
                    });
                    store.createIndex("trip_id", "trip_id", { unique: false });
                    store.createIndex("type", "type", { unique: false });
                    store.createIndex("created_at", "created_at", {
                        unique: false,
                    });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                this.dbPromise = null;
                reject(request.error || new Error("無法開啟 IndexedDB 資料庫"));
            };
        });

        return this.dbPromise;
    }

    /**
     * 儲存單張圖檔
     */
    async saveImage(
        record: Omit<StoredImageRecord, "created_at" | "size_bytes"> & {
            created_at?: string;
            size_bytes?: number;
        }
    ): Promise<string> {
        const db = await this.getDB();
        const finalRecord: StoredImageRecord = {
            ...record,
            size_bytes: record.size_bytes ?? record.blob.size,
            created_at: record.created_at ?? new Date().toISOString(),
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(finalRecord);

            request.onsuccess = () => resolve(finalRecord.id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 依 ID 取得圖檔紀錄
     */
    async getImage(id: string): Promise<StoredImageRecord | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 依 ID 產生臨時 Object URL (供 <img> 標籤預覽)
     */
    async getImageBlobUrl(id: string): Promise<string | null> {
        const record = await this.getImage(id);
        if (!record || !record.blob) return null;
        return URL.createObjectURL(record.blob);
    }

    /**
     * 取得特定旅程底下的所有圖檔
     */
    async getImagesByTrip(
        tripId: string,
        type?: ImageVaultType
    ): Promise<StoredImageRecord[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const index = store.index("trip_id");
            const request = index.getAll(tripId);

            request.onsuccess = () => {
                let records: StoredImageRecord[] = request.result || [];
                if (type) {
                    records = records.filter((r) => r.type === type);
                }
                resolve(records);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 刪除單一圖檔
     */
    async deleteImage(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 級聯刪除：當旅程刪除時，自動清除該旅程的所有本地圖檔
     */
    async deleteImagesByTrip(tripId: string): Promise<number> {
        const db = await this.getDB();
        const records = await this.getImagesByTrip(tripId);
        if (records.length === 0) return 0;

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            let deletedCount = 0;

            records.forEach((r) => {
                store.delete(r.id);
                deletedCount++;
            });

            tx.oncomplete = () => resolve(deletedCount);
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * 清理所有收據圖檔（通常旅行結束後收據核對完畢可釋放空間）
     */
    async clearReceipts(): Promise<number> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const index = store.index("type");
            const request = index.getAll("receipt");

            request.onsuccess = () => {
                const receipts: StoredImageRecord[] = request.result || [];
                receipts.forEach((r) => store.delete(r.id));
                resolve(receipts.length);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 一鍵釋放所有圖片快取
     */
    async clearAllImages(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 取得目前 IndexedDB 的容量用量統計
     */
    async getStorageUsage(): Promise<StorageUsageSummary> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const records: StoredImageRecord[] = request.result || [];
                let totalBytes = 0;
                let receiptCount = 0;
                let receiptBytes = 0;
                let voucherCount = 0;
                let voucherBytes = 0;
                let miscCount = 0;
                let miscBytes = 0;

                records.forEach((r) => {
                    const size = r.size_bytes || r.blob?.size || 0;
                    totalBytes += size;

                    if (r.type === "receipt") {
                        receiptCount++;
                        receiptBytes += size;
                    } else if (r.type === "voucher") {
                        voucherCount++;
                        voucherBytes += size;
                    } else {
                        miscCount++;
                        miscBytes += size;
                    }
                });

                resolve({
                    total_bytes: totalBytes,
                    total_mb: formatBytes(totalBytes),
                    total_count: records.length,
                    receipt_count: receiptCount,
                    receipt_bytes: receiptBytes,
                    voucher_count: voucherCount,
                    voucher_bytes: voucherBytes,
                    misc_count: miscCount,
                    misc_bytes: miscBytes,
                });
            };

            request.onerror = () => reject(request.error);
        });
    }
}

export const ImageVaultDB = new ImageVaultDBService();
