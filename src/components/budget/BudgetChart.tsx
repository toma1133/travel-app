import { useEffect, useState } from "react";
import { Settings, Wallet } from "lucide-react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";

type BudgetChartProps = {
    budgetItems?: BudgetRow[];
    isPrinting?: boolean;
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    convertToHome: (
        amount: number,
        currency: string,
        homeCurrency?: string,
        exchangeRate?: number
    ) => number;
    convertToLocal: (
        amount: number,
        currency: string,
        localCurrency?: string,
        exchangeRate?: number
    ) => number;
    getChartGradient: (
        totalSpentHome: number,
        categoryStats: { [key: string]: number },
        theme: TripThemeConf | null
    ) => string;
    getCategoryName: (cat: string) => string;
    onOpenSmartSettlement?: () => void;
    onOpenSettings?: () => void;
    selectedCategories?: string[];
    onToggleCategoryFilter?: (catId: string) => void;
    onClearCategoryFilter?: () => void;
};

const BudgetChart = ({
    budgetItems,
    isPrinting,
    setting,
    theme,
    convertToHome,
    convertToLocal,
    getChartGradient,
    getCategoryName,
    onOpenSmartSettlement,
    onOpenSettings,
    selectedCategories = [],
    onToggleCategoryFilter,
    onClearCategoryFilter,
}: BudgetChartProps) => {
    const [totalSpentHome, setTotalSpentHome] = useState(0);
    const [categoryStats, setCategoryStats] = useState<{
        [key: string]: number;
    }>({});

    useEffect(() => {
        const getAmountPortion = (item: BudgetRow) => {
            let consumerCount = item.split_with ? item.split_with.length : 0;
            if (item.is_payer_included !== false) {
                consumerCount += 1;
            }
            return consumerCount > 0 ? item.amount / consumerCount : item.amount;
        };

        setTotalSpentHome(
            Array.isArray(budgetItems)
                ? budgetItems.reduce(
                      (sum, item) =>
                          sum +
                          convertToHome(
                              getAmountPortion(item),
                              item.currency_code,
                              setting?.homeCurrency!,
                              setting?.exchangeRate
                          ),
                      0
                  )
                : 0
        );

        if (Array.isArray(budgetItems)) {
            setCategoryStats(
                budgetItems.reduce((acc: { [key: string]: number }, item) => {
                    const homeAmount = convertToHome(
                        getAmountPortion(item),
                        item.currency_code,
                        setting?.homeCurrency!,
                        setting?.exchangeRate
                    );
                    acc[item.category] = (acc[item.category] || 0) + homeAmount;
                    return acc;
                }, {})
            );
        }
    }, [budgetItems]);

    return (
        <div className={`${isPrinting ? "mb-4" : "mb-8"}`}>
            {/* 1. 螢幕顯示: 深色卡片 (只在 !isPrinting 時渲染) */}
            {!isPrinting && (
                <div className="bg-card border border-gray-300 dark:border-border rounded-lg p-6 sm:p-8 text-foreground shadow-md relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start gap-2">
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                                總支出
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-slate-500 text-xl font-mono">
                                    {setting?.homeCurrency}
                                </span>
                                <h2 className="text-4xl sm:text-5xl font-light font-mono tracking-tighter">
                                    {totalSpentHome.toLocaleString()}
                                </h2>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                ≈ {setting?.localCurrency}{" "}
                                {convertToLocal(
                                    totalSpentHome,
                                    setting?.homeCurrency!,
                                    setting?.localCurrency,
                                    setting?.exchangeRate
                                ).toLocaleString()}
                            </div>
                        </div>

                        {/* 右上角操作快捷區：分帳結算與設定 */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {onOpenSmartSettlement && (
                                <button
                                    type="button"
                                    onClick={onOpenSmartSettlement}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-2xs active:scale-95"
                                    title="分帳結算中心"
                                >
                                    <Wallet size={14} className="shrink-0" />
                                    <span>結算</span>
                                </button>
                            )}
                            {onOpenSettings && (
                                <button
                                    type="button"
                                    onClick={onOpenSettings}
                                    className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border/50 transition-all cursor-pointer shadow-2xs active:scale-95"
                                    title="帳本與支付方式設定"
                                >
                                    <Settings size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Category Breakdown Progress Bars & Interactive Filter Cards */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 p-0.5">
                        {Object.entries(categoryStats).length > 0 &&
                            Object.entries(categoryStats)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, val]) => {
                                    const isSelected = selectedCategories.includes(cat);
                                    const hasAnySelected = selectedCategories.length > 0;
                                    const catColor = theme?.categoryColor[cat] || "#9CA3AF";
                                    const pct = totalSpentHome > 0 ? Math.round((val / totalSpentHome) * 100) : 0;

                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => onToggleCategoryFilter?.(cat)}
                                            className={`flex flex-col items-start justify-center p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                                                isSelected
                                                    ? "bg-primary/15 border-primary shadow-xs ring-2 ring-inset ring-primary/50"
                                                    : hasAnySelected
                                                    ? "bg-slate-900/40 dark:bg-neutral-800/40 border-slate-700/40 opacity-40 hover:opacity-90"
                                                    : "bg-slate-900/30 dark:bg-neutral-800/30 border-slate-700/50 hover:border-slate-500 hover:bg-slate-800/50"
                                            }`}
                                            title={
                                                isSelected
                                                    ? `點擊取消篩選【${getCategoryName(cat)}】`
                                                    : `點擊篩選【${getCategoryName(cat)}】交易`
                                            }
                                        >
                                            <div className="flex items-center justify-between w-full gap-1.5 mb-1.5">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: catColor }}
                                                    />
                                                    <span
                                                        className={`text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis ${
                                                            isSelected
                                                                ? "text-primary font-black"
                                                                : "text-slate-200"
                                                        }`}
                                                        title={getCategoryName(cat)}
                                                    >
                                                        {getCategoryName(cat)}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`text-xs font-mono font-bold shrink-0 ml-1 ${
                                                        isSelected ? "text-primary" : "text-rose-400"
                                                    }`}
                                                >
                                                    {pct}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-800 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-700 rounded-full"
                                                    style={{
                                                        backgroundColor: catColor,
                                                        width: `${pct}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </button>
                                    );
                                })}
                    </div>

                    {/* Filter active feedback / hint */}
                    {selectedCategories.length > 0 && (
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/50 text-[11px]">
                            <span className="text-slate-400">
                                正在篩選：
                                <strong className="text-primary font-bold ml-1">
                                    {selectedCategories.map((c) => getCategoryName(c)).join(", ")}
                                </strong>
                            </span>
                            <button
                                type="button"
                                onClick={onClearCategoryFilter}
                                className="text-primary hover:underline font-bold cursor-pointer"
                            >
                                清除篩選 (顯示全部)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 2. 列印顯示: 簡潔的統計表格 (只在 isPrinting 時渲染) */}
            {isPrinting && (
                <div className="border border-gray-300 rounded p-4 text-black">
                    <div className="flex justify-between items-end border-b border-gray-300 pb-2 mb-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Estimated Total
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-mono font-bold text-gray-500">
                                    {setting?.homeCurrency}
                                </span>
                                <h2 className="text-3xl font-bold font-mono">
                                    {totalSpentHome.toLocaleString()}
                                </h2>
                            </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            ≈ {setting?.localCurrency}{" "}
                            {convertToLocal(
                                totalSpentHome,
                                setting?.homeCurrency!,
                                setting?.localCurrency,
                                setting?.exchangeRate
                            ).toLocaleString()}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {Object.entries(categoryStats)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, val]) => (
                                <div
                                    key={cat}
                                    className="flex justify-between items-center text-sm border-b border-gray-200 pb-1 text-black"
                                >
                                    <span className="font-medium">
                                        {getCategoryName(cat)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">
                                            {val.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-gray-500 w-8 text-right">
                                            {Math.round(
                                                (val / totalSpentHome) * 100
                                            )}
                                            %
                                        </span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetChart;
