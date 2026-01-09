import { useEffect, useState } from "react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import BudgetLimitItem from "./BudgetLimitItem";

type BudgetLimitListProps = {
    budgetItems?: BudgetRow[];
    isPrinting?: boolean;
    paymentMethods?: PaymentMethodRow[];
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    convertToHome: (
        amount: number,
        currency: string,
        homeCurrency?: string,
        exchangeRate?: number
    ) => number;
};

const BudgetLimitList = ({
    budgetItems,
    isPrinting,
    paymentMethods,
    setting,
    theme,
    convertToHome,
}: BudgetLimitListProps) => {
    const [usage, setUsage] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const localUsage: { [key: string]: number } = {};

        if (Array.isArray(paymentMethods))
            paymentMethods.forEach((pm) => (localUsage[pm.id] = 0));

        if (Array.isArray(budgetItems))
            budgetItems.forEach((item) => {
                if (localUsage[item.payment_method_id] !== undefined) {
                    localUsage[item.payment_method_id] += convertToHome(
                        item.amount,
                        item.currency_code,
                        setting?.homeCurrency,
                        setting?.exchangeRate
                    );
                }
            });

        setUsage(localUsage);
    }, [budgetItems, paymentMethods]);

    return (
        <div
            className={`px-4 ${
                // 列印優化: 移除 padding-x 因為父層可能有 padding, 移除外框, 僅保留 margin
                isPrinting ? "print:px-0 print:mb-6" : "mb-8"
            }`}
        >
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 print:text-black print:text-xs print:mb-2">
                支付額度狀態
            </h4>
            <div
                className={`grid ${
                    // 列印優化: 雙欄排版，增加間距
                    isPrinting
                        ? "print:grid print:grid-cols-2 print:gap-4"
                        : "space-y-3"
                }`}
            >
                {Array.isArray(paymentMethods) &&
                    paymentMethods.map((paymentMethod, i) => (
                        <BudgetLimitItem
                            key={i}
                            isPrinting={isPrinting}
                            paymentMethod={paymentMethod}
                            percent={Math.min(
                                ((usage[paymentMethod.id] || 0) /
                                    paymentMethod.credit_limit!) *
                                    100,
                                100
                            )}
                            theme={theme}
                            used={usage[paymentMethod.id] || 0}
                        />
                    ))}
            </div>
        </div>
    );
};

export default BudgetLimitList;
