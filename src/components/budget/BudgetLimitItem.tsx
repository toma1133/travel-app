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
                        ? "bg-gray-50 p-3 rounded-md border border-gray-200"
                        : "bg-white border border-gray-200 p-3 shadow-sm rounded-lg"
                }
            `}
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <CreditCard size={14} className="mr-2 text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">
                        {paymentMethod.name}
                    </span>
                </div>
                <span
                    className={`text-xs ${theme?.mono} ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? "text-red-600"
                            : "text-gray-500"
                    }`}
                >
                    {used.toLocaleString()} /{" "}
                    {paymentMethod.credit_limit === 0
                        ? "∞"
                        : paymentMethod.credit_limit!.toLocaleString()}
                </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${
                        percent > 90 && paymentMethod.credit_limit != 0
                            ? "bg-red-500"
                            : "bg-gray-800"
                    }`}
                    style={{
                        width: `${
                            paymentMethod.credit_limit == 0 ? 100 : percent
                        }%`,
                    }}
                ></div>
            </div>
        </div>
    );
};

export default BudgetLimitItem;
