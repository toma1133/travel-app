import type { ChecklistItem } from "../../models/types/ChecklistTypes";

export interface StoredChecklistRecord {
    trip_id: string;
    items: ChecklistItem[];
    updated_at: string;
}

export interface ChecklistStorageUsage {
    tripCount: number;
    itemCount: number;
    totalBytes: number;
}

const DB_NAME = "travel_app_checklist_db";
const DB_VERSION = 1;
const STORE_NAME = "checklists";

class ChecklistDBService {
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
                    db.createObjectStore(STORE_NAME, { keyPath: "trip_id" });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                this.dbPromise = null;
                reject(request.error || new Error("無法開啟 IndexedDB 行李清單資料庫"));
            };
        });

        return this.dbPromise;
    }

    /**
     * 取得指定旅程的行李清單
     * 內建自動遷移：若 IndexedDB 無資料但 localStorage 有舊資料，自動無縫搬移至 IndexedDB
     */
    async getChecklist(tripId: string): Promise<ChecklistItem[] | null> {
        try {
            const db = await this.getDB();
            const record = await new Promise<StoredChecklistRecord | null>((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const store = tx.objectStore(STORE_NAME);
                const request = store.get(tripId);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });

            if (record && Array.isArray(record.items)) {
                return record.items;
            }

            // 自動遷移：檢查 localStorage 是否有舊資料
            if (typeof window !== "undefined") {
                const legacyKey = `travel_checklist_${tripId}`;
                const legacyData = localStorage.getItem(legacyKey);
                if (legacyData) {
                    try {
                        const parsed = JSON.parse(legacyData);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // 自動寫入 IndexedDB
                            await this.saveChecklist(tripId, parsed);
                            // 清除 localStorage 舊 key 釋放空間
                            localStorage.removeItem(legacyKey);
                            return parsed;
                        }
                    } catch (e) {
                        console.warn("無法解析 localStorage 行李清單舊資料:", e);
                    }
                }
            }

            return null;
        } catch (err) {
            console.error("讀取 IndexedDB 行李清單失敗，降級檢查 localStorage:", err);
            if (typeof window !== "undefined") {
                const legacyData = localStorage.getItem(`travel_checklist_${tripId}`);
                if (legacyData) {
                    try {
                        return JSON.parse(legacyData);
                    } catch {
                        return null;
                    }
                }
            }
            return null;
        }
    }

    /**
     * 儲存指定旅程的行李清單
     */
    async saveChecklist(tripId: string, items: ChecklistItem[]): Promise<void> {
        const db = await this.getDB();
        const record: StoredChecklistRecord = {
            trip_id: tripId,
            items,
            updated_at: new Date().toISOString(),
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(record);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 刪除特定旅程的行李清單
     */
    async deleteChecklist(tripId: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(tripId);

            request.onsuccess = () => {
                if (typeof window !== "undefined") {
                    localStorage.removeItem(`travel_checklist_${tripId}`);
                }
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 清空所有行程的行李打包清單
     */
    async clearAllChecklists(): Promise<number> {
        const db = await this.getDB();
        const usage = await this.getStorageUsage();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                // 同時清理 localStorage 中遺留的 checklist keys
                if (typeof window !== "undefined") {
                    const keysToRemove: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith("travel_checklist_")) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach((k) => localStorage.removeItem(k));
                }
                resolve(usage.tripCount);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 取得所有行李清單紀錄
     */
    async getAllChecklists(): Promise<StoredChecklistRecord[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 計算行李清單的儲存空間佔用統計
     */
    async getStorageUsage(): Promise<ChecklistStorageUsage> {
        try {
            const records = await this.getAllChecklists();
            let itemCount = 0;
            let totalBytes = 0;

            records.forEach((rec) => {
                const count = Array.isArray(rec.items) ? rec.items.length : 0;
                itemCount += count;
                const jsonStr = JSON.stringify(rec);
                totalBytes += new Blob([jsonStr]).size;
            });

            // 也包含尚未遷移的 localStorage 殘留項目統計
            if (typeof window !== "undefined") {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("travel_checklist_")) {
                        const val = localStorage.getItem(key) || "";
                        totalBytes += new Blob([val]).size;
                    }
                }
            }

            return {
                tripCount: records.length,
                itemCount,
                totalBytes,
            };
        } catch (err) {
            console.error("無法計算行李清單用量:", err);
            return { tripCount: 0, itemCount: 0, totalBytes: 0 };
        }
    }
}

export const ChecklistDB = new ChecklistDBService();
