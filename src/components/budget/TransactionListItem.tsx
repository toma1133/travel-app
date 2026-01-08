import { JSX } from "react";
import { Users } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import moment from "moment";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

type TransactionListItemProps = {
    budgetItem: BudgetRow;
    isPrinting?: boolean;
    paymentMethodName: string;
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

const TransactionListItem = ({
    budgetItem,
    isPrinting,
    paymentMethodName,
    session,
    setting,
    theme,
    tripMembers,
    convertToHome,
    getCategoryIcon,
    getCategoryName,
    onEditBtnClick,
}: TransactionListItemProps) => {
    const isCreator = budgetItem.user_id === session?.user.id;
    const members = [budgetItem.user_id, ...(budgetItem?.split_with ?? [])].map(
        (userId) =>
            tripMembers?.filter((tm) => tm.user_id === userId)[0]?.profiles
                ?.username ?? userId
    );
    const perPerson = members
        ? budgetItem.amount / members.length
        : budgetItem.amount;

    return (
        <button
            type="button"
            onClick={() =>
                isPrinting || !isCreator ? null : onEditBtnClick(budgetItem)
            }
            className={`w-full bg-white flex justify-between items-start text-left ${
                isPrinting
                    ? "p-2 border-b border-gray-200"
                    : "group items-center p-4 border border-gray-100 hover:border-gray-400 transition-colors rounded-lg shadow-sm"
            }`}
            title={isCreator ? "Edit" : "View"}
        >
            <div className={`flex items-start`}>
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
                        <div className="flex flex-row items-center">
                            <span className="mr-2">{budgetItem.title}</span>
                            {/* {isCreator ? (
                                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded mr-2">
                                    由我建立
                                </span>
                            ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded mr-2">
                                    與我分帳
                                </span>
                            )} */}
                        </div>
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
                            {isCreator
                                ? paymentMethodName
                                : `由 ${members[0]} 代付`}
                        </span>
                    </div>{" "}
                    {budgetItem.split_with &&
                        budgetItem.split_with.length > 0 && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3" /> 成員：
                                {members.join(", ")}
                            </div>
                        )}
                    {isPrinting && (
                        <div className="text-[10px] text-gray-500 mt-1">
                            支付方式: {paymentMethodName}
                        </div>
                    )}
                </div>
            </div>
            {/* Amount Column */}
            <div className={`text-right`}>
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
                {budgetItem.split_with && budgetItem.split_with.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold text-rose-500 mt-1">
                            每人: {budgetItem.currency_code}{" "}
                            {perPerson.toLocaleString()}
                        </div>
                        {budgetItem.currency_code !== setting?.homeCurrency && (
                            <div className="text-[10px] text-gray-400 font-mono">
                                ≈ {setting?.homeCurrency}{" "}
                                {convertToHome(
                                    perPerson,
                                    budgetItem.currency_code,
                                    setting?.homeCurrency,
                                    setting?.exchangeRate
                                ).toLocaleString()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </button>
    );
};

export default TransactionListItem;
