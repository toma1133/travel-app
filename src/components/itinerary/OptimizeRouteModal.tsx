import React, { useState, useEffect, useMemo } from "react";
import {
    X,
    Sparkles,
    Navigation,
    Car,
    Footprints,
    Bike,
    Clock,
    ArrowRight,
    Check,
    RotateCcw,
    MapPin,
    AlertCircle,
    Info,
    Pin,
    PinOff,
    Lock,
    Bed,
} from "lucide-react";
import {
    RoutingService,
    RouteMode,
    TripOptimizationResult,
    formatDuration,
    formatDistance,
} from "../../services/api/RoutingService";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type ActivityWithLocation = {
    activity: ItineraryActivitiy;
    place?: PlaceVM;
    lat: number;
    lng: number;
    originalIndex: number;
};

type OptimizeRouteModalProps = {
    itineraryDay: ItineraryVM;
    placesMap: Map<string, PlaceVM>;
    theme?: TripThemeConf | null;
    onClose: () => void;
    onApplyOptimizedOrder: (
        itineraryDay: ItineraryVM,
        reorderedActivities: ItineraryActivitiy[]
    ) => void;
};

const isActivityHotelOrReservation = (act: ItineraryActivitiy, p?: PlaceVM) => {
    if (act.isFixed) return true;
    const cat = (p?.type || act.type || "").toLowerCase();
    const title = (p?.name || act.title || "").toLowerCase();
    const isHotel =
        cat === "hotel" ||
        cat === "lodging" ||
        cat === "stay" ||
        title.includes("飯店") ||
        title.includes("酒店") ||
        title.includes("民宿") ||
        title.includes("check-in") ||
        title.includes("checkin") ||
        title.includes("旅館");
    return isHotel || act.fixedReason === "reservation" || act.fixedReason === "hotel";
};

const OptimizeRouteModal = ({
    itineraryDay,
    placesMap,
    theme,
    onClose,
    onApplyOptimizedOrder,
}: OptimizeRouteModalProps) => {
    const [mode, setMode] = useState<RouteMode>("driving");
    const [fixStart, setFixStart] = useState<boolean>(true);
    const [fixEnd, setFixEnd] = useState<boolean>(false);
    const [roundtrip, setRoundtrip] = useState<boolean>(false);

    const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
    const [result, setResult] = useState<TripOptimizationResult | null>(null);

    // Extract activities that have valid coordinates
    const locActivities: ActivityWithLocation[] = useMemo(() => {
        if (!Array.isArray(itineraryDay.activities)) return [];
        const list: ActivityWithLocation[] = [];

        itineraryDay.activities.forEach((act, idx) => {
            let lat: number | null = null;
            let lng: number | null = null;
            let p: PlaceVM | undefined = undefined;

            if (act.linkId && placesMap.has(act.linkId)) {
                p = placesMap.get(act.linkId);
                if (typeof p?.lat === "number" && typeof p?.lng === "number") {
                    lat = p.lat;
                    lng = p.lng;
                }
            }

            if (lat !== null && lng !== null) {
                list.push({
                    activity: act,
                    place: p,
                    lat,
                    lng,
                    originalIndex: idx,
                });
            }
        });

        return list;
    }, [itineraryDay.activities, placesMap]);

    // Track user-pinned fixed stops (indices in locActivities)
    const [fixedIndices, setFixedIndices] = useState<Set<number>>(() => {
        const set = new Set<number>();
        locActivities.forEach((item, idx) => {
            if (item.activity.isFixed || isActivityHotelOrReservation(item.activity, item.place)) {
                set.add(idx);
            }
        });
        return set;
    });

    const toggleFixedIndex = (idx: number) => {
        setFixedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    // Run optimization whenever mode, constraints, or fixed pins change
    useEffect(() => {
        if (locActivities.length < 2) {
            setResult(null);
            return;
        }

        let isMounted = true;
        setIsOptimizing(true);

        const runOpt = async () => {
            const stops = locActivities.map((item) => ({
                lat: item.lat,
                lng: item.lng,
            }));

            const optResult = await RoutingService.optimizeDayItinerary(stops, {
                mode,
                fixStart,
                fixEnd,
                roundtrip,
                fixedIndices: Array.from(fixedIndices),
            });

            if (isMounted) {
                setResult(optResult);
                setIsOptimizing(false);
            }
        };

        runOpt();

        return () => {
            isMounted = false;
        };
    }, [locActivities, mode, fixStart, fixEnd, roundtrip, fixedIndices]);

    // Map new optimized activities array
    const reorderedActivities = useMemo(() => {
        if (!itineraryDay.activities) return [];
        if (!result || !result.optimizedOrder || result.optimizedOrder.length === 0) {
            return itineraryDay.activities;
        }

        // Map locActivities into new order with updated isFixed property
        const optimizedLocActivities = result.optimizedOrder.map((optIdx) => {
            const act = locActivities[optIdx].activity;
            return {
                ...act,
                isFixed: fixedIndices.has(optIdx),
            };
        });

        // For activities without coordinates, append them or maintain relative positions
        const nonLocActivities = itineraryDay.activities.filter(
            (act) => !locActivities.some((la) => la.activity === act)
        );

        const finalOrder = [...optimizedLocActivities, ...nonLocActivities].map(
            (act, idx) => ({
                ...act,
                activityIndex: idx,
            })
        );

        return finalOrder;
    }, [itineraryDay.activities, locActivities, result, fixedIndices]);

    const handleApply = () => {
        onApplyOptimizedOrder(itineraryDay, reorderedActivities);
        onClose();
    };

    const hasSavings = result && (result.savedDistanceKm > 0.05 || result.savedDurationMinutes > 1);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl max-h-[92vh] bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* 📱 iOS 原生導航列 */}
                <div className="px-4 py-3 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1"
                    >
                        取消
                    </button>

                    <div className="text-center min-w-0">
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="font-black text-sm text-foreground tracking-tight">
                                當日動線最佳化
                            </span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-bold">
                                DAY {itineraryDay.day_number}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground hidden sm:block">
                            透過 OSRM 路網與 TSP 演算法消除折返跑，自動計算最短路徑
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={locActivities.length < 2 || isOptimizing}
                        onClick={handleApply}
                        className="text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                        套用順序
                    </button>
                </div>

                {/* 內容區塊 */}
                <div className="p-3.5 sm:p-5 overflow-y-auto no-scrollbar space-y-4 flex-1">
                    {/* 條件設定控制列 */}
                    <div className="bg-muted/40 p-3 sm:p-4 rounded-2xl border border-border/60 space-y-3">
                        <div className="space-y-3">
                            {/* 交通方式 (RWD: 2x2 grid on mobile, 4-col on desktop) */}
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                                    移動交通方式
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-background p-1.5 rounded-2xl sm:rounded-xl border border-border shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setMode("driving")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl sm:rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "driving"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                    >
                                        <Car size={13} />
                                        <span>開車</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("motorcycle")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl sm:rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "motorcycle"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                    >
                                        <Navigation size={13} />
                                        <span>機車</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("cycling")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl sm:rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "cycling"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                    >
                                        <Bike size={13} />
                                        <span>單車</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("walking")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl sm:rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "walking"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                    >
                                        <Footprints size={13} />
                                        <span>步行</span>
                                    </button>
                                </div>
                            </div>

                            {/* 起終點約束 (RWD: 2 columns / card touch targets) */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase block">
                                    路線起終點設定
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <label className="flex items-center gap-2 p-2 rounded-xl bg-background/70 border border-border/50 hover:border-primary/40 cursor-pointer text-foreground select-none transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={fixStart}
                                            onChange={(e) => setFixStart(e.target.checked)}
                                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer shrink-0"
                                        />
                                        <span className="font-medium">固定第 1 站為出發點</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-2 rounded-xl bg-background/70 border border-border/50 hover:border-primary/40 cursor-pointer text-foreground select-none transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={fixEnd}
                                            onChange={(e) => {
                                                setFixEnd(e.target.checked);
                                                if (e.target.checked) setRoundtrip(false);
                                            }}
                                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer shrink-0"
                                        />
                                        <span className="font-medium">固定最後 1 站為終點</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 地點不足提示 */}
                    {locActivities.length < 2 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
                            <AlertCircle size={18} className="shrink-0 text-amber-500" />
                            <span>當日行程需要至少 2 個包含位置座標的景點活動才能進行路徑最佳化分析。</span>
                        </div>
                    )}

                    {/* 最佳化效益看板 */}
                    {isOptimizing ? (
                        <div className="p-6 sm:p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center gap-3">
                            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span className="text-xs text-muted-foreground font-mono font-medium">
                                正在透過 OSRM 求解最佳路線矩陣...
                            </span>
                        </div>
                    ) : result ? (
                        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 p-3.5 sm:p-5 rounded-2xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                                <div>
                                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                                        最佳化效果預測
                                    </span>
                                    <h3 className="text-sm sm:text-lg font-bold text-foreground mt-0.5 leading-snug">
                                        {hasSavings ? (
                                            <>
                                                預計為您節省{" "}
                                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                                                    {result.savedDurationFormatted}
                                                </span>
                                                、減少{" "}
                                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                                                    {result.savedDistanceFormatted}
                                                </span>{" "}
                                                車程
                                            </>
                                        ) : (
                                            "當前行程已為最短最佳路線！"
                                        )}
                                    </h3>
                                </div>
                                <div className="sm:text-right bg-background/50 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border border-border/30 sm:border-0 flex items-center justify-between sm:block">
                                    <span className="text-[11px] sm:text-xs text-muted-foreground block">
                                        最佳化後總路程
                                    </span>
                                    <div>
                                        <span className="text-base sm:text-lg font-mono font-black text-foreground">
                                            {result.optimizedDistanceFormatted}
                                        </span>
                                        <span className="text-[11px] sm:text-xs text-muted-foreground ml-1.5">
                                            ({result.optimizedDurationFormatted})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 數據對比條 */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-emerald-500/20 text-xs font-mono">
                                <div className="bg-background/60 p-2.5 rounded-xl border border-border/40">
                                    <span className="text-muted-foreground block text-[10px] sm:text-[11px]">調整前</span>
                                    <span className="font-bold text-foreground text-[11px] sm:text-xs block truncate">
                                        {result.originalDistanceFormatted} ({result.originalDurationFormatted})
                                    </span>
                                </div>
                                <div className="bg-emerald-500/15 p-2.5 rounded-xl border border-emerald-500/30">
                                    <span className="text-emerald-700 dark:text-emerald-300 block text-[10px] sm:text-[11px] font-bold">
                                        調整後 (最佳)
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs block truncate">
                                        {result.optimizedDistanceFormatted} ({result.optimizedDurationFormatted})
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* 順序變更預覽清單 */}
                    {result && locActivities.length >= 2 && (
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase">
                                    動線排序對比 (共 {locActivities.length} 個地點)
                                </h4>
                                <span className="text-[10px] sm:text-[11px] font-normal text-muted-foreground">
                                    點擊 📌 可鎖定或解除固定點
                                </span>
                            </div>

                            {/* 錨點分段提示卡片 */}
                            {fixedIndices.size > 0 && (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs">
                                    <Pin size={14} className="shrink-0 text-amber-500 fill-amber-500" />
                                    <span className="font-medium leading-relaxed">
                                        已釘選 <strong>{fixedIndices.size}</strong> 個固定站點（如飯店放行李、特定預約），系統自動以分段演算法保留其關鍵順序，僅最佳化各區間景點。
                                    </span>
                                </div>
                            )}

                            <div className="space-y-2">
                                {result.optimizedOrder.map((origIdx, newIndex) => {
                                    const item = locActivities[origIdx];
                                    const isMoved = origIdx !== newIndex;
                                    const isFixed = fixedIndices.has(origIdx);
                                    const isHotel = isActivityHotelOrReservation(item.activity, item.place);

                                    return (
                                        <div
                                            key={newIndex}
                                            className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 sm:gap-3 ${
                                                isFixed
                                                    ? "bg-amber-500/5 border-amber-500/35 shadow-2xs"
                                                    : isMoved
                                                    ? "bg-emerald-500/5 border-emerald-500/40 shadow-2xs"
                                                    : "bg-card border-border/80"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                {/* 順序徽章 */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center ${
                                                        isFixed
                                                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                                            : "bg-primary/10 text-primary"
                                                    }`}>
                                                        {newIndex + 1}
                                                    </span>
                                                    {isMoved && (
                                                        <span className="text-[10px] text-muted-foreground line-through font-mono">
                                                            ({origIdx + 1})
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 景點名稱與時間 */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <h5 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                                            {item.activity.title}
                                                        </h5>
                                                        {isHotel && (
                                                            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                                                                <Bed size={9} /> 飯店/住宿
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-mono">
                                                        <span className="shrink-0">{item.activity.time}</span>
                                                        {item.place?.info?.loc && (
                                                            <>
                                                                <span className="shrink-0">•</span>
                                                                <span className="truncate max-w-[130px] sm:max-w-[240px]">
                                                                    {item.place.info.loc}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 操作區：釘選按鈕與狀態標籤 */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFixedIndex(origIdx)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                        isFixed
                                                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-transparent"
                                                    }`}
                                                    title={isFixed ? "點擊解除固定" : "點擊鎖定此站（不參與順序重排）"}
                                                >
                                                    <Pin size={11} className={isFixed ? "fill-amber-500 text-amber-600" : ""} />
                                                    <span className="text-[10px] sm:text-[11px]">
                                                        {isFixed ? "已固定" : "固定"}
                                                    </span>
                                                </button>

                                                {/* 狀態標籤 */}
                                                {isFixed ? (
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 whitespace-nowrap">
                                                        鎖定站點
                                                    </span>
                                                ) : isMoved ? (
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                                                        順序已優化
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 whitespace-nowrap">
                                                        順序不變
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OptimizeRouteModal;
