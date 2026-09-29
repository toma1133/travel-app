import React, { useState } from "react";
import {
    HardDrive,
    Receipt,
    Ticket,
    Trash2,
    RefreshCw,
    ShieldCheck,
    AlertCircle,
    Info,
    Check,
} from "lucide-react";
import { GlassModal, GlassButton } from "../ui";
import { useStorageManager } from "../../hooks/storage/useStorageManager";
import { formatBytes } from "../../utils/ImageCompressor";

interface StorageManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({
    isOpen,
    onClose,
}) => {
    const {
        usage,
        isLoading,
        isActionPending,
        refreshUsage,
        clearReceipts,
        clearAll,
    } = useStorageManager();

    const [confirmAction, setConfirmAction] = useState<"receipts" | "all" | null>(
        null
    );
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const handleClearReceipts = async () => {
        const count = await clearReceipts();
        setConfirmAction(null);
        setActionMessage(`已成功清除 ${count} 張收據照片，記帳數據依然完整保留！`);
        setTimeout(() => setActionMessage(null), 3500);
    };

    const handleClearAll = async () => {
        await clearAll();
        setConfirmAction(null);
        setActionMessage("已成功清空所有本地圖片快取！");
        setTimeout(() => setActionMessage(null), 3500);
    };

    // 預估以 50MB 作為極度充裕的安全基準刻度（實際 IndexedDB 可用數百 MB）
    const totalBytes = usage?.total_bytes || 0;
    const safetyBarPercent = Math.min(
        100,
        Math.max(1, (totalBytes / (50 * 1024 * 1024)) * 100)
    );

    return (
        <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="lg">
            <GlassModal.Header
                title={
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <HardDrive size={18} />
                        </div>
                        <div>
                            <span className="font-bold text-foreground">
                                儲存空間與圖檔管理
                            </span>
                            <span className="text-[11px] block font-normal text-muted-foreground">
                                本地輕量 IndexedDB 空間用量與清理
                            </span>
                        </div>
                    </div>
                }
                onClose={onClose}
            />

            <GlassModal.Body className="space-y-4 text-xs sm:text-sm">
                {/* 狀態訊息提示 */}
                {actionMessage && (
                    <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
                        <Check size={16} className="shrink-0" />
                        <span>{actionMessage}</span>
                    </div>
                )}

                {/* 總容量儀表板卡片 */}
                <div className="p-4 rounded-2xl bg-card/60 dark:bg-card/40 border border-border/70 backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <HardDrive size={15} />
                            <span className="font-medium text-xs">
                                本地已佔用容量
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={refreshUsage}
                            disabled={isLoading || isActionPending}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title="重新整理用量"
                        >
                            <RefreshCw
                                size={14}
                                className={isLoading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>

                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
                            {usage ? usage.total_mb : "計算中..."}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            共 {usage?.total_count || 0} 個圖檔
                        </span>
                    </div>

                    {/* 容量進度條 */}
                    <div className="space-y-1">
                        <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500 rounded-full"
                                style={{ width: `${safetyBarPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>0 MB</span>
                            <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                                極致瘦身中 (單張 &lt;120KB)
                            </span>
                            <span>安全基準 50 MB</span>
                        </div>
                    </div>
                </div>

                {/* 分類明細卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 收據卡片 */}
                    <div className="p-3.5 rounded-2xl bg-card/40 border border-border/60 flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                                    <Receipt size={16} />
                                </div>
                                <span className="font-bold text-foreground">
                                    收據拍照
                                </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-foreground">
                                {usage?.receipt_count || 0} 張
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            佔用空間:{" "}
                            <span className="font-mono font-medium text-foreground">
                                {formatBytes(usage?.receipt_bytes || 0)}
                            </span>
                        </div>
                        {confirmAction === "receipts" ? (
                            <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                                <button
                                    type="button"
                                    onClick={handleClearReceipts}
                                    disabled={isActionPending}
                                    className="flex-1 py-1 px-2 rounded-lg bg-amber-500 text-white font-medium text-xs hover:bg-amber-600 transition-colors"
                                >
                                    確定清理
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction(null)}
                                    className="py-1 px-2 rounded-lg bg-muted text-foreground text-xs"
                                >
                                    取消
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirmAction("receipts")}
                                disabled={
                                    !usage?.receipt_count || isActionPending
                                }
                                className="w-full py-1.5 px-2 rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={13} />
                                <span>清理收據照片 (保留記帳金額)</span>
                            </button>
                        )}
                    </div>

                    {/* 票券卡片 */}
                    <div className="p-3.5 rounded-2xl bg-card/40 border border-border/60 flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Ticket size={16} />
                                </div>
                                <span className="font-bold text-foreground">
                                    票券與 QR 碼
                                </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-foreground">
                                {usage?.voucher_count || 0} 張
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            佔用空間:{" "}
                            <span className="font-mono font-medium text-foreground">
                                {formatBytes(usage?.voucher_bytes || 0)}
                            </span>
                        </div>
                        <div className="py-1.5 px-2 rounded-xl text-[11px] text-muted-foreground bg-muted/30 text-center">
                            隨旅程集中管理・離線可查
                        </div>
                    </div>
                </div>

                {/* 說明保證區塊 (解決使用者的儲存疑慮) */}
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span>雙重防膨脹安全保障</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground pl-1">
                        <li className="flex items-start gap-1.5">
                            <span className="text-primary font-bold">•</span>
                            <span>
                                <strong>前端智慧 Canvas 壓縮</strong>：所有上傳照片皆經演算法縮小至
                                1024px，體積銳減 90% 以上（單張僅約 80~120KB），絕不浪費手機空間。
                            </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                            <span className="text-primary font-bold">•</span>
                            <span>
                                <strong>旅程刪除自動級聯清空</strong>：當您在書架中刪除旅程時，該旅程底下的所有本地照片會一併自動清除，絕無隱藏垃圾。
                            </span>
                        </li>
                    </ul>
                </div>

                {/* 全域清空按鈕 */}
                {confirmAction === "all" ? (
                    <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-2">
                        <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                            <AlertCircle size={15} />
                            <span>確定要清空所有本地圖片快取嗎？</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            此動作會移除所有已儲存的收據照片與離線票券圖檔（行程與文字記帳資料不受影響）。
                        </p>
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={isActionPending}
                                className="px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-xs hover:bg-destructive/90 transition-colors"
                            >
                                確認全部清空
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmAction("all")}
                        disabled={!usage?.total_count || isActionPending}
                        className="w-full py-2 px-3 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                        <Trash2 size={13} />
                        <span>釋放所有本地圖片快取</span>
                    </button>
                )}
            </GlassModal.Body>

            <GlassModal.Footer>
                <GlassButton variant="primary" size="sm" onClick={onClose}>
                    完成關閉
                </GlassButton>
            </GlassModal.Footer>
        </GlassModal>
    );
};
