import TimeZoneSelect from "../../components/common/TimeZoneSelect";
import { getBrowserTimeZone } from "../../utils/DateTimeUtil";
import { toItineraryActivityForm, toItineraryVM, toItineraryUpdate } from "../../services/mappers/ItineraryMapper";
import { FormEvent, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import moment from "moment";
import { MapIcon, RefreshCw, X } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import useMediaQuery from "../../hooks/UseMediaQuery";
import useItinerarys from "../../hooks/itinerary/UseItinerarys";
import useItineraryMutations from "../../hooks/itinerary/UseItineraryMutations";
import useTripPlacesBatch from "../../hooks/place/UseTripPlacesBatch";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import ItineraryList from "../../components/itinerary/ItineraryList";
import ItineraryDayModal from "../../components/itinerary/ItineraryDayModal";
import PreviewPlaceModal from "../../components/itinerary/PreviewPlaceModal";
import ItineraryDayTabBar from "../../components/itinerary/timeline/ItineraryDayTabBar";
import TimelineSkeleton from "../../components/common/skeletons/TimelineSkeleton";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type { ItineraryActivitiy, ItineraryVM } from "../../models/types/ItineraryTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripVM } from "../../models/types/TripTypes";
import { ITINERARY_CATEGORIES } from "../../constants/Categories";
import { getItinerarySyncErrorMessage } from "../../utils/ItinerarySyncUtil";
import { computeDayTimelineSchedule, compareItineraryActivities } from "../../utils/ItineraryTimeUtil";
import useTripWeather from "../../hooks/weather/useTripWeather";
import LiveTravelFocusCard from "../../components/itinerary/LiveTravelFocusCard";

const ItineraryActivityModal = lazy(() => import("../../components/itinerary/ItineraryActivityModal"));
const OptimizeRouteModal = lazy(() => import("../../components/itinerary/OptimizeRouteModal"));
const PlaceMapView = lazy(() => import("../../components/place/PlaceMapView"));

type ItineraryPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const ItineraryPage = ({ isPrinting, tripDataOverride, tripIdOverride }: ItineraryPageProps) => {
    const { session } = useAuth();
    const [displayTimeZone, setDisplayTimeZone] = useState(getBrowserTimeZone);
    const [daySaveError, setDaySaveError] = useState("");
    const [activitySaveError, setActivitySaveError] = useState("");
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const { data: itinerarys, isLoading } = useItinerarys(tripId, displayTimeZone);
    const { insert: insertDay, update: updateDay, remove: removeDay, sync: syncDays, anyPending } = useItineraryMutations();
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const isEditing = true;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [daySelection, setDaySelection] = useState<{ tripId?: string; id: string }>();
    const setSelectedDayFilter = useCallback((id: string) => setDaySelection({ tripId, id }), [tripId]);
    const selectedDayFilter = daySelection?.tripId === tripId && (daySelection?.id === "all" || itinerarys?.some(day => day.id === daySelection?.id))
        ? daySelection!.id
        : itinerarys?.find(day => day.date === moment().format("YYYY-MM-DD"))?.id || itinerarys?.[0]?.id || "";
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [showMobileMap, setShowMobileMap] = useState(false);
    const [loadedDays, setLoadedDays] = useState<{ tripId?: string; ids: string[] }>({ ids: [] });
    const onLoadDay = useCallback((id: string) => setLoadedDays(previous => {
        const ids = previous.tripId === tripId ? previous.ids : [];
        return ids.includes(id) ? previous : { tripId, ids: [...ids, id] };
    }), [tripId]);
    const loadedItineraries = useMemo(() => itinerarys?.filter(day => isPrinting || (showMobileMap && selectedDayFilter === "all") || day.id === selectedDayFilter ||
        (selectedDayFilter === "all" && loadedDays.tripId === tripId && loadedDays.ids.includes(day.id))),
        [itinerarys, isPrinting, showMobileMap, selectedDayFilter, loadedDays, tripId]);
    const placeIds = useMemo(() => Array.from(new Set(loadedItineraries?.flatMap(day => day.activities?.map(activity => activity.linkId).filter(Boolean) || []) || [])), [loadedItineraries]);
    const { placeMap: linkedPlacesMap } = useTripPlacesBatch(tripId, placeIds);
    const [syncMessage, setSyncMessage] = useState("");
    const handleSync = async () => {
        if (!tripData || syncDays.isPending) return;
        setSyncMessage("");
        try {
            const result = await syncDays.mutateAsync(tripData);
            setSyncMessage(`同步完成，新增 ${result.added} 天、校正 ${result.updated} 天、刪除 ${result.removed} 天範圍外日程。`);
        } catch (error) {
            setSyncMessage(getItinerarySyncErrorMessage(error));
        }
    };

    const { dayPlacesMap, dayPlaceCounts } = useMemo(() => {
        const dMap: Record<string, PlaceVM[]> = { all: [] };
        const dCounts: Record<string, number> = {};
        if (Array.isArray(itinerarys)) {
            itinerarys.forEach((d) => {
                const validPlaces: PlaceVM[] = [];
                d.activities?.forEach((a) => {
                    const p = a.linkId ? linkedPlacesMap[a.linkId] : null;
                    if (p && typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng)) {
                        validPlaces.push(p);
                        dMap.all.push(p);
                    }
                });
                dMap[d.id] = validPlaces;
                dCounts[d.id] = d.activities?.filter(activity => activity.linkId).length || 0;
            });
        }
        return { dayPlacesMap: dMap, dayPlaceCounts: dCounts };
    }, [itinerarys, linkedPlacesMap]);

    const [hoveredPlace, setHoveredPlace] = useState<{ id: string | null; index: number | null }>({ id: null, index: null });
    const activeMapPlaces = useMemo(() => dayPlacesMap[selectedDayFilter] || [], [dayPlacesMap, selectedDayFilter]);
    const activeDayLabel = useMemo(() => {
        if (selectedDayFilter === "all") return "全部天數";
        const d = itinerarys?.find((item) => item.id === selectedDayFilter);
        return d ? `DAY ${d.day_number}` : "";
    }, [itinerarys, selectedDayFilter]);

    // Phase 4: 即時旅程天氣批次預報與降雨警示
    const {
        weatherMap,
        isLoading: isWeatherLoading,
        locationName,
    } = useTripWeather({
        tripId,
        itineraries: loadedItineraries,
        placesMap: linkedPlacesMap,
        startDate: tripData?.start_date,
        endDate: tripData?.end_date,
        options: { enabled: !isPrinting && Array.isArray(itinerarys) && itinerarys.length > 0 },
    });

    // Modals state
    const [preview, setPreview] = useState<{ open: boolean; place?: PlaceVM; activity?: ItineraryActivitiy }>({ open: false });
    const [optimizeDay, setOptimizeDay] = useState<ItineraryVM | null>(null);
    const [del, setDel] = useState<{ open: boolean; type: "day" | "activity" | ""; key: string; day?: ItineraryVM; act?: ItineraryActivitiy }>({ open: false, type: "", key: "" });
    const [dayModal, setDayModal] = useState<{ open: boolean; mode: "create" | "edit"; form: ItineraryVM }>({
        open: false, mode: "create",
        form: { is_utc: false, time_zone: null, activities: [], date: moment().format("YYYY-MM-DD"), day_number: 1, created_at: null, id: "", title: "", trip_id: tripId ?? "", updated_at: null, user_id: session?.user?.id || "", weekday: moment().format("ddd") }
    });
    const [actModal, setActModal] = useState<{ open: boolean; mode: "create" | "edit"; day?: ItineraryVM; form: ItineraryActivitiy }>({
        open: false, mode: "create",
        form: { time: moment().format("HH:mm"), title: "", desc: "", type: "sight", linkId: "", activityIndex: 0 }
    });

    const mutatingCount = useIsMutating({ mutationKey: ["itinerary_day"] });
    useEffect(() => {
        setIsPageLoading(anyPending || mutatingCount > 0);
    }, [anyPending, mutatingCount, setIsPageLoading]);

    const handleDaySubmit = async (e: FormEvent) => {
        e.preventDefault();
        setDaySaveError("");
        try {
            if (dayModal.mode === "create") {
                const id = crypto.randomUUID();
                setSelectedDayFilter(id);
                await insertDay.mutateAsync({ ...dayModal.form, id });
            } else {
                await updateDay.mutateAsync(dayModal.form);
            }
            setDayModal((prev) => ({ ...prev, open: false }));
        } catch (error) { setDaySaveError(error instanceof Error ? error.message : "日程儲存失敗，請稍後再試。"); }
    };

    const handleActSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!actModal.day) return;
        setActivitySaveError("");
        try {
        const acts = [...(actModal.day.activities || [])];
        const edited = actModal.mode === "create" ? [...acts, actModal.form] : acts.map((a) => (a.activityIndex === actModal.form.activityIndex ? actModal.form : a));
        // Normalize each input zone before sorting activities in the list display zone.
        const storage = toItineraryUpdate({ ...actModal.day, activities: edited });
        const next = toItineraryVM({ ...actModal.day, activities: storage.activities ?? null }, displayTimeZone).activities || [];
        next.sort((a, b) => compareItineraryActivities(a, b, actModal.day!)).forEach((a, i) => (a.activityIndex = i));
        setSelectedDayFilter(actModal.day.id);
        await updateDay.mutateAsync({ ...actModal.day, activities: next });
        setActModal((prev) => ({ ...prev, open: false }));
        } catch (error) { setActivitySaveError(error instanceof Error ? error.message : "活動儲存失敗，請稍後再試。"); }
    };

    const handleConfirmDelete = async () => {
        if (del.type === "day" && del.day) await removeDay.mutateAsync(del.day.id);
        if (del.type === "activity" && del.day && del.act) {
            const next = (del.day.activities || []).filter((a) => a.activityIndex !== del.act?.activityIndex)
                .sort((a, b) => compareItineraryActivities(a, b, del.day!))
                .map((a, i) => ({ ...a, activityIndex: i }));
            await updateDay.mutateAsync({ ...del.day, activities: next });
        }
        setDel({ open: false, type: "", key: "" });
    };

    return (
        <div className={isPrinting ? "font-[Noto_Sans_TC] text-foreground block bg-white" : `h-full font-[Noto_Sans_TC] text-foreground flex flex-col ${tripData?.theme_config?.bg || "bg-background"} dark:bg-background overflow-hidden`}>
            {!isPrinting && (
                <div className="shrink-0">
                    <SectionHeader
                        title="行程表"
                        subtitle="Timeline"
                        theme={tripData?.theme_config ?? null}
                        hasBackBtn
                    />
                </div>
            )}

            {!isPrinting && (
                <div className="shrink-0 px-3 sm:px-6 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={handleSync} disabled={!tripData || anyPending}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-pill text-xs font-bold cursor-pointer disabled:opacity-50">
                        <RefreshCw size={14} className={syncDays.isPending ? "animate-spin" : ""} />
                        {syncDays.isPending ? "同步中…" : "同步旅程天數"}
                    </button>
                    <TimeZoneSelect value={displayTimeZone} onChange={setDisplayTimeZone} label="行程顯示時區" />
                    <span role="status" className="text-xs text-muted-foreground">{syncMessage}</span>
                </div>
            )}
            <div className={isPrinting ? "space-y-6 overflow-visible" : "flex-1 flex flex-col min-h-0 px-3 sm:px-6 pt-2 pb-2 lg:pb-3 overflow-hidden gap-3"}>
                {isLoading ? (
                    <TimelineSkeleton />
                ) : (
                    <>
                        {!isPrinting && Array.isArray(itinerarys) && itinerarys.length > 0 && (
                            <div className="space-y-2.5 shrink-0">
                                <LiveTravelFocusCard timeZone={displayTimeZone}
                                    trip={tripData}
                                    itineraries={itinerarys}
                                    placesMap={linkedPlacesMap}
                                    weatherMap={weatherMap}
                                    selectedDayId={selectedDayFilter}
                                    onSelectDay={setSelectedDayFilter}
                                    theme={tripData?.theme_config}
                                />
                                <ItineraryDayTabBar
                                    days={itinerarys}
                                    selectedDayId={selectedDayFilter}
                                    onSelectDay={setSelectedDayFilter}
                                    onAddDay={() =>
                                        setDayModal({
                                            open: true,
                                            mode: "create",
                                            form: {
                                                activities: [],
                                                date: moment().format("YYYY-MM-DD"),
                                                day_number: (itinerarys?.length || 0) + 1,
                                                created_at: null,
                                                id: crypto.randomUUID(),
                                                title: "",
                                                trip_id: tripId ?? "",
                                                updated_at: null,
                                                user_id: session?.user?.id || "",
                                                weekday: moment().format("ddd"),
                                                is_utc: false, time_zone: null, date_utc: null, original_date: undefined,
                                            },
                                        })
                                    }
                                    dayPlaceCounts={dayPlaceCounts}
                                    totalPlacesCount={Object.values(dayPlaceCounts).reduce((sum, count) => sum + count, 0)}
                                    theme={tripData?.theme_config}
                                    weatherMap={weatherMap}
                                    isLoadingWeather={isWeatherLoading}
                                    locationName={locationName}
                                />
                            </div>
                        )}

                        <div className={isPrinting ? "block space-y-6" : "flex flex-col lg:flex-row gap-4 sm:gap-5 flex-1 min-h-0 overflow-hidden"}>
                            <div ref={scrollContainerRef} data-scroll-container="true" style={{ overflowAnchor: "none" }} className={isPrinting ? "w-full" : "w-full lg:max-w-[58%] flex-1 h-full overflow-y-auto no-scrollbar lg:pr-2 pb-28 lg:pb-8"}>
                                <ItineraryList
                            onLoadDay={onLoadDay} itinerarys={itinerarys} pcSelectedDayId={selectedDayFilter} itineraryPlacesMap={dayPlacesMap} placeMap={linkedPlacesMap}
                            isEditing={isEditing} isPrinting={isPrinting} theme={tripData?.theme_config ?? null} scrollContainerRef={scrollContainerRef}
                            onAddActivityBtnClick={(day) => {
                                const sched = day.activities ? computeDayTimelineSchedule(day.activities, day) : [];
                                const last = sched[sched.length - 1];
                                const defTime = last?.transit?.arrivalTime || last?.endTime || last?.startTime || "09:00";
                                setActivitySaveError("");
                                setActModal({ open: true, mode: "create", day, form: { is_utc: true, time_zone: displayTimeZone, time_date: last?.transit.arrivalDate || day.date, time: defTime, title: "", desc: "", type: "sight", linkId: "", activityIndex: day.activities?.length || 0 } });
                            }}
                            onDeleteActivityBtnClick={(day, act) => setDel({ open: true, type: "activity", key: `第 ${day.day_number} 天：${act.title}`, day, act })}
                            onDeleteDayBtnClick={(day) => setDel({ open: true, type: "day", key: `第 ${day.day_number} 天 ${day.title}`, day })}
                            onEditActivityBtnClick={(day, act) => { setActivitySaveError(""); setActModal({ open: true, mode: "edit", day, form: toItineraryActivityForm(act, day) }); }}
                            onEditDayBtnClick={(day) => setDayModal({ open: true, mode: "edit", form: { ...day } })}
                            onOptimizeRouteBtnClick={(day) => { setSelectedDayFilter(day.id); setOptimizeDay(day); }}
                            onOpenMapBtnClick={(day) => { setSelectedDayFilter(day.id); setShowMobileMap(true); }}
                            onSelectDay={(dayId) => setSelectedDayFilter(dayId)}
                            onViewBtnClick={(linkId, activity) => setPreview({ open: true, place: linkId ? linkedPlacesMap[linkId] : undefined, activity })}
                            onPlaceHover={(id, index) => setHoveredPlace({ id, index: typeof index === "number" ? index : null })}
                        />
                    </div>

                    {!isPrinting && isDesktop && (
                        <div className="flex flex-1 flex-col h-full rounded-3xl overflow-hidden glass-panel border border-border/80 min-h-0">
                            <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <MapIcon size={16} className="text-primary shrink-0" />
                                    <span className="text-xs font-bold text-foreground">地圖動態路線 {activeDayLabel ? `· ${activeDayLabel}` : ""}</span>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono bg-accent/50 px-2 py-0.5 rounded-full">{activeMapPlaces.length} 個地標</span>
                            </div>
                            <div className="flex-1 w-full relative min-h-0">
                                <Suspense fallback={<div role="status" className="p-4 text-xs text-muted-foreground">地圖載入中…</div>}><PlaceMapView places={activeMapPlaces} showRouteLine highlightedPlaceId={hoveredPlace.id} highlightedIndex={hoveredPlace.index} enabled /></Suspense>
                            </div>
                        </div>
                    )}
                </div>
                </>
                )}
            </div>



            {!isPrinting && !isDesktop && showMobileMap && (
                <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card/90">
                        <div className="flex items-center gap-2">
                            <MapIcon size={16} className="text-primary shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-foreground">路線地圖 {activeDayLabel ? `· ${activeDayLabel}` : ""} ({activeMapPlaces.length})</span>
                        </div>
                        <button type="button" onClick={() => setShowMobileMap(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer">
                            <X size={14} /><span>關閉</span>
                        </button>
                    </div>
                    {Array.isArray(itinerarys) && (
                        <div className="p-2 border-b border-border/60 bg-muted/30">
                            <ItineraryDayTabBar days={itinerarys} selectedDayId={selectedDayFilter} onSelectDay={setSelectedDayFilter} dayPlaceCounts={dayPlaceCounts} totalPlacesCount={Object.values(dayPlaceCounts).reduce((sum, count) => sum + count, 0)} theme={tripData?.theme_config} />
                        </div>
                    )}
                    <div className="flex-1 w-full relative">
                        <Suspense fallback={<div role="status" className="p-4 text-xs text-muted-foreground">地圖載入中…</div>}><PlaceMapView places={activeMapPlaces} showRouteLine highlightedPlaceId={hoveredPlace.id} highlightedIndex={hoveredPlace.index} enabled /></Suspense>
                    </div>
                </div>
            )}

            <Suspense fallback={<div role="status" className="fixed bottom-24 left-4 z-[70] glass-panel p-3 rounded-xl">載入中…</div>}>
            {dayModal.open && <ItineraryDayModal errorMessage={daySaveError} formData={dayModal.form} mode={dayModal.mode} theme={tripData?.theme_config ?? null} onCloseBtnClick={() => setDayModal((p) => ({ ...p, open: false }))} onFormInputChange={(e) => setDayModal((p) => ({ ...p, form: { ...p.form, [e.target.name]: e.target.value, ...(e.target.name === "date" ? { weekday: moment(e.target.value).format("ddd") } : {}) } }))} onFormSubmit={handleDaySubmit} />}
            {actModal.open && <ItineraryActivityModal onTimeSettingsChange={patch => setActModal(p => ({ ...p, form: { ...p.form, ...patch } }))} errorMessage={activitySaveError} formData={actModal.form} itinerary={actModal.day!} itineraryCategory={ITINERARY_CATEGORIES} mode={actModal.mode} theme={tripData?.theme_config ?? null} onCloseBtnClick={() => setActModal((p) => ({ ...p, open: false }))} onFormInputChange={(e) => { const { name, value, type } = e.target; const checked = (e.target as HTMLInputElement).checked; if (name.startsWith("transitDetails.")) { const f = name.replace("transitDetails.", ""); setActModal((p) => ({ ...p, form: { ...p.form, transitDetails: { ...(p.form.transitDetails || {}), [f]: type === "checkbox" ? checked : value } } })); } else { setActModal((p) => ({ ...p, form: { ...p.form, [name]: value } })); } }} onFormSubmit={handleActSubmit} />}
            {del.open && <DeleteModal deleteKey={del.key} onCloseClick={() => setDel({ open: false, type: "", key: "" })} onConfirmClick={handleConfirmDelete} />}
            {preview.open && (preview.place || preview.activity) && <PreviewPlaceModal place={preview.place} activity={preview.activity} theme={tripData?.theme_config ?? null} onCloseBtnClick={() => setPreview({ open: false })} />}
            {optimizeDay && <OptimizeRouteModal itineraryDay={optimizeDay} placesMap={new Map(Object.values(linkedPlacesMap).map((p) => [p.id, p]))} theme={tripData?.theme_config} onClose={() => setOptimizeDay(null)} onApplyOptimizedOrder={async (d, acts) => { await updateDay.mutateAsync({ ...d, activities: acts }); }} />}
            </Suspense>
        </div>
    );
};

export default ItineraryPage;
