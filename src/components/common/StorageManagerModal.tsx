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
        <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="sm" className="md:!max-w-[440px]">
            <GlassModal.Header
                title="💾 儲存空間與圖檔管理"
                subtitle="本地輕量 IndexedDB 空間用量與清理"
                onClose={onClose}
                rightAction={
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        完成
                    </button>
                }
            />

            <GlassModal.Body className="space-y-4 text-xs sm:text-sm pb-6 sm:pb-8">
                {/* 狀態訊息提示 */}
                {actionMessage && (
                    <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
                        <Check size={16} className="shrink-0" />
                        <span>{actionMessage}</span>
                    </div>
                )}

                {/* 總容量儀表板卡片 */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50/80 dark:from-neutral-850 dark:to-neutral-900 border border-slate-200/90 dark:border-neutral-700/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <HardDrive size={15} />
                            <span className="font-semibold text-xs">
                                本地已佔用容量
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={refreshUsage}
                            disabled={isLoading || isActionPending}
                            className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="重新整理用量"
                        >
                            <RefreshCw
                                size={14}
                                className={isLoading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>

                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 dark:text-white font-mono">
                            {usage ? usage.total_mb : "計算中..."}
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            共 {usage?.total_count || 0} 個圖檔
                        </span>
                    </div>

                    {/* 容量進度條 */}
                    <div className="space-y-1">
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                                style={{ width: `${safetyBarPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                            <span>0 MB</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                極致瘦身中 (單張 &lt;120KB)
                            </span>
                            <span>安全基準 50 MB</span>
                        </div>
                    </div>
                </div>

                {/* 分類明細卡片 */}
                <div className="grid grid-cols-1 gap-2.5">
                    {/* 收據卡片 */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/[0.06] dark:bg-amber-500/[0.08] border border-amber-500/20 dark:border-amber-500/20 shadow-xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <Receipt size={16} />
                                </div>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                    收據拍照
                                </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                                {usage?.receipt_count || 0} 張
                            </span>
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            佔用空間:{" "}
                            <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                                {formatBytes(usage?.receipt_bytes || 0)}
                            </span>
                        </div>
                        {confirmAction === "receipts" ? (
                            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                                <button
                                    type="button"
                                    onClick={handleClearReceipts}
                                    disabled={isActionPending}
                                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                                >
                                    確定清理
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction(null)}
                                    className="py-1.5 px-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-medium cursor-pointer"
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
                                className="w-full py-1.5 px-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>清理收據照片 (保留記帳金額)</span>
                            </button>
                        )}
                    </div>

                    {/* 票券卡片 */}
                    <div className="p-3.5 rounded-2xl bg-blue-500/[0.06] dark:bg-blue-500/[0.08] border border-blue-500/20 dark:border-blue-500/20 shadow-xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                    <Ticket size={16} />
                                </div>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                    票券與 QR 碼
                                </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                                {usage?.voucher_count || 0} 張
                            </span>
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            佔用空間:{" "}
                            <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                                {formatBytes(usage?.voucher_bytes || 0)}
                            </span>
                        </div>
                        <div className="py-1.5 px-2 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 bg-blue-500/15 border border-blue-500/25 text-center font-bold">
                            隨旅程集中管理・離線可查
                        </div>
                    </div>
                </div>

                {/* 說明保證區塊 (解決使用者的儲存疑慮) */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] dark:bg-emerald-500/[0.1] border border-emerald-500/25 space-y-2">
                    <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-xs">
                        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span>雙重防膨脹安全保障</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300 pl-1">
                        <li className="flex items-start gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>
                                <strong className="text-neutral-900 dark:text-white">前端智慧 Canvas 壓縮</strong>：所有上傳照片皆經演算法縮小至
                                1024px，體積銳減 90% 以上（單張僅約 80~120KB），絕不浪費手機空間。
                            </span>
                        </li>
                        <li className="flex items-start gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>
                                <strong className="text-neutral-900 dark:text-white">旅程刪除自動級聯清空</strong>：當您在書架中刪除旅程時，該旅程底下的所有本地照片會一併自動清除，絕無隱藏垃圾。
                            </span>
                        </li>
                    </ul>
                </div>

                {/* 全域清空按鈕 */}
                {confirmAction === "all" ? (
                    <div className="p-3.5 rounded-2xl bg-rose-500/[0.08] border border-rose-500/30 space-y-2.5">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                            <AlertCircle size={15} />
                            <span>確定要清空所有本地圖片快取嗎？</span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                            此動作會移除所有已儲存的收據照片與離線票券圖檔（行程與文字記帳資料不受影響）。
                        </p>
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={isActionPending}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
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
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-500/[0.07] hover:bg-rose-500/[0.14] border border-rose-500/25 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                        <Trash2 size={14} />
                        <span>釋放所有本地圖片快取</span>
                    </button>
                )}
            </GlassModal.Body>
        </GlassModal>
    );
};
