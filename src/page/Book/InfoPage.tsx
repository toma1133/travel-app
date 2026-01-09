import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import moment from "moment";
import { Lock, Settings } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import useAccommodations from "../../hooks/info/UseAccommodations";
import useAccommodationMutations from "../../hooks/info/UseAccommodationMutations";
import useCarRentals from "../../hooks/info/UseCarRentals";
import useCarRentalMutations from "../../hooks/info/UseCarRentalMutations";
import useFlights from "../../hooks/info/UseFlights";
import useFlightMutations from "../../hooks/info/UseFlightMutations";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import FlightList from "../../components/info/FlightList";
import FlightModal from "../../components/info/FlightModal";
import AccommodationList from "../../components/info/AccommodationList";
import AccommodationModal from "../../components/info/AccommodationModal";
import CarRentalList from "../../components/info/CarRentalList";
import CarRentalModal from "../../components/info/CarRentalModal";
import PreviewPlaceModal from "../../components/itinerary/PreviewPlaceModal";
import PlaceCard from "../../components/place/PlaceCard";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlaceVM } from "../../services/mappers/PlaceMapper";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";
import type { FlightRow } from "../../models/types/FlightTypes";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripVM } from "../../models/types/TripTypes";

type InfoPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const InfoPage = ({
    isPrinting,
    tripDataOverride,
    tripIdOverride,
}: InfoPageProps) => {
    const { session } = useAuth();
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const {
        data: flights,
        isLoading: isFlightsLoading,
        error: flightsError,
    } = useFlights(tripId);
    const {
        insert: insertFlight,
        update: updateFlight,
        remove: removeFlight,
        anyPending: isFlightPending,
    } = useFlightMutations();
    const {
        data: accommodations,
        isLoading: isAccommodationsLoading,
        error: accommodationsError,
    } = useAccommodations(tripId);
    const {
        insert: insertAccommodation,
        update: updateAccommodation,
        remove: removeAccommodation,
        anyPending: isAccommodationPending,
    } = useAccommodationMutations();
    const {
        data: carRentals,
        isLoading: isCarRentalsLoading,
        error: carRentalsError,
    } = useCarRentals(tripId);
    const {
        insert: insertCarRental,
        update: updateCarRental,
        remove: removeCarRental,
        anyPending: isCarRentalPending,
    } = useCarRentalMutations();
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const [isEditing, setIsEditing] = useState(false);

    const mutatingCount = useIsMutating({
        mutationKey: ["flight", "accommodation", "car_rental"],
    });

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow =
            isAccommodationsLoading ||
            isAccommodationPending ||
            isFlightsLoading ||
            isFlightPending ||
            isCarRentalsLoading ||
            isCarRentalPending ||
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
        isAccommodationsLoading,
        isAccommodationPending,
        isFlightsLoading,
        isFlightPending,
        isCarRentalsLoading,
        isCarRentalPending,
        mutatingCount,
        setIsPageLoading,
    ]);

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

    // --- Common delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteType, setDeleteType] = useState("");
    const [deleteKey, setDeleteKey] = useState("");

    // --- Flight Modal Handlers ---
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [flightModalMode, setFlightModalMode] = useState("create");
    const initialFlightState: FlightRow = useMemo(
        () => ({
            arrival_loc: "",
            arrival_time: moment().format("HH:mm"),
            code: "",
            created_at: null,
            departure_loc: "",
            departure_time: moment().format("HH:mm"),
            flight_date: moment().format("YYYY-MM-DD"),
            id: crypto.randomUUID(),
            trip_id: tripId ?? "",
            type: "",
            updated_at: null,
            user_id: session ? session.user.id : "",
        }),
        [tripId, session]
    );
    const [formFlight, setFormFlight] = useState(initialFlightState);
    const [flightToDelete, setFlightToDelete] = useState<FlightRow | null>(
        null
    );

    const handleOpenCreateFlightModal = () => {
        setFlightModalMode("create");
        setFormFlight({ ...initialFlightState });
        setIsFlightModalOpen(true);
    };

    const handleOpenEditFlightModal = (flight: FlightRow) => {
        setFlightModalMode("edit");
        setFormFlight(flight);
        setIsFlightModalOpen(true);
    };

    const handleCloseFlightModal = () => {
        setFlightModalMode("create");
        setFormFlight(initialFlightState);
        setIsFlightModalOpen(false);
    };

    const handleOpenDeleteFlightModal = (flight: FlightRow) => {
        setFlightToDelete(flight);
        setDeleteType("flight");
        setDeleteKey(`${flight.departure_loc} - ${flight.arrival_loc}`);
        setIsDeleteModalOpen(true);
    };

    const handleFlightFormInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormFlight((prev) => ({ ...prev, [name]: value }));
    };

    const handleFlightFormSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const flightData = { ...formFlight };

        try {
            if (flightModalMode === "create") {
                await insertFlight.mutateAsync({
                    ...flightData,
                    id: crypto.randomUUID(),
                });
            } else {
                await updateFlight.mutateAsync(flightData);
            }
            setFormFlight(initialFlightState);
            setIsFlightModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Accommodation Modal Handlers ---
    const [isAccommodationModalOpen, setIsAccommodationModalOpen] =
        useState(false);
    const [accommodationModalMode, setAccommodationModalMode] =
        useState("create");
    const initialAccommodationState: AccommodationRow = useMemo(
        () => ({
            address: "",
            check_in_date: moment().format("YYYY-MM-DD"),
            check_out_date: moment().format("YYYY-MM-DD"),
            created_at: null,
            name: "",
            id: crypto.randomUUID(),
            trip_id: tripId ?? "",
            updated_at: null,
            user_id: session ? session.user.id : "",
            link_id: "",
        }),
        [tripId, session]
    );
    const [formAccommodation, setFormAccommodation] = useState(
        initialAccommodationState
    );
    const [accommodationToDelete, setAccommodationToDelete] =
        useState<AccommodationRow | null>(null);

    const handleOpenCreateAccommodationModal = () => {
        setAccommodationModalMode("create");
        setFormAccommodation({ ...initialAccommodationState });
        setIsAccommodationModalOpen(true);
    };

    const handleOpenEditAccommodationModal = (
        accommodation: AccommodationRow
    ) => {
        setAccommodationModalMode("edit");
        setFormAccommodation(accommodation);
        setIsAccommodationModalOpen(true);
    };

    const handleAccommodationFormInputChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setFormAccommodation((prev) => ({ ...prev, [name]: value }));
    };

    const handleAccommodationFormSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const accommodationData = { ...formAccommodation };

        try {
            if (accommodationModalMode === "create") {
                await insertAccommodation.mutateAsync({
                    ...accommodationData,
                    id: crypto.randomUUID(),
                });
            } else {
                await updateAccommodation.mutateAsync(accommodationData);
            }
            setFormAccommodation(initialAccommodationState);
            setIsAccommodationModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseAccommodationModal = () => {
        setAccommodationModalMode("create");
        setFormAccommodation(initialAccommodationState);
        setIsAccommodationModalOpen(false);
    };

    const handleOpenDeleteAccommodationModal = (
        accommodation: AccommodationRow
    ) => {
        setAccommodationToDelete(accommodation);
        setDeleteType("accommodation");
        setDeleteKey(`${accommodation.check_in_date} - ${accommodation.name}`);
        setIsDeleteModalOpen(true);
    };

    // --- Car Rental Modal Handlers ---
    const [isCarRentalModalOpen, setIsCarRentalModalOpen] = useState(false);
    const [carRentalModalMode, setCarRentalModalMode] = useState("create");
    const initialCarRentalState: CarRentalRow = useMemo(
        () => ({
            company: "",
            created_at: null,
            dropoff_datetime: moment().format("YYYY-MM-DD HH:mm"),
            dropoff_loc: "",
            model: "",
            id: crypto.randomUUID(),
            insurance_plan: "",
            pickup_datetime: moment().format("YYYY-MM-DD HH:mm"),
            pickup_loc: "",
            trip_id: tripId ?? "",
            updated_at: null,
            user_id: session ? session.user.id : "",
        }),
        [tripId, session]
    );
    const [formCarRental, setFormCarRental] = useState(initialCarRentalState);
    const [carRentalToDelete, setCarRentalToDelete] =
        useState<CarRentalRow | null>(null);

    const handleOpenCreateCarRentalModal = () => {
        setCarRentalModalMode("create");
        setFormCarRental({ ...initialCarRentalState });
        setIsCarRentalModalOpen(true);
    };

    const handleOpenEditCarRentalModal = (carRental: CarRentalRow) => {
        setCarRentalModalMode("edit");
        setFormCarRental({
            ...carRental,
            pickup_datetime: moment(carRental.pickup_datetime).format(
                "YYYY-MM-DD HH:mm:ss"
            ),
            dropoff_datetime: moment(carRental.dropoff_datetime).format(
                "YYYY-MM-DD HH:mm:ss"
            ),
        });
        setIsCarRentalModalOpen(true);
    };

    const handleCloseCarRentalModal = () => {
        setCarRentalModalMode("create");
        setFormCarRental(initialCarRentalState);
        setIsCarRentalModalOpen(false);
    };

    const handleOpenDeleteCarRentalModal = (carRental: CarRentalRow) => {
        setCarRentalToDelete(carRental);
        setDeleteType("car_rental");
        setDeleteKey(
            `租車公司:${carRental.company} 租車車型: ${
                carRental.model
            } 取車: ${moment(carRental.pickup_datetime).format(
                "YYYY-MM-DD HH:mm:ss"
            )} ${carRental.pickup_loc} 還車: ${moment(
                carRental.dropoff_datetime
            ).format("YYYY-MM-DD HH:mm:ss")} ${carRental.dropoff_loc}`
        );
        setIsDeleteModalOpen(true);
    };

    const handleCarRentalFormInputChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setFormCarRental((prev) => ({ ...prev, [name]: value }));
    };

    const handleCarRentalFormSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const carRentalData = { ...formCarRental };

        try {
            if (carRentalModalMode === "create") {
                await insertCarRental.mutateAsync({
                    ...carRentalData,
                    id: crypto.randomUUID(),
                });
            } else {
                await updateCarRental.mutateAsync(carRentalData);
            }
            setFormCarRental(initialCarRentalState);
            setIsCarRentalModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Common Modal Handlers ---
    const handleConfirmDelete = async () => {
        try {
            switch (deleteType) {
                case "accommodation":
                    if (!accommodationToDelete) return;
                    await removeAccommodation.mutateAsync(
                        accommodationToDelete.id
                    );
                    break;
                case "car_rental":
                    if (!carRentalToDelete) return;
                    await removeCarRental.mutateAsync(carRentalToDelete.id);
                    break;
                case "flight":
                    if (!flightToDelete) return;
                    await removeFlight.mutateAsync(flightToDelete.id);
                    break;
            }

            setIsDeleteModalOpen(false);
            setFlightToDelete(null);
            setAccommodationToDelete(null);
            setCarRentalToDelete(null);
            setDeleteType("");
            setDeleteKey("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setFlightToDelete(null);
        setAccommodationToDelete(null);
        setCarRentalToDelete(null);
        setDeleteType("");
        setDeleteKey("");
    };

    return (
        <div
            className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
                isPrinting
                    ? "h-auto min-h-[50vh] break-after-page overflow-visible bg-white"
                    : `${
                          tripData?.theme_config?.bg || "bg-gray-100"
                      } py-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="預訂資訊"
                    subtitle="Flight・Hotel・CarRental"
                    theme={tripData?.theme_config!}
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
                                {isEditing ? "退出" : "編輯"}
                            </button>
                        </div>
                    }
                />
            )}
            <div
                className={`space-y-6 ${
                    isPrinting ? "space-y-4 px-0" : "px-4"
                }`}
            >
                <FlightList
                    flights={flights}
                    isEditing={isEditing}
                    isPrinting={isPrinting}
                    onAddBtnClick={handleOpenCreateFlightModal}
                    onDeleteBtnClick={handleOpenDeleteFlightModal}
                    onEditBtnClick={handleOpenEditFlightModal}
                />
                <AccommodationList
                    accommodations={accommodations}
                    isEditing={isEditing}
                    isPrinting={isPrinting}
                    onAddBtnClick={handleOpenCreateAccommodationModal}
                    onDeleteBtnClick={handleOpenDeleteAccommodationModal}
                    onEditBtnClick={handleOpenEditAccommodationModal}
                    onViewBtnClick={handleOpenPreviewModal}
                />
                <CarRentalList
                    carRentals={carRentals}
                    isEditing={isEditing}
                    isPrinting={isPrinting}
                    onAddBtnClick={handleOpenCreateCarRentalModal}
                    onDeleteBtnClick={handleOpenDeleteCarRentalModal}
                    onEditBtnClick={handleOpenEditCarRentalModal}
                />
            </div>
            {isFlightModalOpen && (
                <FlightModal
                    formData={formFlight}
                    mode={flightModalMode}
                    theme={tripData?.theme_config!}
                    onCloseBtnClick={handleCloseFlightModal}
                    onFormInputChange={handleFlightFormInputChange}
                    onFormSubmit={handleFlightFormSubmit}
                />
            )}
            {isAccommodationModalOpen && (
                <AccommodationModal
                    formData={formAccommodation}
                    mode={accommodationModalMode}
                    theme={tripData?.theme_config!}
                    onCloseBtnClick={handleCloseAccommodationModal}
                    onFormInputChange={handleAccommodationFormInputChange}
                    onFormSubmit={handleAccommodationFormSubmit}
                />
            )}
            {isCarRentalModalOpen && (
                <CarRentalModal
                    formData={formCarRental}
                    mode={carRentalModalMode}
                    theme={tripData?.theme_config!}
                    onCloseBtnClick={handleCloseCarRentalModal}
                    onFormInputChange={handleCarRentalFormInputChange}
                    onFormSubmit={handleCarRentalFormSubmit}
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

export default InfoPage;
