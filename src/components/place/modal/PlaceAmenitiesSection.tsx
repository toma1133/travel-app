import React, { ChangeEventHandler } from "react";
import type { PlaceVM } from "../../../models/types/PlaceTypes";
import {
    RecommendedItemsSection,
    BudgetAndDetailsSection,
    COMMON_PAYMENT_METHODS,
    COMMON_AMENITIES,
} from "../PlaceModalExtraFields";

export interface PlaceAmenitiesSectionProps {
    formData: PlaceVM;
    localCurrency?: string;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    subTab?: "items" | "details" | "all";
}

export const PlaceAmenitiesSection: React.FC<PlaceAmenitiesSectionProps> = ({
    formData,
    localCurrency = "JPY",
    onFormInputChange,
    subTab = "all",
}) => {
    if (subTab === "items") {
        return (
            <div className="space-y-4 animate-in fade-in duration-150">
                <RecommendedItemsSection
                    formData={formData}
                    localCurrency={localCurrency}
                    onFormInputChange={onFormInputChange}
                />
            </div>
        );
    }

    if (subTab === "details") {
        return (
            <div className="space-y-4 animate-in fade-in duration-150">
                <BudgetAndDetailsSection
                    formData={formData}
                    localCurrency={localCurrency}
                    onFormInputChange={onFormInputChange}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-150">
            <BudgetAndDetailsSection
                formData={formData}
                localCurrency={localCurrency}
                onFormInputChange={onFormInputChange}
            />
            <div className="pt-2 border-t border-border/60">
                <RecommendedItemsSection
                    formData={formData}
                    localCurrency={localCurrency}
                    onFormInputChange={onFormInputChange}
                />
            </div>
        </div>
    );
};

export {
    RecommendedItemsSection,
    BudgetAndDetailsSection,
    COMMON_PAYMENT_METHODS,
    COMMON_AMENITIES,
};
