import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import moment from "moment";
import { Lock, MapIcon, Plus, Settings } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import useItinerarys from "../../hooks/itinerary/UseItinerarys";
import useItineraryMutations from "../../hooks/itinerary/UseItineraryMutations";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlaceVM } from "../../services/mappers/PlaceMapper";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import ItineraryList from "../../components/itinerary/ItineraryList";
import ItineraryDayModal from "../../components/itinerary/ItineraryDayModal";
import ItineraryActivityModal from "../../components/itinerary/ItineraryActivityModal";
import PreviewPlaceModal from "../../components/itinerary/PreviewPlaceModal";
import PlaceCard from "../../components/place/PlaceCard";
import PlaceMapView from "../../components/place/PlaceMapView";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripVM } from "../../models/types/TripTypes";

import { ITINERARY_CATEGORIES } from "../../constants/Categories";

type ItineraryPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const ItineraryPage = ({
    isPrinting,
    tripDataOverride,
    tripIdOverride,
}: ItineraryPageProps) => {
    const { session } = useAuth();
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const {
        data: itinerarys,
        isLoading: isItinerarysLoading,
        error: itinerarysError,
    } = useItinerarys(tripId);
    const {
        insert: insertItinerary,
        update: updateItinerary,
        remove: removeItinerary,
        anyPending: isItineraryPending,
    } = useItineraryMutations();
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const [isEditing, setIsEditing] = useState(false);
    const [itineraryCategory] = useState(ITINERARY_CATEGORIES);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all"); // 'all' | day.id
    const [itineraryPlacesMap, setItineraryPlacesMap] = useState<Record<string, PlaceVM[]>>({}); // dayId -> PlaceVM[]
    const hasInitializedDayFilterRef = useRef(false);

    // 維護 selectedDayFilter 狀態：初始載入時預設當天或第一天，之後儲存/更新時保持當前選取的日程
    useEffect(() => {
        if (!Array.isArray(itinerarys) || itinerarys.length === 0) return;

        setSelectedDayFilter((prev) => {
            if (!hasInitializedDayFilterRef.current) {
                hasInitializedDayFilterRef.current = true;
                const todayStr = moment().format("YYYY-MM-DD");
                const todayDay = itinerarys.find((d) => d.date === todayStr);
                return todayDay ? todayDay.id : itinerarys[0].id;
            }

            if (prev === "all") return "all";

            // 若目前選取的日程仍然存在，保持原日程
            const dayStillExists = itinerarys.some((d) => d.id === prev);
            if (dayStillExists) return prev;

            // 原日程已不存在（如被刪除），則回退到當天或第一天
            const todayStr = moment().format("YYYY-MM-DD");
            const todayDay = itinerarys.find((d) => d.date === todayStr);
            return todayDay ? todayDay.id : itinerarys[0].id;
        });
    }, [itinerarys]);

    // 當行程變更時，批次抓取該行程所有活動有關聯的 Place 地標 (善用 快取 與 單次批次查詢 避免額外 API 消耗)
    useEffect(() => {
        if (!Array.isArray(itinerarys)) return;
        let isMounted = true;

        const fetchLinkedPlacesByDay = async () => {
            const allPlaceIds = new Set<string>();

            // 1. 收集行程中所有有連結的 Place ID
            itinerarys.forEach((day) => {
                day.activities?.forEach((act) => {
                    if (act.linkId) allPlaceIds.add(act.linkId);
                });
            });

            if (allPlaceIds.size === 0) {
                if (isMounted) setItineraryPlacesMap({ all: [] });
                return;
            }

            // 2. 一次性批次向 repo 請求（經由記憶體快取或單次併發）
            setIsPageLoading(true);
            try {
                const placeIdList = Array.from(allPlaceIds);
                // @ts-ignore - getByIds added to PlaceRepo
                const rows = await placeRepo.getByIds(placeIdList);
                
                const placeMapById = new Map<string, PlaceVM>();
                rows.forEach((r: any) => {
                    if (r) placeMapById.set(r.id, toPlaceVM(r));
                });

                // 3. 組合每日的 Place 陣列與全部天數陣列
                const dayMap: Record<string, PlaceVM[]> = {};
                const allVMs: PlaceVM[] = [];

                itinerarys.forEach((day) => {
                    const dayVMs: PlaceVM[] = [];
                    day.activities?.forEach((act) => {
                        if (act.linkId && placeMapById.has(act.linkId)) {
                            dayVMs.push(placeMapById.get(act.linkId)!);
                        }
                    });
                    dayMap[day.id] = dayVMs;
                });

                placeMapById.forEach((vm) => allVMs.push(vm));
                dayMap["all"] = allVMs;

                if (isMounted) {
                    setItineraryPlacesMap(dayMap);
                }
            } finally {
                if (isMounted) {
                    setIsPageLoading(false);
                }
            }
        };

        fetchLinkedPlacesByDay();
        return () => {
            isMounted = false;
        };
    }, [itinerarys]);

    const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

    const activeMapPlaces = useMemo(() => {
        return itineraryPlacesMap[selectedDayFilter] || [];
    }, [itineraryPlacesMap, selectedDayFilter]);

    // --- Preview Modal Handlers ---
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [place, setPlace] = useState<PlaceVM | undefined>(undefined);

    const handleOpenPreviewModal = async (linkId: string) => {
        setIsPageLoading(true);

        const row = await placeRepo.getById(linkId);

        setIsPageLoading(false);
        const placeVm = toPlaceVM(row!);
        setPlace(placeVm);
        setIsPreviewModalOpen(true);
    };

    const handleClosePreviewModal = () => {
        setIsPreviewModalOpen(false);
        setPlace(undefined);
    };

    const mutatingCount = useIsMutating({
        mutationKey: ["itinerary_day"],
    });

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow =
            isItinerarysLoading || isItineraryPending || mutatingCount > 0;

        if (shouldShow) {
            timer = window.setTimeout(() => setIsPageLoading(true), 150);
        } else {
            setIsPageLoading(false);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            setIsPageLoading(false);
        };
    }, [
        isItinerarysLoading,
        isItineraryPending,
        mutatingCount,
        setIsPageLoading,
    ]);

    // --- Common delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteType, setDeleteType] = useState("");
    const [deleteKey, setDeleteKey] = useState("");

    // --- Day Modal Handlers ---
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [dayModalMode, setDayModalMode] = useState("create");
    const initialDayState: ItineraryVM = useMemo(
        () => ({
            activities: [],
            date: moment().format("YYYY-MM-DD"),
            day_number: 1,
            created_at: null,
            id: crypto.randomUUID(),
            title: "",
            trip_id: tripId ?? "",
            updated_at: null,
            user_id: session ? session.user.id : "",
            weekday: moment().format("ddd"),
        }),
        [tripId, session]
    );
    const [formDay, setFormDay] = useState(initialDayState);
    const [dayToDelete, setDayToDelete] = useState<ItineraryVM | null>(null);

    const handleOpenCreateDayModal = () => {
        setFormDay(initialDayState);
        setDayModalMode("create");
        setIsDayModalOpen(true);
    };

    const handleOpenEditDayModal = (itineraryDay: ItineraryVM) => {
        setFormDay(itineraryDay);
        setDayModalMode("edit");
        setIsDayModalOpen(true);
    };

    const handleCloseDayModal = () => {
        setFormDay(initialDayState);
        setDayModalMode("create");
        setIsDayModalOpen(false);
    };

    const handleOpenDeleteDayModal = (itineraryDay: ItineraryVM) => {
        setDayToDelete(itineraryDay);
        setDeleteType("day");
        setDeleteKey(
            `${itineraryDay.date} Day ${itineraryDay.day_number} ${itineraryDay.title}`
        );
        setIsDeleteModalOpen(true);
    };

    const handleDayInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormDay((prev) => ({ ...prev, [name]: value }));

        if (name === "date") {
            setFormDay((prev) => ({
                ...prev,
                weekday: moment(value).format("ddd"),
            }));
        }
    };

    const handleDaySubmit = async (e: FormEvent) => {
        e.preventDefault();

        const dayData = { ...formDay };

        try {
            if (dayModalMode === "create") {
                const newDayId = crypto.randomUUID();
                setSelectedDayFilter(newDayId);
                await insertItinerary.mutateAsync({
                    ...dayData,
                    id: newDayId,
                });
            } else {
                setSelectedDayFilter(dayData.id);
                await updateItinerary.mutateAsync(dayData);
            }
            setFormDay(initialDayState);
            setIsDayModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Activity Modal Handlers ---
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityModalMode, setActivityModalMode] = useState("create");
    const initialActivityState: ItineraryActivitiy = useMemo(
        () => ({
            time: moment().format("HH:mm"),
            title: "",
            desc: "",
            type: "sight",
            linkId: "",
            activityIndex: 0,
        }),
        [tripId, session]
    );
    const [dayItemForActivity, setDayItemForActivity] =
        useState<ItineraryVM | null>(null);
    const [formActivity, setFormActivity] = useState(initialActivityState);
    const [activityToDelete, setActivityToDelete] =
        useState<ItineraryActivitiy | null>(null);

    const handleOpenCreateActivityModal = (itineraryDay: ItineraryVM) => {
        setActivityModalMode("create");
        setDayItemForActivity(itineraryDay);
        setFormActivity({ ...initialActivityState });
        setIsActivityModalOpen(true);
    };

    const handleOpenEditActivityModal = (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => {
        setActivityModalMode("edit");
        setDayItemForActivity(itineraryDay);
        setFormActivity({
            ...activity,
        });
        setIsActivityModalOpen(true);
    };

    const handleCloseActivityModal = () => {
        setActivityModalMode("create");
        setDayItemForActivity(null);
        setFormActivity(initialActivityState);
        setIsActivityModalOpen(false);
    };

    const handleOpenDeleteActivityModal = (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => {
        setDayItemForActivity(itineraryDay);
        setActivityToDelete(activity);
        setDeleteType("activity");
        setDeleteKey(
            `${itineraryDay.date} Day ${itineraryDay.day_number} ${activity.title}`
        );
        setIsDeleteModalOpen(true);
    };

    const handleActivityFormInputChange = async (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name.startsWith("transitDetails.")) {
            const field = name.replace("transitDetails.", "");
            setFormActivity((prev) => ({
                ...prev,
                transitDetails: {
                    ...(prev.transitDetails || {}),
                    [field]: type === "checkbox" ? checked : value,
                },
            }));
        } else {
            setFormActivity((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleActivitySubmit = async (e: FormEvent) => {
        e.preventDefault();

        const activityData = { ...formActivity };

        try {
            let targetActivities: ItineraryActivitiy[] = [];

            const existingActivities = dayItemForActivity?.activities ?? [];

            if (
                !Array.isArray(existingActivities) ||
                existingActivities.length === 0
            ) {
                targetActivities = [{ ...activityData, activityIndex: 0 }];
            } else {
                if (activityModalMode === "create") {
                    targetActivities = [
                        ...existingActivities,
                        { ...activityData },
                    ];
                } else {
                    targetActivities = existingActivities.map((activity) =>
                        activity.activityIndex === activityData.activityIndex
                            ? activityData
                            : activity
                    );
                }

                targetActivities = targetActivities
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((activity, index) => ({
                        ...activity,
                        activityIndex: index,
                    }));
            }

            if (dayItemForActivity) {
                setSelectedDayFilter(dayItemForActivity.id);
            }

            await updateItinerary.mutateAsync({
                ...dayItemForActivity!,
                activities: targetActivities,
            });

            setDayItemForActivity(null);
            setFormActivity(initialActivityState);
            setIsActivityModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Common Modal Handlers ---
    const handleConfirmDelete = async () => {
        try {
            switch (deleteType) {
                case "day":
                    if (!dayToDelete) return;
                    await removeItinerary.mutateAsync(dayToDelete.id);
                    break;
                case "activity":
                    let targetActivities: ItineraryActivitiy[] = [];

                    if (!Array.isArray(dayItemForActivity?.activities)) {
                        targetActivities = [];
                    } else {
                        targetActivities = dayItemForActivity.activities.filter(
                            (activity) =>
                                activity.activityIndex !==
                                activityToDelete?.activityIndex
                        );
                        targetActivities.sort((a, b) =>
                            a.time.localeCompare(b.time)
                        );
                        targetActivities = targetActivities.map(
                            (activity, index) => ({
                                ...activity,
                                activityIndex: index,
                            })
                        );
                    }

                    if (dayItemForActivity) {
                        setSelectedDayFilter(dayItemForActivity.id);
                    }

                    await updateItinerary.mutateAsync({
                        ...dayItemForActivity!,
                        activities: targetActivities,
                    });
                    break;
            }

            setIsDeleteModalOpen(false);
            setDayToDelete(null);
            setActivityToDelete(null);
            setDayItemForActivity(null);
            setDeleteType("");
            setDeleteKey("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDayToDelete(null);
        setDayItemForActivity(null);
        setDeleteType("");
        setDeleteKey("");
    };

    return (
        <div
            className={
                isPrinting
                    ? "font-[Noto_Sans_TC] text-foreground block h-auto min-h-0 overflow-visible bg-white"
                    : `min-h-[100dvh] font-[Noto_Sans_TC] text-foreground flex flex-col ${
                          tripData?.theme_config?.bg || "bg-background"
                      } dark:bg-background pb-24 lg:pb-6 lg:h-[100dvh] lg:overflow-hidden`
            }
        >
            {!isPrinting && (
                <SectionHeader
                    title="行程表"
                    subtitle="Timeline"
                    theme={tripData?.theme_config!}
                    hasBackBtn={true}
                    rightAction={
                        <div className="flex justify-center items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex items-center text-xs sm:text-sm font-medium px-2 py-1.5 sm:px-3 rounded-lg shadow-md transition-all ${
                                    isEditing
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent"
                                        : "bg-card text-foreground border border-border hover:bg-card/90"
                                }`}
                                title={isEditing ? "退出" : "編輯"}
                            >
                                {isEditing ? (
                                    <Lock size={15} />
                                ) : (
                                    <Settings size={15} />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenCreateDayModal}
                                className={`flex items-center text-xs sm:text-sm font-medium text-white px-2 py-1.5 sm:px-3 rounded-lg shadow-md ${tripData?.theme_config?.accent} hover:opacity-90 transition-opacity`}
                                title="新增"
                            >
                                <Plus size={15} />
                            </button>
                        </div>
                    }
                />
            )}
            <div
                className={
                    isPrinting
                        ? "space-y-6 px-0 overflow-visible h-auto block"
                        : "flex-1 flex flex-col min-h-0 px-3 sm:px-6 pt-3 pb-20 lg:pb-6 lg:overflow-hidden"
                }
            >
                {/* 主佈局：螢幕版雙欄 (左行程右地圖)，列印版單欄攤平 */}
                <div
                    className={
                        isPrinting
                            ? "block space-y-6 overflow-visible"
                            : "flex flex-col lg:flex-row gap-4 sm:gap-5 lg:items-start lg:px-0 lg:pt-0 lg:flex-1 lg:min-h-0"
                    }
                >
                    
                    {/* 左欄：Tabs + 清單 */}
                    <div ref={scrollContainerRef} className={isPrinting ? "w-full block overflow-visible" : "w-full lg:max-w-[58%] flex flex-col lg:flex-row gap-4 lg:gap-6 lg:flex-1 lg:h-full lg:overflow-y-auto no-scrollbar lg:pr-2 lg:pb-12"}>
                        
                        {/* 電腦版垂直 Day Selector (側邊欄) */}
                        {!isPrinting && (
                            <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[120px] sticky top-0 pt-1 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pb-10">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDayFilter("all")}
                                    className={`px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all ${
                                        selectedDayFilter === "all"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                                    }`}
                                >
                                    全部天數
                                </button>
                                {Array.isArray(itinerarys) &&
                                    itinerarys.map((day) => (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => setSelectedDayFilter(day.id)}
                                            className={`px-4 py-3 rounded-2xl text-left transition-all flex flex-col gap-0.5 ${
                                                selectedDayFilter === day.id
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                                            }`}
                                        >
                                            <span className="text-sm font-bold">DAY {day.day_number}</span>
                                            <span className="text-[11px] opacity-75 font-mono">
                                                {day.date.split("-")[1]}/{day.date.split("-")[2]}
                                            </span>
                                        </button>
                                    ))}
                            </div>
                        )}

                        {/* 行程時間軸清單 */}
                        <div className={`flex-1 w-full min-w-0 ${isPrinting ? "overflow-visible" : "pb-4"}`}>
                        <ItineraryList
                            itinerarys={itinerarys}
                            pcSelectedDayId={selectedDayFilter}
                            isEditing={isEditing}
                            isPrinting={isPrinting}
                            theme={tripData?.theme_config!}
                            scrollContainerRef={scrollContainerRef}
                            onAddActivityBtnClick={handleOpenCreateActivityModal}
                            onDeleteActivityBtnClick={handleOpenDeleteActivityModal}
                            onDeleteDayBtnClick={handleOpenDeleteDayModal}
                            onEditActivityBtnClick={handleOpenEditActivityModal}
                            onEditDayBtnClick={handleOpenEditDayModal}
                            onViewBtnClick={handleOpenPreviewModal}
                            onPlaceHover={setHoveredPlaceId}
                        />
                    </div>
                    </div>

                    {/* 右欄：電腦版常駐大地圖 */}
                    {!isPrinting && (
                        <div className="hidden lg:flex flex-1 flex-col h-full rounded-3xl overflow-hidden shadow-lg border border-border/80 min-h-[450px]">
                            <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapIcon size={16} className="text-primary shrink-0" />
                                    <span className="text-xs font-bold text-foreground">
                                        地圖與動態路線
                                    </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono bg-accent/50 px-2 py-0.5 rounded-full">
                                    {activeMapPlaces.length} 個地標
                                </span>
                            </div>
                            <div className="flex-1 w-full relative">
                                <PlaceMapView places={activeMapPlaces} showRouteLine={true} highlightedPlaceId={hoveredPlaceId} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isDayModalOpen && (
                <ItineraryDayModal
                    formData={formDay}
                    mode={dayModalMode}
                    theme={tripData?.theme_config!}
                    onCloseBtnClick={handleCloseDayModal}
                    onFormInputChange={handleDayInputChange}
                    onFormSubmit={handleDaySubmit}
                />
            )}
            {isActivityModalOpen && (
                <ItineraryActivityModal
                    formData={formActivity}
                    itinerary={dayItemForActivity}
                    itineraryCategory={itineraryCategory}
                    mode={activityModalMode}
                    theme={tripData?.theme_config!}
                    onCloseBtnClick={handleCloseActivityModal}
                    onFormInputChange={handleActivityFormInputChange}
                    onFormSubmit={handleActivitySubmit}
                />
            )}
            {isDeleteModalOpen && (
                <DeleteModal
                    deleteKey={deleteKey}
                    onCloseClick={handleCloseDeleteModal}
                    onConfirmClick={handleConfirmDelete}
                />
            )}
            {isPreviewModalOpen && place && (
                <PreviewPlaceModal
                    onCloseBtnClick={handleClosePreviewModal}
                    place={place}
                    theme={tripData?.theme_config!}
                />
            )}
        </div>
    );
};

export default ItineraryPage;
