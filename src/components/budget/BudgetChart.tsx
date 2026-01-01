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
                              item.split_with?.length! > 0 ? item.amount / (item.split_with?.length! + 1) : item.amount,
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
                        item.split_with?.length! > 0 ? item.amount / (item.split_with?.length! + 1) : item.amount,
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
        <div className="px-4 mt-6 mb-8">
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
                        <div className="text-xs text-gray-500 mt-1 print:text-right">
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
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {Object.entries(categoryStats).length > 1 &&
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
                                                    theme?.categoryColor[cat],
                                                width: `${Math.round(
                                                    (val / totalSpentHome) * 100
                                                )}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                </div>
            </div>
        </div>
    );
};

export default BudgetChart;
