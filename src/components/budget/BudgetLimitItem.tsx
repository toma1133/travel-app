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
                        ? "print:bg-white print:border print:border-gray-300 print:rounded-none print:shadow-none print:p-2 print:break-inside-avoid"
                        : "bg-white border border-gray-200 p-3 shadow-sm rounded-lg"
                }
            `}
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <CreditCard
                        size={14}
                        className="mr-2 text-gray-400 print:text-black"
                    />
                    <span className="text-xs font-bold text-gray-700 print:text-black">
                        {paymentMethod.name}
                    </span>
                </div>
                <span
                    className={`text-xs ${theme?.mono} ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? "text-red-600 print:text-black print:font-bold"
                            : "text-gray-500 print:text-black"
                    }`}
                >
                    {used.toLocaleString()} /{" "}
                    {paymentMethod.credit_limit === 0
                        ? "∞"
                        : paymentMethod.credit_limit!.toLocaleString()}
                </span>
            </div>

            {/* 進度條容器 */}
            <div className="w-full bg-gray-100 h-1.5 overflow-hidden print:bg-gray-200 print:h-1 print:rounded-none">
                <div
                    className={`h-full transition-all duration-500 ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? "bg-red-500 print:bg-black"
                            : "bg-gray-800 print:bg-gray-600"
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
