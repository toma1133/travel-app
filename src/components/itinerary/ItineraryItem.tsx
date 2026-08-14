import { useEffect, useState } from "react";
import {
    BookOpen,
    Pencil,
    Plus,
    Trash2,
    Hourglass,
} from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import {
    getCategoryIcon,
    getTransitIcon,
    DEFAULT_CATEGORY_COLORS,
} from "../../constants/Categories";
import {
    fetchDailyWeather,
    getWeatherInfoByCode,
    WeatherForecastData,
} from "../../services/WeatherService";
import { placeRepo } from "../../services/repositories/PlaceRepo";

type ItineraryItemProps = {
    itinerary: ItineraryVM;
    isEditing: boolean;
    isExpanded: boolean;
    isPrinting?: boolean;
    theme: TripThemeConf | null;
    onAddActivityBtnClick: (itineraryDay: ItineraryVM) => void;
    onDeleteActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy,
    ) => void;
    onDeleteDayBtnClick: (itinerary: ItineraryVM) => void;
    onEditActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy,
    ) => void;
    onEditDayBtnClick: (itinerary: ItineraryVM) => void;
    onExpandedBtnToggle: (itinerary: ItineraryVM) => void;
    onViewBtnClick: (linkId: string) => void;
    onPlaceHover?: (linkId: string | null) => void;
};

const ItineraryItem = ({
    itinerary,
    isEditing,
    isExpanded,
    isPrinting,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onExpandedBtnToggle,
    onViewBtnClick,
    onPlaceHover,
}: ItineraryItemProps) => {
    const accentColor = theme?.accent || "bg-rose-600";
    const primaryTextColor = theme?.primary || "text-gray-900";

    const [showDayActions, setShowDayActions] = useState(false);
    const [activeActivityIdx, setActiveActivityIdx] = useState<number | null>(
        null,
    );
    const [weatherData, setWeatherData] = useState<WeatherForecastData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);

    useEffect(() => {
        if (isPrinting || !itinerary.date) {
            setWeatherData(null);
            setIsWeatherLoading(false);
            return;
        }

        let isMounted = true;
        // 每次日期變更時，立即重置天氣狀態並開啟 Loading 轉圈
        setWeatherData(null);
        setIsWeatherLoading(true);
        
        let targetLat = 25.033;
        let targetLng = 121.565;

        const resolveLocationAndFetch = async () => {
            if (Array.isArray(itinerary.activities)) {
                for (const act of itinerary.activities) {
                    if (act.linkId) {
                        try {
                            const pRow = await placeRepo.getById(act.linkId);
                            if (pRow && typeof pRow.lat === "number" && typeof pRow.lng === "number") {
                                targetLat = pRow.lat;
                                targetLng = pRow.lng;
                                break;
                            }
                        } catch (e) {
                            // Ignore error
                        }
                    }
                }
            }

            if (isMounted) {
                const res = await fetchDailyWeather(targetLat, targetLng, itinerary.date);
                if (isMounted) {
                    setWeatherData(res); // 若無資料會被歸零重置 (null)
                    setIsWeatherLoading(false);
                }
            }
        };

        resolveLocationAndFetch();

        return () => {
            isMounted = false;
        };
    }, [itinerary.date, itinerary.activities, isPrinting]);

    return (
        <div
            className={`
              group relative
                /* 螢幕: 卡片懸浮感、圓角 */
                ${
                    !isPrinting
                        ? "bg-card rounded-2xl shadow-sm border border-border mb-4 transition-all duration-300 hover:shadow-md lg:mb-0"
                        : ""
                }
                /* 列印: 減少底部間距 (mb-4)，避免分頁斷開 */
                ${isPrinting ? "mb-4 break-inside-avoid" : ""}
            `}
            onMouseEnter={() => setShowDayActions(true)}
            onMouseLeave={() => setShowDayActions(false)}
            onTouchStart={() => setShowDayActions(true)}
        >
            {/* --- Day Header (日期標頭) --- */}
            <div
                onClick={
                    isEditing || isPrinting
                        ? undefined
                        : () => onExpandedBtnToggle(itinerary)
                }
                className={`
                    w-full flex items-stretch rounded-t-2xl
                    ${!isPrinting && !isEditing ? "cursor-pointer hover:bg-muted/10" : ""}
                    ${!isPrinting ? "sticky top-[60px] lg:top-0 z-20 bg-card/95 backdrop-blur-sm shadow-sm border-b border-border/50" : ""}
                    ${
                        isPrinting
                            ? "cursor-default border-b border-black pb-1 rounded-none overflow-hidden"
                            : "p-0"
                    }
                `}
            >
                {/* 左側：日期視覺區塊 */}
                <div
                    className={`
                        flex flex-col items-center justify-center 
                        /* 列印: 縮小日期區塊寬度與內距 */
                        ${
                            isPrinting
                                ? "p-2 min-w-[50px]"
                                : "p-4 min-w-[80px] bg-muted/30 border-r border-border"
                        }
                    `}
                >
                    <span
                        className={`font-black uppercase tracking-widest ${
                            isPrinting
                                ? "text-[8px] text-black"
                                : "text-[10px] text-muted-foreground"
                        }`}
                    >
                        {itinerary.weekday}
                    </span>
                    <span
                        className={`font-[Noto_Sans_TC] font-black leading-none mt-1 ${
                            isPrinting
                                ? "text-xl text-black"
                                : "text-3xl text-foreground"
                        }`}
                    >
                        {itinerary.date.split("-")[2]}
                    </span>
                    <span
                        className={`mt-1 ${
                            isPrinting
                                ? "text-[8px] text-gray-600"
                                : "text-[10px] text-muted-foreground"
                        }`}
                    >
                        {itinerary.date.split("-")[1]}月
                    </span>
                </div>

                {/* 右側：標題與操作區 */}
                <div
                    className={`
                        flex-1 flex flex-col justify-center relative 
                        ${isPrinting ? "px-3 py-1" : "px-5 py-3"} 
                        min-w-0
                    `}
                >
                    <div className="flex justify-between items-center w-full min-w-0 gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                                {/* Day Badge */}
                                <span
                                    className={`
                                        rounded-full font-bold text-white tracking-wide shadow-sm shrink-0 whitespace-nowrap
                                        ${
                                            !isPrinting
                                                ? `px-2.5 py-0.5 text-[10px] ${accentColor}`
                                                : "px-2 py-0 text-[9px] bg-black text-white border border-black"
                                        }
                                    `}
                                >
                                    DAY {itinerary.day_number}
                                </span>
                                <h3
                                    className={`
                                        font-bold 
                                        ${
                                            isPrinting
                                                ? "text-base text-black whitespace-normal"
                                                : "text-md truncate text-foreground"
                                        }
                                    `}
                                >
                                    {itinerary.title || "未命名行程"}
                                </h3>
                            </div>

                            {/* 天氣預報資訊膠囊 (Weather Forecast Badge - 支援手機/電腦響應式) */}
                            {!isPrinting && isWeatherLoading && (
                                 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/40 border border-border/40 text-[11px] sm:text-xs font-mono text-muted-foreground shrink-0 animate-pulse w-fit">
                                     <span className="w-2.5 h-2.5 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                                     <span>查詢天氣...</span>
                                 </span>
                            )}

                            {!isPrinting && !isWeatherLoading && weatherData && (
                                <span 
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/60 border border-border/60 text-[11px] sm:text-xs font-mono font-medium text-foreground shrink-0 shadow-2xs w-fit"
                                    title={`降雨機率: ${weatherData.precipitationProbabilityMax ?? 0}%`}
                                >
                                    <span>{getWeatherInfoByCode(weatherData.weatherCode).icon}</span>
                                    <span>{weatherData.temperatureMin}° ~ {weatherData.temperatureMax}°C</span>
                                    {typeof weatherData.precipitationProbabilityMax === "number" && weatherData.precipitationProbabilityMax > 20 && (
                                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-sans font-bold">
                                            💧{weatherData.precipitationProbabilityMax}%
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* 編輯模式下的工具列 (作為靜態 Flex 元素，手機/電腦不壓迫左側) */}
                        {!isPrinting && isEditing && (
                            <div
                                className={`flex items-center gap-1 p-0.5 bg-card/90 backdrop-blur-md rounded-full shadow-sm border border-border/80 shrink-0 transition-all duration-200 z-10 ${showDayActions ? "opacity-100 scale-100" : "lg:opacity-0 lg:scale-95 lg:group-hover:opacity-100 lg:group-hover:scale-100"}`}
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddActivityBtnClick(itinerary);
                                    }}
                                    className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-primary-foreground hover:bg-primary transition-all"
                                    title="新增活動"
                                >
                                    <Plus size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditDayBtnClick(itinerary);
                                    }}
                                    className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                    title="編輯日程"
                                >
                                    <Pencil size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteDayBtnClick(itinerary);
                                    }}
                                    className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-destructive-foreground hover:bg-destructive transition-all"
                                    title="刪除日程"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Content (時間軸內容) --- */}
            {(isExpanded || isPrinting) && (
                <div
                    className={`relative ${
                        isPrinting
                            ? "pt-2 pb-2"
                            : "pb-6 pt-2 lg:flex-1 overflow-x-hidden lg:overflow-y-auto no-scrollbar"
                    }`}
                >
                    <div className="absolute top-0 bottom-6 left-0 w-14 flex justify-center pointer-events-none">
                        <div
                            className={`w-[2px] h-full ${
                                !isPrinting ? "bg-border" : "bg-gray-300"
                            }`}
                        ></div>
                    </div>

                    <div
                        className={`
                            ${isPrinting ? "space-y-2" : "space-y-6"}
                        `}
                    >
                        {Array.isArray(itinerary.activities) &&
                        itinerary.activities.length > 0 ? (
                            itinerary.activities.map((activity, idx) => (
                                /* [Flex 排版核心]
                                   使用 Flex 將 "左側軌道" 與 "右側內容" 分開
                                   這樣圓點跟文字永遠會對齊，不會因為 padding 跑掉
                                */
                                <div
                                    key={idx}
                                    className={`
                                        flex group/item items-start
                                        ${
                                            isPrinting
                                                ? "min-h-0"
                                                : "min-h-[40px]"
                                        }
                                    `}
                                    onMouseEnter={() => {
                                        setActiveActivityIdx(idx);
                                        if (activity.linkId && onPlaceHover) {
                                            onPlaceHover(activity.linkId);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setActiveActivityIdx(null);
                                        if (onPlaceHover) {
                                            onPlaceHover(null);
                                        }
                                    }}
                                    onTouchStart={() => {
                                        setActiveActivityIdx(idx);
                                        if (activity.linkId && onPlaceHover) {
                                            onPlaceHover(activity.linkId);
                                        }
                                    }}
                                >
                                    {/* 1. 左側軌道 (Track Column with Lucide Font Icon) */}
                                    <div className="w-14 shrink-0 flex justify-center items-start z-10 pt-0.5">
                                        {(() => {
                                            const IconComp = getCategoryIcon(
                                                activity.type,
                                            );
                                            const bgColor =
                                                theme?.categoryColor?.[
                                                    activity.type
                                                ] ||
                                                DEFAULT_CATEGORY_COLORS[
                                                    activity.type
                                                ] ||
                                                "#6b7280";

                                            return (
                                                <div
                                                    className={`
                                                        flex items-center justify-center rounded-full shadow-md text-white shrink-0
                                                        ${
                                                            !isPrinting
                                                                ? "w-7 h-7 ring-2 ring-background"
                                                                : "w-5 h-5 bg-black text-white"
                                                        }
                                                    `}
                                                    style={{
                                                        backgroundColor:
                                                            bgColor,
                                                    }}
                                                >
                                                    <IconComp
                                                        size={
                                                            isPrinting ? 11 : 14
                                                        }
                                                        className="text-white drop-shadow-sm"
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* 2. 右側內容 (Content Column) */}
                                    <div
                                        className={`
                                            flex-1 min-w-0 flex flex-col items-start pr-1
                                            ${
                                                !isPrinting
                                                    ? "transition-transform duration-200 group-hover/item:translate-x-0.5"
                                                    : ""
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3 w-full">
                                            {/* 時間 */}
                                            <div className="flex items-center shrink-0">
                                                <span
                                                    className={`
                                                        font-mono font-bold 
                                                        ${
                                                            isPrinting
                                                                ? "text-xs text-black"
                                                                : "text-sm text-muted-foreground group-hover/item:text-foreground"
                                                        }
                                                    `}
                                                >
                                                    {activity.time}
                                                </span>
                                            </div>

                                            {/* 標題與描述 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4
                                                        className={`
                                                            font-bold leading-tight
                                                            ${
                                                                isPrinting
                                                                    ? "text-sm text-black"
                                                                    : "text-sm text-foreground"
                                                            }
                                                        `}
                                                    >
                                                        {activity.title}
                                                    </h4>
                                                    {activity.duration && (
                                                        <span
                                                            className={`
                                                                inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full
                                                                ${
                                                                    isPrinting
                                                                        ? "text-gray-700 bg-gray-100 border border-gray-300 px-1.5 py-0"
                                                                        : "text-primary/80 bg-primary/10 px-2 py-0.5"
                                                                }
                                                            `}
                                                        >
                                                            <Hourglass
                                                                size={10}
                                                            />
                                                            {activity.duration}
                                                        </span>
                                                    )}
                                                </div>

                                                {activity.desc && (
                                                    <p
                                                        className={`
                                                            leading-relaxed whitespace-pre-wrap
                                                            ${
                                                                isPrinting
                                                                    ? "text-[10px] mt-0.5 text-gray-700"
                                                                    : "text-xs mt-1 text-muted-foreground"
                                                            }
                                                        `}
                                                    >
                                                        {activity.desc}
                                                    </p>
                                                )}

                                                {/* 移動/路程時間節點 (Transit Connector Card) */}
                                                {((activity.transitMode &&
                                                    activity.transitMode !==
                                                        "none") ||
                                                    activity.transitDuration) && (
                                                    <div
                                                        className={`
                                                            mt-2.5 rounded-xl text-[11px] font-medium transition-all block w-full max-w-xl
                                                            ${
                                                                isPrinting
                                                                    ? "p-2 bg-white border border-gray-400 text-black text-[9px]"
                                                                    : "p-3 bg-white dark:bg-zinc-800/95 border border-gray-300 dark:border-zinc-700/90 text-gray-900 dark:text-zinc-100 shadow-sm"
                                                            }
                                                        `}
                                                    >
                                                        {/* 標頭：圖示 + 模式 + 預估時間 + 標籤膠囊 */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className={`flex items-center gap-1.5 font-bold ${isPrinting ? "text-black" : "text-gray-900 dark:text-zinc-100"}`}>
                                                                {(() => {
                                                                    const TransitIconComp =
                                                                        getTransitIcon(
                                                                            activity.transitMode,
                                                                        );
                                                                    return (
                                                                        <TransitIconComp
                                                                            size={
                                                                                isPrinting
                                                                                    ? 11
                                                                                    : 14
                                                                            }
                                                                            className={`${isPrinting ? "text-black" : "text-gray-700 dark:text-sky-400"} shrink-0`}
                                                                        />
                                                                    );
                                                                })()}
                                                                <span>
                                                                    {activity.transitDuration
                                                                        ? `預估 ${activity.transitDuration}`
                                                                        : "前往下一站"}
                                                                </span>
                                                            </div>

                                                            {/* 租車公司膠囊標籤 */}
                                                            {(activity
                                                                .transitDetails
                                                                ?.carRentalCompany ||
                                                                activity
                                                                    .transitDetails
                                                                    ?.carRentalBranch) && (
                                                                <span className="px-2 py-0.5 rounded-md bg-indigo-100/90 text-indigo-800 border border-indigo-200/70 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800/60 text-[10px] font-semibold flex items-center gap-1">
                                                                    🚗{" "}
                                                                    {
                                                                        activity
                                                                            .transitDetails
                                                                            .carRentalCompany
                                                                    }{" "}
                                                                    {activity
                                                                        .transitDetails
                                                                        .carRentalBranch &&
                                                                        `(${activity.transitDetails.carRentalBranch})`}
                                                                </span>
                                                            )}

                                                            {/* Pass 周遊券膠囊 */}
                                                            {activity
                                                                .transitDetails
                                                                ?.passName && (
                                                                <span className="px-2 py-0.5 rounded-md bg-sky-100/90 text-sky-800 border border-sky-200/70 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800/60 text-[10px] font-semibold">
                                                                    🎫{" "}
                                                                    {
                                                                        activity
                                                                            .transitDetails
                                                                            .passName
                                                                    }
                                                                </span>
                                                            )}

                                                            {/* 車資膠囊 */}
                                                            {activity
                                                                .transitDetails
                                                                ?.fare && (
                                                                <span className="px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-800 border border-amber-200/70 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60 text-[10px] font-semibold">
                                                                    💰{" "}
                                                                    {
                                                                        activity
                                                                            .transitDetails
                                                                            .fare
                                                                    }
                                                                </span>
                                                            )}

                                                            {/* 叫車/接送標籤 */}
                                                            {activity
                                                                .transitDetails
                                                                ?.isReservationRequired && (
                                                                <span className="px-2 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 border border-emerald-200/70 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60 text-[10px] font-semibold">
                                                                    ✓
                                                                    已預約機場接送
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* 詳細交通欄位內容 */}
                                                        {activity.transitDetails &&
                                                            (activity
                                                                .transitDetails
                                                                .companyAndLine ||
                                                                activity
                                                                    .transitDetails
                                                                    .destination ||
                                                                activity
                                                                    .transitDetails
                                                                    .platform ||
                                                                activity
                                                                    .transitDetails
                                                                    .flightNumber ||
                                                                activity
                                                                    .transitDetails
                                                                    .gate ||
                                                                (activity
                                                                    .transitDetails
                                                                    .scheduleList &&
                                                                    activity
                                                                        .transitDetails
                                                                        .scheduleList
                                                                        .length >
                                                                        0) ||
                                                                activity
                                                                    .transitDetails
                                                                    .schedules) && (
                                                                <div className={`mt-2.5 pt-2 space-y-2 text-xs ${isPrinting ? "border-t border-gray-400" : "border-t border-gray-200 dark:border-zinc-700/70"}`}>
                                                                    {/* 電車/公車/渡輪 路線、目的地、月台碼頭 */}
                                                                    {(activity
                                                                        .transitDetails
                                                                        .companyAndLine ||
                                                                        activity
                                                                            .transitDetails
                                                                            .destination ||
                                                                        activity
                                                                            .transitDetails
                                                                            .platform) && (
                                                                        <div className={`flex items-center gap-2 flex-wrap font-medium ${isPrinting ? "text-black" : "text-gray-800 dark:text-zinc-200"}`}>
                                                                            {activity
                                                                                .transitDetails
                                                                                .companyAndLine && (
                                                                                <span className="font-semibold">
                                                                                    {
                                                                                        activity
                                                                                            .transitDetails
                                                                                            .companyAndLine
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            {activity
                                                                                .transitDetails
                                                                                .destination && (
                                                                                <span className={isPrinting ? "text-gray-600" : "text-gray-500 dark:text-zinc-400"}>
                                                                                    往{" "}
                                                                                    {
                                                                                        activity
                                                                                            .transitDetails
                                                                                            .destination
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            {activity
                                                                                .transitDetails
                                                                                .platform && (
                                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${isPrinting ? "bg-gray-200 text-black" : "bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-zinc-200"}`}>
                                                                                    {activity.transitMode ===
                                                                                    "ferry"
                                                                                        ? "碼頭"
                                                                                        : "月台"}

                                                                                    :{" "}
                                                                                    {
                                                                                        activity
                                                                                            .transitDetails
                                                                                            .platform
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* 飛機資訊 */}
                                                                    {(activity
                                                                        .transitDetails
                                                                        .flightNumber ||
                                                                        activity
                                                                            .transitDetails
                                                                            .gate) && (
                                                                        <div className={`flex items-center gap-2 flex-wrap ${isPrinting ? "text-black" : "text-gray-800 dark:text-zinc-200"}`}>
                                                                            {activity
                                                                                .transitDetails
                                                                                .flightNumber && (
                                                                                <span className="font-bold text-gray-800 dark:text-sky-400">
                                                                                    航班{" "}
                                                                                    {
                                                                                        activity
                                                                                            .transitDetails
                                                                                            .flightNumber
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            {activity
                                                                                .transitDetails
                                                                                .gate && (
                                                                                <span>
                                                                                    {
                                                                                        activity
                                                                                            .transitDetails
                                                                                            .gate
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* 🆕 動態結構化選搭班次表格 (Structured Schedule Table) */}
                                                                    {Array.isArray(
                                                                        activity
                                                                            .transitDetails
                                                                            .scheduleList,
                                                                    ) &&
                                                                        activity
                                                                            .transitDetails
                                                                            .scheduleList
                                                                            .length >
                                                                            0 && (
                                                                            <div className="space-y-1 mt-2">
                                                                                <span className="block text-[10px] font-bold uppercase text-gray-500 dark:text-zinc-400 tracking-wider">
                                                                                    備選/預選班次列表
                                                                                </span>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                                                    {activity.transitDetails.scheduleList.map(
                                                                                        (
                                                                                            sch,
                                                                                            sIdx,
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    sIdx
                                                                                                }
                                                                                                className="flex items-center justify-between p-1.5 rounded-md bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-700/80 font-mono text-[11px] text-gray-800 dark:text-zinc-200 shadow-2xs"
                                                                                            >
                                                                                                <span className="font-bold text-gray-800 dark:text-sky-300 truncate max-w-[120px]">
                                                                                                    {sch.name ||
                                                                                                        `班次 ${sIdx + 1}`}
                                                                                                </span>
                                                                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-zinc-300 shrink-0">
                                                                                                    {(sch.departureTime ||
                                                                                                        sch.arrivalTime) && (
                                                                                                        <span>
                                                                                                            {sch.departureTime ||
                                                                                                                "--:--"}{" "}
                                                                                                            →{" "}
                                                                                                            {sch.arrivalTime ||
                                                                                                                "--:--"}
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {sch.platform && (
                                                                                                        <span className="px-1 bg-gray-100 dark:bg-zinc-800 rounded text-gray-500 dark:text-zinc-400">
                                                                                                            {
                                                                                                                sch.platform
                                                                                                            }
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                    {/* 舊單純文字班次備註 (相容顯示) */}
                                                                    {activity
                                                                        .transitDetails
                                                                        .schedules &&
                                                                        (!activity
                                                                            .transitDetails
                                                                            .scheduleList ||
                                                                            activity
                                                                                .transitDetails
                                                                                .scheduleList
                                                                                .length ===
                                                                                0) && (
                                                                            <div className="mt-1.5 font-mono text-[11px] whitespace-pre-wrap bg-white dark:bg-zinc-900/90 p-2 rounded-lg border border-gray-200 dark:border-zinc-700/80 text-gray-800 dark:text-zinc-200 leading-relaxed shadow-sm">
                                                                                {
                                                                                    activity
                                                                                        .transitDetails
                                                                                        .schedules
                                                                                }
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                            {!isPrinting &&
                                                (isEditing ||
                                                    activity.linkId) && (
                                                    <div
                                                        className={`
                                                        flex items-center gap-1 p-0.5 bg-card/90 backdrop-blur-md rounded-full shadow-sm border border-border/80 shrink-0 ml-1.5 transition-all duration-200 z-10 self-start mt-0.5
                                                        ${activeActivityIdx === idx ? "opacity-100 scale-100" : "lg:opacity-0 lg:scale-95 lg:group-hover/item:opacity-100 lg:group-hover/item:scale-100"}
                                                    `}
                                                    >
                                                        {!isEditing &&
                                                            activity.linkId && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onViewBtnClick(
                                                                            activity.linkId!,
                                                                        )
                                                                    }
                                                                    className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                                    title="查看詳情"
                                                                >
                                                                    <BookOpen
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </button>
                                                            )}
                                                        {isEditing && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onEditActivityBtnClick(
                                                                            itinerary,
                                                                            activity,
                                                                        )
                                                                    }
                                                                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                                    title="編輯活動"
                                                                >
                                                                    <Pencil
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onDeleteActivityBtnClick(
                                                                            itinerary,
                                                                            activity,
                                                                        )
                                                                    }
                                                                    className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                    title="刪除活動"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // 空狀態
                            <div className="flex">
                                <div className="w-14 shrink-0"></div>{" "}
                                {/* 佔位符保持對齊 */}
                                <div className="py-2">
                                    <p className="text-xs text-muted-foreground italic">
                                        尚無活動，點擊上方 + 新增
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItineraryItem;
