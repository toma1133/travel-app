import { useState } from "react";
import moment from "moment";
import {
    AlertTriangle,
    Bed,
    Calendar,
    Car,
    MapPin,
    Plane,
    Lock,
    Settings,
    Pencil,
    Trash2,
    Plus,
    X,
} from "lucide-react";
import SectionHeader from "../../components/common/SectionHeader";

const InfoPage = ({
    theme,
    accommodations,
    flights,
    carRentals,
    isPrinting,
    onAddFlight,
    onEditFlight,
    onDeleteFlight,
    onAddAccommodation,
    onEditAccommodation,
    onDeleteAccommodation,
    onAddCarRental,
    onEditCarRental,
    onDeleteCarRental,
}) => {
    const [isEditing, setIsEditing] = useState(false);

    // --- Flight Modal Handlers ---
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [flightModalMode, setFlightModalMode] = useState("create");
    const initialFlightState = {
        type: "",
        code: "",
        flight_date: moment().format("YYYY-MM-DD"),
        departure_time: moment().format("HH:mm"),
        departure_loc: "",
        arrival_time: moment().format("HH:mm"),
        arrival_loc: "",
    };
    const [formFlight, setFormFlight] = useState(initialFlightState);
    const [isDeleteFlightModalOpen, setIsDeleteFlightModalOpen] =
        useState(false);
    const [flightToDelete, setFlightToDelete] = useState(null);

    const handleOpenCreateFlightModal = () => {
        setFlightModalMode("create");
        setFormFlight({ ...initialFlightState });
        setIsFlightModalOpen(true);
    };

    const handleOpenEditFlightModal = (flightItem) => {
        setFlightModalMode("edit");
        setFormFlight(flightItem);
        setIsFlightModalOpen(true);
    };

    const handleOpenDeleteFlightModal = (flightItem) => {
        setFlightToDelete(flightItem);
        setIsDeleteFlightModalOpen(true);
    };

    const handleFlightFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormFlight((prev) => ({ ...prev, [name]: value }));
    };

    const handleFlightSubmit = (e) => {
        e.preventDefault();

        const flightData = { ...formFlight };

        if (flightModalMode === "create") {
            if (onAddFlight) onAddFlight(flightData);
        } else {
            if (onEditFlight) onEditFlight(flightData);
        }

        setFormFlight(initialFlightState);
        setIsFlightModalOpen(false);
    };

    const handleConfirmFlightDelete = () => {
        if (onDeleteFlight && flightToDelete) {
            onDeleteFlight(flightToDelete.id);
        }
        setIsDeleteFlightModalOpen(false);
        setFlightToDelete(null);
    };

    // --- Accommodation Modal Handlers ---
    const [isAccommodationModalOpen, setIsAccommodationModalOpen] =
        useState(false);
    const [accommodationModalMode, setAccommodationModalMode] =
        useState("create");
    const initialAccommodationState = {
        name: "",
        check_in_date: moment().format("YYYY-MM-DD"),
        check_out_date: moment().format("YYYY-MM-DD"),
        address: "",
    };
    const [formAccommodation, setFormAccommodation] = useState(
        initialAccommodationState
    );
    const [isDeleteAccommodationModalOpen, setIsDeleteAccommodationModalOpen] =
        useState(false);
    const [accommodationToDelete, setAccommodationToDelete] = useState(null);

    const handleOpenCreateAccommodationModal = () => {
        setAccommodationModalMode("create");
        setFormAccommodation({ ...initialAccommodationState });
        setIsAccommodationModalOpen(true);
    };

    const handleOpenEditAccommodationModal = (accommodationItem) => {
        setAccommodationModalMode("edit");
        setFormAccommodation(accommodationItem);
        setIsAccommodationModalOpen(true);
    };

    const handleOpenDeleteAccommodationModal = (accommodationItem) => {
        setAccommodationToDelete(accommodationItem);
        setIsDeleteAccommodationModalOpen(true);
    };

    const handleAccommodationFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormAccommodation((prev) => ({ ...prev, [name]: value }));
    };

    const handleAccommodationSubmit = (e) => {
        e.preventDefault();

        const accommodationData = { ...formAccommodation };

        if (accommodationModalMode === "create") {
            if (onAddAccommodation) onAddAccommodation(accommodationData);
        } else {
            if (onEditAccommodation) onEditAccommodation(accommodationData);
        }

        setFormAccommodation(initialAccommodationState);
        setIsAccommodationModalOpen(false);
    };

    const handleConfirmAccommodationDelete = () => {
        if (onDeleteAccommodation && accommodationToDelete) {
            onDeleteAccommodation(accommodationToDelete.id);
        }
        setIsDeleteAccommodationModalOpen(false);
        setAccommodationToDelete(null);
    };

    // --- Car Rental Modal Handlers ---
    const [isCarRentalModalOpen, setIsCarRentalModalOpen] = useState(false);
    const [carRentalModalMode, setCarRentalModalMode] = useState("create");
    const initialCarRentalState = {
        company: "",
        pickup_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        dropoff_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        pickup_loc: "",
        dropoff_loc: "",
        model: "",
        insurance_plan: "",
    };
    const [formCarRental, setFormCarRental] = useState(initialCarRentalState);
    const [isDeleteCarRentalModalOpen, setIsDeleteCarRentalModalOpen] =
        useState(false);
    const [carRentalToDelete, setCarRentalToDelete] = useState(null);

    const handleOpenCreateCarRentalModal = () => {
        setCarRentalModalMode("create");
        setFormCarRental({ ...initialCarRentalState });
        setIsCarRentalModalOpen(true);
    };

    const handleOpenEditCarRentalModal = (carRentalItem) => {
        setCarRentalModalMode("edit");
        setFormCarRental({
            ...carRentalItem,
            pickup_datetime: moment(carRentalItem.pickup_datetime).format(
                "YYYY-MM-DD HH:mm:ss"
            ),
            dropoff_datetime: moment(carRentalItem.dropoff_datetime).format(
                "YYYY-MM-DD HH:mm:ss"
            ),
        });
        setIsCarRentalModalOpen(true);
    };

    const handleOpenDeleteCarRentalModal = (carRentalItem) => {
        setCarRentalToDelete(carRentalItem);
        setIsDeleteCarRentalModalOpen(true);
    };

    const handleCarRentalFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormCarRental((prev) => ({ ...prev, [name]: value }));
    };

    const handleCarRentalSubmit = (e) => {
        e.preventDefault();

        const carRentalData = { ...formCarRental };

        if (carRentalModalMode === "create") {
            if (onAddCarRental) onAddCarRental(carRentalData);
        } else {
            if (onEditCarRental) onEditCarRental(carRentalData);
        }

        setFormCarRental(initialCarRentalState);
        setIsCarRentalModalOpen(false);
    };

    const handleConfirmCarRentalDelete = () => {
        if (onDeleteCarRental && carRentalToDelete) {
            onDeleteCarRental(carRentalToDelete.id);
        }
        setIsDeleteCarRentalModalOpen(false);
        setCarRentalToDelete(null);
    };

    return (
        <div
            className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
                isPrinting
                    ? "p-4 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                    : `${theme.bg || "bg-gray-100"} py-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="預訂資訊"
                    subtitle="航班・住宿・租車"
                    theme={theme}
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
                <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
                    <div className="flex items-center justify-between mb-4 text-[#8E354A] print:text-gray-700">
                        <div className="flex justify-between">
                            <Plane size={18} className="mr-2" />
                            <h3 className="font-bold text-sm tracking-wider uppercase">
                                Flights
                            </h3>
                        </div>
                        {!isPrinting && isEditing && (
                            <div
                                className={`
                                    flex space-x-2 bg-white pr-2
                                    transition-opacity duration-200
                                `}
                            >
                                <button
                                    type="button"
                                    onClick={handleOpenCreateFlightModal}
                                    className={`p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                                    title="新增航班"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    {Array.isArray(flights) &&
                        flights.map((f, i) => (
                            <div key={i} className="relative">
                                <div
                                    className={`flex justify-between items-center text-sm py-2 print:py-1.5 print:text-gray-800 ${
                                        i !== 0
                                            ? "border-t border-gray-100 print:border-gray-200"
                                            : ""
                                    }`}
                                >
                                    <div>
                                        <div className="font-bold text-gray-800 print:text-base">
                                            {f.departure_loc} - {f.arrival_loc}
                                        </div>
                                        <div className="text-xs text-gray-400 print:text-gray-600">
                                            {f.flight_date}・{f.code}
                                        </div>
                                    </div>
                                    <div className="font-mono text-gray-600 print:text-gray-800">
                                        {moment(
                                            f.departure_time,
                                            "HH:mm:ss"
                                        ).format("HH:mm")}
                                        -
                                        {moment(
                                            f.arrival_time,
                                            "HH:mm:ss"
                                        ).format("HH:mm")}
                                    </div>
                                    {!isPrinting && isEditing && (
                                        <div
                                            className={`
                                                flex space-x-2 bg-white pr-2
                                                transition-opacity duration-200
                                            `}
                                        >
                                            <button
                                                onClick={() =>
                                                    handleOpenEditFlightModal(f)
                                                }
                                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="編輯航班"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleOpenDeleteFlightModal(
                                                        f
                                                    )
                                                }
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                title="刪除航班"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
                    <div className="flex items-center justify-between mb-4 text-[#8E354A] print:text-gray-700">
                        <div className="flex justify-between">
                            <Bed size={18} className="mr-2" />
                            <h3 className="font-bold text-sm tracking-wider uppercase">
                                Hotels
                            </h3>
                        </div>
                        {!isPrinting && isEditing && (
                            <div
                                className={`
                                    flex space-x-2 bg-white pr-2
                                    transition-opacity duration-200
                                `}
                            >
                                <button
                                    onClick={handleOpenCreateAccommodationModal}
                                    className={`p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                                    title="新增住宿"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    {Array.isArray(accommodations) &&
                        accommodations.map((h, i) => (
                            <div
                                key={i}
                                className={`flex justify-between items-start pt-4 mb-4 last:mb-0 ${
                                    i !== 0
                                        ? "border-t border-gray-100 print:border-gray-200"
                                        : ""
                                }`}
                            >
                                <div>
                                    <div className="font-bold text-gray-800 text-sm mb-1 print:text-base">
                                        {h.name}
                                    </div>
                                    <div className="flex items-start text-xs text-gray-500 print:text-gray-600">
                                        <Calendar
                                            size={12}
                                            className="mr-1.5 mt-0.5"
                                        />
                                        {h.check_in_date} - {h.check_out_date}
                                    </div>
                                    <div className="flex items-start text-xs text-gray-500 mt-1 print:text-gray-600">
                                        <MapPin
                                            size={12}
                                            className="mr-1.5 mt-0.5 shrink-0"
                                        />
                                        <span className="truncate">
                                            {h.address}
                                        </span>
                                    </div>
                                </div>
                                {!isPrinting && isEditing && (
                                    <div
                                        className={`
                                                flex space-x-2 bg-white pr-2
                                                transition-opacity duration-200 
                                            `}
                                    >
                                        <button
                                            onClick={() =>
                                                handleOpenEditAccommodationModal(
                                                    h
                                                )
                                            }
                                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                            title="編輯住宿"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleOpenDeleteAccommodationModal(
                                                    h
                                                )
                                            }
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="刪除住宿"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
                    <div className="flex items-center justify-between mb-4 text-[#8E354A] print:text-gray-700">
                        <div className="flex justify-between">
                            <Car size={18} className="mr-2" />
                            <h3 className="font-bold text-sm tracking-wider uppercase">
                                Rental Car
                            </h3>
                        </div>
                        {!isPrinting && isEditing && (
                            <div
                                className={`
                                    flex space-x-2 bg-white pr-2
                                    transition-opacity duration-200
                                `}
                            >
                                <button
                                    type="button"
                                    onClick={handleOpenCreateCarRentalModal}
                                    className={`p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                                    title="新增租車"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    {Array.isArray(carRentals) &&
                        carRentals.map((carRental, i) => (
                            <div
                                key={i}
                                className={`flex justify-between items-start pt-4 mb-4 last:mb-0 ${
                                    i !== 0
                                        ? "border-t border-gray-100 print:border-gray-200"
                                        : ""
                                }`}
                            >
                                <div className="w-full text-sm px-2">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-500 print:text-gray-600">
                                            租車公司
                                        </span>
                                        <span className="font-bold text-gray-800">
                                            {carRental.company}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-500 print:text-gray-600">
                                            車型
                                        </span>
                                        <span className="font-bold text-gray-800">
                                            {carRental.model}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-500 print:text-gray-600">
                                            保險
                                        </span>
                                        <span className="font-bold text-gray-800">
                                            {carRental.insurance_plan}
                                        </span>
                                    </div>
                                    {/* 取還車細節 */}
                                    <div className="p-4 bg-gray-50 rounded text-xs space-y-2 print:bg-white print:border print:border-gray-200 print:mt-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 print:text-gray-600">
                                                取車
                                            </span>
                                            <span className="text-gray-700 print:text-gray-800">
                                                {carRental.pickup_loc}{" "}
                                                {moment(
                                                    carRental.pickup_datetime
                                                ).format("YYYY-MM-DD HH:mm")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 print:text-gray-600">
                                                還車
                                            </span>
                                            <span className="text-gray-700 print:text-gray-800">
                                                {carRental.dropoff_loc}{" "}
                                                {moment(
                                                    carRental.dropoff_datetime
                                                ).format("YYYY-MM-DD HH:mm")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {!isPrinting && isEditing && (
                                    <div
                                        className={`
                                                flex space-x-2 bg-white pr-2
                                                transition-opacity duration-200 
                                            `}
                                    >
                                        <button
                                            onClick={() =>
                                                handleOpenEditCarRentalModal(
                                                    carRental
                                                )
                                            }
                                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                            title="編輯租車"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleOpenDeleteCarRentalModal(
                                                    carRental
                                                )
                                            }
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="刪除租車"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </div>

            {/* ==================================== */}
            {/* Add/Edit Flight Modal */}
            {/* ==================================== */}
            {isFlightModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">
                                {flightModalMode === "create"
                                    ? `新增航班`
                                    : "編輯航班"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsFlightModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Form */}
                        <div className="p-6 overflow-y-auto">
                            <form
                                id="flight-form"
                                onSubmit={handleFlightSubmit}
                                className="space-y-4"
                            >
                                {/* Departure and arrive location */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                            出發地
                                        </label>
                                        <input
                                            required
                                            name="departure_loc"
                                            value={formFlight.departure_loc}
                                            onChange={
                                                handleFlightFormInputChange
                                            }
                                            placeholder="TPE"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            目的地
                                        </label>
                                        <input
                                            required
                                            name="arrival_loc"
                                            value={formFlight.arrival_loc}
                                            onChange={
                                                handleFlightFormInputChange
                                            }
                                            placeholder="KIX"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Code and flight date */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                            航班代號
                                        </label>
                                        <input
                                            required
                                            name="code"
                                            value={formFlight.code}
                                            onChange={
                                                handleFlightFormInputChange
                                            }
                                            placeholder="JX800"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            目的地
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            name="flight_date"
                                            value={formFlight.flight_date}
                                            onChange={
                                                handleFlightFormInputChange
                                            }
                                            placeholder="2023/10/10"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Departure and arrive time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            起飛時間
                                        </label>
                                        <input
                                            required
                                            type="time"
                                            name="departure_time"
                                            value={formFlight.departure_time}
                                            onChange={
                                                handleFlightFormInputChange
                                            }
                                            placeholder="08:30"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            抵達時間
                                        </label>
                                        <input
                                            required
                                            type="time"
                                            name="arrival_time"
                                            value={formFlight.arrival_time}
                                            onChange={
                                                handleFlightFormInputChange
                                            }
                                            placeholder="12:00"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsFlightModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                form="flight-form"
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme.accent}`}
                            >
                                {flightModalMode === "create"
                                    ? "新增航班"
                                    : "儲存變更"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Flight Confirmation Modal */}
            {isDeleteFlightModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                確定要刪除航班？
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            您即將刪除航班：
                            <span className="font-bold text-gray-800">
                                {flightToDelete?.departure_loc}-
                                {flightToDelete?.arrival_loc}於
                                {flightToDelete?.flight_date}代號
                                {flightToDelete?.code}
                            </span>
                            。此動作無法復原。
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsDeleteFlightModalOpen(false)
                                }
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmFlightDelete}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================== */}
            {/* Add/Edit Accommodation Modal */}
            {/* ==================================== */}
            {isAccommodationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">
                                {accommodationModalMode === "create"
                                    ? `新增住宿`
                                    : "編輯住宿"}
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setIsAccommodationModalOpen(false)
                                }
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Form */}
                        <div className="p-6 overflow-y-auto">
                            <form
                                id="accommodation-form"
                                onSubmit={handleAccommodationSubmit}
                                className="space-y-4"
                            >
                                {/* Hotel name */}
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                            住宿名稱
                                        </label>
                                        <input
                                            required
                                            name="name"
                                            value={formAccommodation.name}
                                            onChange={
                                                handleAccommodationFormInputChange
                                            }
                                            placeholder="XXX飯店"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                {/* Checkin and Checkout date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            入住日期
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            name="check_in_date"
                                            value={
                                                formAccommodation.check_in_date
                                            }
                                            onChange={
                                                handleAccommodationFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            退房日期
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            name="check_out_date"
                                            value={
                                                formAccommodation.check_out_date
                                            }
                                            onChange={
                                                handleAccommodationFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Address */}
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                            地址
                                        </label>
                                        <input
                                            name="address"
                                            value={formAccommodation.address}
                                            onChange={
                                                handleAccommodationFormInputChange
                                            }
                                            placeholder="XXX市XXX區"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsAccommodationModalOpen(false)
                                }
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                form="accommodation-form"
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme.accent}`}
                            >
                                {accommodationModalMode === "create"
                                    ? "新增住宿"
                                    : "儲存變更"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Accommodation Confirmation Modal */}
            {isDeleteAccommodationModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                確定要刪除住宿？
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            您即將刪除住宿：
                            <span className="font-bold text-gray-800">
                                {accommodationToDelete.name}於
                                {accommodationToDelete.check_in_date}
                            </span>
                            。此動作無法復原。
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsDeleteAccommodationModalOpen(false)
                                }
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmAccommodationDelete}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================== */}
            {/* Add/Edit Car Rental Modal */}
            {/* ==================================== */}
            {isCarRentalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">
                                {carRentalModalMode === "create"
                                    ? `新增租車`
                                    : "編輯租車"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsCarRentalModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Form */}
                        <div className="p-6 overflow-y-auto">
                            <form
                                id="car-rental-form"
                                onSubmit={handleCarRentalSubmit}
                                className="space-y-4"
                            >
                                {/* Company name */}
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                            租車公司
                                        </label>
                                        <input
                                            required
                                            name="company"
                                            value={formCarRental.company}
                                            onChange={
                                                handleCarRentalFormInputChange
                                            }
                                            placeholder="Toyota Rent a Car"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                {/* Insurance and model */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            保險方案
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="insurance_plan"
                                            value={formCarRental.insurance_plan}
                                            onChange={
                                                handleCarRentalFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            車型
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="model"
                                            value={formCarRental.model}
                                            onChange={
                                                handleCarRentalFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Pickup and Dropoff location */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            取車地點
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="pickup_loc"
                                            value={formCarRental.pickup_loc}
                                            onChange={
                                                handleCarRentalFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            還車地點
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="dropoff_loc"
                                            value={formCarRental.dropoff_loc}
                                            onChange={
                                                handleCarRentalFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Dropoff date and location */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            取車日期
                                        </label>
                                        <input
                                            required
                                            type="datetime-local"
                                            name="pickup_datetime"
                                            value={
                                                formCarRental.pickup_datetime
                                            }
                                            onChange={
                                                handleCarRentalFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            還車日期
                                        </label>
                                        <input
                                            required
                                            type="datetime-local"
                                            name="dropoff_datetime"
                                            value={
                                                formCarRental.dropoff_datetime
                                            }
                                            onChange={
                                                handleCarRentalFormInputChange
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsCarRentalModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                form="car-rental-form"
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme.accent}`}
                            >
                                {carRentalModalMode === "create"
                                    ? "新增租車"
                                    : "儲存變更"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Car Rental Confirmation Modal */}
            {isDeleteCarRentalModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                確定要刪除租車？
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            您即將刪除租車：
                            <span className="font-bold text-gray-800">
                                {carRentalToDelete.company},{" "}
                                {carRentalToDelete.model}於
                                {carRentalToDelete.pickup_loc}{" "}
                                {moment(
                                    carRentalToDelete.pickup_datetime
                                ).format("YYYY-MM-DD HH:mm")}
                            </span>
                            。此動作無法復原。
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsDeleteCarRentalModalOpen(false)
                                }
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCarRentalDelete}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfoPage;
