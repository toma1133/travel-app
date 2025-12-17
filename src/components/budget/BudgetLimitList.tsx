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
                isPrinting ? "mb-6 border border-gray-300 p-4" : "mb-8"
            }`}
        >
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 print:text-gray-700 print:text-center print:border-b print:pb-2">
                支付額度狀態
            </h4>
            <div
                className={`grid ${
                    isPrinting ? "grid-cols-2 gap-x-4 gap-y-3" : "space-y-3"
                }`}
            >
                {Array.isArray(paymentMethods) &&
                    paymentMethods.map((paymentMethod, i) => (
                        <BudgetLimitItem
                            key={i}
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
