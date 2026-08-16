import { useEffect, useState } from "react";
import {
    Pencil,
    Plus,
    Trash2,
    Hourglass,
    Sparkles,
    Star,
    Clock,
    MapPin,
    Volume2,
    Navigation,
    CalendarX,
} from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
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
import { getBusinessStatus } from "../../utils/OpeningHoursUtil";
import { detectLanguage, playPronunciation } from "../../utils/SpeechLanguageUtil";

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
    onOptimizeRouteBtnClick?: (itineraryDay: ItineraryVM) => void;
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
    onOptimizeRouteBtnClick,
    onViewBtnClick,
    onPlaceHover,
}: ItineraryItemProps) => {
    const accentColor = theme?.accent || "bg-rose-600";
    const primaryTextColor = theme?.primary || "text-gray-900";

    const [showDayActions, setShowDayActions] = useState(false);
    const [activeActivityIdx, setActiveActivityIdx] = useState<number | null>(null);
    const [weatherData, setWeatherData] = useState<WeatherForecastData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [placeMap, setPlaceMap] = useState<Record<string, PlaceVM>>({});
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    // 載入當天活動所有已連結的地點資料
    useEffect(() => {
        const linkIds = (itinerary.activities || [])
            .map((a) => a.linkId)
            .filter(Boolean) as string[];

        if (linkIds.length === 0) {
            setPlaceMap({});
            return;
        }

        let isMounted = true;
        if (placeRepo.getByIds) {
            placeRepo.getByIds(linkIds)
                .then((places) => {
                    if (isMounted) {
                        const map: Record<string, PlaceVM> = {};
                        (places || []).forEach((p) => {
                            if (p) map[p.id] = toPlaceVM(p);
                        });
                        setPlaceMap(map);
                    }
                })
                .catch(console.error);
        }

        return () => {
            isMounted = false;
        };
    }, [itinerary.activities]);

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
                group relative
                ${
                    !isPrinting
                        ? "overflow-hidden bg-card rounded-3xl shadow-sm border border-border/80 mb-4 transition-all duration-300 hover:shadow-md lg:mb-0"
                        : "overflow-visible block mb-6"
                }
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
                    w-full flex items-stretch rounded-t-3xl
                    ${!isPrinting && !isEditing ? "cursor-pointer hover:bg-muted/10" : ""}
                    ${!isPrinting ? "bg-card z-20 shadow-2xs border-b border-border/50" : ""}
                    ${
                        isPrinting
                            ? "cursor-default border-b border-black pb-1 rounded-none overflow-visible break-inside-avoid break-after-avoid"
                            : "p-0"
                    }
                `}
            >
                {/* 左側：日期視覺區塊 */}
                <div
                    className={`
                        flex flex-col items-center justify-center 
                        ${
                            isPrinting
                                ? "p-2 min-w-[50px]"
                                : "p-4 min-w-[80px] bg-muted/30 border-r border-border/60"
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
                                : "text-[10px] text-muted-foreground font-medium"
                        }`}
                    >
                        {itinerary.date.split("-")[1]}月
                    </span>
                </div>

                {/* 右側：標題與操作區 */}
                <div
                    className={`
                        flex-1 flex flex-col justify-center relative 
                        ${isPrinting ? "px-3 py-1" : "px-4 sm:px-5 py-3"} 
                        min-w-0
                    `}
                >
                    <div className="flex justify-between items-center w-full min-w-0 gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                                {/* Day Badge */}
                                <span
                                    className={`
                                        rounded-full font-bold text-white tracking-wide shadow-xs shrink-0 whitespace-nowrap
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
                                                : "text-sm sm:text-base truncate text-foreground font-[Noto_Sans_TC]"
                                        }
                                    `}
                                >
                                    {itinerary.title || "未命名行程"}
                                </h3>
                            </div>

                            {/* 天氣預報資訊膠囊 */}
                            {!isPrinting && isWeatherLoading && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/40 border border-border/40 text-[11px] font-mono text-muted-foreground shrink-0 animate-pulse w-fit">
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                                    <span>查詢天氣...</span>
                                </span>
                            )}

                            {!isPrinting && !isWeatherLoading && weatherData && (
                                <span 
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/50 border border-border/60 text-[11px] font-mono font-medium text-foreground shrink-0 shadow-2xs w-fit"
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

                        {/* 操作工具列 */}
                        {!isPrinting && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                {/* 最佳化路線按鈕 */}
                                {onOptimizeRouteBtnClick && Array.isArray(itinerary.activities) && itinerary.activities.length >= 2 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOptimizeRouteBtnClick(itinerary);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold transition-all border border-amber-500/30 active:scale-95 shadow-2xs cursor-pointer"
                                        title="使用 OSRM / TSP 演算法最佳化當日最短動線"
                                    >
                                        <Sparkles size={12} className="text-amber-500" />
                                        <span className="hidden sm:inline">動線最佳化</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 📱 編輯模式專屬 iOS 快捷工具列 (iOS Sub-Toolbar - 與動線最佳化完全分離，絕不重疊) */}
            {!isPrinting && isEditing && (
                <div className="px-3.5 sm:px-5 py-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-2 flex-wrap animate-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditDayBtnClick(itinerary);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-card border border-border/80 text-foreground text-xs font-semibold hover:bg-muted transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="編輯日程天數與主題"
                        >
                            <Pencil size={11} className="text-blue-500" />
                            <span>編輯資訊</span>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDayBtnClick(itinerary);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ml-auto"
                        title="新增活動"
                    >
                        <Plus size={13} />
                        <span>新增活動</span>
                    </button>
                </div>
            )}

            {/* --- Content (時間軸內容) --- */}
            {(isExpanded || isPrinting) && (
                <div
                    className={`relative ${
                        isPrinting
                            ? "pt-2 pb-2"
                            : "pb-6 pt-3 lg:flex-1 overflow-x-hidden lg:overflow-y-auto no-scrollbar"
                    }`}
                >
                    {/* 左側時間軸貫穿線 */}
                    <div className="absolute top-0 bottom-6 left-0 w-12 sm:w-14 flex justify-center pointer-events-none">
                        <div
                            className={`w-[2px] h-full ${
                                !isPrinting ? "bg-border/70" : "bg-gray-300"
                            }`}
                        />
                    </div>

                    <div className={isPrinting ? "space-y-2.5" : "space-y-4"}>
                        {Array.isArray(itinerary.activities) && itinerary.activities.length > 0 ? (
                            itinerary.activities.map((activity, idx) => {
                                const linkedPlace = activity.linkId ? placeMap[activity.linkId] : null;
                                const businessStatus = linkedPlace
                                    ? getBusinessStatus(linkedPlace.info?.open, linkedPlace.info?.closed_days)
                                    : null;
                                const firstRec = linkedPlace?.info?.recommended_items?.[0];
                                const detectedLang = linkedPlace
                                    ? detectLanguage(linkedPlace.info?.native_name, {
                                          address: linkedPlace.info?.loc,
                                          currency: linkedPlace.info?.price,
                                      })
                                    : null;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex group/item items-start ${
                                            isPrinting ? "min-h-0 break-inside-avoid" : "min-h-[40px]"
                                        }`}
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
                                        {/* 1. 左側軌道節點 (Timeline Node Icon) */}
                                        <div className="w-12 sm:w-14 shrink-0 flex justify-center items-start z-10 pt-1">
                                            {(() => {
                                                const IconComp = getCategoryIcon(activity.type);
                                                const bgColor =
                                                    theme?.categoryColor?.[activity.type] ||
                                                    DEFAULT_CATEGORY_COLORS[activity.type] ||
                                                    "#3b82f6";

                                                return (
                                                    <div
                                                        className={`flex items-center justify-center rounded-full shadow-xs text-white shrink-0 ${
                                                            !isPrinting
                                                                ? "w-6 h-6 sm:w-7 sm:h-7 ring-2 ring-background"
                                                                : "w-5 h-5 bg-black text-white"
                                                        }`}
                                                        style={{ backgroundColor: bgColor }}
                                                    >
                                                        <IconComp
                                                            size={isPrinting ? 10 : 13}
                                                            className="text-white drop-shadow-2xs"
                                                        />
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* 2. 右側活動卡片主體 (Activity Body) */}
                                        <div className="flex-1 min-w-0 pr-3 sm:pr-4 space-y-2">
                                            {/* 時間與停留標籤列 */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs sm:text-sm text-muted-foreground group-hover/item:text-foreground">
                                                        {activity.time}
                                                    </span>
                                                    {activity.duration && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 border border-blue-500/20">
                                                            <Hourglass size={9} />
                                                            <span>停留 {activity.duration}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 編輯 / 刪除工具按鈕 (在編輯模式下清晰可點擊，不需依賴 Hover) */}
                                                {!isPrinting && isEditing && (
                                                    <div className="flex items-center gap-1 p-0.5 bg-card/95 backdrop-blur-md rounded-full shadow-xs border border-border/80 shrink-0 transition-all">
                                                        <button
                                                            type="button"
                                                            onClick={() => onEditActivityBtnClick(itinerary, activity)}
                                                            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                                            title="編輯活動"
                                                        >
                                                            <Pencil size={11} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => onDeleteActivityBtnClick(itinerary, activity)}
                                                            className="p-1 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                            title="刪除活動"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 🌟 核心：有連結地點時，呈現 iOS 原生風格卡片 (點擊直接開啟地點預覽) */}
                                            {linkedPlace ? (
                                                <div
                                                    onClick={() => !isPrinting && onViewBtnClick(linkedPlace.id)}
                                                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                                                        !isPrinting
                                                            ? "bg-card border-border/80 hover:border-blue-500/50 hover:shadow-md cursor-pointer active:scale-[0.99] group/card shadow-2xs text-card-foreground"
                                                            : "bg-white border-gray-400 text-black font-[Noto_Sans_TC]"
                                                    }`}
                                                    title={!isPrinting ? "點擊查看地點詳細卡片" : undefined}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* 左側縮圖 */}
                                                        <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-muted border border-border/60 shadow-2xs">
                                                            {linkedPlace.image_url ? (
                                                                <img
                                                                    src={linkedPlace.image_url}
                                                                    alt={linkedPlace.name}
                                                                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                                                    <MapPin size={18} />
                                                                </div>
                                                            )}
                                                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 backdrop-blur-md text-[9px] text-white font-bold tracking-wider">
                                                                {getCategoryTypeName(linkedPlace.type)}
                                                            </span>
                                                        </div>

                                                        {/* 右側資訊 */}
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            {/* 標題與語音按鈕 */}
                                                            <div className="flex items-start justify-between gap-1">
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                                                                        isPrinting ? "text-black text-sm" : "text-foreground group-hover/card:text-blue-500 transition-colors"
                                                                    }`}>
                                                                        {linkedPlace.name}
                                                                    </h4>
                                                                    {(linkedPlace.eng_name || linkedPlace.info?.native_name) && (
                                                                        <p className={`text-[11px] font-mono truncate mt-0.5 ${
                                                                            isPrinting ? "text-gray-700" : "text-muted-foreground"
                                                                        }`}>
                                                                            {linkedPlace.eng_name}
                                                                            {linkedPlace.eng_name && linkedPlace.info?.native_name && " · "}
                                                                            {linkedPlace.info?.native_name}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {!isPrinting && linkedPlace.info?.native_name && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleSpeakPlace(linkedPlace, e)}
                                                                        className={`p-1 rounded-full hover:bg-muted text-blue-500 transition-colors shrink-0 cursor-pointer ${
                                                                            speakingId === linkedPlace.id ? "animate-pulse scale-110 text-amber-500" : ""
                                                                        }`}
                                                                        title={`發音 (${detectedLang?.name || ""})`}
                                                                    >
                                                                        <Volume2 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* 營業狀態 / 住宿時間 + 評分 */}
                                                            {linkedPlace && (
                                                                <div className={`flex items-center gap-2 flex-wrap text-[11px] ${
                                                                    isPrinting ? "text-black" : ""
                                                                }`}>
                                                                    {linkedPlace.type === "hotel" || linkedPlace.type === "stay" ? (
                                                                        !isPrinting ? (
                                                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                                                                🏨 入住 {linkedPlace.info?.check_in || "15:00"} · 退房 {linkedPlace.info?.check_out || "11:00"}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] text-gray-800 font-bold">
                                                                                入住：{linkedPlace.info?.check_in || "15:00"} / 退房：{linkedPlace.info?.check_out || "11:00"}
                                                                            </span>
                                                                        )
                                                                    ) : businessStatus ? (
                                                                        <>
                                                                            {linkedPlace.info?.open && !isPrinting && (
                                                                                <span className={`px-1.5 py-0.2 rounded font-extrabold text-[10px] ${businessStatus.badgeColor}`}>
                                                                                    {businessStatus.badgeText}
                                                                                </span>
                                                                            )}

                                                                            {linkedPlace.info?.open && isPrinting && (
                                                                                <span className="text-[10px] text-gray-800 font-bold">
                                                                                    營業時間：{businessStatus.allHoursSummary}
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : null}

                                                                    {linkedPlace.info?.rating && (
                                                                        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${
                                                                            isPrinting ? "text-black" : "text-amber-500"
                                                                        }`}>
                                                                            <Star size={10} className={isPrinting ? "text-black fill-black" : "fill-amber-400 text-amber-400"} />
                                                                            <span>{linkedPlace.info.rating}</span>
                                                                        </span>
                                                                    )}

                                                                    {firstRec && (
                                                                        <span className={`text-[10px] truncate max-w-[140px] font-medium hidden sm:inline-block ${
                                                                            isPrinting ? "text-black" : "text-rose-600 dark:text-rose-400"
                                                                        }`}>
                                                                            🍽️ {firstRec.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* 地址 */}
                                                            {linkedPlace.info?.loc && (
                                                                <div className={`flex items-center gap-1 text-[10px] truncate pt-0.5 ${
                                                                    isPrinting ? "text-black" : "text-muted-foreground"
                                                                }`}>
                                                                    <MapPin size={10} className={isPrinting ? "text-black shrink-0" : "text-rose-500 shrink-0"} />
                                                                    <span className="truncate">{linkedPlace.info.loc}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* 無連結地點時的自訂手動活動卡片 */
                                                <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                                                    isPrinting ? "bg-white border-gray-400 text-black" : "bg-card border-border/70 text-card-foreground shadow-2xs"
                                                }`}>
                                                    <h4 className={`font-bold text-sm ${
                                                        isPrinting ? "text-black" : "text-foreground"
                                                    }`}>
                                                        {activity.title}
                                                    </h4>
                                                    {activity.desc && (
                                                        <p className={`leading-relaxed text-xs ${
                                                            isPrinting ? "text-gray-800" : "text-muted-foreground"
                                                        }`}>
                                                            {activity.desc}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* 🚆 前往下一站的交通時間節點 (Transit Connector Card) */}
                                            {((activity.transitMode && activity.transitMode !== "none") || activity.transitDuration) && (
                                                <div
                                                    className={`mt-2 rounded-xl text-xs font-medium p-2.5 ${
                                                        isPrinting
                                                            ? "bg-gray-100 border border-gray-400 text-black text-[9px] font-bold"
                                                            : "bg-muted/30 border border-border/60 text-foreground"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div className="flex items-center gap-1.5 font-bold">
                                                            {(() => {
                                                                const TransitIconComp = getTransitIcon(activity.transitMode);
                                                                return (
                                                                    <TransitIconComp
                                                                        size={13}
                                                                        className={isPrinting ? "text-black shrink-0" : "text-blue-500 shrink-0"}
                                                                    />
                                                                );
                                                            })()}
                                                            <span>
                                                                {activity.transitDuration
                                                                    ? `路程約 ${activity.transitDuration}`
                                                                    : "前往下一站"}
                                                            </span>
                                                        </div>

                                                        {/* 詳細備註膠囊 */}
                                                        {activity.transitDetails?.companyAndLine && (
                                                            <span className={`text-[10px] px-2 py-0.2 rounded font-mono font-semibold ${
                                                                isPrinting ? "bg-gray-200 text-black border border-gray-400" : "bg-muted text-muted-foreground"
                                                            }`}>
                                                                {activity.transitDetails.companyAndLine}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex py-3">
                                <div className="w-12 sm:w-14 shrink-0" />
                                <p className="text-xs text-muted-foreground italic">
                                    尚無活動，點擊「新增活動」加入景點
                                </p>
                            </div>
                        )}

                        {/* 📱 編輯模式下，時間軸底部快速新增活動按鈕 */}
                        {!isPrinting && isEditing && Array.isArray(itinerary.activities) && itinerary.activities.length > 0 && (
                            <div className="flex pt-1 pb-1">
                                <div className="w-12 sm:w-14 shrink-0" />
                                <button
                                    type="button"
                                    onClick={() => onAddActivityBtnClick(itinerary)}
                                    className="flex-1 mr-3 sm:mr-4 py-2.5 rounded-2xl border border-dashed border-border hover:border-blue-500 bg-muted/20 hover:bg-blue-500/5 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
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
