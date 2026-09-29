import React from "react";
import { AlertTriangle } from "lucide-react";
import type { PlaceVM } from "../../../models/types/PlaceTypes";
import { getBusinessStatus, getScheduledMoment } from "../../../utils/OpeningHoursUtil";

type BusinessStatusBadgeProps = {
    place?: PlaceVM | null;
    activityTime?: string;
    itineraryDate: string;
    isPrinting?: boolean;
};

export const BusinessStatusBadge: React.FC<BusinessStatusBadgeProps> = ({
    place,
    activityTime,
    itineraryDate,
    isPrinting = false,
}) => {
    if (!place) return null;

    const isHotel = place.type === "hotel" || place.type === "stay";

    // 1. 飯店類型處理
    if (isHotel) {
        return (
            <span
                className={`inline-flex items-center gap-1 font-medium truncate ${
                    isPrinting
                        ? "text-black"
                        : "text-purple-600 dark:text-purple-400 font-semibold"
                }`}
            >
                <span>🏨 入住 {place.info?.check_in || "15:00"}</span>
                <span className="opacity-40">·</span>
                <span>退房 {place.info?.check_out || "11:00"}</span>
            </span>
        );
    }

    // 2. 排程時間檢核
    const scheduledMoment = activityTime ? getScheduledMoment(itineraryDate, activityTime) : null;
    const scheduledStatus = place.info?.open && scheduledMoment
        ? getBusinessStatus(place.info.open, place.info?.closed_days, scheduledMoment)
        : null;

    const isScheduleConflict = !!(
        activityTime &&
        scheduledStatus &&
        (scheduledStatus.status === "closed" || scheduledStatus.status === "closed_today")
    );

    const isScheduleClosingSoon = !!(
        activityTime &&
        scheduledStatus &&
        scheduledStatus.status === "closing_soon"
    );

    if (isScheduleConflict) {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse truncate text-[10px] sm:text-[11px]">
                <AlertTriangle size={10} className="shrink-0" />
                <span>
                    {scheduledStatus?.status === "closed_today"
                        ? "排定日公休"
                        : `非營業時段 (${scheduledStatus?.detailText || ""})`}
                </span>
            </span>
        );
    }

    if (isScheduleClosingSoon) {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 truncate text-[10px] sm:text-[11px]">
                <AlertTriangle size={10} className="shrink-0 text-amber-500" />
                <span>排定時間快打烊 ({scheduledStatus?.detailText || ""})</span>
            </span>
        );
    }

    // 3. 即時營業狀態
    const currentBusinessStatus = place.info?.open
        ? getBusinessStatus(place.info.open, place.info?.closed_days)
        : null;

    if (!currentBusinessStatus?.badgeText) return null;

    return (
        <div className="inline-flex items-center gap-1.5 truncate text-[10px] sm:text-[11px]">
            <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    currentBusinessStatus.badgeColor === "emerald"
                        ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                        : currentBusinessStatus.badgeColor === "amber"
                        ? "bg-amber-500 ring-2 ring-amber-500/20"
                        : currentBusinessStatus.badgeColor === "rose"
                        ? "bg-rose-500 ring-2 ring-rose-500/20"
                        : "bg-muted-foreground"
                }`}
            />
            <span
                className={`font-semibold ${
                    isPrinting
                        ? "text-black"
                        : currentBusinessStatus.badgeColor === "emerald"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : currentBusinessStatus.badgeColor === "amber"
                        ? "text-amber-600 dark:text-amber-400"
                        : currentBusinessStatus.badgeColor === "rose"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-muted-foreground"
                }`}
            >
                {currentBusinessStatus.badgeText}
            </span>
            {currentBusinessStatus.todayHoursText && currentBusinessStatus.todayHoursText !== "未設定" && (
                <>
                    <span className={isPrinting ? "text-black" : "opacity-30"}>·</span>
                    <span className={`font-mono truncate ${isPrinting ? "text-black font-medium" : "text-muted-foreground"}`}>
                        {currentBusinessStatus.todayHoursText}
                    </span>
                </>
            )}
        </div>
    );
};

export default BusinessStatusBadge;
