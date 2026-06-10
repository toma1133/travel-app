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
    const payerName = tripMembers?.filter((tm) => tm.user_id === budgetItem.user_id)[0]?.profiles?.username ?? budgetItem.user_id;
    let rawMembers = budgetItem.split_with ? [...budgetItem.split_with] : [];
    if (budgetItem.is_payer_included !== false) {
        rawMembers = [budgetItem.user_id, ...rawMembers];
    }
    rawMembers = Array.from(new Set(rawMembers));
    const members = rawMembers.map(
        (userId) =>
            tripMembers?.filter((tm) => tm.user_id === userId)[0]?.profiles
                ?.username ?? userId
    );
    const perPerson = members.length > 0
        ? budgetItem.amount / members.length
        : budgetItem.amount;

    // --- 1. 列印模式專用佈局 (Compact Table Row) ---
    if (isPrinting) {
        return (
            <div className="w-full flex items-center py-1.5 break-inside-avoid text-black border-b border-gray-200">
                {/* 1. 日期 */}
                <div className="w-12 font-mono font-bold shrink-0">
                    {moment(budgetItem.expense_date).format("MM/DD")}
                </div>

                {/* 2. 分類 */}
                <div className="w-16 text-[10px] uppercase tracking-tight truncate shrink-0 pr-2">
                    {getCategoryName(budgetItem.category)}
                </div>

                {/* 3. 詳細資訊 */}
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-baseline">
                        <span className="font-bold text-sm truncate mr-2">
                            {budgetItem.title}
                        </span>
                        {(members.length > 1 || budgetItem.is_payer_included === false) && (
                                <span className="text-[10px] truncate hidden sm:inline-block">
                                    <Users
                                        size={10}
                                        className="inline mr-0.5"
                                    />
                                    <span className="italic">
                                        {" "}
                                        {/* 修改：移除 print:italic */}
                                        {rawMembers.map((uid, i) => {
                                            const username = tripMembers?.filter((tm) => tm.user_id === uid)[0]?.profiles?.username ?? uid;
                                            const isSettled = uid !== budgetItem.user_id && budgetItem.settled_with?.includes(uid);
                                            return (
                                                <span key={uid} className="inline-flex items-center">
                                                    {username}
                                                    {isSettled && <span className="ml-0.5 text-[8px]" title="已收回">✅</span>}
                                                    {i < rawMembers.length - 1 && ", "}
                                                </span>
                                            );
                                        })}
                                    </span>
                                </span>
                            )}
                    </div>
                </div>

                {/* 4. 付款方式 */}
                <div className="w-20 text-right text-[10px] font-medium truncate shrink-0">
                    {isCreator ? paymentMethodName : `由 ${payerName} 代付`}
                </div>

                {/* 5. 金額 */}
                <div className="w-24 text-right shrink-0">
                    <div className="text-sm font-bold font-mono">
                        {budgetItem.currency_code}{" "}
                        {budgetItem.amount.toLocaleString()}
                    </div>
                    {budgetItem.currency_code !== setting?.homeCurrency && (
                        <div className="text-[9px] font-mono leading-none font-medium mt-0.5">
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
            </div>
        );
    }

    // --- 螢幕模式專用佈局 (原本的 Card) ---
    return (
        <div
            role="button"
            onClick={() =>
                isPrinting || !isCreator ? null : onEditBtnClick(budgetItem)
            }
            className={`w-full bg-card flex justify-between items-start text-left break-inside-avoid-page ${
                isPrinting
                    ? "py-2 border-b border-border"
                    : "group items-center p-4 border border-border hover:border-border transition-colors rounded-lg shadow-sm"
            }`}
            title={isCreator ? "編輯" : "檢視"}
        >
            <div className={`flex items-start`}>
                {!isPrinting && (
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-primary-foreground shadow-sm"
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
                    <div
                        className={`text-sm font-bold text-foreground ${
                            !isPrinting
                                ? "group-hover:text-[#9F1239] transition-colors"
                                : "print:text-foreground"
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
                    {/* Meta info */}
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center print:text-muted-foreground print:mt-1">
                        <span
                            className={`mr-2 ${
                                isPrinting ? "font-semibold text-foreground" : ""
                            }`}
                        >
                            {getCategoryName(budgetItem.category)}
                        </span>
                        <span className="mr-2 text-muted-foreground/50">|</span>
                        <span className="print:text-foreground font-mono">
                            {moment(budgetItem.expense_date).format("MM/DD")}
                        </span>
                        {/* 螢幕顯示代付者標籤 */}
                        <span
                            className={`${
                                isPrinting
                                    ? "hidden"
                                    : "bg-muted px-1.5 rounded text-muted-foreground ml-2"
                            }`}
                        >
                            {isCreator
                                ? paymentMethodName
                                : `由 ${payerName} 代付`}
                        </span>
                    </div>
                    {/* 分帳成員 (列印時可視需求決定是否顯示詳細名單，太長會佔空間) */}
                    {(members.length > 1 || budgetItem.is_payer_included === false) && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 print:text-muted-foreground print:mt-0.5">
                                <Users className="w-3 h-3 print:hidden" />
                                <span className="print:hidden">
                                    成員：
                                </span>{" "}
                                {/* 列印時也許只顯示 (3人) 之類的簡稱 */}
                                <span className="print:italic">
                                    {rawMembers.map((uid, i) => {
                                        const username = tripMembers?.filter((tm) => tm.user_id === uid)[0]?.profiles?.username ?? uid;
                                        const isSettled = uid !== budgetItem.user_id && budgetItem.settled_with?.includes(uid);
                                        return (
                                            <span key={uid} className="inline-flex items-center">
                                                {username}
                                                {isSettled && <span className="ml-0.5 text-[8px]" title="已收回">✅</span>}
                                                {i < rawMembers.length - 1 && ", "}
                                            </span>
                                        );
                                    })}
                                </span>
                            </div>
                        )}
                    {/* 支付方式 (列印顯示) */}
                    {isPrinting && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 italic">
                            {isCreator
                                ? paymentMethodName
                                : `由 ${payerName} 代付`}
                        </div>
                    )}
                </div>
            </div>
            {/* Amount Column */}
            <div className={`text-right`}>
                <div
                    className={`text-sm font-bold ${theme?.mono} text-foreground print:text-foreground`}
                >
                    {budgetItem.currency_code}{" "}
                    {budgetItem.amount.toLocaleString()}
                </div>
                {/* 匯率換算 (列印時非常重要) */}
                {budgetItem.currency_code !== setting?.homeCurrency && (
                    <div className="text-[10px] text-muted-foreground font-mono print:text-muted-foreground">
                        ≈ {setting?.homeCurrency}{" "}
                        {convertToHome(
                            budgetItem.amount,
                            budgetItem.currency_code,
                            setting?.homeCurrency,
                            setting?.exchangeRate
                        ).toLocaleString()}
                    </div>
                )}
                {(members.length > 1 || budgetItem.is_payer_included === false) && (
                    <div>
                        <div className="text-[10px] font-bold text-rose-500 mt-1">
                            每人: {budgetItem.currency_code}{" "}
                            {perPerson.toLocaleString()}
                        </div>
                        {budgetItem.currency_code !== setting?.homeCurrency && (
                            <div className="text-[10px] text-muted-foreground font-mono">
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
