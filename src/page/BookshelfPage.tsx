import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import moment from "moment";
import useAuth from "../hooks/UseAuth";
import useTrip from "../hooks/trip/UseTrip";
import useTrips from "../hooks/trip/UseTrips";
import useTripMembers from "../hooks/tripMember/UseTripMembers";
import useTripMutations from "../hooks/trip/UseTripMutations";
import type LayoutContextType from "../models/types/LayoutContextTypes";
import type { TripSettingConf, TripVM } from "../models/types/TripTypes";
import DeleteModal from "../components/common/DeleteModal";
import SectionHeader from "../components/common/SectionHeader";
import PermissionModal from "../components/bookshelf/PermissionModal";
import TripList from "../components/bookshelf/TripList";
import TripModal from "../components/bookshelf/TripModal";
import PrintableFullPage from "./PrintableFullPage";
import useTripMemberMutations from "../hooks/tripMember/UseTripMemberMutations";
import LoadingMask from "../components/common/LoadingMask";

const BookshelfPage = () => {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const {
        data: trips,
        isLoading: isTripsLoading,
        error: tripsError,
    } = useTrips(userId);
    const {
        insert: insertTrip,
        update: updateTrip,
        remove: removeTrip,
        anyPending: anyTripPending,
    } = useTripMutations();
    const [targetTrip, setTargetTrip] = useState<TripVM | undefined>(undefined);

    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const {
        data: tripMembers,
        isLoading: isTripMembersLoading,
        error: tripMembersError,
    } = useTripMembers(targetTrip?.id, isPermissionModalOpen);
    const {
        insert: insertTripMember,
        update: updateTripMember,
        remove: removeTripMember,
        anyPending: anyTripMemberPending,
    } = useTripMemberMutations();
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();
    const navigate = useNavigate();

    const mutatingCount = useIsMutating({
        mutationKey: [
            "trips",
            "trip",
            "trip_members",
            "trip_member",
            "trip_invitations",
        ],
    });

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow =
            isTripsLoading ||
            isTripMembersLoading ||
            anyTripPending ||
            anyTripMemberPending ||
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
        isTripsLoading,
        isTripMembersLoading,
        anyTripPending,
        anyTripMemberPending,
        mutatingCount,
        setIsPageLoading,
    ]);

    const handleSelectTrip = (tripId: string) => {
        navigate(`/trip/${tripId}`, { replace: false });
    };

    // --- Permission Modal
    const handlePermissionBtnClick = async (tripItem: TripVM) => {
        setTargetTrip(tripItem);
        setIsPermissionModalOpen(true);
    };

    const handleClosePermissionModalClick = async () => {
        setIsPermissionModalOpen(false);
        setTargetTrip(undefined);
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await removeTripMember.mutateAsync(memberId);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Common delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteType, setDeleteType] = useState("");
    const [deleteKey, setDeleteKey] = useState("");

    // Print
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [printTripId, setPrintTripId] = useState<string | undefined>(
        undefined,
    );
    const { data: printTripData, isLoading: isPrintTripLoading } =
        useTrip(printTripId);

    const handlePrintBtnClick = async (trip: TripVM) => {
        setPrintTripId(trip.id);
        setIsPrintMode(true);
    };

    const handlePrintCloseBtn = () => {
        setIsPrintMode(false);
        setPrintTripId(undefined);
    };

    // Trip Modal
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const initialTripState: TripVM = useMemo(
        () => ({
            cover_image: "",
            created_at: null,
            description: "",
            end_date: moment().format("YYYY-MM-DD"),
            id: crypto.randomUUID(),
            settings_config: {
                exchangeRate: 0.0,
                homeCurrency: "TWD",
                localCurrency: "",
            },
            start_date: moment().format("YYYY-MM-DD"),
            subtitle: "",
            theme_config: {
                bg: "bg-[#F2F2F0]",
                nav: "bg-black",
                card: "bg-white",
                mono: "font-mono tracking-tight",
                accent: "bg-[#9F1239]",
                border: "border-[#E5E7EB]",
                primary: "text-[#111827]",
                secondary: "text-[#4B5563]",
                accentText: "text-[#9F1239]",
                categoryColor: {
                    food: "#d97706",      // 濃郁琥珀橘 (Amber/Orange) - 高對比清晰
                    stay: "#2563eb",      // 皇家藍 (Royal Blue) - 住宿專用對比色
                    hotel: "#2563eb",     // 皇家藍 (Hotel)
                    other: "#6b7280",     // 質感灰 (Slate Gray)
                    sight: "#059669",     // 翡翠綠 (Emerald Green)
                    ticket: "#7c3aed",    // 紫羅蘭 (Violet)
                    shopping: "#db2777",  // 亮桃粉 (Rose/Pink) - 解決原本淺淡色系問題
                    transport: "#dc2626", // 經典紅 (Red)
                    cafe: "#b45309",      // 暖咖啡 (Warm Coffee)
                    activity: "#7c3aed",  // 紫羅蘭 (Activity)
                    nature: "#16a34a",    // 森林綠 (Forest Green)
                    culture: "#4f46e5",   // 靛藍 (Indigo)
                },
                navTextActive: "text-white",
                navTextInactive: "text-[#6B7280]",
            },
            title: "",
            updated_at: null,
            user_id: session ? session.user.id : "",
            lat: 23.973875,
            lng: 120.982025,
        }),
        [session],
    );
    const [tripModalMode, setTripModalMode] = useState("create"); // 'create' | 'edit'
    const [formTrip, setFormTrip] = useState<TripVM>(initialTripState);
    const [tripToDelete, setTripToDelete] = useState<TripVM | null>(null);

    const handleAddTripBtnClick = () => {
        setTripModalMode("create");
        setFormTrip(initialTripState);
        setIsTripModalOpen(true);
    };

    const handleEditTripBtnClick = (tripItem: TripVM) => {
        setTripModalMode("edit");
        setFormTrip(tripItem);
        setIsTripModalOpen(true);
    };

    const handleCloseTripModalBtnClick = () => {
        setTripModalMode("create");
        setFormTrip(initialTripState);
        setIsTripModalOpen(false);
    };

    const handleTripFormInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "lat" || name === "lng") {
            setFormTrip((prev) => ({
                ...prev,
                [name]: value === "" ? 0 : +value,
            }));
        } else {
            setFormTrip((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleTripFormSettingInputChange = (
        name: string,
        value: string | number,
    ) => {
        setFormTrip((prev) => ({
            ...prev,
            settings_config: {
                ...prev.settings_config,
                [name]: value,
            } as TripSettingConf,
        }));
    };

    const handleTripModalSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const tripData: TripVM = { ...formTrip };

        try {
            if (tripModalMode === "create") {
                var tripId = crypto.randomUUID();

                await insertTrip.mutateAsync({
                    ...tripData,
                    id: tripId,
                });
                // Insert creator as trip member
                await insertTripMember.mutateAsync({
                    trip_id: tripId,
                    user_id: session?.user.id!,
                });
            } else {
                await updateTrip.mutateAsync(tripData);
            }
            setFormTrip(initialTripState);
            setIsTripModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDeleteTripModal = (tripItem: TripVM) => {
        setTripToDelete(tripItem);
        setDeleteType("trip");
        setDeleteKey(
            `${tripItem.start_date} ~ ${tripItem.end_date} ${tripItem.title}`,
        );
        setIsDeleteModalOpen(true);
    };

    // --- Common Modal Handlers ---
    const handleConfirmDelete = async () => {
        try {
            switch (deleteType) {
                case "trip":
                    if (!tripToDelete) return;
                    await removeTrip.mutateAsync(tripToDelete.id);
                    break;
            }

            setIsDeleteModalOpen(false);
            setTripToDelete(null);
            setDeleteType("");
            setDeleteKey("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setTripToDelete(null);
        setDeleteType("");
        setDeleteKey("");
    };

    if (isPrintMode) {
        // 如果 Trip 資料還在抓，先顯示 Loading
        if (isPrintTripLoading || !printTripData) {
            return <LoadingMask />;
        }

        return (
            <PrintableFullPage
                key={printTripData.id}
                tripData={printTripData}
                onClose={handlePrintCloseBtn} // 傳入 callback
            />
        );
    }

    return (
        <div className="flex flex-col min-h-0">
            <SectionHeader
                title="我的旅程"
                subtitle="Travel Collections"
                theme={null}
                rightAction={
                    <div className="flex justify-center items-center gap-4">
                        <button
                            type="button"
                            onClick={handleAddTripBtnClick}
                            disabled={isTripsLoading}
                            className={`flex items-center text-sm font-medium text-white px-3 py-1.5 rounded-lg shadow-md bg-[#9F1239] hover:opacity-90 transition-opacity`}
                            title="新增"
                        >
                            <PlusIcon size={16} />
                        </button>
                    </div>
                }
            />
            <TripList
                trips={trips}
                userId={userId}
                onDeleteBtnClick={handleOpenDeleteTripModal}
                onEditBtnClick={handleEditTripBtnClick}
                onPermissionBtnClick={handlePermissionBtnClick}
                onPrintBtnClick={handlePrintBtnClick}
                onTripBtnClick={handleSelectTrip}
            />
            {isTripModalOpen && (
                <TripModal
                    formData={formTrip}
                    mode={tripModalMode}
                    theme={initialTripState.theme_config}
                    onCloseBtnClick={handleCloseTripModalBtnClick}
                    onFormChange={handleTripFormInputChange}
                    onSettingChange={handleTripFormSettingInputChange}
                    onFormSubmit={handleTripModalSubmit}
                />
            )}
            {isDeleteModalOpen && (
                <DeleteModal
                    deleteKey={deleteKey}
                    onCloseClick={handleCloseDeleteModal}
                    onConfirmClick={handleConfirmDelete}
                />
            )}
            {isPermissionModalOpen && (
                <PermissionModal
                    trip={targetTrip}
                    currentUserId={userId}
                    members={tripMembers}
                    theme={initialTripState.theme_config}
                    onCloseBtnClick={handleClosePermissionModalClick}
                    onRemoveMember={handleRemoveMember}
                />
            )}
        </div>
    );
};

export default BookshelfPage;
