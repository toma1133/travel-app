import React, { useState } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Settings,
    Store,
    Sparkles,
    ChevronRight,
    Building2,
    Layers,
    ArrowRight,
    ShoppingCart,
} from "lucide-react";
import { getCurrencySymbol } from "../../utils/CurrencyUtil";

export type StoreItemStat = {
    name: string;
    amount: number;
    total: number;
    unbought: number;
    threshold: number;
};

type TaxFreeBarProps = {
    selectedStore: string; // "all" | storeName
    allStores: StoreItemStat[];
    currency?: string;
    onSelectStore: (storeName: string) => void;
    onUpdateThreshold: (storeName: string, newThreshold: number) => void;
    onOpenStoreBatchBuy?: (storeName: string) => void;
};

const TaxFreeBar = ({
    selectedStore,
    allStores = [],
    currency = "JPY",
    onSelectStore,
    onUpdateThreshold,
    onOpenStoreBatchBuy,
}: TaxFreeBarProps) => {
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
        <div className="space-y-2 bg-card/60 border border-border/80 rounded-3xl p-3 sm:p-4 shadow-xs">
            {/* 1. Consolidated Store Filter & Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground shrink-0 pl-1">
                    <Store size={14} className="text-primary" />
                    <span className="hidden sm:inline">店家免稅:</span>
                </div>

                {/* "All Stores" Tab */}
                <button
                    type="button"
                    onClick={() => onSelectStore("all")}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                        selectedStore === "all"
                            ? "bg-foreground text-background border-foreground shadow-xs scale-[1.02]"
                            : "bg-background/80 hover:bg-muted border-border/70 text-foreground"
                    }`}
                >
                    <span>全部店家</span>
                    <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            selectedStore === "all"
                                ? "bg-background/20 text-background"
                                : "bg-muted text-muted-foreground"
                        }`}
                    >
                        {totalItemsCount}件
                    </span>
                    {allStores.length > 0 && (
                        <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                unqualifiedStores.length === 0
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                        >
                            {qualifiedStores.length}/{allStores.length}免稅
                        </span>
                    )}
                </button>

                {/* Individual Store Tabs with Tax-Free Badge & Mini Progress Bar */}
                {allStores.map((st) => {
                    const isSelected = selectedStore === st.name;
                    const qualified = st.amount >= st.threshold;
                    const diff = Math.max(0, st.threshold - st.amount);
                    const percent = Math.min(100, Math.round((st.amount / st.threshold) * 100));

                    return (
                        <button
                            key={st.name}
                            type="button"
                            onClick={() => onSelectStore(st.name)}
                            className={`relative px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex flex-col gap-1 border overflow-hidden ${
                                isSelected
                                    ? "bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/40"
                                    : "bg-background/80 hover:bg-muted border-border/70 text-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <Building2 size={12} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                                <span className="max-w-[120px] truncate">{st.name}</span>

                                {/* Item count */}
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {st.unbought}/{st.total}
                                </span>

                                {/* Tax-free pill */}
                                <span
                                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                                        qualified
                                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                    }`}
                                >
                                    {qualified ? "✓ 免稅" : `差${currencySymbol}${diff.toLocaleString()}`}
                                </span>
                            </div>

                            {/* Mini Progress Bar Line on Bottom of Tab */}
                            <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        qualified ? "bg-emerald-500" : "bg-amber-500"
                                    }`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* 2. Contextual Tax-Free Progress Panel */}
            {selectedStore !== "all" && activeStore ? (
                /* Detail Bar for Selected Store */
                <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border/60 p-3 sm:p-3.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isQualified
                                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                        : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                }`}
                            >
                                {isQualified ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                                        <span>【{activeStore.name}】</span>
                                        <span>免稅湊單進度</span>
                                    </span>

                                    <span
                                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                            isQualified
                                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                        }`}
                                    >
                                        {isQualified
                                            ? "🎉 已達免稅資格"
                                            : `還差 ${currencySymbol}${activeDiff.toLocaleString()} 免稅`}
                                    </span>
                                </div>

                                <div className="text-xs text-muted-foreground mt-0.5 flex items-baseline gap-1.5 font-mono">
                                    <span className="font-bold text-foreground">
                                        {currencySymbol}{activeStore.amount.toLocaleString()}
                                    </span>
                                    <span>/</span>
                                    <span>目標 {currencySymbol}{activeStore.threshold.toLocaleString()}</span>
                                    <span className="font-bold text-foreground ml-1">({activePercent}%)</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Threshold Edit Trigger */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {onOpenStoreBatchBuy && (
                                <button
                                    type="button"
                                    onClick={() => onOpenStoreBatchBuy(activeStore.name)}
                                    className="text-[11px] font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                                    title="在同一店家集中快速填寫購買數量與價格"
                                >
                                    <ShoppingCart size={13} />
                                    <span>店內快速記數</span>
                                </button>
                            )}

                            {isEditingThreshold ? (
                                <form onSubmit={handleSaveThreshold} className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        value={customThreshold}
                                        onChange={(e) => setCustomThreshold(e.target.value)}
                                        className="w-20 px-2 py-1 text-xs bg-background border border-input rounded-lg text-foreground outline-none font-mono"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="px-2 py-1 text-xs bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 cursor-pointer"
                                    >
                                        儲存
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingThreshold(false)}
                                        className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
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
                                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-muted border border-border/70 transition-colors cursor-pointer"
                                    title="調整免稅門檻"
                                >
                                    <Settings size={12} />
                                    <span>門檻 {currencySymbol}{activeStore.threshold}</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => onSelectStore("all")}
                                className="text-[11px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                            >
                                <span>看全部</span>
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5 w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${
                                isQualified
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    : "bg-gradient-to-r from-amber-500 to-rose-400"
                            }`}
                            style={{ width: `${activePercent}%` }}
                        />
                    </div>
                </div>
            ) : (
                /* Overview Ribbon when "All Stores" is selected */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1 text-xs text-muted-foreground rounded-2xl bg-muted/20 border border-border/40">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground flex items-center gap-1">
                            <Sparkles size={13} className="text-amber-500" />
                            <span>免稅概況：</span>
                        </span>
                        <span className="text-foreground font-medium">
                            共 <span className="font-bold text-primary">{allStores.length}</span> 間指定店家
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {qualifiedStores.length} 間已免稅
                        </span>
                        {unqualifiedStores.length > 0 && (
                            <>
                                <span>•</span>
                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                    {unqualifiedStores.length} 間差額湊單中
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {/* Quick store shortcut pills for stores that still need湊單 */}
                        {unqualifiedStores.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px]">點擊湊單：</span>
                                {unqualifiedStores.slice(0, 3).map((st) => (
                                    <button
                                        key={st.name}
                                        type="button"
                                        onClick={() => onSelectStore(st.name)}
                                        className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <span>{st.name}</span>
                                        <span>(差{currencySymbol}{st.threshold - st.amount})</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 size={13} />
                                <span>所有店家皆已達免稅門檻</span>
                            </div>
                        )}

                        {onOpenStoreBatchBuy && allStores.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onOpenStoreBatchBuy(allStores[0].name)}
                                className="text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 px-2.5 py-1 rounded-xl border border-primary/30 transition-all cursor-pointer"
                                title="在同一店家集中快速填寫購買數量"
                            >
                                <ShoppingCart size={12} />
                                <span>店內記數</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxFreeBar;
