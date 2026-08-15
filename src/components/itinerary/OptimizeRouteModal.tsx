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

    // Run optimization whenever mode or constraints change
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
    }, [locActivities, mode, fixStart, fixEnd, roundtrip]);

    // Map new optimized activities array
    const reorderedActivities = useMemo(() => {
        if (!itineraryDay.activities) return [];
        if (!result || !result.optimizedOrder || result.optimizedOrder.length === 0) {
            return itineraryDay.activities;
        }

        // Map locActivities into new order
        const optimizedLocActivities = result.optimizedOrder.map(
            (optIdx) => locActivities[optIdx].activity
        );

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
    }, [itineraryDay.activities, locActivities, result]);

    const handleApply = () => {
        onApplyOptimizedOrder(itineraryDay, reorderedActivities);
        onClose();
    };

    const hasSavings = result && (result.savedDistanceKm > 0.05 || result.savedDurationMinutes > 1);

    return (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl max-h-[90vh] bg-card text-foreground rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 頂部標題 */}
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <span>當日路線最短動線最佳化</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                                    DAY {itineraryDay.day_number}
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                透過 OSRM 路網與 TSP 演算法消除折返跑，自動計算最順暢的走法
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                        title="關閉"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 內容區塊 */}
                <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-5 flex-1">
                    {/* 條件設定控制列 */}
                    <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            {/* 交通方式 */}
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                                    移動交通方式
                                </label>
                                <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setMode("driving")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "driving"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Car size={13} />
                                        <span>開車</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("motorcycle")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "motorcycle"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Navigation size={13} />
                                        <span>機車</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("cycling")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "cycling"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Bike size={13} />
                                        <span>單車</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("walking")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            mode === "walking"
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Footprints size={13} />
                                        <span>步行</span>
                                    </button>
                                </div>
                            </div>

                            {/* 起終點約束 */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase block">
                                    路線起終點設定
                                </label>
                                <div className="flex items-center gap-4 flex-wrap text-xs">
                                    <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                                        <input
                                            type="checkbox"
                                            checked={fixStart}
                                            onChange={(e) => setFixStart(e.target.checked)}
                                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                        />
                                        <span>固定第 1 站為出發點</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-foreground select-none">
                                        <input
                                            type="checkbox"
                                            checked={fixEnd}
                                            onChange={(e) => {
                                                setFixEnd(e.target.checked);
                                                if (e.target.checked) setRoundtrip(false);
                                            }}
                                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                        />
                                        <span>固定最後 1 站為終點</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 地點不足提示 */}
                    {locActivities.length < 2 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
                            <AlertCircle size={18} className="shrink-0 text-amber-500" />
                            <span>當日行程需要至少 2 個包含位置座標的景點活動才能進行路徑最佳化分析。</span>
                        </div>
                    )}

                    {/* 最佳化效益看板 */}
                    {isOptimizing ? (
                        <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center gap-3">
                            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span className="text-xs text-muted-foreground font-mono font-medium">
                                正在透過 OSRM 求解最佳路線矩陣...
                            </span>
                        </div>
                    ) : result ? (
                        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 p-4 sm:p-5 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                                        最佳化效果預測
                                    </span>
                                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
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
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground block">
                                        最佳化後總路程
                                    </span>
                                    <span className="text-lg font-mono font-black text-foreground">
                                        {result.optimizedDistanceFormatted}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-1.5">
                                        ({result.optimizedDurationFormatted})
                                    </span>
                                </div>
                            </div>

                            {/* 數據對比條 */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20 text-xs font-mono">
                                <div className="bg-background/60 p-2.5 rounded-xl border border-border/40">
                                    <span className="text-muted-foreground block text-[11px]">調整前</span>
                                    <span className="font-bold text-foreground">
                                        {result.originalDistanceFormatted} ({result.originalDurationFormatted})
                                    </span>
                                </div>
                                <div className="bg-emerald-500/15 p-2.5 rounded-xl border border-emerald-500/30">
                                    <span className="text-emerald-700 dark:text-emerald-300 block text-[11px] font-bold">
                                        調整後 (最佳)
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {result.optimizedDistanceFormatted} ({result.optimizedDurationFormatted})
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* 順序變更預覽清單 */}
                    {result && locActivities.length >= 2 && (
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center justify-between">
                                <span>動線排序對比 (共 {locActivities.length} 個地點)</span>
                                <span className="text-[11px] font-normal text-muted-foreground">
                                    綠色標示順序已最佳化
                                </span>
                            </h4>

                            <div className="space-y-2">
                                {result.optimizedOrder.map((origIdx, newIndex) => {
                                    const item = locActivities[origIdx];
                                    const isMoved = origIdx !== newIndex;

                                    return (
                                        <div
                                            key={newIndex}
                                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                isMoved
                                                    ? "bg-emerald-500/5 border-emerald-500/40 shadow-2xs"
                                                    : "bg-card border-border/80"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* 順序徽章 */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center">
                                                        {newIndex + 1}
                                                    </span>
                                                    {isMoved && (
                                                        <span className="text-[10px] text-muted-foreground line-through font-mono">
                                                            (原{origIdx + 1})
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 景點名稱與時間 */}
                                                <div className="min-w-0">
                                                    <h5 className="text-sm font-bold text-foreground truncate">
                                                        {item.activity.title}
                                                    </h5>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                        <span>{item.activity.time}</span>
                                                        {item.place?.info?.loc && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate max-w-[240px]">
                                                                    {item.place.info.loc}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 狀態標籤 */}
                                            {isMoved ? (
                                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg shrink-0">
                                                    順序已優化
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground/70 shrink-0">
                                                    順序不變
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部按鈕 */}
                <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        disabled={locActivities.length < 2 || isOptimizing}
                        onClick={handleApply}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={14} />
                        <span>套用最佳化順序</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OptimizeRouteModal;
