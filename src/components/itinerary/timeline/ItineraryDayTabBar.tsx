import React, { useRef, useEffect } from "react";
import { Calendar, MapPin } from "lucide-react";
import type { ItineraryVM } from "../../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../../models/types/TripTypes";

type ItineraryDayTabBarProps = {
    days: ItineraryVM[];
    selectedDayId: string;
    onSelectDay: (dayId: string) => void;
    dayPlaceCounts?: Record<string, number>;
    totalPlacesCount?: number;
    theme?: TripThemeConf | null;
    className?: string;
};

export const ItineraryDayTabBar: React.FC<ItineraryDayTabBarProps> = ({
    days,
    selectedDayId,
    onSelectDay,
    dayPlaceCounts,
    totalPlacesCount,
    theme,
    className = "",
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeBtnRef = useRef<HTMLButtonElement>(null);

    // 當選取的天數改變時，平滑將選中的膠囊捲動至置中
    useEffect(() => {
        if (activeBtnRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const btn = activeBtnRef.current;
            const btnLeft = btn.offsetLeft;
            const btnWidth = btn.offsetWidth;
            const containerWidth = container.offsetWidth;
            container.scrollTo({
                left: btnLeft - containerWidth / 2 + btnWidth / 2,
                behavior: "smooth",
            });
        }
    }, [selectedDayId]);

    const accentBg = theme?.accent || "bg-primary";

    return (
        <div
            className={`relative w-full rounded-2xl glass-panel p-1.5 sm:p-2 overflow-hidden shadow-sm ${className}`}
        >
            <div
                ref={scrollContainerRef}
                className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5"
            >
                {/* 全部天數選項 */}
                <button
                    ref={selectedDayId === "all" ? activeBtnRef : null}
                    type="button"
                    onClick={() => onSelectDay("all")}
                    className={`
                        inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 select-none
                        ${
                            selectedDayId === "all"
                                ? `${accentBg} text-white shadow-md scale-[1.02]`
                                : "bg-white/40 dark:bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/70 dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]"
                        }
                    `}
                >
                    <Calendar size={13} className={selectedDayId === "all" ? "text-white" : "text-muted-foreground"} />
                    <span>全部天數</span>
                    {typeof totalPlacesCount === "number" && (
                        <span
                            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                selectedDayId === "all"
                                    ? "bg-white/25 text-white"
                                    : "bg-black/[0.06] dark:bg-white/[0.1] text-muted-foreground"
                            }`}
                        >
                            {totalPlacesCount}
                        </span>
                    )}
                </button>

                {/* 各日程天數膠囊 */}
                {Array.isArray(days) &&
                    days.map((day) => {
                        const isSelected = selectedDayId === day.id;
                        const placeCount = dayPlaceCounts?.[day.id];
                        const dateParts = day.date ? day.date.split("-") : ["", "", ""];
                        const dateFormatted = `${dateParts[1]}/${dateParts[2]}`;

                        return (
                            <button
                                key={day.id}
                                ref={isSelected ? activeBtnRef : null}
                                type="button"
                                onClick={() => onSelectDay(day.id)}
                                className={`
                                    inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 select-none
                                    ${
                                        isSelected
                                            ? `${accentBg} text-white shadow-md scale-[1.02]`
                                            : "bg-white/40 dark:bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/70 dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]"
                                    }
                                `}
                            >
                                <div className="flex flex-col items-start leading-tight">
                                    <div className="flex items-center gap-1.5">
                                        <span>DAY {day.day_number}</span>
                                        <span
                                            className={`text-[10px] font-normal ${
                                                isSelected ? "text-white/80" : "text-muted-foreground"
                                            }`}
                                        >
                                            {day.weekday}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-[10px] font-mono ${
                                            isSelected ? "text-white/90" : "text-muted-foreground/75"
                                        }`}
                                    >
                                        {dateFormatted}
                                    </span>
                                </div>

                                {typeof placeCount === "number" && (
                                    <span
                                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                                            isSelected
                                                ? "bg-white/25 text-white"
                                                : "bg-black/[0.06] dark:bg-white/[0.1] text-muted-foreground"
                                        }`}
                                        title={`${placeCount} 個景點地標`}
                                    >
                                        <MapPin size={9} />
                                        <span>{placeCount}</span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
            </div>
        </div>
    );
};

export default ItineraryDayTabBar;
