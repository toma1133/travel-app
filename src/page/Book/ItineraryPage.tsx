import {
    ChangeEvent,
    FormEvent,
    MouseEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import moment from "moment";
import { Calendar, Lock, Settings } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import useItinerarys from "../../hooks/itinerary/UseItinerarys";
import useItineraryMutations from "../../hooks/itinerary/UseItineraryMutations";
import usePlace from "../../hooks/place/UsePlace";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { PlaceVM } from "../../models/types/PlacesTypes";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import ItineraryList from "../../components/itinerary/ItineraryList";
import ItineraryDayModal from "../../components/itinerary/ItineraryDayModal";
import ItineraryActivityModal from "../../components/itinerary/ItineraryActivityModal";
import PreviewPlaceModal from "../../components/itinerary/PreviewPlaceModal";
import PlaceCard from "../../components/place/PlaceCard";

type ItineraryPageProps = {
    isPrinting?: boolean;
};

const ItineraryPage = ({ isPrinting }: ItineraryPageProps) => {
    const { session } = useAuth();
    const { id: tripId } = useParams<{ id: string }>();
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
    const { tripData } = useOutletContext<BookLayoutContextType>();
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const [isEditing, setIsEditing] = useState(false);
    const [itineraryCategory] = useState([
        { id: "sight", label: "觀光" },
        { id: "food", label: "美食" },
        {
            id: "shopping",
            label: "購物",
        },
        {
            id: "transport",
            label: "移動",
        },
        {
            id: "other",
            label: "其他",
        },
    ]);

    // --- Preview Modal Handlers ---
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewPlaceId, setPreviewPlaceId] = useState<string | undefined>(
        undefined,
    );
    const {
        data: place,
        isLoading: isPlaceLoading,
        error: placeError,
    } = usePlace(previewPlaceId);

    const handleClosePreviewModal = () => {
        setIsPreviewModalOpen(false);
        setPreviewPlaceId(undefined);
    };

    const mutatingCount = useIsMutating({
        mutationKey: ["itinerary_day", "place"],
    });

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow =
            isItinerarysLoading ||
            isItineraryPending ||
            isPlaceLoading ||
            mutatingCount > 0;

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
        isPlaceLoading,
        mutatingCount,
        setIsPageLoading,
    ]);

    useEffect(() => {
        setIsPreviewModalOpen(place! && !isPlaceLoading);
    }, [place, isPlaceLoading]);

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
        [tripId, session],
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
            `${itineraryDay.date} Day ${itineraryDay.day_number} ${itineraryDay.title}`,
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
        [tripId, session],
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
        activity: ItineraryActivitiy,
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
        activity: ItineraryActivitiy,
    ) => {
        setDayItemForActivity(itineraryDay);
        setActivityToDelete(activity);
        setDeleteType("activity");
        setDeleteKey(
            `${itineraryDay.date} Day ${itineraryDay.day_number} ${activity.title}`,
        );
        setIsDeleteModalOpen(true);
    };

    const handleActivityFormInputChange = async (
        e: ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = e.target;
        setFormActivity((prev) => ({ ...prev, [name]: value }));
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
                            : activity,
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

    const handleOpenPreviewModal = (linkId: string) => {
        setPreviewPlaceId(linkId);
        // setIsPreviewModalOpen(true);
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
                                activityToDelete?.activityIndex,
                        );
                        targetActivities.sort((a, b) =>
                            a.time.localeCompare(b.time),
                        );
                        targetActivities = targetActivities.map(
                            (activity, index) => ({
                                ...activity,
                                activityIndex: index,
                            }),
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
            className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
                isPrinting
                    ? "p-4 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                    : `${
                          tripData?.theme_config?.bg || "bg-gray-100"
                      } py-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="旅程表"
                    subtitle="時間與移動的軌跡"
                    theme={tripData.theme_config}
                    rightAction={
                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg shadow-md transition-all ${
                                    isEditing
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                {isEditing ? (
                                    <Lock size={16} className="mr-1" />
                                ) : (
                                    <Settings size={16} className="mr-1" />
                                )}
                                {isEditing ? "退出編輯" : "開始編輯"}
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenCreateDayModal}
                                className={`flex items-center text-sm font-medium text-white px-4 py-2 rounded-lg shadow-md ${tripData?.theme_config?.accent} hover:opacity-90 transition-opacity`}
                            >
                                <Calendar size={16} className="mr-1" />
                                新增日程
                            </button>
                        </div>
                    }
                />
            )}
            <ItineraryList
                itinerarys={itinerarys}
                isEditing={isEditing}
                isPrinting={isPrinting}
                theme={tripData.theme_config}
                onAddActivityBtnClick={handleOpenCreateActivityModal}
                onDeleteActivityBtnClick={handleOpenDeleteActivityModal}
                onDeleteDayBtnClick={handleOpenDeleteDayModal}
                onEditActivityBtnClick={handleOpenEditActivityModal}
                onEditDayBtnClick={handleOpenEditDayModal}
                onViewBtnClick={handleOpenPreviewModal}
            />
            {isDayModalOpen && (
                <ItineraryDayModal
                    formData={formDay}
                    mode={dayModalMode}
                    theme={tripData.theme_config}
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
                    theme={tripData.theme_config}
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
                            theme={tripData.theme_config}
                            place={place!}
                            isPrinting={false}
                            isPreview={true}
                            onDelete={(place: PlaceVM) => {}}
                            onEdit={(place: PlaceVM) => {}}
                        />
                    }
                />
            )}
        </div>
    );
};

export default ItineraryPage;
