import React from "react";
import {
    Pencil,
    Plus,
    Trash2,
    Sparkles,
    ChevronDown,
    Map as MapIcon,
} from "lucide-react";
import type { ItineraryVM } from "../../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../../models/types/TripTypes";
import { getWeatherInfoByCode } from "../../../services/WeatherService";
import useDailyWeather from "../../../hooks/weather/UseDailyWeather";

type ItineraryDayHeaderProps = {
    itinerary: ItineraryVM;
    theme: TripThemeConf | null;
    isEditing: boolean;
    isExpanded: boolean;
    isPrinting?: boolean;
    weatherCoordinates: { lat: number; lng: number; hasCoordinates: boolean };
    onToggleExpand: () => void;
    onOptimizeRoute?: (itinerary: ItineraryVM) => void;
    onOpenMap?: (itinerary: ItineraryVM) => void;
    onEditDay?: (itinerary: ItineraryVM) => void;
    onDeleteDay?: (itinerary: ItineraryVM) => void;
    onAddActivity?: (itinerary: ItineraryVM) => void;
};

export const ItineraryDayHeader: React.FC<ItineraryDayHeaderProps> = ({
    itinerary,
    theme,
    isEditing,
    isExpanded,
    isPrinting = false,
    weatherCoordinates,
    onToggleExpand,
    onOptimizeRoute,
    onOpenMap,
    onEditDay,
    onDeleteDay,
    onAddActivity,
}) => {
    const accentColor = theme?.accent || "bg-rose-600";

    const {
        weather: weatherData,
        isLoading: isWeatherLoading,
    } = useDailyWeather(
        weatherCoordinates.lat,
        weatherCoordinates.lng,
        itinerary.date,
        { enabled: !isPrinting && isExpanded && weatherCoordinates.hasCoordinates && !!itinerary.date }
    );

    const canOptimize = Array.isArray(itinerary.activities) && itinerary.activities.length >= 2;
    const hasLinkedPlaces = Array.isArray(itinerary.activities) && itinerary.activities.some((a) => a.linkId);

    const dateParts = itinerary.date ? itinerary.date.split("-") : ["", "", ""];
    const month = dateParts[1] || "";
    const day = dateParts[2] || "";

    return (
        <div className="w-full select-none">
            {/* 主標頭區塊 */}
            <div
                onClick={isPrinting ? undefined : onToggleExpand}
                className={`
                    w-full flex items-center justify-between transition-colors
                    ${
                        !isPrinting
                            ? "p-3 sm:p-4 bg-white/60 dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.08]"
                            : "p-2 border-b border-black cursor-default"
                    }
                    ${!isPrinting ? "cursor-pointer hover:bg-white/80 dark:hover:bg-white/[0.06]" : ""}
                `}
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* 日曆膠囊 (Apple Calendar Style Badge) */}
                    <div
                        className={`
                            flex flex-col items-center justify-center shrink-0 transition-all
                            ${
                                !isPrinting
                                    ? "py-2 px-2.5 sm:px-3 rounded-2xl bg-white dark:bg-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-black/[0.08] dark:border-white/10 min-w-[58px] sm:min-w-[64px]"
                                    : "border border-black px-2 py-0.5 min-w-[50px]"
                            }
                        `}
                    >
                        <span
                            className={`font-black uppercase tracking-wider ${
                                isPrinting
                                    ? "text-[8px] text-black"
                                    : "text-red-500 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]"
                            }`}
                        >
                            {itinerary.weekday}
                        </span>
                        <span
                            className={`font-black leading-none my-1 tracking-tight ${
                                isPrinting
                                    ? "text-lg text-black"
                                    : "text-2xl sm:text-3xl text-gray-900 dark:text-white font-[Noto_Sans_TC]"
                            }`}
                        >
                            {day}
                        </span>
                        <span
                            className={`font-bold ${
                                isPrinting
                                    ? "text-[8px] text-black"
                                    : "text-[10px] text-gray-500 dark:text-zinc-400"
                            }`}
                        >
                            {month}月
                        </span>
                    </div>

                    {/* 日程標題與天氣資訊 */}
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className={`
                                    rounded-full font-bold tracking-wide shrink-0 whitespace-nowrap
                                    ${
                                        !isPrinting
                                            ? `px-2.5 py-0.5 text-[10px] text-white shadow-2xs ${accentColor}`
                                            : "px-2 py-0 text-[9px] bg-black text-white border border-black"
                                    }
                                `}
                            >
                                DAY {itinerary.day_number}
                            </span>
                            <h3
                                className={`
                                    font-bold truncate
                                    ${
                                        isPrinting
                                            ? "text-base text-black"
                                            : "text-sm sm:text-base text-foreground font-[Noto_Sans_TC]"
                                    }
                                `}
                            >
                                {itinerary.title || "未命名行程"}
                            </h3>
                        </div>

                        {/* 天氣資訊膠囊 */}
                        {!isPrinting && isWeatherLoading && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-pill text-[10px] font-mono text-muted-foreground shrink-0 animate-pulse w-fit">
                                <span className="w-2 h-2 rounded-full border border-primary border-t-transparent animate-spin" />
                                <span>天氣讀取中...</span>
                            </span>
                        )}

                        {!isPrinting && !isWeatherLoading && weatherData && (
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-pill text-[11px] font-mono font-medium text-foreground shrink-0 shadow-2xs w-fit"
                                title={`降雨機率: ${weatherData.precipitationProbabilityMax ?? 0}%`}
                            >
                                <span>{getWeatherInfoByCode(weatherData.weatherCode).icon}</span>
                                <span>
                                    {weatherData.temperatureMin}° ~ {weatherData.temperatureMax}°C
                                </span>
                                {typeof weatherData.precipitationProbabilityMax === "number" &&
                                    weatherData.precipitationProbabilityMax > 20 && (
                                        <span className="text-[10px] text-blue-500 font-sans font-bold">
                                            💧{weatherData.precipitationProbabilityMax}%
                                        </span>
                                    )}
                            </span>
                        )}
                    </div>
                </div>

                {/* 右側操作按鈕群 */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {!isPrinting && onOptimizeRoute && canOptimize && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOptimizeRoute(itinerary);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            title="最佳化當日動線"
                        >
                            <Sparkles size={11} className="text-amber-500" />
                            <span className="hidden sm:inline">動線最佳化</span>
                        </button>
                    )}

                    {/* 📱 手機版：快速查看此日地圖路線按鈕 */}
                    {!isPrinting && onOpenMap && hasLinkedPlaces && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenMap(itinerary);
                            }}
                            className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                            title="在地圖中查看此日路線"
                        >
                            <MapIcon size={12} />
                            <span>地圖</span>
                        </button>
                    )}

                    {/* 手機版折疊/展開指示箭頭 */}
                    {!isPrinting && (
                        <div
                            className={`lg:hidden p-1 text-muted-foreground transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : ""
                            }`}
                        >
                            <ChevronDown size={18} />
                        </div>
                    )}
                </div>
            </div>

            {/* 📱 編輯模式快捷工具列 */}
            {!isPrinting && isEditing && (
                <div className="px-3.5 sm:px-5 py-2 bg-white/30 dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        {onEditDay && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditDay(itinerary);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl glass-pill text-foreground text-xs font-semibold hover:bg-white/80 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
                                title="編輯日程天數與主題"
                            >
                                <Pencil size={11} className="text-blue-500" />
                                <span>編輯日程</span>
                            </button>
                        )}
                        {onDeleteDay && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteDay(itinerary);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                                title="刪除此日行程"
                            >
                                <Trash2 size={11} />
                                <span>刪除此天</span>
                            </button>
                        )}
                    </div>

                    {onAddActivity && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddActivity(itinerary);
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${accentColor}`}
                            title="新增活動"
                        >
                            <Plus size={13} />
                            <span>新增活動</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ItineraryDayHeader;
