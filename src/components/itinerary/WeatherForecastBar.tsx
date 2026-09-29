import React from "react";
import moment from "moment";
import { CloudRain, Umbrella, SunMedium, AlertTriangle, ChevronRight } from "lucide-react";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import { getWeatherInfoByCode, type DailyWeatherMap } from "../../services/weather/WeatherService";

export interface WeatherForecastBarProps {
    itineraries: ItineraryVM[];
    weatherMap: DailyWeatherMap;
    selectedDayId: string;
    onSelectDay: (dayId: string) => void;
    isLoading?: boolean;
    locationName?: string;
    theme?: TripThemeConf | null;
}

export const WeatherForecastBar: React.FC<WeatherForecastBarProps> = ({
    itineraries,
    weatherMap,
    selectedDayId,
    onSelectDay,
    isLoading = false,
    locationName,
    theme: _theme,
}) => {
    if (!Array.isArray(itineraries) || itineraries.length === 0) {
        return null;
    }

    const todayDate = moment().format("YYYY-MM-DD");

    // 找出目前選中或今日的高降雨警告天數
    const activeDay = itineraries.find((d) => d.id === selectedDayId) || itineraries[0];
    const activeWeather = activeDay ? weatherMap[activeDay.date] : null;
    const isRainAlertForActive = Boolean(
        activeWeather &&
        typeof activeWeather.precipitationProbabilityMax === "number" &&
        activeWeather.precipitationProbabilityMax >= 50
    );

    // 檢查整趟旅程是否有任何一天大雨
    const rainDays = itineraries.filter((d) => {
        const w = weatherMap[d.date];
        return w && typeof w.precipitationProbabilityMax === "number" && w.precipitationProbabilityMax >= 50;
    });

    return (
        <div className="w-full space-y-2">
            {/* 天氣膠囊滑動列 */}
            <div className="relative group">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth">
                    {/* 地點概況標籤 (如果有) */}
                    {locationName && (
                        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl glass-panel text-[11px] font-bold text-muted-foreground border border-border/40 select-none">
                            <SunMedium size={13} className="text-amber-500 shrink-0" />
                            <span className="truncate max-w-[100px]">{locationName}</span>
                        </div>
                    )}

                    {itineraries.map((day) => {
                        const w = weatherMap[day.date];
                        const isSelected = selectedDayId === day.id;
                        const isToday = day.date === todayDate;
                        const info = getWeatherInfoByCode(w?.weatherCode);
                        const rainProb = w?.precipitationProbabilityMax ?? 0;
                        const isRainy = rainProb >= 50;

                        const dateFormatted = day.date ? moment(day.date).format("M/D") : `D${day.day_number}`;

                        return (
                            <button
                                key={day.id}
                                type="button"
                                onClick={() => onSelectDay(day.id)}
                                className={`
                                    shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl text-left transition-all duration-200 cursor-pointer select-none
                                    ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20 scale-[1.02]"
                                            : "glass-panel hover:bg-white/80 dark:hover:bg-white/[0.08] text-foreground border border-border/40"
                                    }
                                `}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                                            D{day.day_number}
                                        </span>
                                        {isToday && (
                                            <span className={`text-[9px] px-1 rounded-sm font-bold ${isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                                                今日
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-bold leading-tight ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                                        {dateFormatted} {day.weekday || ""}
                                    </span>
                                </div>

                                {isLoading ? (
                                    <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin opacity-50" />
                                ) : w ? (
                                    <div className="flex items-center gap-1.5 pl-1 border-l border-current/10">
                                        <span className="text-base leading-none" title={info.label}>
                                            {info.icon}
                                        </span>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[11px] font-bold font-mono leading-none">
                                                {w.temperatureMin}°~{w.temperatureMax}°
                                            </span>
                                            {rainProb > 20 && (
                                                <span
                                                    className={`text-[9px] font-bold font-mono leading-none mt-0.5 flex items-center justify-end gap-0.5 ${
                                                        isRainy
                                                            ? isSelected
                                                                ? "text-amber-200"
                                                                : "text-blue-500 font-extrabold"
                                                            : isSelected
                                                            ? "text-primary-foreground/70"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    💧{rainProb}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] opacity-40 font-mono pl-1 border-l border-current/10">
                                        --
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 雨天備案提示橫幅 (當選中日或當日降雨機率 >= 50% 時自動跳出) */}
            {isRainAlertForActive && activeWeather && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            <Umbrella size={14} />
                        </div>
                        <span className="truncate">
                            <strong className="font-bold">DAY {activeDay.day_number} 雨勢提醒：</strong>
                            降雨機率高達 {activeWeather.precipitationProbabilityMax}%，建議隨身攜帶雨具，或優先安排室內景點與購物備案！
                        </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 font-bold text-[11px] text-amber-700 dark:text-amber-300">
                        <CloudRain size={13} />
                        <span>備傘建議</span>
                    </div>
                </div>
            )}

            {/* 如果有其他天數有大雨但非當前選中天數，提供微型提醒 */}
            {!isRainAlertForActive && rainDays.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                        <AlertTriangle size={12} className="text-blue-500 shrink-0" />
                        <span className="truncate">
                            注意：行程第 {rainDays.map((d) => d.day_number).join("、")} 天降雨機率較高 (≥50%)
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

export default WeatherForecastBar;
