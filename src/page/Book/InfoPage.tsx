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
import type { AccommodationRow } from "../../models/types/AccommodationTypes";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";
import type { FlightRow } from "../../models/types/FlightTypes";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import FlightList from "../../components/info/FlightList";
import FlightModal from "../../components/info/FlightModal";
import AccommodationList from "../../components/info/AccommodationList";
import AccommodationModal from "../../components/info/AccommodationModal";
import CarRentalList from "../../components/info/CarRentalList";
import CarRentalModal from "../../components/info/CarRentalModal";

type InfoPageProps = {
    isPrinting?: boolean;
};

const InfoPage = ({ isPrinting }: InfoPageProps) => {
    const { session } = useAuth();
    const { id: tripId } = useParams<{ id: string }>();
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
    const { tripData } = useOutletContext<BookLayoutContextType>();
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
            arrival_time: moment().format("HH:mm:ss"),
            code: "",
            created_at: null,
            departure_loc: "",
            departure_time: moment().format("HH:mm:ss"),
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
            dropoff_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
            dropoff_loc: "",
            model: "",
            id: crypto.randomUUID(),
            insurance_plan: "",
            pickup_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
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
            setDeleteType("");
            setDeleteKey("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setFlightToDelete(null);
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
                    title="預訂資訊"
                    subtitle="航班・住宿・租車"
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
                        </div>
                    }
                />
            )}
            <div className="px-4 space-y-6 print:space-y-4">
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
                    theme={tripData.theme_config}
                    onCloseBtnClick={handleCloseFlightModal}
                    onFormInputChange={handleFlightFormInputChange}
                    onSubmit={handleFlightFormSubmit}
                />
            )}
            {isAccommodationModalOpen && (
                <AccommodationModal
                    formData={formAccommodation}
                    mode={accommodationModalMode}
                    theme={tripData.theme_config}
                    onCloseBtnClick={handleCloseAccommodationModal}
                    onFormInputChange={handleAccommodationFormInputChange}
                    onSubmit={handleAccommodationFormSubmit}
                />
            )}
            {isCarRentalModalOpen && (
                <CarRentalModal
                    formData={formCarRental}
                    mode={carRentalModalMode}
                    theme={tripData.theme_config}
                    onCloseBtnClick={handleCloseCarRentalModal}
                    onFormInputChange={handleCarRentalFormInputChange}
                    onSubmit={handleCarRentalFormSubmit}
                />
            )}
            {isDeleteModalOpen && (
                <DeleteModal
                    deleteKey={deleteKey}
                    onCloseClick={handleCloseDeleteModal}
                    onConfirmClick={handleConfirmDelete}
                />
            )}
        </div>
    );
};

export default InfoPage;

// const InfoPage = ({
//     carRentals,
//     onAddCarRental,
//     onEditCarRental,
//     onDeleteCarRental,
// }) => {

//     return (
//         <div
//             className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
//                 isPrinting
//                     ? "p-4 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
//                     : `${theme.bg || "bg-gray-100"} py-12 pb-24`
//             }`}
//         >

//             {/* ==================================== */}
//             {/* Add/Edit Car Rental Modal */}
//             {/* ==================================== */}
//             {isCarRentalModalOpen && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
//                     <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
//                         {/* Modal Header */}
//                         <div className="flex justify-between items-center p-4 border-b border-gray-100">
//                             <h3 className="text-lg font-bold text-gray-800">
//                                 {carRentalModalMode === "create"
//                                     ? `新增租車`
//                                     : "編輯租車"}
//                             </h3>
//                             <button
//                                 type="button"
//                                 onClick={() => setIsCarRentalModalOpen(false)}
//                                 className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
//                             >
//                                 <X size={20} />
//                             </button>
//                         </div>

//                         {/* Modal Body - Form */}
//                         <div className="p-6 overflow-y-auto">
//                             <form
//                                 id="car-rental-form"
//                                 onSubmit={handleCarRentalSubmit}
//                                 className="space-y-4"
//                             >
//                                 {/* Company name */}
//                                 <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
//                                     <div className="col-span-2">
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
//                                             租車公司
//                                         </label>
//                                         <input
//                                             required
//                                             name="company"
//                                             value={formCarRental.company}
//                                             onChange={
//                                                 handleCarRentalFormInputChange
//                                             }
//                                             placeholder="Toyota Rent a Car"
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
//                                         />
//                                     </div>
//                                 </div>
//                                 {/* Insurance and model */}
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="col-span-1 md:col-span-2">
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             保險方案
//                                         </label>
//                                         <input
//                                             required
//                                             type="text"
//                                             name="insurance_plan"
//                                             value={formCarRental.insurance_plan}
//                                             onChange={
//                                                 handleCarRentalFormInputChange
//                                             }
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                     <div className="col-span-1 md:col-span-2">
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             車型
//                                         </label>
//                                         <input
//                                             required
//                                             type="text"
//                                             name="model"
//                                             value={formCarRental.model}
//                                             onChange={
//                                                 handleCarRentalFormInputChange
//                                             }
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                 </div>
//                                 {/* Pickup and Dropoff location */}
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="col-span-1 md:col-span-2">
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             取車地點
//                                         </label>
//                                         <input
//                                             required
//                                             type="text"
//                                             name="pickup_loc"
//                                             value={formCarRental.pickup_loc}
//                                             onChange={
//                                                 handleCarRentalFormInputChange
//                                             }
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                     <div className="col-span-1 md:col-span-2">
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             還車地點
//                                         </label>
//                                         <input
//                                             required
//                                             type="text"
//                                             name="dropoff_loc"
//                                             value={formCarRental.dropoff_loc}
//                                             onChange={
//                                                 handleCarRentalFormInputChange
//                                             }
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                 </div>
//                                 {/* Dropoff date and location */}
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="col-span-2 md:col-span-2">
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             取車日期
//                                         </label>
//                                         <input
//                                             required
//                                             type="datetime-local"
//                                             name="pickup_datetime"
//                                             value={
//                                                 formCarRental.pickup_datetime
//                                             }
//                                             onChange={
//                                                 handleCarRentalFormInputChange
//                                             }
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                     <div className="col-span-2 md:col-span-2">
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             還車日期
//                                         </label>
//                                         <input
//                                             required
//                                             type="datetime-local"
//                                             name="dropoff_datetime"
//                                             value={
//                                                 formCarRental.dropoff_datetime
//                                             }
//                                             onChange={
//                                                 handleCarRentalFormInputChange
//                                             }
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                 </div>
//                             </form>
//                         </div>

//                         {/* Modal Footer */}
//                         <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
//                             <button
//                                 type="button"
//                                 onClick={() => setIsCarRentalModalOpen(false)}
//                                 className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
//                             >
//                                 取消
//                             </button>
//                             <button
//                                 type="submit"
//                                 form="car-rental-form"
//                                 className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme.accent}`}
//                             >
//                                 {carRentalModalMode === "create"
//                                     ? "新增租車"
//                                     : "儲存變更"}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Delete Car Rental Confirmation Modal */}
//             {isDeleteCarRentalModalOpen && (
//                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
//                     <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
//                         <div className="flex items-center space-x-3 mb-4">
//                             <div className="p-2 bg-red-100 rounded-full text-red-600">
//                                 <AlertTriangle size={24} />
//                             </div>
//                             <h3 className="text-lg font-bold text-gray-900">
//                                 確定要刪除租車？
//                             </h3>
//                         </div>
//                         <p className="text-sm text-gray-600 mb-6">
//                             您即將刪除租車：
//                             <span className="font-bold text-gray-800">
//                                 {carRentalToDelete.company},{" "}
//                                 {carRentalToDelete.model}於
//                                 {carRentalToDelete.pickup_loc}{" "}
//                                 {moment(
//                                     carRentalToDelete.pickup_datetime
//                                 ).format("YYYY-MM-DD HH:mm")}
//                             </span>
//                             。此動作無法復原。
//                         </p>
//                         <div className="flex justify-end space-x-3">
//                             <button
//                                 type="button"
//                                 onClick={() =>
//                                     setIsDeleteCarRentalModalOpen(false)
//                                 }
//                                 className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                             >
//                                 取消
//                             </button>
//                             <button
//                                 type="button"
//                                 onClick={handleConfirmCarRentalDelete}
//                                 className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
//                             >
//                                 確認刪除
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default InfoPage;
