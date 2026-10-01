import React, { useRef, useEffect } from "react";
import moment from "moment";
import useHorizontalScroll from "../../../hooks/UseHorizontalScroll";
import {
    Calendar,
    MapPin,
    Umbrella,
    CloudRain,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react";
import type { ItineraryVM } from "../../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../../models/types/TripTypes";
import { getWeatherInfoByCode, type DailyWeatherMap } from "../../../services/weather/WeatherService";

export type ItineraryDayTabBarProps = {
    days: ItineraryVM[];
    selectedDayId: string;
    onSelectDay: (dayId: string) => void;
    onAddDay?: () => void;
    dayPlaceCounts?: Record<string, number>;
    totalPlacesCount?: number;
    theme?: TripThemeConf | null;
    className?: string;
    // 天氣整合屬性 (Phase 4 氣象預報整合)
    weatherMap?: DailyWeatherMap;
    isLoadingWeather?: boolean;
    locationName?: string;
};

export const ItineraryDayTabBar: React.FC<ItineraryDayTabBarProps> = ({
    days,
    selectedDayId,
    onSelectDay,
    onAddDay,
    dayPlaceCounts,
    totalPlacesCount,
    theme,
    className = "",
    weatherMap = {},
    isLoadingWeather = false,
    locationName: _locationName,
}) => {
    const { scrollRef: scrollContainerRef, contentRef, bounds, scrollByPage, handlers } = useHorizontalScroll();
    const activeBtnRef = useRef<HTMLButtonElement>(null);

    // 當選取的天數改變時，平滑將選中的膠囊捲動至置中
    useEffect(() => {
        if (activeBtnRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const btn = activeBtnRef.current;
            const btnLeft = btn.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
            const btnWidth = btn.offsetWidth;
            const containerWidth = container.clientWidth;
            container.scrollTo({
                left: btnLeft - containerWidth / 2 + btnWidth / 2,
                behavior: "smooth",
            });
        }
    }, [selectedDayId, bounds.overflow, scrollContainerRef]);

    const accentBg = theme?.accent || "bg-primary";
    const todayDate = moment().format("YYYY-MM-DD");

    // 找出目前選中或今日的天氣警示
    const activeDay = selectedDayId === "all"
        ? days.find((d) => d.date === todayDate) || days[0]
        : days.find((d) => d.id === selectedDayId) || days[0];

    const activeWeather = activeDay ? weatherMap[activeDay.date] : null;
    const isRainAlertForActive = Boolean(
        activeWeather &&
        typeof activeWeather.precipitationProbabilityMax === "number" &&
        activeWeather.precipitationProbabilityMax >= 50
    );

    // 旅程中其他高降雨天數
    const rainDays = days.filter((d) => {
        const w = weatherMap[d.date];
        return w && typeof w.precipitationProbabilityMax === "number" && w.precipitationProbabilityMax >= 50;
    });

    return (
        <div className={`relative w-full rounded-2xl glass-panel p-2 overflow-hidden shadow-sm space-y-2 ${className}`}>
            {/* 整合式天數與天氣滑動列 */}
            <div className="flex items-center gap-1.5 min-w-0">
                {bounds.overflow && (
                    <button type="button" aria-label="向左捲動天數" title="向左捲動天數" disabled={!bounds.left}
                        onClick={() => scrollByPage(-1)}
                        className="hidden lg:inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-xl glass-pill cursor-pointer disabled:opacity-30 disabled:cursor-default">
                        <ChevronLeft size={16} />
                    </button>
                )}
                <div ref={scrollContainerRef} {...handlers}
                    className="min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5 px-0.5 lg:cursor-grab data-[dragging=true]:cursor-grabbing select-none">
                <div ref={contentRef} className="flex w-max min-w-full items-center gap-1.5 sm:gap-2">
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

                {/* 各日程天數膠囊 (整合天氣圖示、氣溫與降雨機率) */}
                {Array.isArray(days) &&
                    days.map((day) => {
                        const isSelected = selectedDayId === day.id;
                        const placeCount = dayPlaceCounts?.[day.id];
                        const dateParts = day.date ? day.date.split("-") : ["", "", ""];
                        const dateFormatted = `${dateParts[1]}/${dateParts[2]}`;
                        const isToday = day.date === todayDate;

                        const w = weatherMap[day.date];
                        const weatherInfo = getWeatherInfoByCode(w?.weatherCode);
                        const rainProb = w?.precipitationProbabilityMax ?? 0;
                        const isRainy = rainProb >= 50;

                        return (
                            <button
                                key={day.id}
                                ref={isSelected ? activeBtnRef : null}
                                type="button"
                                onClick={() => onSelectDay(day.id)}
                                className={`
                                    inline-flex items-center gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 select-none
                                    ${
                                        isSelected
                                            ? `${accentBg} text-white shadow-md scale-[1.02]`
                                            : "bg-white/40 dark:bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/70 dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]"
                                    }
                                `}
                            >
                                <div className="flex flex-col items-start leading-tight">
                                    <div className="flex items-center gap-1">
                                        <span>DAY {day.day_number}</span>
                                        <span
                                            className={`text-[10px] font-normal ${
                                                isSelected ? "text-white/80" : "text-muted-foreground"
                                            }`}
                                        >
                                            {day.weekday}
                                        </span>
                                        {isToday && (
                                            <span
                                                className={`text-[9px] px-1 rounded font-bold ${
                                                    isSelected
                                                        ? "bg-white/20 text-white"
                                                        : "bg-primary/10 text-primary"
                                                }`}
                                            >
                                                今日
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] font-mono ${
                                            isSelected ? "text-white/90" : "text-muted-foreground/75"
                                        }`}
                                    >
                                        {dateFormatted}
                                    </span>
                                </div>

                                {/* 整合天氣資訊膠囊 */}
                                {isLoadingWeather ? (
                                    <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin opacity-50 shrink-0" />
                                ) : w ? (
                                    <div
                                        className={`flex items-center gap-1.5 pl-1.5 border-l ${
                                            isSelected
                                                ? "border-white/20"
                                                : "border-black/[0.06] dark:border-white/[0.08]"
                                        }`}
                                    >
                                        <span className="text-base leading-none" title={weatherInfo.label}>
                                            {weatherInfo.icon}
                                        </span>
                                        <div className="flex flex-col text-right leading-none">
                                            <span
                                                className={`text-[10px] font-mono font-bold ${
                                                    isSelected ? "text-white" : "text-foreground"
                                                }`}
                                            >
                                                {w.temperatureMin}°~{w.temperatureMax}°
                                            </span>
                                            {rainProb > 20 && (
                                                <span
                                                    className={`text-[9px] font-mono font-bold mt-0.5 ${
                                                        isRainy
                                                            ? isSelected
                                                                ? "text-amber-200"
                                                                : "text-blue-500 font-black"
                                                            : isSelected
                                                            ? "text-white/70"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    💧{rainProb}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : null}

                                {/* 景點數量計數器 */}
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

                {onAddDay && (
                    <button
                        type="button"
                        onClick={onAddDay}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 border border-dashed border-border/80 transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                        title="新增一天日程"
                    >
                        <Plus size={13} className="text-primary" />
                        <span>加一天</span>
                    </button>
                )}
                </div>
                </div>
                {bounds.overflow && (
                    <button type="button" aria-label="向右捲動天數" title="向右捲動天數" disabled={!bounds.right}
                        onClick={() => scrollByPage(1)}
                        className="hidden lg:inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-xl glass-pill cursor-pointer disabled:opacity-30 disabled:cursor-default">
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>

            {/* 雨天備案提示橫幅 (當選中日或當日降雨機率 >= 50% 時自動跳出) */}
            {isRainAlertForActive && activeWeather && (
                <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            <Umbrella size={13} />
                        </div>
                        <span className="truncate">
                            <strong className="font-bold">DAY {activeDay.day_number} 雨勢提醒：</strong>
                            降雨機率高達 {activeWeather.precipitationProbabilityMax}%，建議外出備妥雨具，或優先安排室內景點與購物備案！
                        </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 font-bold text-[11px] text-amber-700 dark:text-amber-300">
                        <CloudRain size={13} />
                        <span>備傘建議</span>
                    </div>
                </div>
            )}

            {/* 若當前在「全部天數」且其他天數有大雨，給予快速跳轉連結 */}
            {selectedDayId === "all" && !isRainAlertForActive && rainDays.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                        <AlertTriangle size={12} className="text-blue-500 shrink-0" />
                        <span className="truncate">
                            行程第 {rainDays.map((d) => d.day_number).join("、")} 天降雨機率較高 (≥50%)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelectDay(rainDays[0].id)}
                        className="shrink-0 text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer ml-2"
                    >
                        <span>查看 DAY {rainDays[0].day_number}</span>
                        <ChevronRight size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ItineraryDayTabBar;
