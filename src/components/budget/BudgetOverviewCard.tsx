import React from "react";
import BudgetChart from "./BudgetChart";
import BudgetLimitList from "./BudgetLimitList";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripSettingConf, TripThemeConf } from "../../models/types/TripTypes";
import { CATEGORY_DEFINITIONS } from "../../constants/Categories";

export interface BudgetOverviewCardProps {
    budgetItems?: BudgetRow[];
    paymentMethods?: PaymentMethodRow[];
    isPrinting?: boolean;
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    convertToHome: (
        amount: number,
        currency: string,
        homeCurrency?: string,
        exchangeRate?: number
    ) => number;
    convertToLocal: (
        amount: number,
        currency: string,
        localCurrency?: string,
        exchangeRate?: number
    ) => number;
    onOpenSmartSettlement?: () => void;
    onOpenSettings?: () => void;
    selectedCategories?: string[];
    onToggleCategoryFilter?: (catId: string) => void;
    onClearCategoryFilter?: () => void;
    selectedPaymentMethods?: string[];
    onTogglePaymentMethodFilter?: (pmId: string) => void;
}

export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({
    budgetItems,
    paymentMethods,
    isPrinting,
    setting,
    theme,
    convertToHome,
    convertToLocal,
    onOpenSmartSettlement,
    onOpenSettings,
    selectedCategories,
    onToggleCategoryFilter,
    onClearCategoryFilter,
    selectedPaymentMethods,
    onTogglePaymentMethodFilter,
}) => {
    const getChartGradient = (
        totalSpentHome: number,
        categoryStats: { [key: string]: number },
        themeConf: TripThemeConf | null
    ) => {
        if (totalSpentHome === 0) return `conic-gradient(#E5E7EB 0% 100%)`;
        let currentDeg = 0;
        const gradients = Object.entries(categoryStats).map(([cat, amount]) => {
            const percent = amount / totalSpentHome;
            const deg = percent * 360;
            const color = themeConf?.categoryColor[cat] || "#9CA3AF";
            const str = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
            currentDeg += deg;
            return str;
        });
        return `conic-gradient(${gradients.join(", ")})`;
    };

    const getCategoryName = (cat: string) => {
        const item = CATEGORY_DEFINITIONS.find((c) => c.id === cat);
        return item ? item.label : "其他";
    };

    return (
        <div className="space-y-4">
            <BudgetChart
                budgetItems={budgetItems}
                isPrinting={isPrinting}
                setting={setting}
                theme={theme}
                convertToHome={convertToHome}
                convertToLocal={convertToLocal}
                getChartGradient={getChartGradient}
                getCategoryName={getCategoryName}
                onOpenSmartSettlement={onOpenSmartSettlement}
                onOpenSettings={onOpenSettings}
                selectedCategories={selectedCategories}
                onToggleCategoryFilter={onToggleCategoryFilter}
                onClearCategoryFilter={onClearCategoryFilter}
            />
            <BudgetLimitList
                budgetItems={budgetItems}
                isPrinting={isPrinting}
                paymentMethods={paymentMethods}
                setting={setting}
                theme={theme}
                convertToHome={convertToHome}
                convertToLocal={convertToLocal}
                selectedPaymentMethods={selectedPaymentMethods}
                onTogglePaymentMethodFilter={onTogglePaymentMethodFilter}
            />
        </div>
    );
};

export default BudgetOverviewCard;
