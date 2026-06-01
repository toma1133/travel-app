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
    convertToLocal: (
        amount: number,
        currency: string,
        localCurrency?: string,
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
    convertToLocal,
}: BudgetLimitListProps) => {
    const [usage, setUsage] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const localUsage: { [key: string]: number } = {};

        if (Array.isArray(paymentMethods))
            paymentMethods.forEach((pm) => (localUsage[pm.id] = 0));

        if (Array.isArray(budgetItems)) {
            budgetItems.forEach((item) => {
                const pm = paymentMethods?.find((p) => p.id === item.payment_method_id);
                if (pm && localUsage[item.payment_method_id] !== undefined) {
                    const targetCurrency = pm.currency_code || setting?.homeCurrency;
                    let baseAmount = item.split_with?.length! > 0 
                        ? item.amount / (item.split_with?.length! + 1)
                        : item.amount;
                    let amountToAdd = baseAmount;

                    let itemCurrency = item.currency_code;
                    if (
                        itemCurrency !== setting?.homeCurrency &&
                        itemCurrency !== setting?.localCurrency
                    ) {
                        itemCurrency = setting?.homeCurrency;
                    }

                    if (itemCurrency !== targetCurrency) {
                        if (
                            targetCurrency === setting?.homeCurrency &&
                            itemCurrency === setting?.localCurrency
                        ) {
                            amountToAdd = convertToHome(
                                baseAmount,
                                itemCurrency,
                                setting?.homeCurrency,
                                setting?.exchangeRate
                            );
                        } else if (
                            targetCurrency === setting?.localCurrency &&
                            itemCurrency === setting?.homeCurrency
                        ) {
                            amountToAdd = convertToLocal(
                                baseAmount,
                                itemCurrency,
                                setting?.localCurrency,
                                setting?.exchangeRate
                            );
                        }
                        // If 3rd currency, we can't reliably convert without rates, so amountToAdd remains baseAmount
                    }

                    localUsage[item.payment_method_id] += amountToAdd;
                }
            });
        }

        setUsage(localUsage);
    }, [budgetItems, paymentMethods]);

    return (
        <div className={`${isPrinting ? "mb-6" : "mb-8"}`}>
            <h4
                className={`text-xs font-bold uppercase tracking-widest ${
                    isPrinting ? "mb-2 text-black" : "mb-3 text-muted-foreground"
                }`}
            >
                支付額度狀態
            </h4>
            <div
                className={`grid ${
                    isPrinting ? "grid-cols-2 gap-4" : "grid-cols-1 gap-3"
                }`}
            >
                {Array.isArray(paymentMethods) &&
                    paymentMethods.map((paymentMethod, i) => (
                        <BudgetLimitItem 
                            key={i}
                            isPrinting={isPrinting}
                            paymentMethod={paymentMethod}
                            percent={
                                paymentMethod.credit_limit! > 0
                                    ? Math.min(
                                          ((usage[paymentMethod.id] || 0) /
                                              paymentMethod.credit_limit!) *
                                              100,
                                          100
                                      )
                                    : 0
                            }
                            setting={setting}
                            theme={theme}
                            used={usage[paymentMethod.id] || 0}
                            convertToHome={convertToHome}
                            convertToLocal={convertToLocal}
                        />
                    ))}
            </div>
        </div>
    );
};

export default BudgetLimitList;
