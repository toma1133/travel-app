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
        <div
            role="button"
            onClick={() =>
                isPrinting || !isCreator ? null : onEditBtnClick(budgetItem)
            }
            className={`w-full bg-white flex justify-between items-start text-left break-inside-avoid-page ${
                isPrinting
                    ? "py-2 border-b border-gray-200"
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
                    {/* Title */}
                    <div className={`text-sm font-bold text-gray-900 ${!isPrinting ? "group-hover:text-[#9F1239] transition-colors" : "print:text-black"}`}>
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
                    {/* Meta info */}
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center print:text-gray-600 print:mt-1">
                        <span className={`mr-2 ${isPrinting ? "font-semibold text-gray-700" : ""}`}>
                            {getCategoryName(budgetItem.category)}
                        </span>
                        <span className="mr-2 text-gray-300">|</span>
                        <span className="print:text-black font-mono">
                            {moment(budgetItem.expense_date).format("MM/DD")}
                        </span>
                        {/* 螢幕顯示代付者標籤 */}
                        <span className={`${isPrinting ? "hidden" : "bg-gray-100 px-1.5 rounded text-gray-500 ml-2"}`}>
                            {isCreator
                                ? paymentMethodName
                                : `由 ${members[0]} 代付`}
                        </span>
                    </div>
                    {/* 分帳成員 (列印時可視需求決定是否顯示詳細名單，太長會佔空間) */}
                    {budgetItem.split_with && budgetItem.split_with.length > 0 && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 print:text-gray-500 print:mt-0.5">
                            <Users className="w-3 h-3 print:hidden" /> 
                            <span className="print:hidden">成員：</span> {/* 列印時也許只顯示 (3人) 之類的簡稱 */}
                            <span className="print:italic">{members.join(", ")}</span>
                        </div>
                    )}
                    {/* 支付方式 (列印顯示) */}
                    {isPrinting && (
                        <div className="text-[10px] text-gray-500 mt-0.5 italic">
                             {isCreator
                                ? paymentMethodName
                                : `由 ${members[0]} 代付`}
                        </div>
                    )}
                </div>
            </div>
            {/* Amount Column */}
            <div className={`text-right`}>
                <div className={`text-sm font-bold ${theme?.mono} text-gray-900 print:text-black`}>
                    {budgetItem.currency_code}{" "}
                    {budgetItem.amount.toLocaleString()}
                </div>
                {/* 匯率換算 (列印時非常重要) */}
                {budgetItem.currency_code !== setting?.homeCurrency && (
                    <div className="text-[10px] text-gray-400 font-mono print:text-gray-600">
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
        </div>
    );
};

export default TransactionListItem;
