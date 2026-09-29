import React from "react";
import { CreditCard, Sparkles } from "lucide-react";

export interface AmenitiesViewerProps {
    paymentMethods?: string[] | string;
    amenities?: string[] | string;
}

export const AmenitiesViewer: React.FC<AmenitiesViewerProps> = ({
    paymentMethods,
    amenities,
}) => {
    const paymentList: string[] = Array.isArray(paymentMethods)
        ? paymentMethods
        : typeof paymentMethods === "string"
        ? paymentMethods.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const amenitiesList: string[] = Array.isArray(amenities)
        ? amenities
        : typeof amenities === "string"
        ? amenities.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    if (paymentList.length === 0 && amenitiesList.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={13} className="text-primary" />
                <span>實用資訊與設施服務</span>
            </h4>

            <div className="space-y-2">
                {paymentList.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                            付款方式：
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {paymentList.map((pay) => (
                                <span
                                    key={pay}
                                    className="inline-flex items-center gap-1 bg-background dark:bg-muted/40 text-foreground/80 px-2.5 py-1 rounded-xl font-medium border border-border/60 text-[11px] shadow-2xs"
                                >
                                    <CreditCard size={11} className="text-primary opacity-80" />
                                    <span>{pay}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {amenitiesList.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                            設施服務：
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {amenitiesList.map((amenity) => (
                                <span
                                    key={amenity}
                                    className="inline-flex items-center gap-1 bg-primary/5 text-primary-900 dark:text-primary-200 px-2.5 py-1 rounded-xl font-medium border border-primary/20 text-[11px]"
                                >
                                    <Sparkles size={11} className="text-amber-500" />
                                    <span>{amenity}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
