import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import moment from "moment";
import { ListIcon, Lock, MapIcon, Plus, Settings } from "lucide-react";
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
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all"); // 'all' | day.id
    const [itineraryPlacesMap, setItineraryPlacesMap] = useState<Record<string, PlaceVM[]>>({}); // dayId -> PlaceVM[]

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
            const placeIdList = Array.from(allPlaceIds);
            const rows = await Promise.all(placeIdList.map((id) => placeRepo.getById(id)));
            
            const placeMapById = new Map<string, PlaceVM>();
            rows.forEach((r) => {
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
        };

        fetchLinkedPlacesByDay();
        return () => {
            isMounted = false;
        };
    }, [itinerarys]);

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
                await insertItinerary.mutateAsync({
                    ...dayData,
                    id: crypto.randomUUID(),
                });
            } else {
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
            className={`min-h-[100dvh] font-[Noto_Sans_TC] text-foreground flex flex-col ${
                isPrinting
                    ? "h-auto break-after-page overflow-visible bg-white"
                    : `min-h-full ${
                          tripData?.theme_config?.bg || "bg-background"
                      } dark:bg-background pb-24 lg:pb-6 lg:h-[100dvh] lg:overflow-hidden`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="行程表"
                    subtitle="Timeline"
                    theme={tripData?.theme_config!}
                    hasBackBtn={true}
                    rightAction={
                        <div className="flex justify-center items-center gap-1.5 sm:gap-3">
                            {/* 切換 清單 / 地圖 檢視模式 (手機縮小圖示) */}
                            <div className="flex items-center bg-card border border-border rounded-lg p-0.5 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("list")}
                                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 sm:px-2.5 rounded-md transition-all ${
                                        viewMode === "list"
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                    title="清單模式"
                                >
                                    <ListIcon size={14} />
                                    <span className="hidden sm:inline">清單</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("map")}
                                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 sm:px-2.5 rounded-md transition-all ${
                                        viewMode === "map"
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                    title="地圖模式"
                                >
                                    <MapIcon size={14} />
                                    <span className="hidden sm:inline">地圖</span>
                                </button>
                            </div>
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
                className={`lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden ${
                    isPrinting ? "space-y-4 px-0" : "px-4 mt-6"
                }`}
            >
                {viewMode === "list" ? (
                    <ItineraryList
                        itinerarys={itinerarys}
                        isEditing={isEditing}
                        isPrinting={isPrinting}
                        theme={tripData?.theme_config!}
                        onAddActivityBtnClick={handleOpenCreateActivityModal}
                        onDeleteActivityBtnClick={handleOpenDeleteActivityModal}
                        onDeleteDayBtnClick={handleOpenDeleteDayModal}
                        onEditActivityBtnClick={handleOpenEditActivityModal}
                        onEditDayBtnClick={handleOpenEditDayModal}
                        onViewBtnClick={handleOpenPreviewModal}
                    />
                ) : (
                    <div className="flex flex-col h-[70vh] lg:h-full gap-3">
                        {/* Day Filter Pills */}
                        {Array.isArray(itinerarys) && itinerarys.length > 0 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDayFilter("all")}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                        selectedDayFilter === "all"
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "bg-card border border-border text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    全部天數
                                </button>
                                {itinerarys.map((day) => {
                                    return (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => setSelectedDayFilter(day.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                                                selectedDayFilter === day.id
                                                    ? "bg-primary text-primary-foreground shadow-xs"
                                                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <span>DAY {day.day_number}</span>
                                            {day.title && <span className="opacity-80 max-w-[100px] truncate">({day.title})</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-md relative min-h-[300px]">
                            <PlaceMapView places={activeMapPlaces} showRouteLine={true} />
                        </div>
                    </div>
                )}
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
            {isPreviewModalOpen && (
                <PreviewPlaceModal
                    onCloseBtnClick={handleClosePreviewModal}
                    children={
                        <PlaceCard
                            theme={tripData?.theme_config!}
                            place={place!}
                            isPrinting={false}
                            isPreview={true}
                            onDelete={(place: PlaceVM) => {}}
                            onEdit={(place: PlaceVM) => {}}
                            onTagBtnClick={(tag: string) => {}}
                        />
                    }
                />
            )}
        </div>
    );
};

export default ItineraryPage;
