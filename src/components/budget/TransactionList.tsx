import { JSX, MouseEventHandler } from "react";
import { Plus } from "lucide-react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import TransactionListItem from "./TransactionListItem";

type TransactionListProps = {
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
    getCategoryIcon: (cat: string) => JSX.Element;
    getCategoryName: (cat: string) => string;
    onAddBtnClick: MouseEventHandler<HTMLButtonElement>;
    onEditBtnClick: (transactionItem: BudgetRow) => void;
};

const TransactionList = ({
    budgetItems,
    isPrinting,
    paymentMethods,
    setting,
    theme,
    convertToHome,
    getCategoryIcon,
    getCategoryName,
    onAddBtnClick,
    onEditBtnClick,
}: TransactionListProps) => {
    return (
        <div
            className={`flex flex-col px-4 justify-center items-center ${
                isPrinting
                    ? "border-b-2 border-gray-900 pb-2 mb-0"
                    : "mb-4 sticky top-0 z-10"
            }`}
        >
            <div className="w-full flex justify-between items-center py-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    交易紀錄
                </h4>
                {!isPrinting && (
                    <button
                        type="button"
                        onClick={onAddBtnClick}
                        className="flex items-center text-xs font-bold text-gray-900 bg-white border border-gray-300 px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all"
                        title="新增"
                    >
                        <Plus size={14} className="mr-1" />
                        新增
                    </button>
                )}
            </div>
            <div
                className={`w-full ${
                    isPrinting
                        ? "text-xs divide-y divide-gray-200 border-b border-gray-200"
                        : "space-y-2"
                }`}
            >
                {Array.isArray(budgetItems) &&
                    budgetItems.map((budgetItem, i) => {
                        const pmName =
                            paymentMethods?.find(
                                (p) => p.id === budgetItem.payment_method_id
                            )?.name || "Unknown";
                        return (
                            <TransactionListItem
                                key={i}
                                budgetItem={budgetItem}
                                paymentMethodName={pmName}
                                setting={setting}
                                theme={theme}
                                convertToHome={convertToHome}
                                getCategoryIcon={getCategoryIcon}
                                getCategoryName={getCategoryName}
                                onEditBtnClick={onEditBtnClick}
                            />
                        );
                    })}
                {!Array.isArray(budgetItems) ||
                    (budgetItems.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-xs">
                            尚無紀錄
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default TransactionList;
