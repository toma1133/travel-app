import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { getBrowserTimeZone, utcToLocal } from "../../utils/DateTimeUtil";
import {
    Navigation,
    Clock,
    ArrowRight,
    MapPin,
    ChevronDown,
    ChevronUp,
    Eye,
    CheckCircle2,
    Compass,
    Calendar,
    Footprints,
    Car,
    Train,
    Bus,
    Umbrella,
} from "lucide-react";
import type { ItineraryVM, ItineraryActivitiy } from "../../models/types/ItineraryTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf, TripVM } from "../../models/types/TripTypes";
import { computeDayTimelineSchedule, type ActivityScheduleMeta } from "../../utils/ItineraryTimeUtil";
import { openNavigation, getNavigationBadgeInfo } from "../../utils/NavigationUtil";
import { getWeatherInfoByCode, type DailyWeatherMap } from "../../services/weather/WeatherService";

export interface LiveTravelFocusCardProps {
    trip?: TripVM | null;
    itineraries: ItineraryVM[];
    placesMap: Record<string, PlaceVM>;
    weatherMap?: DailyWeatherMap;
    selectedDayId: string;
    onSelectDay: (dayId: string) => void;
    theme?: TripThemeConf | null;
    timeZone?: string;
}

export const LiveTravelFocusCard: React.FC<LiveTravelFocusCardProps> = ({
    trip,
    itineraries,
    placesMap,
    weatherMap = {},
    selectedDayId,
    onSelectDay,
    theme: _theme,
    timeZone = getBrowserTimeZone(),
}) => {
    // 即時時間更新 (每 30 秒更新一次時間字串)
    const [now, setNow] = useState(() => new Date().toISOString());
    const { date: currentDateStr } = utcToLocal(now, timeZone);

    // 展開/收合狀態 (預設展開)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date().toISOString());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    // 判斷今日是否在旅程期間中 (僅在旅程當天顯示 Live 焦點卡)
    const todayItinerary = useMemo(() => {
        if (!Array.isArray(itineraries) || itineraries.length === 0) return null;
        const instant = Date.parse(now);
        return itineraries.find(d => computeDayTimelineSchedule(d.activities, d).some(meta => meta.startAtMs <= instant && instant < meta.transit.arrivalAtMs))
            || itineraries.find(d => d.activities?.some(activity => (activity.is_utc ?? d.is_utc) && activity.time_date === currentDateStr))
            || itineraries.find(d => d.date === currentDateStr) || null;
    }, [itineraries, currentDateStr, now]);

    const activeDay = todayItinerary;

    // 取得當前日程的行程時間表運算結果
    const scheduleMetas = useMemo<ActivityScheduleMeta[]>(() => {
        if (!activeDay || !Array.isArray(activeDay.activities) || activeDay.activities.length === 0) {
            return [];
        }
        return computeDayTimelineSchedule(activeDay.activities, activeDay);
    }, [activeDay]);

    // 依當前時間計算「進行中 (NOW)」與「下一個目標 (NEXT)」
    const liveFocusState = useMemo(() => {
        if (scheduleMetas.length === 0) {
            return {
                status: "empty" as const,
                currentMeta: null,
                nextMeta: null,
                minutesToNext: null,
                progressPercent: 0,
            };
        }

        const nowMinutes = Date.parse(now) / 60000;
        const startMinutes = (meta: ActivityScheduleMeta) => meta.startAtMs / 60000;

        // 1. 旅程尚未開始 (現在時間比第一項活動早)
        const firstMeta = scheduleMetas[0];
        const firstStartMins = startMinutes(firstMeta);
        if (nowMinutes < firstStartMins) {
            const diff = firstStartMins - nowMinutes;
            return {
                status: "upcoming_first" as const,
                currentMeta: null,
                nextMeta: firstMeta,
                minutesToNext: diff,
                progressPercent: 0,
            };
        }

        // 2. 遍歷檢查是否有活動正在進行中
        for (let i = 0; i < scheduleMetas.length; i++) {
            const meta = scheduleMetas[i];
            const startMins = startMinutes(meta);
            const endMins = meta.endAtMs / 60000;
            const transitEndMins = meta.transit.arrivalAtMs / 60000;

            // 在活動停留時間內
            if (nowMinutes >= startMins && nowMinutes < endMins) {
                const totalStay = Math.max(1, endMins - startMins);
                const elapsed = nowMinutes - startMins;
                const progress = Math.min(100, Math.round((elapsed / totalStay) * 100));
                const next = scheduleMetas[i + 1] || null;
                const nextMins = next ? startMinutes(next) - nowMinutes : null;

                return {
                    status: "in_activity" as const,
                    currentMeta: meta,
                    nextMeta: next,
                    minutesToNext: nextMins,
                    progressPercent: progress,
                };
            }

            // 在前往下一站的路程或自由時間內
            if (nowMinutes >= endMins && nowMinutes < transitEndMins) {
                const next = scheduleMetas[i + 1] || null;
                const nextMins = next ? startMinutes(next) - nowMinutes : null;
                const totalTransit = Math.max(1, transitEndMins - endMins);
                const elapsed = nowMinutes - endMins;
                const progress = Math.min(100, Math.round((elapsed / totalTransit) * 100));

                return {
                    status: "in_transit" as const,
                    currentMeta: meta,
                    nextMeta: next,
                    minutesToNext: nextMins,
                    progressPercent: progress,
                };
            }

            // 若在此項結束與下一項開始之間的空檔 (Gap)
            const next = scheduleMetas[i + 1];
            if (next) {
                const nextStartMins = startMinutes(next);
                if (nowMinutes >= transitEndMins && nowMinutes < nextStartMins) {
                    const diff = nextStartMins - nowMinutes;
                    return {
                        status: "in_gap" as const,
                        currentMeta: meta,
                        nextMeta: next,
                        minutesToNext: diff,
                        progressPercent: 100,
                    };
                }
            }
        }

        // 3. 所有行程已結束 (現在時間已超過最後一項活動)
        const lastMeta = scheduleMetas[scheduleMetas.length - 1];
        return {
            status: "day_finished" as const,
            currentMeta: lastMeta,
            nextMeta: null,
            minutesToNext: null,
            progressPercent: 100,
        };
    }, [scheduleMetas, now]);

    if (!activeDay) return null;

    // 當前與下一項地標 PlaceVM
    const currentPlace = liveFocusState.currentMeta?.activity.linkId
        ? placesMap[liveFocusState.currentMeta.activity.linkId]
        : null;
    const nextPlace = liveFocusState.nextMeta?.activity.linkId
        ? placesMap[liveFocusState.nextMeta.activity.linkId]
        : null;

    // 當日氣象預報
    const dayWeather = weatherMap[activeDay.date];
    const weatherInfo = getWeatherInfoByCode(dayWeather?.weatherCode);
    const rainProb = dayWeather?.precipitationProbabilityMax ?? 0;
    const isHighRainRisk = rainProb >= 50;

    // 一鍵導航點擊處理
    const handleNavigate = (act?: ItineraryActivitiy | null, place?: PlaceVM | null) => {
        if (!act && !place) return;
        const name = place?.name || act?.title || "目的地";
        const loc = place?.info?.loc || "";
        const lat = place?.lat;
        const lng = place?.lng;
        openNavigation({ name, loc, lat, lng });
    };

    // 格式化倒數時間
    const formatRemainingCountdown = (mins: number | null) => {
        if (mins === null || mins <= 0) return "即將開始";
        if (mins < 60) return `約 ${mins} 分鐘後`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m === 0 ? `約 ${h} 小時後` : `約 ${h} 小時 ${m} 分後`;
    };

    const navBadge = getNavigationBadgeInfo({
        name: nextPlace?.name || liveFocusState.nextMeta?.activity.title || currentPlace?.name || "目的地",
    });

    // 交通圖示輔助
    const getTransitIcon = (mode?: string) => {
        switch (mode) {
            case "car":
            case "taxi":
                return <Car size={13} className="text-amber-500" />;
            case "train":
            case "subway":
                return <Train size={13} className="text-emerald-500" />;
            case "bus":
                return <Bus size={13} className="text-sky-500" />;
            default:
                return <Footprints size={13} className="text-blue-500" />;
        }
    };

    return (
        <div className="w-full relative overflow-hidden rounded-3xl glass-panel border border-primary/20 shadow-lg bg-gradient-to-br from-background/95 via-background/90 to-primary/5 dark:to-primary/10 transition-all duration-300">
            {/* 裝飾光暈 */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* 頂部資訊列 (Header & Status Badges) */}
            <div className="relative px-4 sm:px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-border/50 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Live 狀態指示標籤 */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-black tracking-wide">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span>LIVE NOW</span>
                    </div>

                    {/* 當前焦點日程標籤 */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-lg">
                            DAY {activeDay.day_number}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                            {activeDay.date ? moment(activeDay.date).format("M月D日") : ""} {activeDay.weekday}
                        </span>
                        {activeDay.title && (
                            <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[140px]">
                                · {activeDay.title}
                            </span>
                        )}
                    </div>
                </div>

                {/* 右側：即時天氣膠囊與收合按鈕 */}
                <div className="flex items-center gap-2 shrink-0">
                    {dayWeather && (
                        <div
                            className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-xs font-mono font-medium shadow-2xs"
                            title={`降雨機率: ${rainProb}%`}
                        >
                            <span>{weatherInfo.icon}</span>
                            <span className="text-[11px]">
                                {dayWeather.temperatureMin}°~{dayWeather.temperatureMax}°C
                            </span>
                            {rainProb > 20 && (
                                <span className={`text-[10px] font-bold ${isHighRainRisk ? "text-amber-500 font-extrabold" : "text-blue-500"}`}>
                                    💧{rainProb}%
                                </span>
                            )}
                        </div>
                    )}

                    {/* 收合/展開按鈕 */}
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title={isCollapsed ? "展開焦點卡" : "收合焦點卡"}
                    >
                        {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                    </button>
                </div>
            </div>

            {/* 收合狀態只顯示單行進度精簡摘要 */}
            {isCollapsed ? (
                <div className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                        <MapPin size={14} className="text-primary shrink-0" />
                        <span className="font-bold truncate">
                            {liveFocusState.currentMeta?.activity.title || "目前行程準備中"}
                        </span>
                        {liveFocusState.nextMeta && (
                            <span className="text-muted-foreground text-[11px] truncate flex items-center gap-1">
                                <ArrowRight size={11} /> 下一站: {liveFocusState.nextMeta.activity.title}
                            </span>
                        )}
                    </div>
                    {liveFocusState.nextMeta && (
                        <button
                            type="button"
                            onClick={() => handleNavigate(liveFocusState.nextMeta?.activity, nextPlace)}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] shadow-xs cursor-pointer active:scale-95"
                        >
                            <Navigation size={11} />
                            <span>導航下一站</span>
                        </button>
                    )}
                </div>
            ) : (
                /* 展開狀態：完整的 NOW & NEXT 流體焦點卡 */
                <div className="relative p-4 sm:p-5 space-y-4">
                    {/* 高降雨提醒條 */}
                    {isHighRainRisk && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs">
                            <div className="flex items-center gap-1.5">
                                <Umbrella size={14} className="text-amber-600 dark:text-amber-400" />
                                <span>
                                    <strong>降雨提醒 ({rainProb}%)：</strong>今日降雨機率高，出門請備妥雨具或隨時切換室內備案。
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 活動為空的情境 */}
                    {liveFocusState.status === "empty" && (
                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground">
                            <Calendar size={28} className="opacity-40" />
                            <p className="text-xs sm:text-sm font-medium">DAY {activeDay.day_number} 目前尚未安排任何活動</p>
                            <button
                                type="button"
                                onClick={() => onSelectDay(activeDay.id)}
                                className="text-xs font-bold text-primary hover:underline cursor-pointer"
                            >
                                點此前往新增活動
                            </button>
                        </div>
                    )}

                    {/* 活動即將開始 (清晨 / 行程前) */}
                    {liveFocusState.status === "upcoming_first" && liveFocusState.nextMeta && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col justify-center space-y-2 p-3.5 rounded-2xl bg-primary/5 border border-primary/10">
                                <span className="text-[11px] font-bold tracking-wider uppercase text-primary flex items-center gap-1">
                                    <Clock size={12} /> 今日首站即將啟程
                                </span>
                                <h4 className="text-base sm:text-lg font-black text-foreground">
                                    {liveFocusState.nextMeta.activity.title}
                                </h4>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span>預計 {liveFocusState.nextMeta.startTime} 開始</span>
                                    <span>·</span>
                                    <span className="font-bold text-primary">
                                        {formatRemainingCountdown(liveFocusState.minutesToNext)}
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                                {nextPlace && (
                                    <div className="text-right hidden sm:block">
                                        <div className="text-xs font-bold text-foreground truncate max-w-[200px]">
                                            {nextPlace.name}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                            {nextPlace.info?.loc || "地標準備就緒"}
                                        </div>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleNavigate(liveFocusState.nextMeta?.activity, nextPlace)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                                >
                                    <Navigation size={15} />
                                    <span>一鍵導航出發 ({navBadge.appName})</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 進行中 (IN_ACTIVITY) 或 移動中 (IN_TRANSIT) 或 空檔 (IN_GAP) */}
                    {(liveFocusState.status === "in_activity" ||
                        liveFocusState.status === "in_transit" ||
                        liveFocusState.status === "in_gap") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 左側：📍 NOW 當前狀態 */}
                            <div className="p-4 rounded-2xl bg-card/70 border border-border/60 shadow-xs flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-400 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            NOW 當前位置
                                        </span>
                                        <span className="text-[11px] font-mono font-bold text-muted-foreground">
                                            {liveFocusState.currentMeta?.startTime} ~ {liveFocusState.currentMeta?.endTime}
                                        </span>
                                    </div>

                                    <h4 className="text-base sm:text-lg font-black text-foreground truncate">
                                        {liveFocusState.currentMeta?.activity.title}
                                    </h4>

                                    {currentPlace && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                            <MapPin size={11} className="shrink-0 text-primary" />
                                            <span className="truncate">{currentPlace.name}</span>
                                            {currentPlace.info?.open && (
                                                <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground shrink-0 ml-1">
                                                    營業: {currentPlace.info.open}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* 進度條與狀態提示 */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground">
                                            {liveFocusState.status === "in_activity"
                                                ? `預計停留至 ${liveFocusState.currentMeta?.endTime}`
                                                : "正在前往下一站或移動中"}
                                        </span>
                                        <span className="font-mono font-bold text-primary">
                                            {liveFocusState.progressPercent}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${liveFocusState.progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* 當前地標導航備案 */}
                                {currentPlace && (
                                    <button
                                        type="button"
                                        onClick={() => handleNavigate(liveFocusState.currentMeta?.activity, currentPlace)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit"
                                    >
                                        <Compass size={12} />
                                        <span>查看當前地標路線</span>
                                    </button>
                                )}
                            </div>

                            {/* 右側：🎯 NEXT 下一個目標 */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-card/60 to-primary/10 border border-primary/20 shadow-xs flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                                            <ArrowRight size={12} />
                                            NEXT 下一個目標
                                        </span>
                                        {liveFocusState.nextMeta && (
                                            <span className="text-[11px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                {formatRemainingCountdown(liveFocusState.minutesToNext)}
                                            </span>
                                        )}
                                    </div>

                                    {liveFocusState.nextMeta ? (
                                        <>
                                            <h4 className="text-base sm:text-lg font-black text-foreground truncate">
                                                {liveFocusState.nextMeta.activity.title}
                                            </h4>

                                            <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Clock size={12} className="shrink-0" />
                                                    <span>預計抵達：{liveFocusState.nextMeta.startTime}</span>
                                                    {liveFocusState.nextMeta.activity.duration && (
                                                        <span className="text-muted-foreground/80">
                                                            (預計停留 {liveFocusState.nextMeta.activity.duration})
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 交通接駁說明 */}
                                                {liveFocusState.currentMeta?.transit.hasTransit && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                                                        {getTransitIcon(liveFocusState.currentMeta.transit.mode)}
                                                        <span>
                                                            交通：{liveFocusState.currentMeta.transit.durationFormatted || "路線移動"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-2 text-xs text-muted-foreground">
                                            這是今日最後一項行程，完成後即可放鬆休息！
                                        </div>
                                    )}
                                </div>

                                {/* 一鍵導航按鈕 */}
                                {liveFocusState.nextMeta ? (
                                    <button
                                        type="button"
                                        onClick={() => handleNavigate(liveFocusState.nextMeta?.activity, nextPlace)}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Navigation size={14} />
                                        <span>立即導航前往下一站 ({navBadge.appName})</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                        <CheckCircle2 size={14} />
                                        <span>即將圓滿結束今日行程</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 今日行程已結束 (DAY_FINISHED) */}
                    {liveFocusState.status === "day_finished" && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                            <div className="inline-flex p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
                                <CheckCircle2 size={24} />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-foreground">
                                DAY {activeDay.day_number} 行程已圓滿完成！🎉
                            </h4>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                今日共完成了 {scheduleMetas.length} 項活動，好好放鬆休息，明天繼續探索新冒險！
                            </p>
                            {itineraries.some((d) => d.day_number === activeDay.day_number + 1) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextDay = itineraries.find((d) => d.day_number === activeDay.day_number + 1);
                                        if (nextDay) {
                                            onSelectDay(nextDay.id);
                                        }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                                >
                                    <Eye size={13} />
                                    <span>預覽明天 (DAY {activeDay.day_number + 1}) 行程</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LiveTravelFocusCard;
