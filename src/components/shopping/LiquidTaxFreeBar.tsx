import React, { useState } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Settings,
    Store,
    Sparkles,
    ChevronRight,
    Building2,
    ShoppingCart,
    Coins,
} from "lucide-react";
import { getCurrencySymbol } from "../../utils/CurrencyUtil";
import { GlassCard, GlassBadge, GlassButton } from "../ui";

export type StoreItemStat = {
    name: string;
    amount: number;
    total: number;
    unbought: number;
    threshold: number;
};

export type LiquidTaxFreeBarProps = {
    selectedStore: string; // "all" | storeName
    allStores: StoreItemStat[];
    currency?: string;
    onSelectStore: (storeName: string) => void;
    onUpdateThreshold: (storeName: string, newThreshold: number) => void;
    onOpenStoreBatchBuy?: (storeName: string) => void;
};

export const LiquidTaxFreeBar: React.FC<LiquidTaxFreeBarProps> = ({
    selectedStore,
    allStores = [],
    currency = "JPY",
    onSelectStore,
    onUpdateThreshold,
    onOpenStoreBatchBuy,
}) => {
    const [isEditingThreshold, setIsEditingThreshold] = useState(false);
    const [customThreshold, setCustomThreshold] = useState("");

    const currencySymbol = getCurrencySymbol(currency);

    // Store statistics aggregates
    const totalItemsCount = allStores.reduce((s, st) => s + st.total, 0);
    const totalUnboughtCount = allStores.reduce((s, st) => s + st.unbought, 0);
    const totalPlannedAmount = allStores.reduce((s, st) => s + st.amount, 0);

    const qualifiedStores = allStores.filter((s) => s.amount >= s.threshold);
    const unqualifiedStores = allStores.filter((s) => s.amount < s.threshold);

    // Identify active store data
    const activeStore =
        selectedStore !== "all"
            ? allStores.find((s) => s.name === selectedStore) || null
            : null;

    const isQualified = activeStore ? activeStore.amount >= activeStore.threshold : false;
    const activeDiff = activeStore
        ? Math.max(0, activeStore.threshold - activeStore.amount)
        : 0;
    const activePercent = activeStore
        ? Math.min(100, Math.round((activeStore.amount / activeStore.threshold) * 100))
        : 0;

    const handleSaveThreshold = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeStore) return;
        const num = parseFloat(customThreshold);
        if (!isNaN(num) && num > 0) {
            onUpdateThreshold(activeStore.name, num);
        }
        setIsEditingThreshold(false);
    };

    return (
        <GlassCard
            variant="elevated"
            rounded="3xl"
            padding="sm"
            className="bg-white/95 dark:liquid-glass-elevated border-slate-200/90 dark:border-white/10 shadow-lg space-y-2.5 transition-all"
        >
            {/* 1. 店家切換膠囊橫向滾動列 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pt-0.5 px-1">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-neutral-400 shrink-0 pl-1 mr-1">
                    <Store size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">免稅店家:</span>
                </div>

                {/* 全部店家 Tab */}
                <button
                    type="button"
                    onClick={() => onSelectStore("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                        selectedStore === "all"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]"
                            : "bg-white dark:bg-neutral-800 hover:bg-slate-50 text-slate-800 dark:text-neutral-200 border-slate-200 dark:border-neutral-700 shadow-2xs"
                    }`}
                >
                    <span>全部店家</span>
                    <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            selectedStore === "all"
                                ? "bg-white/20 dark:bg-black/20 text-current"
                                : "bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold"
                        }`}
                    >
                        {totalItemsCount}
                    </span>
                </button>

                {/* 個別店家 Tabs */}
                {allStores.map((st) => {
                    const isSelected = selectedStore === st.name;
                    const reach = st.amount >= st.threshold;
                    return (
                        <button
                            key={st.name}
                            type="button"
                            onClick={() => onSelectStore(st.name)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                                isSelected
                                    ? reach
                                        ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20 shadow-sm scale-[1.02]"
                                        : "bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]"
                                    : reach
                                    ? "bg-emerald-50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100"
                                    : "bg-white dark:bg-neutral-800 hover:bg-slate-50 text-slate-800 dark:text-neutral-200 border-slate-200 dark:border-neutral-700 shadow-2xs"
                            }`}
                        >
                            {reach && <Sparkles size={11} className="text-amber-300 shrink-0 animate-pulse" />}
                            <span className="truncate max-w-[120px]">{st.name}</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                    isSelected
                                        ? "bg-white/25 dark:bg-black/25 text-current"
                                        : reach
                                        ? "bg-emerald-200/50 dark:bg-emerald-500/25 text-emerald-900 dark:text-emerald-100 font-bold"
                                        : "bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold"
                                }`}
                            >
                                {st.total}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* 2. 核心統計與流體免稅膠囊 */}
            <div className="bg-white/90 dark:bg-neutral-900/60 rounded-2xl p-3.5 border border-black/[0.06] dark:border-white/10 shadow-xs space-y-2.5 backdrop-blur-md">
                {selectedStore === "all" ? (
                    /* 檢視「全部店家」時的毛玻璃總覽 */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                <Building2 size={18} />
                            </div>
                            <div>
                                <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                                    全行程伴手禮採購總計
                                </div>
                                <div className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                    <span>{currencySymbol} {totalPlannedAmount.toLocaleString()}</span>
                                    <span className="text-[11px] font-normal text-neutral-500">
                                        (共 {allStores.length} 家門市，{totalItemsCount} 件商品)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 免稅達標狀態統計 */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                            {qualifiedStores.length > 0 && (
                                <GlassBadge
                                    color="emerald"
                                    size="sm"
                                    icon={<CheckCircle2 size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
                                    className="whitespace-nowrap shrink-0 px-2.5 py-1"
                                >
                                    {qualifiedStores.length} 家已達免稅
                                </GlassBadge>
                            )}
                            {unqualifiedStores.length > 0 && (
                                <GlassBadge
                                    color="amber"
                                    size="sm"
                                    icon={<AlertCircle size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />}
                                    className="whitespace-nowrap shrink-0 px-2.5 py-1"
                                >
                                    {unqualifiedStores.length} 家尚待湊單
                                </GlassBadge>
                            )}
                        </div>
                    </div>
                ) : activeStore ? (
                    /* 檢視「特定店家」時的流體免稅動態進度條 */
                    <div className="space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                                <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1 whitespace-nowrap shrink-0">
                                    <Store size={14} className="text-primary shrink-0" />
                                    <span>{activeStore.name}</span>
                                </span>

                                {isQualified ? (
                                    <GlassBadge
                                        color="emerald"
                                        size="sm"
                                        icon={<Sparkles size={11} className="text-amber-400 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />}
                                        className="font-bold whitespace-nowrap shrink-0 px-2.5 py-1"
                                    >
                                        🎉 已達免稅門檻！省約 10%
                                    </GlassBadge>
                                ) : (
                                    <GlassBadge
                                        color="amber"
                                        size="sm"
                                        icon={<Coins size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />}
                                        className="font-semibold whitespace-nowrap shrink-0 px-2.5 py-1"
                                    >
                                        尚差 {currencySymbol} {activeDiff.toLocaleString()} 免稅
                                    </GlassBadge>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* 門檻自訂切換 */}
                                {isEditingThreshold ? (
                                    <form onSubmit={handleSaveThreshold} className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={customThreshold}
                                            onChange={(e) => setCustomThreshold(e.target.value)}
                                            placeholder={activeStore.threshold.toString()}
                                            className="w-20 px-2 py-0.5 rounded-lg border border-white/30 text-xs font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            className="px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold"
                                        >
                                            儲存
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingThreshold(false)}
                                            className="px-1.5 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-700"
                                        >
                                            取消
                                        </button>
                                    </form>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomThreshold(activeStore.threshold.toString());
                                            setIsEditingThreshold(true);
                                        }}
                                        className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                        title="修改門檻金額"
                                    >
                                        <Settings size={12} />
                                        <span>門檻 {currencySymbol}{activeStore.threshold.toLocaleString()}</span>
                                    </button>
                                )}

                                {/* 一鍵門市採購/批次記帳 */}
                                {onOpenStoreBatchBuy && activeStore.unbought > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenStoreBatchBuy(activeStore.name)}
                                        className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                    >
                                        <ShoppingCart size={12} />
                                        <span>批次採購 ({activeStore.unbought})</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 流體毛玻璃進度條 */}
                        <div className="relative w-full h-3 rounded-full bg-slate-200/80 dark:bg-neutral-800 border border-slate-300/60 dark:border-neutral-700 overflow-hidden p-0.5 backdrop-blur-xs">
                            <div
                                className={`h-full rounded-full transition-all duration-500 relative overflow-hidden ${
                                    isQualified
                                        ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-sm shadow-emerald-500/50"
                                        : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                                }`}
                                style={{ width: `${activePercent}%` }}
                            >
                                {/* 流體波紋高光微動畫 */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </div>
                        </div>

                        {/* 金額統計數字 */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                            <span>
                                預計金額: <strong className="text-neutral-900 dark:text-neutral-100 font-bold">{currencySymbol} {activeStore.amount.toLocaleString()}</strong>
                            </span>
                            <span>
                                免稅門檻: <strong className="text-neutral-900 dark:text-neutral-100 font-bold">{currencySymbol} {activeStore.threshold.toLocaleString()}</strong> ({activePercent}%)
                            </span>
                        </div>
                    </div>
                ) : null}
            </div>
        </GlassCard>
    );
};

export default LiquidTaxFreeBar;
