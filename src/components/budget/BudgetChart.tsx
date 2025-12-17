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
                              item.amount,
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
                        item.amount,
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
        <div
            className={`flex flex-row px-4 items-center justify-between ${
                isPrinting ? "mb-6 border border-gray-300 p-4" : "mb-10"
            }`}
        >
            <div className="relative w-32 h-32 shrink-0">
                {/* Chart Ring */}
                <div
                    className="w-full h-full rounded-full print:border print:border-gray-400"
                    style={{
                        background: getChartGradient(
                            totalSpentHome,
                            categoryStats,
                            theme
                        ),
                        mask: "radial-gradient(transparent 60%, black 61%)",
                        WebkitMask:
                            "radial-gradient(transparent 60%, black 61%)",
                    }}
                ></div>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider print:text-gray-600">
                        總支出
                    </span>
                    <span className={`text-sm font-bold ${theme?.mono}`}>
                        {setting?.homeCurrency}
                    </span>
                </div>
            </div>
            <div className="flex-1 pl-6 text-right">
                <div className="text-5xl font-light tracking-tighter text-gray-900 font-mono print:text-right">
                    {totalSpentHome.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1 print:text-right">
                    ≈ {setting?.localCurrency}{" "}
                    {Math.round(
                        totalSpentHome / setting?.exchangeRate!
                    ).toLocaleString()}
                </div>
                {/* Legend Mini */}
                <div
                    className={`flex flex-wrap justify-end gap-2 mt-4 ${
                        isPrinting ? "border-t border-gray-300 pt-4" : ""
                    }`}
                >
                    {Object.entries(categoryStats)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, val]) => (
                            <div
                                key={cat}
                                className="flex items-center text-[10px] text-gray-500"
                            >
                                <div
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{
                                        backgroundColor:
                                            theme?.categoryColor[cat],
                                    }}
                                ></div>
                                {getCategoryName(cat)}
                                {Math.round((val / totalSpentHome) * 100)}%
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default BudgetChart;
