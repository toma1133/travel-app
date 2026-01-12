import { useEffect, useState } from "react";
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
}: BudgetChartProps) => {
    const [totalSpentHome, setTotalSpentHome] = useState(0);
    const [categoryStats, setCategoryStats] = useState<{
        [key: string]: number;
    }>({});

    useEffect(() => {
        setTotalSpentHome(
            Array.isArray(budgetItems)
                ? budgetItems.reduce(
                      (sum, item) =>
                          sum +
                          convertToHome(
                              item.split_with?.length! > 0
                                  ? item.amount / (item.split_with?.length! + 1)
                                  : item.amount,
                              item.currency_code,
                              setting?.homeCurrency,
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
                        item.split_with?.length! > 0
                            ? item.amount / (item.split_with?.length! + 1)
                            : item.amount,
                        item.currency_code,
                        setting?.homeCurrency,
                        setting?.exchangeRate
                    );
                    acc[item.category] = (acc[item.category] || 0) + homeAmount;
                    return acc;
                }, {})
            );
        }
    }, [budgetItems]);

    return (
        <div className={`mt-6 ${isPrinting ? "mb-4" : "mb-8"}`}>
            {/* 1. 螢幕顯示: 深色卡片 (只在 !isPrinting 時渲染) */}
            {!isPrinting && (
                <div className="bg-slate-900 rounded-lg p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                                總支出
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-slate-500 text-xl font-mono">
                                    {setting?.homeCurrency}
                                </span>
                                <h2 className="text-5xl font-light font-mono tracking-tighter">
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
                    </div>
                    {/* Progress Bars */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {Object.entries(categoryStats).length > 0 &&
                            Object.entries(categoryStats)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, val]) => (
                                    <div
                                        key={cat}
                                        className="flex flex-col items-start justify-center"
                                    >
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="text-xs text-slate-400 font-bold uppercase">
                                                {getCategoryName(cat)}
                                            </span>
                                            <span className="text-xs font-mono text-rose-400 font-bold">
                                                {Math.round(
                                                    (val / totalSpentHome) * 100
                                                )}
                                                %
                                            </span>
                                        </div>
                                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-1000"
                                                style={{
                                                    backgroundColor:
                                                        theme?.categoryColor[
                                                            cat
                                                        ],
                                                    width: `${Math.round(
                                                        (val / totalSpentHome) *
                                                            100
                                                    )}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                    </div>
                </div>
            )}

            {/* 2. 列印顯示: 簡潔的統計表格 (只在 isPrinting 時渲染) */}
            {isPrinting && (
                <div className="border border-gray-300 rounded p-4">
                    <div className="flex justify-between items-end border-b border-gray-300 pb-2 mb-4">
                        <div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                Estimated Total
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-gray-500 text-sm font-mono font-bold">
                                    {setting?.homeCurrency}
                                </span>
                                <h2 className="text-3xl font-bold font-mono text-black">
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
                                    className="flex justify-between items-center text-sm border-b border-gray-100 pb-1"
                                >
                                    <span className="font-medium text-gray-700 truncate">
                                        {getCategoryName(cat)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-900 font-mono">
                                            {val.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-gray-400 w-8 text-right">
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
