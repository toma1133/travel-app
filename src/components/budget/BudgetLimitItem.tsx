import { CreditCard } from "lucide-react";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripSettingConf, TripThemeConf } from "../../models/types/TripTypes";

type BudgetLimitItemProps = {
    isPrinting?: boolean;
    paymentMethod: PaymentMethodRow;
    percent: number;
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    used: number;
};

const BudgetLimitItem = ({
    isPrinting,
    paymentMethod,
    percent,
    setting,
    theme,
    used,
}: BudgetLimitItemProps) => {
    const currencyLabel = paymentMethod.currency_code || setting?.homeCurrency || "";
    if (isPrinting) {
        return (
            <div className="flex justify-between items-center py-1.5 border-b border-gray-200 break-inside-avoid text-black">
                <div className="flex items-center">
                    <span className="text-xs font-bold">
                        {paymentMethod.name}
                    </span>
                </div>
                <span className={`text-xs font-mono font-medium`}>
                    {used.toLocaleString()} /{" "}
                    {paymentMethod.credit_limit === 0
                        ? "∞"
                        : paymentMethod.credit_limit!.toLocaleString()}{" "}
                    {currencyLabel}
                </span>
            </div>
        );
    }

    return (
        <div
            className={`
                bg-card border border-border p-3 shadow-sm rounded-lg
            `}
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <CreditCard
                        size={14}
                        className={`mr-2 text-muted-foreground`}
                    />
                    <span className={`text-xs font-bold text-foreground`}>
                        {paymentMethod.name}
                    </span>
                </div>
                <span
                    className={`text-xs ${theme?.mono} ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                    }`}
                >
                    {used.toLocaleString()} /{" "}
                    {paymentMethod.credit_limit === 0
                        ? "∞"
                        : paymentMethod.credit_limit!.toLocaleString()}{" "}
                    {currencyLabel}
                </span>
            </div>

            {/* 進度條容器 */}
            <div className={`w-full overflow-hidden bg-muted h-1.5 rounded-full`}>
                <div
                    className={`h-full transition-all duration-500 rounded-full ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? "bg-red-500"
                            : "bg-foreground"
                    }`}
                    style={
                        {
                            width: `${
                                paymentMethod.credit_limit == 0 ? 100 : percent
                            }%`
                        } as React.CSSProperties
                    }
                ></div>
            </div>
        </div>
    );
};

export default BudgetLimitItem;
