import React, { useState } from "react";
import {
    Pencil,
    Trash2,
    Star,
    Clock,
    Volume2,
    AlertTriangle,
    MapPin,
    Pin,
} from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../../models/types/ItineraryTypes";
import type { PlaceVM } from "../../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../../models/types/TripTypes";
import {
    getCategoryIcon,
    getCategoryTypeName,
    DEFAULT_CATEGORY_COLORS,
} from "../../../constants/Categories";
import { detectLanguage, playPronunciation } from "../../../utils/SpeechLanguageUtil";
import BusinessStatusBadge from "./BusinessStatusBadge";

type ActivityTimelineCardProps = {
    itineraryDay: ItineraryVM;
    activity: ItineraryActivitiy;
    activityIndex: number;
    startTime: string;
    hasStayDuration: boolean;
    durationFormatted?: string;
    linkedPlace?: PlaceVM | null;
    theme: TripThemeConf | null;
    isEditing: boolean;
    isPrinting?: boolean;
    isDelayedFromPrev?: boolean;
    delayFromPrevMinutes?: number;
    prevArrivalTime?: string;
    currentPlaceIndex?: number | null;
    onViewClick: (linkId: string, activity?: ItineraryActivitiy) => void;
    onEditClick?: (itineraryDay: ItineraryVM, activity: ItineraryActivitiy) => void;
    onDeleteClick?: (itineraryDay: ItineraryVM, activity: ItineraryActivitiy) => void;
    onPlaceHover?: (linkId: string | null, placeIndex?: number | null) => void;
};

export const ActivityTimelineCard: React.FC<ActivityTimelineCardProps> = ({
    itineraryDay,
    activity,
    activityIndex,
    startTime,
    hasStayDuration,
    durationFormatted,
    linkedPlace,
    theme,
    isEditing,
    isPrinting = false,
    isDelayedFromPrev = false,
    delayFromPrevMinutes = 0,
    prevArrivalTime,
    currentPlaceIndex,
    onViewClick,
    onEditClick,
    onDeleteClick,
    onPlaceHover,
}) => {
    const [speaking, setSpeaking] = useState(false);

    const hasGps = !!(
        linkedPlace &&
        typeof linkedPlace.lat === "number" &&
        typeof linkedPlace.lng === "number" &&
        !isNaN(linkedPlace.lat) &&
        !isNaN(linkedPlace.lng)
    );

    const handleMouseEnterOrTouch = () => {
        if (!onPlaceHover) return;
        if (hasGps && linkedPlace && typeof currentPlaceIndex === "number") {
            onPlaceHover(linkedPlace.id, currentPlaceIndex);
        } else {
            onPlaceHover(null, null);
        }
    };

    const handleMouseLeave = () => {
        if (onPlaceHover) {
            onPlaceHover(null, null);
        }
    };

    const handleSpeak = (place: PlaceVM, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!place.info?.native_name) return;
        playPronunciation(place.info.native_name, {
            context: {
                address: place.info?.loc,
                mapUrl: place.map_url,
                currency: place.info?.price,
            },
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: () => setSpeaking(false),
        });
    };

    const detectedLang = linkedPlace
        ? detectLanguage(linkedPlace.info?.native_name, {
              address: linkedPlace.info?.loc,
              currency: linkedPlace.info?.price,
          })
        : null;

    const IconComp = getCategoryIcon(activity.type);
    const bgColor =
        theme?.categoryColor?.[activity.type] ||
        DEFAULT_CATEGORY_COLORS[activity.type] ||
        "#3b82f6";

    return (
        <div
            className={`flex group/item items-start ${
                isPrinting ? "break-inside-avoid min-h-0" : "min-h-[44px]"
            }`}
            onMouseEnter={handleMouseEnterOrTouch}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseEnterOrTouch}
        >
            {/* 左側時間軸節點 (時間點 + 類別圖標) */}
            <div className="w-12 sm:w-14 shrink-0 flex flex-col items-center justify-start z-10 pt-1">
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
                <span
                    className={`font-mono font-bold text-[10px] sm:text-xs mt-1 text-center tracking-tight ${
                        isPrinting
                            ? "text-black"
                            : isDelayedFromPrev
                            ? "text-rose-600 dark:text-rose-400 font-extrabold"
                            : "text-muted-foreground group-hover/item:text-foreground transition-colors"
                    }`}
                >
                    {startTime}
                    {(activity.is_utc ?? itineraryDay.is_utc) && activity.time_date && activity.time_date !== itineraryDay.date &&
                        <span className="block text-[10px] font-normal">{activity.time_date}</span>}
                </span>
            </div>

            {/* 右側卡片主體 (Liquid Glass 極簡質感) */}
            <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                {linkedPlace ? (
                    <div
                        onClick={() => !isPrinting && onViewClick(linkedPlace.id, activity)}
                        className={`
                            group/card relative transition-all duration-200
                            ${
                                !isPrinting
                                    ? "glass-panel liquid-glass-interactive rounded-2xl p-2.5 sm:p-3 cursor-pointer active:scale-[0.99] hover:shadow-md hover:border-primary/30"
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

                            {/* 地標資訊主幹 */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                                {/* 頂部：標題 + 評分 + 固定站 + 動作按鈕 */}
                                <div className="flex items-start justify-between gap-1.5">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <h4
                                                className={`text-xs sm:text-sm font-bold truncate leading-snug tracking-tight ${
                                                    isPrinting
                                                        ? "text-black"
                                                        : "text-foreground group-hover/card:text-primary transition-colors"
                                                }`}
                                            >
                                                {linkedPlace.name}
                                            </h4>

                                            {/* 評分 */}
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

                                            {/* 動線固定站點標籤 */}
                                            {activity.isFixed && (
                                                <span
                                                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                                        isPrinting
                                                            ? "text-black border border-black/30"
                                                            : "text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30"
                                                    }`}
                                                    title="動線固定站點（自動規劃時保持在此順序）"
                                                >
                                                    <Pin size={9} className={isPrinting ? "text-black" : "fill-amber-500 text-amber-600"} />
                                                    <span>固定站</span>
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
                                                onClick={(e) => handleSpeak(linkedPlace, e)}
                                                className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-blue-500 transition-colors cursor-pointer ${
                                                    speaking
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
                                                        onEditClick?.(itineraryDay, {
                                                            ...activity,
                                                            activityIndex: activity.activityIndex ?? activityIndex,
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
                                                        onDeleteClick?.(itineraryDay, {
                                                            ...activity,
                                                            activityIndex: activity.activityIndex ?? activityIndex,
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

                                {/* 資訊與營業狀態列 */}
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.05] dark:border-white/[0.06] text-[10px] sm:text-[11px]">
                                    <BusinessStatusBadge
                                        place={linkedPlace}
                                        activityTime={activity.time}
                                        itineraryDate={activity.time_date || itineraryDay.date}
                                        isPrinting={isPrinting}
                                    />

                                    {/* 停留時間標籤 */}
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

                                {/* 底層：備註與延遲警示 */}
                                {((activity.desc && activity.desc !== linkedPlace.eng_name && activity.desc !== linkedPlace.info?.native_name) || (!isPrinting && isDelayedFromPrev)) && (
                                    <div className="pt-0.5 flex flex-col gap-1">
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

                                        {!isPrinting && isDelayedFromPrev && (
                                            <div
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-fit"
                                                title={`前一站預計抵達時間為 ${prevArrivalTime}`}
                                            >
                                                <AlertTriangle size={10} className="shrink-0 text-rose-500" />
                                                <span>前站預計 {prevArrivalTime} 抵達（延誤約 {delayFromPrevMinutes} 分）</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 無連結地點時的自訂手動活動卡片 (Liquid Glass) */
                    <div
                        onClick={() => !isPrinting && onViewClick(activity.linkId || "", activity)}
                        className={`
                            group/card relative transition-all duration-200
                            ${
                                !isPrinting
                                    ? "glass-panel liquid-glass-interactive text-card-foreground shadow-2xs rounded-2xl p-2.5 sm:p-3 cursor-pointer active:scale-[0.99] hover:shadow-md hover:border-primary/30"
                                    : "bg-white border border-gray-300 text-black p-2.5 sm:p-3 rounded-2xl break-inside-avoid shadow-none"
                            }
                        `}
                        title={!isPrinting ? "點擊查看活動詳細內容" : undefined}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <h4 className={`font-bold text-xs sm:text-sm truncate transition-colors ${
                                    isPrinting
                                        ? "text-black"
                                        : "text-foreground group-hover/card:text-primary"
                                }`}>
                                    {activity.title}
                                </h4>
                                {activity.isFixed && (
                                    <span
                                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                            isPrinting
                                                ? "text-black border border-black/30"
                                                : "text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30"
                                        }`}
                                        title="動線固定站點（自動規劃時保持在此順序）"
                                    >
                                        <Pin size={9} className={isPrinting ? "text-black" : "fill-amber-500 text-amber-600"} />
                                        <span>固定站</span>
                                    </span>
                                )}
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
                                {!isPrinting && isDelayedFromPrev && (
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                        title={`前一站預計抵達時間為 ${prevArrivalTime}`}
                                    >
                                        <AlertTriangle size={9} className="shrink-0" />
                                        <span>前站預計 {prevArrivalTime} 抵達</span>
                                    </span>
                                )}
                            </div>

                            {!isPrinting && isEditing && (
                                <div className="flex items-center gap-0.5 p-0.5 glass-pill rounded-full shrink-0">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditClick?.(itineraryDay, {
                                                ...activity,
                                                activityIndex: activity.activityIndex ?? activityIndex,
                                            });
                                        }}
                                        className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title="編輯活動"
                                    >
                                        <Pencil size={11} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteClick?.(itineraryDay, {
                                                ...activity,
                                                activityIndex: activity.activityIndex ?? activityIndex,
                                            });
                                        }}
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
    );
};

export default ActivityTimelineCard;
