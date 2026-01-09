import { CreditCard } from "lucide-react";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type BudgetLimitItemProps = {
    isPrinting?: boolean;
    paymentMethod: PaymentMethodRow;
    percent: number;
    theme: TripThemeConf | null;
    used: number;
};

const BudgetLimitItem = ({
    isPrinting,
    paymentMethod,
    percent,
    theme,
    used,
}: BudgetLimitItemProps) => {
    return (
        <div
            className={`
                ${
                    isPrinting
                        ? "bg-white border border-gray-300 rounded-none shadow-none p-2 break-inside-avoid"
                        : "bg-white border border-gray-200 p-3 shadow-sm rounded-lg"
                }
            `}
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <CreditCard
                        size={14}
                        className={`mr-2 ${
                            isPrinting ? "text-black" : "text-gray-400"
                        }`}
                    />
                    <span
                        className={`text-xs font-bold ${
                            isPrinting ? "text-black" : "text-gray-700"
                        }`}
                    >
                        {paymentMethod.name}
                    </span>
                </div>
                <span
                    className={`text-xs ${theme?.mono} ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? isPrinting
                                ? "text-black font-bold"
                                : "text-red-600"
                            : isPrinting
                            ? "text-black"
                            : "text-gray-500"
                    }`}
                >
                    {used.toLocaleString()} /{" "}
                    {paymentMethod.credit_limit === 0
                        ? "∞"
                        : paymentMethod.credit_limit!.toLocaleString()}
                </span>
            </div>

            {/* 進度條容器 */}
            <div
                className={`w-full overflow-hidden ${
                    isPrinting ? "bg-gray-200 h-1" : "bg-gray-100 h-1.5"
                }`}
            >
                <div
                    className={`h-full transition-all duration-500 ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? isPrinting
                                ? "bg-black"
                                : "bg-red-500"
                            : isPrinting
                            ? "bg-gray-600"
                            : "bg-gray-800"
                    }`}
                    style={
                        {
                            width: `${
                                paymentMethod.credit_limit == 0 ? 100 : percent
                            }%`,
                            printColorAdjust: "exact",
                            WebkitPrintColorAdjust: "exact",
                        } as React.CSSProperties
                    }
                ></div>
            </div>
        </div>
    );
};

export default BudgetLimitItem;
