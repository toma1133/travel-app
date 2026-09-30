import { JSX, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { Camera, Filter, LucideIcon, Plus } from "lucide-react";
import TransactionListItem from "./TransactionListItem";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";
import type { StoredImageRecord } from "../../services/storage/ImageVaultDB";

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
    receiptMap?: Record<string, StoredImageRecord>;
    convertToHome: (
        amount: number,
        currency: string,
        homeCurrency?: string,
        exchangeRate?: number
    ) => number;
    getCategoryIcon: (cat: string) => JSX.Element;
    getCategoryName: (cat: string) => string;
    onEditBtnClick: (transactionItem: BudgetRow) => void;
    onDeleteBtnClick?: (transactionItem: BudgetRow) => void;
    onToggleSettle?: (transactionItem: BudgetRow) => void;
    onOpenReceiptModal?: (record: StoredImageRecord, item: BudgetRow) => void;
    onOpenFilterModal?: () => void;
    hasActiveFilters?: boolean;
    onAddTransaction?: () => void;
    onReceiptFileSelected?: (file: File) => void;
    selectedCategories?: string[];
    selectedPaymentMethods?: string[];
    onToggleCategoryFilter?: (catId: string) => void;
    onTogglePaymentMethodFilter?: (pmId: string) => void;
    onClearAllFilters?: () => void;
};

const TransactionList = ({
    budgetItems,
    isPrinting,
    paymentMethods,
    session,
    setting,
    theme,
    tripMembers,
    receiptMap,
    convertToHome,
    getCategoryIcon,
    getCategoryName,
    onEditBtnClick,
    onDeleteBtnClick,
    onToggleSettle,
    onOpenReceiptModal,
    onOpenFilterModal,
    hasActiveFilters = false,
    onAddTransaction,
    onReceiptFileSelected,
    selectedCategories = [],
    selectedPaymentMethods = [],
    onToggleCategoryFilter,
    onTogglePaymentMethodFilter,
    onClearAllFilters,
}: TransactionListProps) => {
    const pcFileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div
            className={`flex flex-col justify-center items-center ${
                isPrinting
                    ? "pb-2 mb-0 px-0 mt-4" // 列印樣式
                    : "mb-4 sticky top-0 z-10" // 螢幕樣式
            }`}
        >
            {/* 隱藏的 PC 端收據上傳 input */}
            <input
                ref={pcFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onReceiptFileSelected) {
                        onReceiptFileSelected(file);
                    }
                    if (pcFileInputRef.current) {
                        pcFileInputRef.current.value = "";
                    }
                }}
            />

            <div className={`w-full flex justify-between items-center py-2 gap-2`}>
                <div className="flex items-center gap-2">
                    <h4
                        className={`text-xs font-bold uppercase tracking-widest text-muted-foreground`}
                    >
                        交易紀錄
                    </h4>
                    {!isPrinting && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                            共 {budgetItems?.length} 筆
                        </span>
                    )}
                </div>

                {!isPrinting && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* 拍收據辨識 (桌面版 PC 顯示) */}
                        {onReceiptFileSelected && (
                            <button
                                type="button"
                                onClick={() => pcFileInputRef.current?.click()}
                                className="hidden lg:flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="拍收據/上傳發票自動辨識"
                            >
                                <Camera size={13} />
                                <span className="text-[11px]">拍收據</span>
                            </button>
                        )}

                        {/* 記一筆主按鈕 (桌面版 PC 顯示，手機版已由下方 QuickExpenseBar 承擔) */}
                        {onAddTransaction && (
                            <button
                                type="button"
                                onClick={onAddTransaction}
                                className={`hidden lg:flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-xl shadow-xs ${
                                    theme?.accent || "bg-primary"
                                } hover:opacity-90 active:scale-95 transition-all cursor-pointer`}
                                title="新增記帳"
                            >
                                <Plus size={14} />
                                <span>記一筆</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Active Category & Payment Filters Pill Bar */}
            {!isPrinting && (selectedCategories.length > 0 || selectedPaymentMethods.length > 0) && (
                <div className="w-full flex items-center gap-1.5 flex-wrap pb-2 px-0.5 animate-in fade-in">
                    <span className="text-[11px] font-bold text-muted-foreground">已套用篩選：</span>
                    {selectedCategories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => onToggleCategoryFilter?.(cat)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="點擊清除此類別篩選"
                        >
                            <span>{getCategoryName(cat)}</span>
                            <span className="text-[10px]">✕</span>
                        </button>
                    ))}
                    {selectedPaymentMethods.map((pmId) => {
                        const pmName = paymentMethods?.find((p) => p.id === pmId)?.name || "付款方式";
                        return (
                            <button
                                key={pmId}
                                type="button"
                                onClick={() => onTogglePaymentMethodFilter?.(pmId)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="點擊清除此付款方式篩選"
                            >
                                <span>{pmName}</span>
                                <span className="text-[10px]">✕</span>
                            </button>
                        );
                    })}
                    {onClearAllFilters && (
                        <button
                            type="button"
                            onClick={onClearAllFilters}
                            className="text-[11px] text-muted-foreground hover:text-rose-500 font-bold underline ml-1 cursor-pointer"
                        >
                            清除全部
                        </button>
                    )}
                </div>
            )}

            {isPrinting && (
                <div className="w-full flex text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1 border-b border-border">
                    <div className="w-12">Date</div>
                    <div className="w-20">Cat.</div>
                    <div className="flex-1">Details</div>
                    <div className="w-20 text-right">Payment</div>
                    <div className="w-24 text-right">Amount</div>
                </div>
            )}
            <div
                className={`w-full ${
                    isPrinting
                        ? "text-xs divide-y divide-gray-300 border-b border-border"
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
                                key={budgetItem.id || i}
                                budgetItem={budgetItem}
                                isPrinting={isPrinting}
                                paymentMethodName={pmName}
                                session={session}
                                setting={setting}
                                theme={theme}
                                tripMembers={tripMembers}
                                receiptRecord={receiptMap?.[budgetItem.id]}
                                convertToHome={convertToHome}
                                getCategoryIcon={getCategoryIcon}
                                getCategoryName={getCategoryName}
                                onEditBtnClick={onEditBtnClick}
                                onDeleteBtnClick={onDeleteBtnClick}
                                onToggleSettle={onToggleSettle}
                                onOpenReceiptModal={onOpenReceiptModal}
                            />
                        );
                    })}
                {!Array.isArray(budgetItems) ||
                    (budgetItems.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-xs">
                            尚無紀錄
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default TransactionList;
