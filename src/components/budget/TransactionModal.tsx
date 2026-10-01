import React, { ChangeEventHandler, MouseEventHandler, useState, useEffect } from "react";
import {
    Calendar,
    Trash2,
    Check,
    Wallet,
    Calculator,
    Receipt,
    Plus,
} from "lucide-react";
import { GlassModal, GlassSegmentedControl } from "../ui";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import { formatThousands, handleThousandsInputChange, parseThousandsToNumber } from "../../utils/numberFormat";
import type { BudgetRow, BudgetSubItem } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripSettingConf, TripThemeConf } from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

export type TransactionModalProps = {
    categories: {
        id: string;
        name: string;
        icon: any;
    }[];
    formData: BudgetRow;
    mode: string;
    paymentMethods?: PaymentMethodRow[];
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    tripMembers?: TripMemberVM[];
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDeleteBtnClick: (budgetItem: BudgetRow) => void;
    onFormDataChange: (name: string, value?: any) => void;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: (event: React.FormEvent<HTMLFormElement>, splitMode?: "simple" | "itemized") => void;
    receiptPreviewUrl?: string;
    receiptMessage?: string;
    isSaving?: boolean;
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
    formData,
    mode,
    paymentMethods = [],
    setting,
    tripMembers = [],
    onCloseBtnClick,
    onDeleteBtnClick,
    onFormDataChange,
    onFormInputChange,
    onFormSubmit,
    receiptPreviewUrl,
    receiptMessage,
    isSaving = false,
}) => {
    const [activeTab, setActiveTab] = useState<string>("basic");

    const hasInitialSubItems = Array.isArray(formData.receipt_items) && formData.receipt_items.length > 0;
    const [splitMode, setSplitMode] = useState<"simple" | "itemized">(hasInitialSubItems ? "itemized" : "simple");

    const receiptItems: BudgetSubItem[] = (formData.receipt_items as BudgetSubItem[]) || [];
    const itemsTotal = receiptItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const handleAddSubItem = () => {
        const allIds = Array.from(new Set([formData.user_id, ...tripMembers.map((m) => m.user_id)].filter(Boolean)));
        const newItem: BudgetSubItem = {
            id: crypto.randomUUID(),
            name: "",
            original_name: "",
            quantity: 1,
            amount: 0,
            category: formData.category || "shopping",
            split_with: allIds,
            is_payer_included: true,
            selected: true,
        };
        onFormDataChange("receipt_items", [...receiptItems, newItem]);
    };

    const handleUpdateSubItem = (index: number, patch: Partial<BudgetSubItem>) => {
        const updated = [...receiptItems];
        updated[index] = { ...updated[index], ...patch };
        onFormDataChange("receipt_items", updated);
    };

    const handleDeleteSubItem = (index: number) => {
        const updated = receiptItems.filter((_, i) => i !== index);
        onFormDataChange("receipt_items", updated.length > 0 ? updated : null);
    };

    const handleToggleSubItemMember = (index: number, userId: string) => {
        const item = receiptItems[index];
        const current = Array.from(new Set([...(item.split_with || []), ...(item.is_payer_included !== false ? [formData.user_id] : [])]));
        const exists = current.includes(userId);
        if (exists && current.length <= 1) return;
        const next = exists ? current.filter((id) => id !== userId) : [...current, userId];
        handleUpdateSubItem(index, { split_with: next, is_payer_included: next.includes(formData.user_id) });
    };

    const [displayAmount, setDisplayAmount] = useState<string>(
        formData.amount ? formatThousands(formData.amount, true) : ""
    );

    useEffect(() => {
        const numDisplay = parseThousandsToNumber(displayAmount);
        if (numDisplay !== formData.amount && !isNaN(formData.amount)) {
            setDisplayAmount(formData.amount ? formatThousands(formData.amount, true) : "");
        }
    }, [formData.amount]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleThousandsInputChange(
            e,
            (formatted, numericValue) => {
                setDisplayAmount(formatted);
                onFormDataChange("amount", numericValue);
            },
            { allowDecimal: true }
        );
    };

    // 分帳計算輔助
    const totalSplitParticipants =
        (formData.is_payer_included !== false ? 1 : 0) + (formData.split_with?.length || 0);
    const amountNum = typeof formData.amount === "number" ? formData.amount : 0;
    const splitPerPerson =
        totalSplitParticipants > 0 && amountNum > 0
            ? Math.round(amountNum / totalSplitParticipants)
            : 0;

    return (
        <GlassModal isOpen={true} onClose={() => { if (!isSaving) onCloseBtnClick({} as any); }} maxWidth="2xl" className="md:!max-w-[760px]">
            <GlassModal.Header
                title={
                    <div className="flex items-center justify-center gap-1.5">
                        <Receipt size={17} className="text-primary shrink-0" />
                        <span className="truncate">{mode === "create" ? "新增支出帳目" : "編輯支出帳目"}</span>
                    </div>
                }
                onClose={() => { if (!isSaving) onCloseBtnClick({} as any); }}
                rightAction={
                    <button
                        type="submit"
                        form="transaction-form"
                        disabled={isSaving}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        {isSaving ? "儲存中…" : mode === "create" ? "完成" : "儲存"}
                    </button>
                }
            />

            <GlassModal.Body className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
                {receiptPreviewUrl && (
                    <details className="rounded-2xl border border-border p-3 text-xs">
                        <summary className="cursor-pointer font-bold">檢視收據照片與辨識資訊</summary>
                        <p className="my-2 text-muted-foreground">{receiptMessage || "辨識結果已帶入下方欄位，請確認後儲存。"}</p>
                        <img src={receiptPreviewUrl} alt="待記帳收據" className="max-h-64 w-full object-contain rounded-lg" />
                    </details>
                )}
                {receiptItems.length > 0 && Math.abs(Number(formData.amount) - itemsTotal) > 0.005 && (
                    <p className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-700 dark:text-amber-300">
                        細項合計 {formData.currency_code} {itemsTotal.toLocaleString()}，與帳目總額相差 {(Number(formData.amount) - itemsTotal).toLocaleString()}。
                        請確認稅金、服務費或折扣；差額會依整筆帳目的分攤對象分攤。
                    </p>
                )}
                {/* 分頁切換 (基本記帳 / 分帳設定) */}
                <GlassSegmentedControl
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { label: "💵 基本記帳", value: "basic" },
                        {
                            label: `👥 細項與分帳 ${
                                formData.split_with && formData.split_with.length > 0
                                    ? `(${formData.split_with.length})`
                                    : ""
                            }`,
                            value: "split",
                        },
                    ]}
                    size="sm"
                />

                <form id="transaction-form" onSubmit={(e) => onFormSubmit(e, splitMode)} className="space-y-4">
                    <fieldset disabled={isSaving} className="space-y-4">
                    {/* 💵 Tab 1: 基本記帳 */}
                    {activeTab === "basic" && (
                        <div className="space-y-4">
                            {/* 💰 Hero 金額輸入區塊 (Liquid Glass 醒目卡片) */}
                            <div className="bg-gradient-to-br from-white to-slate-50/90 dark:from-neutral-900/90 dark:to-neutral-950/90 border border-slate-200/90 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm backdrop-blur-md flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        支出金額
                                    </span>
                                    {/* 幣別切換膠囊 */}
                                    <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
                                        {Array.from(new Set([formData.currency_code, setting?.localCurrency, setting?.homeCurrency].filter(Boolean)))
                                            .map((curr) => (
                                                <button
                                                    key={curr}
                                                    type="button"
                                                    onClick={() => onFormDataChange("currency_code", curr)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                                        formData.currency_code === curr
                                                            ? "bg-blue-600 text-white shadow-2xs"
                                                            : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                                                    }`}
                                                >
                                                    {curr}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-mono font-bold text-neutral-500">
                                        {formData.currency_code || setting?.localCurrency || "$"}
                                    </span>
                                    <input
                                        type="text"
                                        name="amount"
                                        inputMode="decimal"
                                        value={displayAmount}
                                        onChange={handleAmountChange}
                                        onFocus={(e) => e.currentTarget.select()}
                                        placeholder="0"
                                        className="min-w-0 flex-1 bg-transparent text-3xl sm:text-4xl font-mono font-black text-neutral-900 dark:text-neutral-100 outline-none tracking-tight placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
                                    />
                                </div>

                                {splitMode === "simple" && totalSplitParticipants > 1 && amountNum > 0 && (
                                    <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-mono">
                                        <Calculator size={13} />
                                        <span>
                                            共 {totalSplitParticipants} 人分攤，每人約{" "}
                                            <strong>{formData.currency_code || "$"} {splitPerPerson.toLocaleString()}</strong>
                                        </span>
                                    </div>
                                )}
                                {splitMode === "itemized" && receiptItems.length > 0 && amountNum > 0 && (() => {
                                    // 計算每位成員應付的細項總額
                                    const memberTotals: Record<string, number> = {};
                                    receiptItems.forEach((item) => {
                                        const participants = Array.from(new Set([...(item.split_with || []), ...(item.is_payer_included !== false ? [formData.user_id] : [])]));
                                        if (participants.length === 0 || !item.amount) return;
                                        const share = Math.round(item.amount / participants.length);
                                        participants.forEach((uid) => {
                                            memberTotals[uid] = (memberTotals[uid] || 0) + share;
                                        });
                                    });
                                    const entries = Object.entries(memberTotals);
                                    if (entries.length === 0) return null;
                                    return (
                                        <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                                <Calculator size={11} />
                                                <span>各人份額預覽</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {entries.map(([uid, total]) => {
                                                    const name = tripMembers.find((tm) => tm.user_id === uid)?.profiles?.username || uid.slice(0, 5);
                                                    const isPayer = uid === formData.user_id;
                                                    return (
                                                        <span key={uid} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPayer ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"}`}>
                                                            {name}{isPayer ? " 💳" : ""}
                                                            <span className="font-mono">{formData.currency_code} {total.toLocaleString()}</span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* 交易明細 */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-1">
                                    交易明細
                                </span>
                                <div className="bg-white/90 dark:bg-neutral-900/70 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08] backdrop-blur-md shadow-xs">
                                    {/* 標題 */}
                                    <div className="p-3.5 flex items-center gap-3">
                                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 w-16 shrink-0">
                                            名稱 <span className="text-rose-500">*</span>
                                        </span>
                                        <input
                                            type="text"
                                            required
                                            name="title"
                                            value={formData.title}
                                            onChange={onFormInputChange}
                                            placeholder="例如：一蘭拉麵、地鐵西瓜卡加值"
                                            className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none font-medium"
                                        />
                                    </div>

                                    <label className="p-3.5 flex items-center gap-3">
                                        <span className="text-xs font-bold w-16 shrink-0">備註</span>
                                        <input type="text" name="notes" value={formData.notes || ""}
                                            onChange={onFormInputChange} placeholder="原文店名或其他備註"
                                            className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
                                    </label>
                                    {/* 分類 */}
                                    <div className="p-3.5">
                                        <CategoryCustomSelect
                                            label="分類 *"
                                            value={formData.category || "sight"}
                                            onChange={(newCatId) => onFormDataChange("category", newCatId)}
                                        />
                                    </div>

                                    {mode === "create" && tripMembers.length > 0 && (
                                        <label className="p-3.5 flex items-center justify-between gap-3">
                                            <span className="text-xs font-bold">付款人</span>
                                            <select aria-label="付款人" value={formData.user_id}
                                                onChange={(e) => onFormDataChange("user_id", e.target.value)}
                                                className="bg-neutral-50 dark:bg-neutral-800 border border-border rounded-xl px-3 py-1.5 text-xs">
                                                {!tripMembers.some((member) => member.user_id === formData.user_id) && <option value={formData.user_id}>自己</option>}
                                                {tripMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.profiles?.username || member.user_id.slice(0, 5)}</option>)}
                                            </select>
                                        </label>
                                    )}
                                    {/* 支付方式 */}
                                    <div className="p-3.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Wallet size={14} className="text-emerald-500 shrink-0" />
                                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                支付方式
                                            </span>
                                        </div>
                                        <select
                                            id="payment_method"
                                            name="payment_method_id"
                                            required
                                            value={formData.payment_method_id || ""}
                                            onChange={(e) => onFormDataChange("payment_method_id", e.target.value)}
                                            className="bg-neutral-50 dark:bg-neutral-800 border border-black/15 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-medium outline-none cursor-pointer shadow-2xs"
                                        >
                                            <option value="" disabled className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                                                請選擇支付方式
                                            </option>
                                            {Array.isArray(paymentMethods) &&
                                                paymentMethods.map((pm) => (
                                                    <option key={pm.id} value={pm.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                                                        {pm.type === "credit" ? "💳 " : "💵 "}
                                                        {pm.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* 交易日期 */}
                                    <div className="p-3.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-blue-500 shrink-0" />
                                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                交易日期 <span className="text-rose-500">*</span>
                                            </span>
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            name="expense_date"
                                            value={formData.expense_date || ""}
                                            onChange={onFormInputChange}
                                            className="bg-neutral-50 dark:bg-neutral-800 border border-black/15 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer shadow-2xs dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 👥 Tab 2: 分帳設定 */}
                    {activeTab === "split" && (
                        <div className="space-y-4">
                            {/* 分帳模式選擇器：簡易全額均分 vs 細項各自負擔 */}
                            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setSplitMode("simple")}
                                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        splitMode === "simple"
                                            ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs"
                                            : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
                                    }`}
                                >
                                    ⚡ 簡易全額均分
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSplitMode("itemized");
                                        if (receiptItems.length === 0) {
                                            handleAddSubItem();
                                        }
                                    }}
                                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        splitMode === "itemized"
                                            ? "bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs"
                                            : "text-slate-600 dark:text-neutral-400 hover:text-slate-900"
                                    }`}
                                >
                                    🧾 細項各自負擔 {receiptItems.length > 0 ? `(${receiptItems.length})` : ""}
                                </button>
                            </div>

                            {/* --- 模式 1: 簡易全額均分 --- */}
                            {splitMode === "simple" && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                            分帳對象
                                        </span>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {totalSplitParticipants} 人分攤
                                            {splitPerPerson > 0 && ` (每人 $${splitPerPerson.toLocaleString()})`}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 dark:bg-neutral-900/70 border border-black/10 dark:border-white/10 rounded-2xl p-3.5 backdrop-blur-md space-y-3 shadow-xs">
                                        <div className="flex flex-wrap gap-2">
                                            {/* 自己 */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onFormDataChange(
                                                        "is_payer_included",
                                                        formData.is_payer_included === false ? true : false
                                                    )
                                                }
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                                    formData.is_payer_included !== false
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                        : "bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 shadow-2xs"
                                                }`}
                                            >
                                                {formData.is_payer_included !== false && <Check size={12} className="stroke-[3]" />}
                                                <span>自己 (參與分帳)</span>
                                            </button>

                                            {/* 旅伴清單 */}
                                            {Array.isArray(tripMembers) &&
                                                tripMembers
                                                    .filter((tm) => tm.user_id !== formData.user_id)
                                                    .map((tm, i) => {
                                                        const isSelected =
                                                            formData.split_with?.includes(tm.user_id) || false;

                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => onFormDataChange("split_with", tm.user_id)}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                                                    isSelected
                                                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                                        : "bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 shadow-2xs"
                                                                }`}
                                                            >
                                                                {isSelected && <Check size={12} className="stroke-[3]" />}
                                                                <span>{tm.profiles?.username}</span>
                                                            </button>
                                                        );
                                                    })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- 模式 2: 細項各自負擔清單 --- */}
                            {splitMode === "itemized" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                                商品細項清單 ({receiptItems.length})
                                            </span>
                                            {itemsTotal > 0 && itemsTotal !== Number(formData.amount) && (
                                                <button
                                                    type="button"
                                                    onClick={() => onFormDataChange("amount", itemsTotal)}
                                                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 hover:underline cursor-pointer"
                                                >
                                                    🔄 總額同步為 ${itemsTotal.toLocaleString()}
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddSubItem}
                                            className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            <Plus size={13} />
                                            <span>新增細項</span>
                                        </button>
                                    </div>

                                    {receiptItems.length === 0 ? (
                                        <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 text-center space-y-2">
                                            <p className="text-xs text-muted-foreground">尚無商品細項，請點選上方「新增細項」</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {receiptItems.map((item, idx) => (
                                                <div
                                                    key={item.id || idx}
                                                    className="p-3 rounded-2xl bg-white dark:bg-neutral-850 border border-slate-200/90 dark:border-neutral-700/80 shadow-2xs space-y-2"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => handleUpdateSubItem(idx, { name: e.target.value })}
                                                            aria-label={`品項 ${idx + 1} 中文名稱`}
                                                            placeholder="商品中文名稱 (例: 咖啡)"
                                                            className="min-w-0 flex-1 bg-transparent text-xs font-bold text-foreground placeholder:text-muted-foreground/60 border-b border-dashed border-slate-200 dark:border-neutral-700 pb-1 focus:outline-none focus:border-blue-500"
                                                        />
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="text-xs font-bold text-neutral-400">$</span>
                                                            <input
                                                                type="number"
                                                                value={item.amount || ""}
                                                                onChange={(e) => handleUpdateSubItem(idx, { amount: Number(e.target.value) || 0 })}
                                                                aria-label={`品項 ${idx + 1} 整列金額`}
                                                                step="any"
                                                                placeholder="整列金額"
                                                                className="w-20 bg-transparent text-xs font-mono font-bold text-foreground text-right border-b border-dashed border-slate-200 dark:border-neutral-700 pb-1 focus:outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSubItem(idx)}
                                                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-3">
                                                        <label className="text-[10px] text-muted-foreground">
                                                            原文名稱
                                                            <input type="text" value={item.original_name || ""}
                                                                onChange={(e) => handleUpdateSubItem(idx, { original_name: e.target.value })}
                                                                placeholder="收據上的原文"
                                                                className="mt-1 w-full bg-transparent border-b border-border py-1 text-xs text-foreground outline-none" />
                                                        </label>
                                                        <label className="text-[10px] text-muted-foreground">
                                                            數量
                                                            <input type="number" min="0.001" step="any" required value={item.quantity ?? 1}
                                                                onChange={(e) => handleUpdateSubItem(idx, { quantity: Number(e.target.value) })}
                                                                className="mt-1 w-full bg-transparent border-b border-border py-1 text-xs text-foreground outline-none" />
                                                        </label>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">金額為整列小計，已包含數量。</p>
                                                    {/* 成員分攤標籤 */}
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                        <span className="text-[10px] text-muted-foreground mr-1">分攤:</span>
                                                        {tripMembers.map((tm) => {
                                                            const isSelected = item.split_with?.includes(tm.user_id) || (tm.user_id === formData.user_id && item.is_payer_included !== false);
                                                            return (
                                                                <button
                                                                    key={tm.user_id}
                                                                    type="button"
                                                                    onClick={() => handleToggleSubItemMember(idx, tm.user_id)}
                                                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                                        isSelected
                                                                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                                                            : "bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 border-transparent hover:bg-slate-200 dark:hover:bg-neutral-600 dark:hover:text-neutral-100"
                                                                    }`}
                                                                >
                                                                    {isSelected && "✓ "}{tm.profiles?.username || tm.user_id.slice(0, 5)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 收款狀態 (代墊收回) */}
                            {mode === "edit" && formData.split_with && formData.split_with.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                            收款狀態 (代墊已收回)
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            {formData.settled_with?.length || 0} 人已結清
                                        </span>
                                    </div>

                                    <div className="bg-white/90 dark:bg-neutral-900/70 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08] backdrop-blur-md shadow-xs">
                                        {Array.isArray(tripMembers) &&
                                            tripMembers
                                                .filter((tm) => formData.split_with?.includes(tm.user_id))
                                                .map((tm, i) => {
                                                    const isSettled =
                                                        formData.settled_with?.includes(tm.user_id) || false;
                                                    return (
                                                        <label
                                                            key={i}
                                                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div
                                                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                                        isSettled
                                                                            ? "bg-emerald-500 text-white"
                                                                            : "border-2 border-neutral-300 dark:border-neutral-600 bg-transparent"
                                                                    }`}
                                                                >
                                                                    {isSettled && <Check size={13} className="stroke-[3]" />}
                                                                </div>
                                                                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                                                    已向 <strong className="font-bold">{tm.profiles?.username}</strong> 收回款項
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSettled}
                                                                onChange={() => onFormDataChange("settled_with", tm.user_id)}
                                                                className="sr-only"
                                                            />
                                                        </label>
                                                    );
                                                })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 🗑️ 編輯模式下的刪除按鈕 */}
                    {mode === "edit" && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => onDeleteBtnClick(formData)}
                                className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Trash2 size={14} />
                                刪除此筆支出
                            </button>
                        </div>
                    )}
                    </fieldset>
                </form>
            </GlassModal.Body>
        </GlassModal>
    );
};

export default TransactionModal;
