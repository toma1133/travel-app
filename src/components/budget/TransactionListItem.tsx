import { JSX } from "react";
import moment from "moment";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";

type TransactionListItemProps = {
    budgetItem: BudgetRow;
    isPrinting?: boolean;
    paymentMethodName: string;
    theme: TripThemeConf | null;
    setting: TripSettingConf | null;
    convertToHome: (
        amount: number,
        currency: string,
        homeCurrency?: string,
        exchangeRate?: number
    ) => number;
    getCategoryIcon: (cat: string) => JSX.Element;
    getCategoryName: (cat: string) => string;
    onEditBtnClick: (transactionItem: BudgetRow) => void;
};

const TransactionListItem = ({
    budgetItem,
    isPrinting,
    paymentMethodName,
    theme,
    setting,
    convertToHome,
    getCategoryIcon,
    getCategoryName,
    onEditBtnClick,
}: TransactionListItemProps) => {
    return (
        <button
            type="button"
            onClick={() => (isPrinting ? null : onEditBtnClick(budgetItem))}
            className={`w-full bg-white flex justify-between text-left ${
                isPrinting
                    ? "p-2 border-b border-gray-200"
                    : "group items-center p-4 border border-gray-100 hover:border-gray-400 transition-colors rounded-lg shadow-sm"
            }`}
            title="Edit"
        >
            <div className={`flex items-start ${isPrinting ? "w-1/2" : ""}`}>
                {!isPrinting && (
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white shadow-sm"
                        style={{
                            backgroundColor:
                                theme?.categoryColor[budgetItem.category] ||
                                theme?.categoryColor.other,
                        }}
                    >
                        {getCategoryIcon(budgetItem.category)}
                    </div>
                )}
                <div className={`${isPrinting ? "flex-1" : ""}`}>
                    <div
                        className={`text-sm font-bold text-gray-900 ${
                            !isPrinting
                                ? "group-hover:text-[#9F1239] transition-colors "
                                : ""
                        }`}
                    >
                        {budgetItem.title}
                    </div>
                    {/* Sub details row */}
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center print:text-gray-600 print:mt-0">
                        <span
                            className={`mr-2 ${
                                isPrinting ? "font-semibold text-gray-500" : ""
                            }`}
                        >
                            {getCategoryName(budgetItem.category)}
                        </span>
                        <span className="mr-2">|</span>
                        <span className="print:text-gray-500">
                            {moment(budgetItem.expense_date).format("MM-DD")}
                        </span>
                        <span
                            className={`${
                                isPrinting
                                    ? "hidden"
                                    : "bg-gray-100 px-1.5 rounded text-gray-500 ml-2"
                            }`}
                        >
                            {paymentMethodName}
                        </span>
                    </div>
                    {isPrinting && (
                        <div className="text-[10px] text-gray-500 mt-1">
                            支付方式: {paymentMethodName}
                        </div>
                    )}
                </div>
            </div>
            {/* Amount Column */}
            <div className={`text-right ${isPrinting ? "w-1/2" : ""}`}>
                <div
                    className={`text-sm font-bold ${theme?.mono} text-gray-900`}
                >
                    {budgetItem.currency_code}{" "}
                    {budgetItem.amount.toLocaleString()}
                </div>
                {/* Home Currency Conversion (Always visible in print for calculation) */}
                {budgetItem.currency_code !== setting?.homeCurrency && (
                    <div className="text-[10px] text-gray-400 font-mono">
                        ≈ {setting?.homeCurrency}{" "}
                        {convertToHome(
                            budgetItem.amount,
                            budgetItem.currency_code,
                            setting?.homeCurrency,
                            setting?.exchangeRate
                        ).toLocaleString()}
                    </div>
                )}
            </div>
        </button>
    );
};

export default TransactionListItem;
