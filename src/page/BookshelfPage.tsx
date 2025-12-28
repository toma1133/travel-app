import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import moment from "moment";
import useAuth from "../hooks/UseAuth";
import usePlaces from "../hooks/place/UsePlaces";
import useProfiles from "../hooks/profile/UseProfiles";
import useTrip from "../hooks/trip/UseTrip";
import useTrips from "../hooks/trip/UseTrips";
import useTripMembers from "../hooks/tripMember/UseTripMembers";
import useTripMutations from "../hooks/trip/UseTripMutations";
import type LayoutContextType from "../models/types/LayoutContextTypes";
import type { ProfileRow } from "../models/types/ProfileTypes";
import type { TripSettingConf, TripVM } from "../models/types/TripTypes";
import DeleteModal from "../components/common/DeleteModal";
import SectionHeader from "../components/common/SectionHeader";
import PermissionModal from "../components/bookshelf/PermissionModal";
import TripList from "../components/bookshelf/TripList";
import TripModal from "../components/bookshelf/TripModal";
import PrintableFullPage from "./PrintableFullPage";
import useTripMemberMutations from "../hooks/tripMember/UseTripMemberMutations";

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
        data: profiles,
        isLoading: isProfilesLoading,
        error: profilesError,
    } = useProfiles(isPermissionModalOpen);
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
        mutationKey: ["profiles", "trip", "trip_members"],
    });

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow =
            isProfilesLoading ||
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
        isProfilesLoading,
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
    const initialTripMemberState: { [key: string]: boolean } = useMemo(
        () =>
            profiles
                ? profiles
                      .filter((profile) => targetTrip?.user_id !== profile.id)
                      .reduce(
                          (
                              acc: { [key: string]: boolean },
                              curr: ProfileRow
                          ) => {
                              const isTripMember = !!tripMembers?.find(
                                  (member) => member.user_id === curr.id
                              );
                              return { ...acc, [curr.id]: isTripMember };
                          },
                          {} as { [key: string]: boolean }
                      )
                : {},
        [profiles, tripMembers]
    );
    const [formTripMembers, setFormTripMembers] = useState<{
        [key: string]: boolean;
    }>(initialTripMemberState);

    useEffect(() => {
        if (isPermissionModalOpen) {
            setFormTripMembers(initialTripMemberState);
        }
    }, [isPermissionModalOpen, initialTripMemberState]);

    const handlePermissionBtnClick = async (tripItem: TripVM) => {
        setTargetTrip(tripItem);
        setIsPermissionModalOpen(true);
    };

    const handleClosePermissionModalClick = async () => {
        setIsPermissionModalOpen(false);
        setTargetTrip(undefined);
    };

    const handleTripMemberBtnClick = (profile: ProfileRow) => {
        setFormTripMembers((prev) => ({
            ...prev,
            [profile.id]: !prev[profile.id],
        }));
    };

    const handlePermissionModalSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const tripMemberData: { [key: string]: boolean } = {
            ...formTripMembers,
        };

        try {
            for (const [key, value] of Object.entries(tripMemberData)) {
                const existInTripMembers = tripMembers?.find(
                    (member) =>
                        member.trip_id === targetTrip?.id &&
                        member.user_id === key
                );
                if (value && !!!existInTripMembers) {
                    await insertTripMember.mutateAsync({
                        trip_id: targetTrip!.id,
                        user_id: key,
                    });
                } else if (!value && !!existInTripMembers) {
                    await removeTripMember.mutateAsync(existInTripMembers.id);
                }
            }

            setIsPermissionModalOpen(false);
            setTargetTrip(undefined);
            setFormTripMembers(initialTripMemberState);
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
        undefined
    );
    const {
        data: trip,
        isLoading: isTripLoading,
        error: tripError,
    } = useTrip(printTripId);
    const {
        data: places,
        isLoading: isPlacesLoading,
        error: placesError,
    } = usePlaces(printTripId);

    useEffect(() => {
        if (isPrintMode) {
            setTimeout(() => {
                window.print();
                setIsPrintMode(false);
                setPrintTripId(undefined);
            }, 500);
        }
    }, [isPrintMode]);

    const handlePrintBtnClick = async (trip: TripVM) => {
        setPrintTripId(trip.id);
        setIsPrintMode(true);
    };

    if (isPrintMode) {
        return <PrintableFullPage />;
    }

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
                homeCurrency: "NT$",
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
                    food: "#ebceb1",
                    stay: "#d0755c",
                    other: "#798187",
                    sight: "#576169",
                    ticket: "#929489",
                    shopping: "#eee9de",
                    transport: "#88352b",
                },
                navTextActive: "text-white",
                navTextInactive: "text-[#6B7280]",
            },
            title: "",
            updated_at: null,
            user_id: session ? session.user.id : "",
        }),
        [session]
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
        setFormTrip((prev) => ({ ...prev, [name]: value }));
    };

    const handleTripFormSettingInputChange = (
        name: string,
        value: string | number
    ) => {
        setFormTrip((prev) => ({
            ...prev,
            settings_config: {
                ...prev.settings_config,
                [name]: value,
            } as TripSettingConf,
        }));
    };

    const handleSettingModalSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const tripData: TripVM = { ...formTrip };

        try {
            if (tripModalMode === "create") {
                await insertTrip.mutateAsync({
                    ...tripData,
                    id: crypto.randomUUID(),
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
            `${tripItem.start_date} ~ ${tripItem.end_date} ${tripItem.title}`
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

    return (
        <div className="flex flex-col pt-12 min-h-0">
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
                            className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity`}
                        >
                            <PlusIcon size={16} className="mr-1" />
                            <span>創建新旅程</span>
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
                    onFormSubmit={handleSettingModalSubmit}
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
                    formData={formTripMembers}
                    profiles={profiles}
                    trip={targetTrip}
                    theme={initialTripState.theme_config}
                    onCloseBtnClick={handleClosePermissionModalClick}
                    onSelectBtnClick={handleTripMemberBtnClick}
                    onSubmit={handlePermissionModalSubmit}
                />
            )}
        </div>
    );
};

export default BookshelfPage;
