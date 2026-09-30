import React, { useState, useMemo } from "react";
import {
    Plus,
    Trash2,
    Check,
    CheckCircle2,
    AlertCircle,
    Store,
    Calendar,
    Coins,
    User,
    CreditCard,
    Sparkles,
    Users,
} from "lucide-react";
import type { ParsedReceiptData, ReceiptLineItem } from "../../models/types/ReceiptScannerTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";
import type { BudgetRowInsert } from "../../models/types/BudgetTypes";
import { CATEGORY_DEFINITIONS } from "../../constants/Categories";
import { CURRENCIES } from "../../constants/Currencies";
import { ImageVaultDB } from "../../services/storage/ImageVaultDB";
import { compressImage } from "../../utils/ImageCompressor";
import { hapticFeedback } from "../../utils/HapticUtil";

export interface ReceiptBatchSplitModalProps {
    parsedData: ParsedReceiptData;
    imageFile?: File | Blob;
    tripId: string;
    currentUserId: string;
    paymentMethods?: PaymentMethodRow[];
    tripMembers?: TripMemberVM[];
    defaultCurrency?: string;
    onClose: () => void;
    onBatchSaved: (createdCount: number) => void;
    insertBudgetBatch: (items: BudgetRowInsert[]) => Promise<void>;
}

export const ReceiptBatchSplitModal: React.FC<ReceiptBatchSplitModalProps> = ({
    parsedData,
    imageFile,
    tripId,
    currentUserId,
    paymentMethods = [],
    tripMembers = [],
    defaultCurrency,
    onClose,
    onBatchSaved,
    insertBudgetBatch,
}) => {
    // 預設表頭資訊
    const [storeName, setStoreName] = useState<string>(parsedData.store_name || "");
    const [date, setDate] = useState<string>(parsedData.date || new Date().toISOString().split("T")[0]);
    const [currency, setCurrency] = useState<string>(parsedData.currency || defaultCurrency || "JPY");
    const [payerId, setPayerId] = useState<string>(currentUserId);
    const [paymentMethodId, setPaymentMethodId] = useState<string>(paymentMethods[0]?.id || "");
    const [items, setItems] = useState<ReceiptLineItem[]>(parsedData.items || []);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const allMemberIds = useMemo(() => {
        return tripMembers.map((m) => m.user_id).filter(Boolean) as string[];
    }, [tripMembers]);

    // 計算所選明細總金額
    const selectedTotal = useMemo(() => {
        return items
            .filter((item) => item.selected)
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [items]);

    const targetTotal = parsedData.total_amount || selectedTotal;
    const diff = targetTotal - selectedTotal;
    const isReconciled = Math.abs(diff) < 1;

    // 切換單一品項成員
    const handleToggleMember = (itemIndex: number, userId: string) => {
        setItems((prev) => {
            const next = [...prev];
            const current = next[itemIndex];
            const exists = current.split_with.includes(userId);
            const nextSplitWith = exists
                ? current.split_with.filter((id) => id !== userId)
                : [...current.split_with, userId];

            next[itemIndex] = {
                ...current,
                split_with: nextSplitWith,
            };
            return next;
        });
    };

    // 快捷設定成員：全員均分 or 僅本人
    const handleSetAllMembers = (itemIndex: number) => {
        setItems((prev) => {
            const next = [...prev];
            next[itemIndex] = {
                ...next[itemIndex],
                split_with: [...allMemberIds],
            };
            return next;
        });
    };

    const handleSetSoloMember = (itemIndex: number, userId: string) => {
        setItems((prev) => {
            const next = [...prev];
            next[itemIndex] = {
                ...next[itemIndex],
                split_with: [userId],
            };
            return next;
        });
    };

    // 更新品項數值
    const handleUpdateItem = (
        index: number,
        fields: Partial<ReceiptLineItem>
    ) => {
        setItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...fields };
            return next;
        });
    };

    // 刪除品項
    const handleDeleteItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    // 新增自訂品項
    const handleAddItem = () => {
        const newItem: ReceiptLineItem = {
            id: crypto.randomUUID(),
            name: "",
            amount: 0,
            quantity: 1,
            category: "food",
            split_with: [...allMemberIds],
            is_payer_included: true,
            selected: true,
        };
        setItems((prev) => [...prev, newItem]);
    };

    // 自動補齊差額項目（如稅金、服務費、折價）
    const handleBalanceDiff = () => {
        if (Math.abs(diff) < 1) return;
        const newItem: ReceiptLineItem = {
            id: crypto.randomUUID(),
            name: diff > 0 ? "收據消費稅/差額調整" : "促銷折扣",
            amount: Math.abs(diff),
            quantity: 1,
            category: "other",
            split_with: [...allMemberIds],
            is_payer_included: true,
            selected: true,
        };
        setItems((prev) => [...prev, newItem]);
    };

    // 批次儲存到 Budget 記帳資料庫與 ImageVaultDB
    const handleBatchSave = async () => {
        const selectedItems = items.filter((it) => it.selected && it.amount > 0);
        if (selectedItems.length === 0) {
            alert("請至少勾選一項金額大於 0 的消費項目！");
            return;
        }

        setIsSaving(true);
        try {
            let receiptImageId: string | undefined;

            // 1. 若有上傳照片，進行 Phase 1 Canvas 壓縮至 ~100KB 並寫入 ImageVaultDB
            if (imageFile) {
                try {
                    const compressed = await compressImage(
                        imageFile instanceof File
                            ? imageFile
                            : new File([imageFile], `receipt_${Date.now()}.jpg`, { type: imageFile.type || "image/jpeg" }),
                        { maxWidth: 1200, maxHeight: 1200, quality: 0.75, format: "image/jpeg" }
                    );

                    receiptImageId = `receipt_${crypto.randomUUID()}`;
                    await ImageVaultDB.saveImage({
                        id: receiptImageId,
                        trip_id: tripId,
                        type: "receipt",
                        name: `${storeName || "收據"}_${date}`,
                        blob: compressed.blob,
                        mime_type: "image/jpeg",
                        meta: {
                            store_name: storeName,
                            total_amount: targetTotal,
                            currency,
                        },
                    });
                } catch (imgErr) {
                    console.warn("收據圖檔儲存失敗，但繼續批次建立記帳紀錄:", imgErr);
                }
            }

            // 2. 組裝要批次新增的 BudgetRow 紀錄清單
            const budgetRowsToInsert: BudgetRowInsert[] = selectedItems.map((item) => {
                const rowId = crypto.randomUUID();
                const displayName = item.name.trim() || "消費項目";
                return {
                    id: rowId,
                    trip_id: tripId,
                    user_id: payerId,
                    payment_method_id: paymentMethodId,
                    category: item.category || "shopping",
                    title: `${displayName}${storeName ? ` (${storeName})` : ""}`,
                    amount: Number(item.amount),
                    currency_code: currency,
                    expense_date: date,
                    split_with: item.split_with && item.split_with.length > 0 ? item.split_with : null,
                    is_payer_included: item.is_payer_included !== false,
                    settled_with: [],
                };
            });

            // 3. 呼叫批次插入方法
            await insertBudgetBatch(budgetRowsToInsert);

            // 4. 更新 ImageVaultDB 的 meta 關聯的 budget_ids
            if (receiptImageId) {
                const storedRecord = await ImageVaultDB.getImage(receiptImageId);
                if (storedRecord) {
                    await ImageVaultDB.saveImage({
                        ...storedRecord,
                        meta: {
                            ...(storedRecord.meta || {}),
                            budget_ids: budgetRowsToInsert.map((b) => b.id),
                        },
                    });
                }
            }

            hapticFeedback.success();
            onBatchSaved(budgetRowsToInsert.length);
            onClose();
        } catch (err) {
            hapticFeedback.error();
            console.error("批次記帳失敗:", err);
            alert("批次記帳失敗，請檢查網路連線或重試");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white/98 dark:bg-neutral-900/98 text-slate-900 dark:text-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 border border-slate-200/90 dark:border-neutral-800 flex flex-col max-h-[92vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 手機把手 */}
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-700 mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* 頂部導航列 */}
                <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-neutral-900 flex items-center justify-between gap-2 sm:gap-3 shrink-0 select-none">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 active:opacity-70 transition-opacity cursor-pointer px-1 py-1 shrink-0"
                    >
                        取消
                    </button>

                    <div className="flex-1 min-w-0 text-center flex items-center justify-center gap-1.5">
                        <Sparkles size={16} className="text-primary shrink-0" />
                        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                            收據辨識與批次分帳
                        </h3>
                        {parsedData.source === "gemini_vision" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shrink-0">
                                AI
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleBatchSave}
                        disabled={isSaving}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                        {isSaving ? "處理中..." : `建立 (${items.filter((i) => i.selected).length})`}
                    </button>
                </div>

                {/* 表頭快速配置列：店名、日期、幣別、付款人、付款方式 (高對比度深淺模式支援) */}
                <div className="px-5 py-3 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-neutral-900/60 backdrop-blur-md shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {/* 店名 */}
                    <div className="col-span-2 flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-2.5 py-1.5 rounded-xl shadow-2xs">
                        <Store size={14} className="text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="店家名稱 (選填)"
                            className="w-full bg-transparent text-foreground dark:text-neutral-100 font-bold placeholder:text-muted-foreground/60 focus:outline-none"
                        />
                    </div>

                    {/* 日期 */}
                    <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-black/10 dark:border-neutral-700 px-2.5 py-1.5 rounded-xl shadow-2xs min-w-0 overflow-hidden">
                        <Calendar size={13} className="text-muted-foreground shrink-0 hidden sm:block" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full min-w-0 bg-transparent text-foreground dark:text-neutral-100 text-xs font-mono font-medium focus:outline-none cursor-pointer p-0 [color-scheme:light] dark:[color-scheme:dark]"
                        />
                    </div>

                    {/* 幣別 */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-black/10 dark:border-neutral-700 px-2.5 py-1.5 rounded-xl shadow-2xs">
                        <Coins size={14} className="text-muted-foreground shrink-0" />
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full bg-transparent text-foreground dark:text-neutral-100 font-mono font-bold focus:outline-none cursor-pointer"
                        >
                            {CURRENCIES.map((c) => (
                                <option
                                    key={c.code}
                                    value={c.code}
                                    className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                >
                                    {c.label}
                                </option>
                            ))}
                            {currency && !CURRENCIES.find((c) => c.code === currency) && (
                                <option
                                    value={currency}
                                    className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                                >
                                    {currency}
                                </option>
                            )}
                        </select>
                    </div>

                    {/* 付款人 */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-black/10 dark:border-neutral-700 px-2.5 py-1.5 rounded-xl shadow-2xs">
                        <User size={14} className="text-muted-foreground shrink-0" />
                        <select
                            value={payerId}
                            onChange={(e) => setPayerId(e.target.value)}
                            className="w-full bg-transparent text-foreground dark:text-neutral-100 font-medium focus:outline-none cursor-pointer"
                        >
                            {tripMembers.map((tm) => (
                                <option key={tm.user_id} value={tm.user_id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                                    {tm.profiles?.username || tm.user_id.slice(0, 6)} 代付
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 支付方式 */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-black/10 dark:border-neutral-700 px-2.5 py-1.5 rounded-xl shadow-2xs">
                        <CreditCard size={14} className="text-muted-foreground shrink-0" />
                        <select
                            value={paymentMethodId}
                            onChange={(e) => setPaymentMethodId(e.target.value)}
                            className="w-full bg-transparent text-foreground dark:text-neutral-100 font-medium focus:outline-none cursor-pointer"
                        >
                            {paymentMethods.map((pm) => (
                                <option key={pm.id} value={pm.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                                    {pm.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 明細清單滑動區 */}
                <div className="overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-3 flex-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-bold px-1">
                        <span>辨識品項清單 ({items.length} 項)</span>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>新增一項</span>
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/20 dark:bg-neutral-900/40 rounded-2xl border border-dashed border-border dark:border-neutral-800">
                            <p className="text-xs text-muted-foreground mb-3">
                                未偵測到收據品項明細，請點選下方按鈕手動新增項目。
                            </p>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs active:scale-95"
                            >
                                <Plus size={14} />
                                <span>新增第一筆品項</span>
                            </button>
                        </div>
                    ) : (
                        items.map((item, idx) => {
                            const isAllSelected =
                                allMemberIds.length > 0 &&
                                allMemberIds.every((id) => item.split_with.includes(id));
                            const isSolo =
                                item.split_with.length === 1 &&
                                item.split_with[0] === currentUserId;

                            return (
                                <div
                                    key={item.id || idx}
                                    className={`p-3.5 rounded-2xl border transition-all ${
                                        item.selected
                                            ? "bg-white dark:bg-neutral-800 border-black/[0.08] dark:border-neutral-700 shadow-xs"
                                            : "bg-neutral-50/70 dark:bg-neutral-900/40 border-black/[0.04] dark:border-neutral-800 opacity-60"
                                    }`}
                                >
                                    {/* 第一行：勾選、品項名、分類、金額、刪除 */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={(e) =>
                                                handleUpdateItem(idx, {
                                                    selected: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                                        />

                                        {/* 品名 */}
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                                handleUpdateItem(idx, {
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="品項名稱"
                                            className="flex-1 min-w-0 text-xs font-bold bg-transparent border-b border-transparent hover:border-black/20 dark:hover:border-neutral-600 focus:border-primary focus:outline-none py-0.5 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                                        />

                                        {/* 分類下拉 */}
                                        <select
                                            value={item.category}
                                            onChange={(e) =>
                                                handleUpdateItem(idx, {
                                                    category: e.target.value,
                                                })
                                            }
                                            className="text-[11px] bg-neutral-100/90 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 px-2.5 py-1 rounded-lg border border-black/10 dark:border-neutral-700 focus:outline-none shrink-0 font-medium cursor-pointer"
                                        >
                                            {CATEGORY_DEFINITIONS.map((c) => (
                                                <option key={c.id} value={c.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>

                                        {/* 金額 */}
                                        <div className="flex items-center gap-1 w-24 shrink-0">
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {currency}
                                            </span>
                                            <input
                                                type="number"
                                                value={item.amount || ""}
                                                onChange={(e) =>
                                                    handleUpdateItem(idx, {
                                                        amount: Math.max(
                                                            0,
                                                            Number(e.target.value) || 0
                                                        ),
                                                    })
                                                }
                                                className="w-full text-right font-mono font-bold text-xs bg-neutral-100/90 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-1.5 py-1 rounded-lg border border-black/10 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>

                                        {/* 刪除 */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteItem(idx)}
                                            className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors shrink-0 cursor-pointer"
                                            title="刪除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* 第二行：分帳指派膠囊 (高對比深淺色適配) */}
                                    <div className="mt-2.5 pt-2 border-t border-black/[0.06] dark:border-neutral-800 flex items-center flex-wrap gap-1.5 text-[11px]">
                                        <span className="text-[10px] text-muted-foreground font-medium mr-1 flex items-center gap-1 shrink-0">
                                            <Users size={11} />
                                            分攤：
                                        </span>

                                        {/* 快捷：全員均分 */}
                                        <button
                                            type="button"
                                            onClick={() => handleSetAllMembers(idx)}
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                                                isAllSelected
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                    : "bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-700"
                                            }`}
                                        >
                                            全員均分
                                        </button>

                                        {/* 快捷：本人獨享 */}
                                        <button
                                            type="button"
                                            onClick={() => handleSetSoloMember(idx, currentUserId)}
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                                                isSolo
                                                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                                    : "bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-700"
                                            }`}
                                        >
                                            本人獨享
                                        </button>

                                        {/* 各成員標籤 */}
                                        {tripMembers.map((tm) => {
                                            const isSelected = item.split_with.includes(
                                                tm.user_id
                                            );
                                            const name =
                                                tm.profiles?.username || tm.user_id.slice(0, 4);

                                            return (
                                                <button
                                                    key={tm.user_id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleMember(idx, tm.user_id)
                                                    }
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                                        isSelected
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/60 font-bold"
                                                            : "bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700"
                                                    }`}
                                                >
                                                    {isSelected && <Check size={10} />}
                                                    <span>{name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 底部總額核對資訊列 */}
                <div className="px-4 py-3 sm:px-5 sm:py-3 border-t border-slate-200/90 dark:border-white/[0.08] bg-slate-50/90 dark:bg-neutral-900/90 backdrop-blur-xl flex items-center justify-between text-xs shrink-0">
                    {/* 核對指標膠囊 */}
                    <div className="flex items-center gap-2">
                        {isReconciled ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 size={15} />
                                <span>明細與收據總額吻合</span>
                            </span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-amber-500 font-bold">
                                    <AlertCircle size={15} />
                                    <span>
                                        差額: {diff > 0 ? "+" : ""}
                                        {diff.toLocaleString()} {currency}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleBalanceDiff}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                                >
                                    自動補齊差額
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="font-mono text-right">
                        <span className="text-slate-500 dark:text-neutral-400 text-[11px] mr-1.5 font-sans font-medium">
                            明細總計:
                        </span>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                            {currency} {selectedTotal.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptBatchSplitModal;
