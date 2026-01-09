import { JSX } from "react";
import { Session } from "@supabase/supabase-js";
import { LucideIcon } from "lucide-react";
import TransactionListItem from "./TransactionListItem";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

type TransactionListProps = {
    budgetItems?: BudgetRow[];
    categories?: {
        id: string;
        name: string;
        icon: LucideIcon;
    }[];
    isPrinting?: boolean;
    paymentMethods?: PaymentMethodRow[];
    session: Session | null;
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    tripMembers?: TripMemberVM[];
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

const TransactionList = ({
    budgetItems,
    isPrinting,
    paymentMethods,
    session,
    setting,
    theme,
    tripMembers,
    convertToHome,
    getCategoryIcon,
    getCategoryName,
    onEditBtnClick,
}: TransactionListProps) => {
    return (
        <div
            className={`flex flex-col justify-center items-center ${
                isPrinting
                    ? "pb-2 mb-0 px-0 mt-4" // 列印樣式
                    : "px-4 mb-4 sticky top-0 z-10" // 螢幕樣式
            }`}
        >
            <div className="w-full flex justify-between items-center py-2 print:border-b print:border-gray-800 print:mb-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest print:text-black">
                    交易紀錄 (Transactions)
                </h4>
                <span
                    className={`text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold ${
                        isPrinting ? "print:hidden" : ""
                    }`}
                >
                    共 {budgetItems?.length} 筆
                </span>
            </div>
            {/* [新增] 列印專用的表頭，對齊 Item 的欄位 */}
            {isPrinting && (
                <div className="w-full flex text-[10px] font-bold text-gray-500 uppercase tracking-wider py-1 border-b border-gray-300">
                    <div className="w-12">Date</div>
                    <div className="w-16">Cat.</div>
                    <div className="flex-1">Details</div>
                    <div className="w-20 text-right">Payment</div>
                    <div className="w-24 text-right">Amount</div>
                </div>
            )}
            <div
                className={`w-full ${
                    isPrinting
                        ? "text-xs divide-y divide-gray-300 border-b border-gray-300" // 列印用深一點的分隔線
                        : "space-y-2"
                }`}
            >
                {/* ... map Items ... */}
                {/* Item 傳遞 isPrinting props，TransactionListItem 需要正確接收 */}
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
                                isPrinting={isPrinting}
                                paymentMethodName={pmName}
                                session={session}
                                setting={setting}
                                theme={theme}
                                tripMembers={tripMembers}
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
