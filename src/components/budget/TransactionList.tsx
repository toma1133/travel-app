import { JSX, useMemo, useState } from "react";
import { LucideIcon } from "lucide-react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import type { TransactionFilterType } from "../../models/types/TransactionFilterTypes";
import TransactionListItem from "./TransactionListItem";
import TransactionFilter from "./TransactionFilter";

type TransactionListProps = {
    budgetItems?: BudgetRow[];
    categories?: {
        id: string;
        name: string;
        icon: LucideIcon;
    }[];
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
    onEditBtnClick: (transactionItem: BudgetRow) => void;
};

const TransactionList = ({
    budgetItems,
    categories,
    isPrinting,
    paymentMethods,
    setting,
    theme,
    convertToHome,
    getCategoryIcon,
    getCategoryName,
    onEditBtnClick,
}: TransactionListProps) => {
    // --- Filter
    const initialFilterState: TransactionFilterType = useMemo(
        () => ({
            category: "all",
            payment_method_id: "all",
        }),
        []
    );
    const [filters, setFilters] = useState(initialFilterState);
    const filteredBudgets = useMemo(() => {
        return budgetItems?.filter((ex) => {
            const matchCategory =
                filters.category !== "all"
                    ? ex.category === filters.category
                    : true;
            const matchMethod =
                filters.payment_method_id !== "all"
                    ? ex.payment_method_id === filters.payment_method_id
                    : true;
            return matchCategory && matchMethod;
        });
    }, [budgetItems, filters]);
    const filteredTotalSpentHome = useMemo(() => {
        return Array.isArray(filteredBudgets)
            ? filteredBudgets.reduce(
                  (sum, item) =>
                      sum +
                      convertToHome(
                          item.amount,
                          item.currency_code,
                          setting?.homeCurrency,
                          setting?.exchangeRate
                      ),
                  0
              )
            : 0;
    }, [filteredBudgets]);
    const filteredTotalSpentLocal = useMemo(() => {
        return Math.round(filteredTotalSpentHome / setting?.exchangeRate!);
    }, [filteredTotalSpentHome]);

    const handleFilterChange = (name: string, value?: string | number) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

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
            </div>
            <TransactionFilter
                categories={categories}
                formData={filters}
                paymentMethods={paymentMethods}
                setting={setting}
                totalCount={filteredBudgets?.length}
                totalSpentHome={filteredTotalSpentHome}
                totalSpentLocal={filteredTotalSpentLocal}
                onFormDataChange={handleFilterChange}
            />
            <div
                className={`w-full ${
                    isPrinting
                        ? "text-xs divide-y divide-gray-200 border-b border-gray-200"
                        : "space-y-2"
                }`}
            >
                {Array.isArray(filteredBudgets) &&
                    filteredBudgets.map((budgetItem, i) => {
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
