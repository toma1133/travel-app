import { useEffect, useState, useMemo } from "react";
import {
    Pencil,
    Plus,
    Trash2,
    Sparkles,
    Star,
    Clock,
    Volume2,
    AlertTriangle,
    ChevronDown,
    MapPin,
} from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import { computeDayTimelineSchedule, timeToMinutes } from "../../utils/ItineraryTimeUtil";
import type { TripThemeConf } from "../../models/types/TripTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import {
    getCategoryIcon,
    getTransitIcon,
    getCategoryTypeName,
    DEFAULT_CATEGORY_COLORS,
} from "../../constants/Categories";
import {
    fetchDailyWeather,
    getWeatherInfoByCode,
    WeatherForecastData,
} from "../../services/WeatherService";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlaceVM } from "../../services/mappers/PlaceMapper";
import { getBusinessStatus, getScheduledMoment } from "../../utils/OpeningHoursUtil";
import { detectLanguage, playPronunciation } from "../../utils/SpeechLanguageUtil";

type ItineraryItemProps = {
    itinerary: ItineraryVM;
    isEditing: boolean;
    isExpanded: boolean;
    isPrinting?: boolean;
    dayPlaceIndexOffset?: number;
    placeMap?: Record<string, PlaceVM>;
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
    onOptimizeRouteBtnClick?: (itineraryDay: ItineraryVM) => void;
    onViewBtnClick: (linkId: string) => void;
    onPlaceHover?: (linkId: string | null, placeIndex?: number | null) => void;
};

const ItineraryItem = ({
    itinerary,
    isEditing,
    isExpanded,
    isPrinting,
    dayPlaceIndexOffset = 0,
    placeMap: externalPlaceMap,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onExpandedBtnToggle,
    onOptimizeRouteBtnClick,
    onViewBtnClick,
    onPlaceHover,
}: ItineraryItemProps) => {
    const accentColor = theme?.accent || "bg-rose-600";
    const accentTextColor =
        theme?.accentText ||
        (theme?.accent?.startsWith("bg-")
            ? theme.accent.replace("bg-", "text-")
            : "text-rose-600 dark:text-rose-400");

    const [weatherData, setWeatherData] = useState<WeatherForecastData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [localPlaceMap, setLocalPlaceMap] = useState<Record<string, PlaceVM>>({});
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    const placeMap =
        externalPlaceMap && Object.keys(externalPlaceMap).length > 0
            ? externalPlaceMap
            : localPlaceMap;

    // 載入當天活動所有已連結的地點資料 (當父層未傳入時作為 fallback)
    useEffect(() => {
        if (externalPlaceMap && Object.keys(externalPlaceMap).length > 0) return;

        const linkIds = (itinerary.activities || [])
            .map((a) => a.linkId)
            .filter(Boolean) as string[];

        if (linkIds.length === 0) {
            setLocalPlaceMap({});
            return;
        }

        let isMounted = true;
        if (placeRepo.getByIds) {
            placeRepo
                .getByIds(linkIds)
                .then((places) => {
                    if (isMounted) {
                        const map: Record<string, PlaceVM> = {};
                        (places || []).forEach((p) => {
                            if (p) map[p.id] = toPlaceVM(p);
                        });
                        setLocalPlaceMap(map);
                    }
                })
                .catch(console.error);
        }

        return () => {
            isMounted = false;
        };
    }, [itinerary.activities, externalPlaceMap]);

    // 載入天氣預報
    useEffect(() => {
        if (isPrinting || !itinerary.date) {
            setWeatherData(null);
            setIsWeatherLoading(false);
            return;
        }

        let isMounted = true;
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
                    setWeatherData(res);
                    setIsWeatherLoading(false);
                }
            }
        };

        resolveLocationAndFetch();

        return () => {
            isMounted = false;
        };
    }, [itinerary.date, itinerary.activities, isPrinting]);

    const handleSpeakPlace = (place: PlaceVM, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!place.info?.native_name) return;
        playPronunciation(place.info.native_name, {
            context: {
                address: place.info?.loc,
                mapUrl: place.map_url,
                currency: place.info?.price,
            },
            onStart: () => setSpeakingId(place.id),
            onEnd: () => setSpeakingId(null),
            onError: () => setSpeakingId(null),
        });
    };

    return (
        <div
            className={`
                group relative transition-all duration-300
                ${
                    !isPrinting
                        ? "glass-panel rounded-3xl mb-4 lg:mb-5 overflow-hidden"
                        : "bg-white border-b-2 border-black pb-4 mb-6 overflow-visible block"
                }
            `}
        >
            {/* --- Day Header (日曆毛玻璃標頭) --- */}
            <div
                onClick={
                    isEditing || isPrinting
                        ? undefined
                        : () => onExpandedBtnToggle(itinerary)
                }
                className={`
                    w-full flex items-center justify-between transition-colors
                    ${
                        !isPrinting
                            ? "p-3 sm:p-4 bg-white/60 dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.08]"
                            : "p-2 border-b border-black cursor-default"
                    }
                    ${!isPrinting && !isEditing ? "cursor-pointer hover:bg-white/80 dark:hover:bg-white/[0.06]" : ""}
                `}
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* 日曆膠囊 (Apple Calendar Style Badge - 清爽純白高對比 + 品牌強調色) */}
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
                            {itinerary.date.split("-")[2]}
                        </span>
                        <span
                            className={`font-bold ${
                                isPrinting
                                    ? "text-[8px] text-black"
                                    : "text-[10px] text-gray-500 dark:text-zinc-400"
                            }`}
                        >
                            {itinerary.date.split("-")[1]}月
                        </span>
                    </div>

                    {/* 日程標題與輔助資訊 */}
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

                {/* 右側操作按鈕 (最佳化動線 / 展開指示) */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {!isPrinting && onOptimizeRouteBtnClick && Array.isArray(itinerary.activities) && itinerary.activities.length >= 2 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOptimizeRouteBtnClick(itinerary);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            title="最佳化當日動線"
                        >
                            <Sparkles size={11} className="text-amber-500" />
                            <span className="hidden sm:inline">動線最佳化</span>
                        </button>
                    )}

                    {/* 手機版折疊/展開指示箭頭 */}
                    {!isPrinting && !isEditing && (
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
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditDayBtnClick(itinerary);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl glass-pill text-foreground text-xs font-semibold hover:bg-white/80 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
                            title="編輯日程天數與主題"
                        >
                            <Pencil size={11} className="text-blue-500" />
                            <span>編輯日程</span>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDayBtnClick(itinerary);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
                            title="刪除此日行程"
                        >
                            <Trash2 size={11} />
                            <span>刪除此天</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddActivityBtnClick(itinerary);
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${accentColor}`}
                        title="新增活動"
                    >
                        <Plus size={13} />
                        <span>新增活動</span>
                    </button>
                </div>
            )}

            {/* --- Content (極簡時間軸內容) --- */}
            {(isExpanded || isPrinting) && (
                <div
                    className={`relative px-2 sm:px-4 ${
                        isPrinting
                            ? "pt-2 pb-2 overflow-visible block"
                            : "py-4 overflow-hidden"
                    }`}
                >
                    {/* 左側極簡時間軸貫穿線 */}
                    <div className="absolute top-0 bottom-4 left-2 sm:left-4 w-12 sm:w-14 flex justify-center pointer-events-none">
                        <div
                            className={`w-[1.5px] h-full ${
                                !isPrinting
                                    ? "bg-black/[0.08] dark:bg-white/[0.12]"
                                    : "bg-gray-400"
                            }`}
                        />
                    </div>

                    <div className={isPrinting ? "space-y-2" : "space-y-1.5"}>
                        {Array.isArray(itinerary.activities) && itinerary.activities.length > 0 ? (
                            (() => {
                                const scheduleList = computeDayTimelineSchedule(itinerary.activities);
                                return scheduleList.map((scheduleItem, scheduleIdx) => {
                                    const {
                                        activity,
                                        index: idx,
                                        startTime,
                                        endTime,
                                        hasStayDuration,
                                        durationFormatted,
                                        transit,
                                    } = scheduleItem;
                                    const linkedPlace = activity.linkId ? placeMap[activity.linkId] : null;

                                    const nextScheduleItem = scheduleList[scheduleIdx + 1];
                                    const arrivalMins = transit.arrivalTime ? timeToMinutes(transit.arrivalTime) : null;
                                    const nextStartMins = nextScheduleItem?.startTime ? timeToMinutes(nextScheduleItem.startTime) : null;

                                    // ⚠️ 智慧偵測：若車程預計抵達時間晚於下一站排定的開始時間 (延誤衝突)
                                    const isLateConflict =
                                        arrivalMins !== null &&
                                        nextStartMins !== null &&
                                        nextStartMins < arrivalMins &&
                                        arrivalMins - nextStartMins < 720;

                                    const delayMinutes = isLateConflict ? arrivalMins! - nextStartMins! : 0;

                                    // ⚠️ 智慧偵測：前站交通是否會導致此站延誤開始
                                    const prevScheduleItem = scheduleIdx > 0 ? scheduleList[scheduleIdx - 1] : null;
                                    const prevArrivalMins = prevScheduleItem?.transit?.arrivalTime ? timeToMinutes(prevScheduleItem.transit.arrivalTime) : null;
                                    const currentStartMins = timeToMinutes(startTime);
                                    const isDelayedFromPrev =
                                        prevArrivalMins !== null &&
                                        currentStartMins < prevArrivalMins &&
                                        prevArrivalMins - currentStartMins < 720;
                                    const delayFromPrevMinutes = isDelayedFromPrev ? prevArrivalMins! - currentStartMins : 0;

                                    // ☕ 自由空檔：抵達下一站後距離下一站開始有充足緩衝
                                    const freeGapMinutes =
                                        arrivalMins !== null &&
                                        nextStartMins !== null &&
                                        nextStartMins > arrivalMins
                                            ? nextStartMins - arrivalMins
                                            : 0;

                                    // 計算排程時間是否在營業時間內
                                    const scheduledMoment = getScheduledMoment(itinerary.date, activity.time);
                                    const businessStatus = linkedPlace?.info?.open
                                        ? getBusinessStatus(linkedPlace.info.open, linkedPlace.info?.closed_days, scheduledMoment)
                                        : null;

                                    const isScheduleConflict = !!(
                                        linkedPlace &&
                                        linkedPlace.type !== "hotel" &&
                                        linkedPlace.type !== "stay" &&
                                        businessStatus &&
                                        (businessStatus.status === "closed" || businessStatus.status === "closed_today")
                                    );

                                    const firstRec = linkedPlace?.info?.recommended_items?.[0];
                                    const detectedLang = linkedPlace
                                        ? detectLanguage(linkedPlace.info?.native_name, {
                                              address: linkedPlace.info?.loc,
                                              currency: linkedPlace.info?.price,
                                          })
                                        : null;

                                    const hasGps = !!(
                                        linkedPlace &&
                                        typeof linkedPlace.lat === "number" &&
                                        typeof linkedPlace.lng === "number" &&
                                        !isNaN(linkedPlace.lat) &&
                                        !isNaN(linkedPlace.lng)
                                    );

                                    const placeIndexInDay = hasGps
                                        ? (itinerary.activities?.slice(0, idx).filter((a) => {
                                              const p = a.linkId ? placeMap[a.linkId] : null;
                                              return (
                                                  p &&
                                                  typeof p.lat === "number" &&
                                                  typeof p.lng === "number" &&
                                                  !isNaN(p.lat) &&
                                                  !isNaN(p.lng)
                                              );
                                          }).length ?? 0)
                                        : null;

                                    const currentPlaceIndex =
                                        placeIndexInDay !== null
                                            ? dayPlaceIndexOffset + placeIndexInDay
                                            : null;

                                    const TransitIconComp = getTransitIcon(transit.mode);
                                    const transitNote =
                                        activity.transitDetails?.flightNumber ||
                                        activity.transitDetails?.companyAndLine ||
                                        activity.transitDetails?.carRentalCompany ||
                                        activity.transitDetails?.passName ||
                                        activity.transitDetails?.startLocation;

                                    return (
                                        <div key={idx} className="space-y-1.5">
                                            {/* 🎯 1. 景點/活動極簡卡片節點 */}
                                            <div
                                                className={`flex group/item items-start ${
                                                    isPrinting ? "break-inside-avoid min-h-0" : "min-h-[44px]"
                                                }`}
                                                onMouseEnter={() => {
                                                    if (onPlaceHover) {
                                                        if (hasGps && linkedPlace && typeof currentPlaceIndex === "number") {
                                                            onPlaceHover(linkedPlace.id, currentPlaceIndex);
                                                        } else {
                                                            onPlaceHover(null, null);
                                                        }
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    if (onPlaceHover) {
                                                        onPlaceHover(null, null);
                                                    }
                                                }}
                                                onTouchStart={() => {
                                                    if (onPlaceHover) {
                                                        if (hasGps && linkedPlace && typeof currentPlaceIndex === "number") {
                                                            onPlaceHover(linkedPlace.id, currentPlaceIndex);
                                                        } else {
                                                            onPlaceHover(null, null);
                                                        }
                                                    }
                                                }}
                                            >
                                                {/* 1.1 左側時間軸節點 (時間點 + 類別圖標) */}
                                                <div className="w-12 sm:w-14 shrink-0 flex flex-col items-center justify-start z-10 pt-1">
                                                    {(() => {
                                                        const IconComp = getCategoryIcon(activity.type);
                                                        const bgColor =
                                                            theme?.categoryColor?.[activity.type] ||
                                                            DEFAULT_CATEGORY_COLORS[activity.type] ||
                                                            "#3b82f6";

                                                        return (
                                                            <div
                                                                className={`flex items-center justify-center text-white shrink-0 shadow-2xs ${
                                                                    !isPrinting
                                                                        ? "w-7 h-7 sm:w-8 sm:h-8 rounded-2xl ring-2 ring-background/90"
                                                                        : "w-5 h-5 rounded-full bg-black text-white"
                                                                }`}
                                                                style={{
                                                                    backgroundColor: isPrinting ? "#000" : bgColor,
                                                                }}
                                                            >
                                                                <IconComp
                                                                    size={isPrinting ? 10 : 13}
                                                                    className="text-white drop-shadow-2xs"
                                                                />
                                                            </div>
                                                        );
                                                    })()}
                                                    <span
                                                        className={`font-mono font-bold text-[10px] sm:text-xs mt-1 text-center tracking-tight ${
                                                            isPrinting
                                                                ? "text-black"
                                                                : isScheduleConflict || isDelayedFromPrev
                                                                ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                                                : "text-muted-foreground group-hover/item:text-foreground transition-colors"
                                                        }`}
                                                    >
                                                        {startTime}
                                                    </span>
                                                </div>

                                                {/* 1.2 右側卡片主體 (iOS Liquid Glass 極簡風格) */}
                                                <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                                                    {linkedPlace ? (
                                                        <div
                                                            onClick={() => !isPrinting && onViewBtnClick(linkedPlace.id)}
                                                            className={`
                                                                group/card relative transition-all duration-200
                                                                ${
                                                                    !isPrinting
                                                                        ? `glass-panel rounded-2xl p-2.5 sm:p-3 cursor-pointer active:scale-[0.99] hover:shadow-md ${
                                                                              isScheduleConflict
                                                                                  ? "ring-1 ring-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20"
                                                                                  : "hover:border-primary/30"
                                                                          }`
                                                                        : "bg-white border border-gray-300 p-2.5 rounded-xl break-inside-avoid shadow-none"
                                                                }
                                                            `}
                                                            title={!isPrinting ? "點擊查看地點詳細卡片" : undefined}
                                                        >
                                                            <div className="flex items-center gap-2.5 sm:gap-3">
                                                                {/* 縮圖 */}
                                                                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-muted/60 border border-black/5 dark:border-white/10 shadow-2xs">
                                                                    {linkedPlace.image_url ? (
                                                                        <img
                                                                            src={linkedPlace.image_url}
                                                                            alt={linkedPlace.name}
                                                                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                                                            <MapPin size={16} />
                                                                        </div>
                                                                    )}
                                                                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 backdrop-blur-md text-[8px] sm:text-[9px] text-white font-bold tracking-wider">
                                                                        {getCategoryTypeName(linkedPlace.type)}
                                                                    </span>
                                                                </div>

                                                                {/* 地標資訊主幹 (Apple Maps 極簡精品排版) */}
                                                                <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                                                                    {/* 頂部：標題 + 評分 + 動作按鈕 */}
                                                                    <div className="flex items-start justify-between gap-1.5">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <h4
                                                                                    className={`text-xs sm:text-sm font-bold truncate leading-snug tracking-tight ${
                                                                                        isPrinting
                                                                                            ? "text-black"
                                                                                            : isScheduleConflict
                                                                                            ? "text-rose-600 dark:text-rose-400 group-hover/card:text-rose-500"
                                                                                            : "text-foreground group-hover/card:text-primary transition-colors"
                                                                                    }`}
                                                                                >
                                                                                    {linkedPlace.name}
                                                                                </h4>

                                                                                {/* 評分（移至標題旁，像 Apple Maps 精緻微標） */}
                                                                                {linkedPlace.info?.rating && (
                                                                                    <span
                                                                                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                                                                            isPrinting
                                                                                                ? "text-black border border-black/30"
                                                                                                : "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                                                                        }`}
                                                                                    >
                                                                                        <Star
                                                                                            size={9}
                                                                                            className={
                                                                                                isPrinting
                                                                                                    ? "fill-black text-black"
                                                                                                    : "fill-amber-400 text-amber-400"
                                                                                            }
                                                                                        />
                                                                                        <span>{linkedPlace.info.rating}</span>
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* 外文原名 / 英文名副標 */}
                                                                            {(linkedPlace.eng_name || linkedPlace.info?.native_name) && (
                                                                                <p
                                                                                    className={`text-[10px] sm:text-[11px] font-mono truncate mt-0.5 ${
                                                                                        isPrinting
                                                                                            ? "text-black font-semibold"
                                                                                            : "text-muted-foreground/80 font-medium"
                                                                                    }`}
                                                                                >
                                                                                    {linkedPlace.eng_name}
                                                                                    {linkedPlace.eng_name &&
                                                                                        linkedPlace.info?.native_name &&
                                                                                        " · "}
                                                                                    {linkedPlace.info?.native_name}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* 動作按鈕：語音與編輯 */}
                                                                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                                                            {/* 語音發音按鈕 */}
                                                                            {!isPrinting && linkedPlace.info?.native_name && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => handleSpeakPlace(linkedPlace, e)}
                                                                                    className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-blue-500 transition-colors cursor-pointer ${
                                                                                        speakingId === linkedPlace.id
                                                                                            ? "animate-pulse scale-110 text-amber-500"
                                                                                            : ""
                                                                                    }`}
                                                                                    title={`發音 (${detectedLang?.name || ""})`}
                                                                                >
                                                                                    <Volume2 size={13} />
                                                                                </button>
                                                                            )}

                                                                            {/* 編輯 / 刪除按鈕 */}
                                                                            {!isPrinting && isEditing && (
                                                                                <div className="flex items-center gap-0.5 p-0.5 glass-pill rounded-full shrink-0">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onEditActivityBtnClick(itinerary, {
                                                                                                ...activity,
                                                                                                activityIndex: activity.activityIndex ?? idx,
                                                                                            });
                                                                                        }}
                                                                                        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                                                        title="編輯活動"
                                                                                    >
                                                                                        <Pencil size={11} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onDeleteActivityBtnClick(itinerary, {
                                                                                                ...activity,
                                                                                                activityIndex: activity.activityIndex ?? idx,
                                                                                            });
                                                                                        }}
                                                                                        className="p-1 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                                                        title="刪除活動"
                                                                                    >
                                                                                        <Trash2 size={11} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* 資訊與營業狀態列 (Apple Maps Style 質感精簡列) */}
                                                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.05] dark:border-white/[0.06] text-[10px] sm:text-[11px]">
                                                                        {/* 左側：營業狀態 / 飯店入住退房 */}
                                                                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                                            {linkedPlace.type === "hotel" || linkedPlace.type === "stay" ? (
                                                                                <span
                                                                                    className={`inline-flex items-center gap-1 font-medium truncate ${
                                                                                        isPrinting
                                                                                            ? "text-black"
                                                                                            : "text-purple-600 dark:text-purple-400 font-semibold"
                                                                                    }`}
                                                                                >
                                                                                    <span>🏨 入住 {linkedPlace.info?.check_in || "15:00"}</span>
                                                                                    <span className="opacity-40">·</span>
                                                                                    <span>退房 {linkedPlace.info?.check_out || "11:00"}</span>
                                                                                </span>
                                                                            ) : isScheduleConflict ? (
                                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse truncate">
                                                                                    <AlertTriangle size={10} className="shrink-0" />
                                                                                    <span>
                                                                                        {businessStatus?.status === "closed_today"
                                                                                            ? "排定日公休"
                                                                                            : `非營業時段 (${businessStatus?.detailText || ""})`}
                                                                                    </span>
                                                                                </span>
                                                                            ) : businessStatus?.badgeText ? (
                                                                                <div className="inline-flex items-center gap-1.5 truncate">
                                                                                    <span
                                                                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                                                            businessStatus.badgeColor === "emerald"
                                                                                                ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                                                                                                : businessStatus.badgeColor === "amber"
                                                                                                ? "bg-amber-500 ring-2 ring-amber-500/20"
                                                                                                : "bg-muted-foreground"
                                                                                        }`}
                                                                                    />
                                                                                    <span
                                                                                        className={`font-semibold ${
                                                                                            isPrinting
                                                                                                ? "text-black"
                                                                                                : businessStatus.badgeColor === "emerald"
                                                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                                                : businessStatus.badgeColor === "amber"
                                                                                                ? "text-amber-600 dark:text-amber-400"
                                                                                                : "text-muted-foreground"
                                                                                        }`}
                                                                                    >
                                                                                        {businessStatus.badgeText}
                                                                                    </span>
                                                                                    {businessStatus.todayHoursText && businessStatus.todayHoursText !== "未設定" && (
                                                                                        <>
                                                                                            <span className={isPrinting ? "text-black" : "opacity-30"}>·</span>
                                                                                            <span className={`font-mono truncate ${isPrinting ? "text-black font-medium" : "text-muted-foreground"}`}>
                                                                                                {businessStatus.todayHoursText}
                                                                                            </span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>

                                                                        {/* 右側：停留時間標籤 */}
                                                                        {(hasStayDuration || activity.duration) && (
                                                                            <span
                                                                                className={`inline-flex items-center gap-1 shrink-0 font-medium px-2 py-0.5 rounded-full text-[10px] ${
                                                                                    isPrinting
                                                                                        ? "border border-gray-400 text-black bg-white"
                                                                                        : "bg-black/[0.03] dark:bg-white/[0.06] text-muted-foreground border border-black/[0.04] dark:border-white/[0.06]"
                                                                                }`}
                                                                            >
                                                                                <Clock size={9} className={`shrink-0 ${isPrinting ? "text-black" : "text-muted-foreground/70"}`} />
                                                                                <span>停留 {durationFormatted || activity.duration}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* 底層 (若有)：活動備註說明或前站延誤警示 */}
                                                                    {((activity.desc && activity.desc !== linkedPlace.eng_name && activity.desc !== linkedPlace.info?.native_name) || (!isPrinting && isDelayedFromPrev)) && (
                                                                        <div className="pt-0.5 flex flex-col gap-1">
                                                                            {/* 使用者活動自訂備註 */}
                                                                            {activity.desc && activity.desc !== linkedPlace.eng_name && activity.desc !== linkedPlace.info?.native_name && (
                                                                                <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border truncate ${
                                                                                    isPrinting
                                                                                        ? "text-black bg-gray-100 border-gray-300 font-medium"
                                                                                        : "text-muted-foreground/90 font-medium bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.04] dark:border-white/[0.05]"
                                                                                }`}>
                                                                                    <span className={`font-bold ${isPrinting ? "text-black" : "opacity-60 text-blue-500"}`}>備註:</span>
                                                                                    <span className="truncate">{activity.desc}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* ⚠️ 智慧衝突提示 (前站交通延誤) */}
                                                                            {!isPrinting && isDelayedFromPrev && (
                                                                                <div
                                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-fit"
                                                                                    title={`前一站預計抵達時間為 ${prevScheduleItem?.transit?.arrivalTime}`}
                                                                                >
                                                                                    <AlertTriangle size={10} className="shrink-0 text-rose-500" />
                                                                                    <span>前站預計 {prevScheduleItem?.transit?.arrivalTime} 抵達（延誤約 {delayFromPrevMinutes} 分）</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* 無連結地點時的自訂手動活動卡片 (極簡毛玻璃) */
                                                        <div
                                                            className={`p-2.5 sm:p-3 rounded-2xl transition-all ${
                                                                isPrinting
                                                                    ? "bg-white border border-gray-300 text-black"
                                                                    : "glass-panel text-card-foreground shadow-2xs"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <h4 className={`font-bold text-xs sm:text-sm truncate ${isPrinting ? "text-black" : "text-foreground"}`}>
                                                                        {activity.title}
                                                                    </h4>
                                                                    {(hasStayDuration || activity.duration) && (
                                                                        <span
                                                                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                                                isPrinting
                                                                                    ? "border border-gray-400 text-black"
                                                                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                                            }`}
                                                                        >
                                                                            <Clock size={9} className="shrink-0" />
                                                                            <span>
                                                                                停留 {durationFormatted || activity.duration}
                                                                            </span>
                                                                        </span>
                                                                    )}
                                                                    {/* ⚠️ 智慧衝突提示 (前站交通預計抵達晚於此站開始) */}
                                                                    {!isPrinting && isDelayedFromPrev && (
                                                                        <span
                                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                                                            title={`前一站預計抵達時間為 ${prevScheduleItem?.transit?.arrivalTime}`}
                                                                        >
                                                                            <AlertTriangle size={9} className="shrink-0" />
                                                                            <span>前站預計 {prevScheduleItem?.transit?.arrivalTime} 抵達</span>
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {!isPrinting && isEditing && (
                                                                    <div className="flex items-center gap-0.5 p-0.5 glass-pill rounded-full shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                onEditActivityBtnClick(itinerary, {
                                                                                    ...activity,
                                                                                    activityIndex: activity.activityIndex ?? idx,
                                                                                })
                                                                            }
                                                                            className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                                            title="編輯活動"
                                                                        >
                                                                            <Pencil size={11} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                onDeleteActivityBtnClick(itinerary, {
                                                                                    ...activity,
                                                                                    activityIndex: activity.activityIndex ?? idx,
                                                                                })
                                                                            }
                                                                            className="p-1 rounded-full text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                                                                            title="刪除活動"
                                                                        >
                                                                            <Trash2 size={11} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {activity.desc && (
                                                                <p className={`mt-1 text-xs line-clamp-2 ${isPrinting ? "text-black font-medium" : "text-muted-foreground"}`}>
                                                                    {activity.desc}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 🚆 2. 前往下一站的交通時間軸軌道 (動態呈現：出發時刻 ➔ 車程 ➔ 預計抵達時刻，自動偵測時間不合理) */}
                                            {transit.hasTransit && (
                                                <div
                                                    className={`flex items-center my-1.5 sm:my-2 ${
                                                        isPrinting ? "py-1 break-inside-avoid" : ""
                                                    }`}
                                                >
                                                    {/* 左側：連接軌道圖標 + 出發時間 (垂直時間軸完美接續) */}
                                                    <div className="w-12 sm:w-14 shrink-0 flex flex-col items-center justify-center z-10">
                                                        <div
                                                            className={`flex items-center justify-center rounded-full ${
                                                                isPrinting
                                                                    ? "w-4 h-4 bg-gray-100 border border-gray-400 text-black"
                                                                    : isLateConflict
                                                                    ? "w-5 h-5 bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-2xs"
                                                                    : "w-5 h-5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-black/10 dark:border-white/10 text-muted-foreground shadow-2xs"
                                                            }`}
                                                        >
                                                            <TransitIconComp
                                                                size={10}
                                                                className={
                                                                    isPrinting
                                                                        ? "text-black"
                                                                        : isLateConflict
                                                                        ? "text-rose-600 dark:text-rose-400"
                                                                        : "text-blue-500"
                                                                }
                                                            />
                                                        </div>
                                                        {transit.departureTime && (
                                                            <span
                                                                className={`font-mono text-[9px] sm:text-[10px] mt-0.5 tracking-tighter ${
                                                                    isPrinting ? "text-black" : "text-muted-foreground/80 font-semibold"
                                                                }`}
                                                                title={`預計 ${transit.departureTime} 出發`}
                                                            >
                                                                {transit.departureTime}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* 右側：精巧磨砂交通膠囊 + 智慧時序與衝突偵測 */}
                                                    <div className="flex-1 min-w-0 pr-1 sm:pr-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                        <div
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] ${
                                                                isPrinting
                                                                    ? "bg-gray-100 border border-gray-400 text-black text-[9px]"
                                                                    : isLateConflict
                                                                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-2xs"
                                                                    : "glass-pill text-foreground/80 shadow-2xs hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
                                                            }`}
                                                        >
                                                            <span className={`font-semibold flex items-center gap-1 flex-wrap ${isPrinting ? "text-black" : "text-foreground"}`}>
                                                                {transit.arrivalTime ? (
                                                                    <>
                                                                        <span className={isPrinting ? "text-black" : ""}>
                                                                            {transit.durationFormatted ? transit.durationFormatted : "移動"}
                                                                        </span>
                                                                        <span className={isPrinting ? "text-black font-bold" : "opacity-40"}>➔</span>
                                                                        <span className={isPrinting ? "text-black font-extrabold" : isLateConflict ? "text-rose-600 dark:text-rose-400 font-bold" : "text-primary font-bold"}>
                                                                            預計 {transit.arrivalTime} 抵達
                                                                        </span>
                                                                    </>
                                                                ) : transit.durationFormatted ? (
                                                                    <span className={isPrinting ? "text-black" : ""}>
                                                                        {`移動約 ${transit.durationFormatted}`}
                                                                    </span>
                                                                ) : (
                                                                    <span className={isPrinting ? "text-black" : ""}>
                                                                        前往下一站
                                                                    </span>
                                                                )}
                                                            </span>
                                                            {transitNote && (
                                                                <>
                                                                    <span className={isPrinting ? "text-black font-bold opacity-60" : "opacity-30"}>·</span>
                                                                    <span className={`font-mono text-[9px] sm:text-[10px] truncate max-w-[120px] sm:max-w-[200px] ${isPrinting ? "text-black font-medium" : "text-muted-foreground"}`}>
                                                                        {transitNote}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* ⚠️ 智慧偵測：時間不合理警告標籤 (抵達時間晚於下一站開始時間) */}
                                                        {!isPrinting && isLateConflict && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                                                                <AlertTriangle size={9} className="shrink-0" />
                                                                <span>時間不及：晚於下站開始時間（延誤約 {delayMinutes} 分）</span>
                                                            </span>
                                                        )}

                                                        {/* ☕ 自由空檔提示 (抵達後距下站開始 >= 15 分鐘) */}
                                                        {!isPrinting && !isLateConflict && freeGapMinutes >= 15 && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                ☕ 留有 {freeGapMinutes < 60 ? `${freeGapMinutes} 分鐘` : `${(freeGapMinutes / 60).toFixed(1)} 小時`} 空檔
                                                            </span>
                                                        )}

                                                        {/* 細緻虛線延展 */}
                                                        <div
                                                            className={`flex-1 h-[1px] min-w-[20px] ${
                                                                isPrinting
                                                                    ? "border-b border-gray-300 border-dashed"
                                                                    : isLateConflict
                                                                    ? "border-b border-rose-500/30 border-dashed"
                                                                    : "border-b border-black/[0.08] dark:border-white/[0.1] border-dashed"
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            <div className="flex py-3">
                                <div className="w-12 sm:w-14 shrink-0" />
                                <p className="text-xs text-muted-foreground italic">
                                    尚無活動，點擊「新增活動」加入景點
                                </p>
                            </div>
                        )}

                        {/* 📱 編輯模式下底部快速新增活動按鈕 */}
                        {!isPrinting && isEditing && Array.isArray(itinerary.activities) && itinerary.activities.length > 0 && (
                            <div className="flex pt-1 pb-1">
                                <div className="w-12 sm:w-14 shrink-0" />
                                <button
                                    type="button"
                                    onClick={() => onAddActivityBtnClick(itinerary)}
                                    className="flex-1 mr-1 sm:mr-2 py-2 rounded-2xl border border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                                >
                                    <Plus size={13} />
                                    <span>加入新行程活動</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItineraryItem;
