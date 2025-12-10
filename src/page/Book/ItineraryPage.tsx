import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import moment from "moment";
import { Calendar, Lock, Settings } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import useItinerarys from "../../hooks/itinerary/UseItinerarys";
import useItineraryMutations from "../../hooks/itinerary/UseItineraryMutations";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";
import SectionHeader from "../../components/common/SectionHeader";

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
        </div>
    );
};

export default ItineraryPage;

// import { useState } from "react";
// import moment from "moment";
// import {
//     AlertTriangle,
//     Calendar,
//     Clock,
//     Lock,
//     Settings,
//     Tag,
//     X,
// } from "lucide-react";
// import DayItem from "../../components/itinerary/DayItem";
// import SectionHeader from "../../components/common/SectionHeader";

// const ItineraryPage = ({
//     itinerary,
//     theme,
//     isPrinting,
//     onNavigateToPlace,
//     onAddActivity,
//     onEditActivity,
//     onDeleteActivity,
//     onAddDay,
//     onEditDay,
//     onDeleteDay,
// }) => {
//     const [expandedDay, setExpandedDay] = useState(1);
//     const [isEditing, setIsEditing] = useState(false);

//     // --- Activity State ---
//     const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
//     const [activityModalMode, setActivityModalMode] = useState("create");
//     const initialActivityState = {
//         time: moment().format("HH:mm"),
//         title: "",
//         desc: "",
//         type: "sight",
//         linkId: "",
//         dayId: null,
//         activityIndex: null,
//     };
//     const [formActivity, setFormActivity] = useState(initialActivityState);
//     // Delete Confirmation Modal State (for Activity)
//     const [isDeleteActivityModalOpen, setIsDeleteActivityModalOpen] =
//         useState(false);
//     const [activityToDelete, setActivityToDelete] = useState(null);

//     // --- Day State ---
//     const [isDayModalOpen, setIsDayModalOpen] = useState(false);
//     const [dayModalMode, setDayModalMode] = useState("create");
//     const initialDayState = {
//         date: moment().format("YYYY-MM-DD"),
//         title: "",
//         day_number: 1,
//         weekday: moment().format("ddd"),
//     };
//     const [formDay, setFormDay] = useState(initialDayState);
//     const [isDeleteDayModalOpen, setIsDeleteDayModalOpen] = useState(false);
//     const [dayToDelete, setDayToDelete] = useState(null);

//     // --- Activity Modal Handlers ---
//     const handleOpenCreateActivityModal = (dayId) => {
//         setActivityModalMode("create");
//         setFormActivity({ ...initialActivityState, dayId });
//         setIsActivityModalOpen(true);
//     };

//     const handleOpenEditActivityModal = (dayId, activity, activityIndex) => {
//         setActivityModalMode("edit");
//         setFormActivity({
//             ...activity,
//             dayId,
//             activityIndex,
//         });
//         setIsActivityModalOpen(true);
//     };

//     const handleOpenDeleteActivityModal = (
//         dayId,
//         activityTitle,
//         activityIndex
//     ) => {
//         setActivityToDelete({ dayId, activityTitle, activityIndex });
//         setIsDeleteActivityModalOpen(true);
//     };

//     const handleActivityFormInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormActivity((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleActivitySubmit = (e) => {
//         e.preventDefault();

//         const activityData = { ...formActivity };

//         if (activityModalMode === "create") {
//             if (onAddActivity) onAddActivity(activityData);
//         } else {
//             if (onEditActivity) onEditActivity(activityData);
//         }

//         setFormActivity(initialActivityState);
//         setIsActivityModalOpen(false);
//     };

//     const handleConfirmActivityDelete = () => {
//         if (onDeleteActivity && activityToDelete) {
//             onDeleteActivity({
//                 dayId: activityToDelete.dayId,
//                 activityTitle: activityToDelete.activityTitle,
//                 activityIndex: activityToDelete.activityIndex,
//             });
//         }
//         setIsDeleteActivityModalOpen(false);
//         setActivityToDelete(null);
//     };

//     // --- Day Modal Handlers ---
//     const handleOpenCreateDayModal = () => {
//         setFormDay(initialDayState);
//         setDayModalMode("create");
//         setIsDayModalOpen(true);
//     };

//     const handleOpenEditDayModal = (dayItem) => {
//         setFormDay(dayItem);
//         setDayModalMode("edit");
//         setIsDayModalOpen(true);
//     };

//     const handleOpenDeleteDayModal = (dayItem) => {
//         setDayToDelete(dayItem);
//         setIsDeleteDayModalOpen(true);
//     };

//     const handleDayInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormDay((prev) => ({ ...prev, [name]: value }));

//         if (name === "date") {
//             setFormDay((prev) => ({
//                 ...prev,
//                 weekday: moment(value).format("ddd"),
//             }));
//         }
//     };

//     const handleDaySubmit = (e) => {
//         e.preventDefault();

//         const dayData = { ...formDay };

//         if (dayModalMode === "create") {
//             if (onAddDay) onAddDay(dayData);
//         } else {
//             if (onEditDay) onEditDay(dayData);
//         }

//         setFormDay(initialDayState);
//         setIsDayModalOpen(false);
//     };

//     const handleConfirmDayDelete = () => {
//         if (onDeleteDay && dayToDelete) {
//             onDeleteDay(dayToDelete.id);
//         }
//         setIsDeleteDayModalOpen(false);
//         setDayToDelete(null);
//     };

//     return (
//         <div
//             className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
//                 isPrinting
//                     ? "p-0 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
//                     : `${theme.bg || "bg-gray-100"} py-12 pb-24`
//             }`}
//         >
//             {!isPrinting && (
//                 <>
//                     <SectionHeader
//                         title="旅程表"
//                         subtitle="時間與移動的軌跡"
//                         theme={theme}
//                         rightAction={
//                             <div className="flex justify-center items-center gap-4">
//                                 {/* 編輯模式切換按鈕 */}
//                                 <button
//                                     type="button"
//                                     onClick={() => setIsEditing(!isEditing)}
//                                     className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg shadow-md transition-all ${
//                                         isEditing
//                                             ? "bg-red-500 text-white hover:bg-red-600"
//                                             : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
//                                     }`}
//                                 >
//                                     {isEditing ? (
//                                         <Lock size={16} className="mr-1" />
//                                     ) : (
//                                         <Settings size={16} className="mr-1" />
//                                     )}
//                                     {isEditing ? "退出編輯" : "開始編輯"}
//                                 </button>
//                                 <button
//                                     type="button"
//                                     onClick={handleOpenCreateDayModal}
//                                     className={`flex items-center text-sm font-medium text-white px-4 py-2 rounded-lg shadow-md ${theme.accent} hover:opacity-90 transition-opacity`}
//                                 >
//                                     <Calendar size={16} className="mr-1" />
//                                     新增日程
//                                 </button>
//                             </div>
//                         }
//                     />
//                 </>
//             )}
//             {/* 行程清單 */}
//             <div
//                 className={`space-y-4 px-4 ${
//                     isPrinting ? "print:space-y-3" : ""
//                 }`}
//             >
//                 {Array.isArray(itinerary) && itinerary.length > 0 ? (
//                     itinerary.map((day) => (
//                         <DayItem
//                             key={day.id}
//                             day={day}
//                             theme={theme}
//                             isPrinting={isPrinting}
//                             isEditing={isEditing} // 傳遞編輯模式狀態
//                             categoryColor={theme.categoryColor}
//                             expanded={expandedDay === day.day_number}
//                             onToggle={() =>
//                                 setExpandedDay(
//                                     expandedDay === day.day_number
//                                         ? null
//                                         : day.day_number
//                                 )
//                             }
//                             onNavigate={onNavigateToPlace}
//                             onAddActivity={handleOpenCreateActivityModal}
//                             onEditActivity={handleOpenEditActivityModal}
//                             onDeleteActivity={handleOpenDeleteActivityModal}
//                             onEditDay={handleOpenEditDayModal}
//                             onDeleteDay={handleOpenDeleteDayModal}
//                         />
//                     ))
//                 ) : (
//                     // 提示新增日程
//                     <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300 mx-4">
//                         <p className="text-gray-500 mb-4">
//                             目前沒有任何日程，請點擊上方按鈕開始規劃！
//                         </p>
//                         <button
//                             type="button"
//                             onClick={handleOpenCreateDayModal}
//                             className={`flex items-center mx-auto text-xs font-medium text-white px-3 py-1.5 rounded-full shadow-sm ${theme.accent} hover:opacity-90 transition-opacity`}
//                         >
//                             <Calendar size={12} className="mr-1" />
//                             新增第一個日程
//                         </button>
//                     </div>
//                 )}

//                 {/* ==================================== */}
//                 {/* Add/Edit Day Modal */}
//                 {/* ==================================== */}
//                 {isDayModalOpen && (
//                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
//                         <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
//                             {/* Modal Header */}
//                             <div className="flex justify-between items-center p-4 border-b border-gray-100">
//                                 <h3 className="text-lg font-bold text-gray-800">
//                                     {dayModalMode === "create"
//                                         ? `新增日程`
//                                         : "編輯日程"}
//                                 </h3>
//                                 <button
//                                     type="button"
//                                     onClick={() => setIsDayModalOpen(false)}
//                                     className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
//                                 >
//                                     <X size={20} />
//                                 </button>
//                             </div>

//                             {/* Modal Body - Form */}
//                             <div className="p-6 overflow-y-auto">
//                                 <form
//                                     id="day-form"
//                                     onSubmit={handleDaySubmit}
//                                     className="space-y-4"
//                                 >
//                                     <div>
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
//                                             <Calendar
//                                                 size={12}
//                                                 className="mr-1"
//                                             />{" "}
//                                             日期 *
//                                         </label>
//                                         <input
//                                             required
//                                             type="date"
//                                             name="date"
//                                             value={formDay.date}
//                                             onChange={handleDayInputChange}
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             旅遊第幾天
//                                         </label>
//                                         <input
//                                             type="number"
//                                             name="day_number"
//                                             min="1"
//                                             value={formDay.day_number}
//                                             onChange={handleDayInputChange}
//                                             placeholder="0"
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             當日主題 (可選)
//                                         </label>
//                                         <input
//                                             name="title"
//                                             value={formDay.title}
//                                             onChange={handleDayInputChange}
//                                             placeholder="例如：清水寺周邊散步"
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                         />
//                                     </div>
//                                 </form>
//                             </div>

//                             {/* Modal Footer */}
//                             <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
//                                 <button
//                                     type="button"
//                                     onClick={() => setIsDayModalOpen(false)}
//                                     className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
//                                 >
//                                     取消
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     form="day-form"
//                                     className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme.accent}`}
//                                 >
//                                     {dayModalMode === "create"
//                                         ? "新增日程"
//                                         : "儲存變更"}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Delete Day Confirmation Modal */}
//                 {isDeleteDayModalOpen && (
//                     <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
//                         <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
//                             <div className="flex items-center space-x-3 mb-4">
//                                 <div className="p-2 bg-red-100 rounded-full text-red-600">
//                                     <AlertTriangle size={24} />
//                                 </div>
//                                 <h3 className="text-lg font-bold text-gray-900">
//                                     確定要刪除日程？
//                                 </h3>
//                             </div>
//                             <p className="text-sm text-gray-600 mb-6">
//                                 您即將刪除日程：
//                                 <span className="font-bold text-gray-800">
//                                     {dayToDelete?.date}
//                                 </span>
//                                 。此動作無法復原。
//                             </p>
//                             <div className="flex justify-end space-x-3">
//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setIsDeleteDayModalOpen(false)
//                                     }
//                                     className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                                 >
//                                     取消
//                                 </button>
//                                 <button
//                                     type="button"
//                                     onClick={handleConfirmDayDelete}
//                                     className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
//                                 >
//                                     確認刪除
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* ==================================== */}
//                 {/* Add/Edit Activity Modal (現有活動管理) */}
//                 {/* ==================================== */}
//                 {isActivityModalOpen && (
//                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
//                         <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
//                             {/* Modal Header */}
//                             <div className="flex justify-between items-center p-4 border-b border-gray-100">
//                                 <h3 className="text-lg font-bold text-gray-800">
//                                     {activityModalMode === "create"
//                                         ? `新增 Day ${
//                                               itinerary.find(
//                                                   (d) =>
//                                                       d.id ===
//                                                       formActivity.dayId
//                                               )?.day_number
//                                           } 活動`
//                                         : "編輯活動"}
//                                 </h3>
//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setIsActivityModalOpen(false)
//                                     }
//                                     className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
//                                 >
//                                     <X size={20} />
//                                 </button>
//                             </div>

//                             {/* Modal Body - Scrollable Form */}
//                             <div className="p-6 overflow-y-auto">
//                                 <form
//                                     id="activity-form"
//                                     onSubmit={handleActivitySubmit}
//                                     className="space-y-4"
//                                 >
//                                     {/* Time and Title */}
//                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                         <div className="col-span-1 md:col-span-1">
//                                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
//                                                 <Clock
//                                                     size={12}
//                                                     className="mr-1"
//                                                 />{" "}
//                                                 時間 *
//                                             </label>
//                                             <input
//                                                 type="time"
//                                                 required
//                                                 name="time"
//                                                 value={formActivity.time}
//                                                 onChange={
//                                                     handleActivityFormInputChange
//                                                 }
//                                                 placeholder="例如: 09:30"
//                                                 className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
//                                             />
//                                         </div>
//                                         <div className="col-span-1 md:col-span-2">
//                                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                                 標題 *
//                                             </label>
//                                             <input
//                                                 required
//                                                 name="title"
//                                                 value={formActivity.title}
//                                                 onChange={
//                                                     handleActivityFormInputChange
//                                                 }
//                                                 placeholder="例如：從飯店出發"
//                                                 className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
//                                             />
//                                         </div>
//                                     </div>

//                                     {/* Type Selection */}
//                                     <div>
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
//                                             類型
//                                         </label>
//                                         <div className="grid grid-cols-5 gap-2">
//                                             {[
//                                                 { id: "sight", label: "觀光" },
//                                                 { id: "food", label: "美食" },
//                                                 {
//                                                     id: "shopping",
//                                                     label: "購物",
//                                                 },
//                                                 {
//                                                     id: "transport",
//                                                     label: "移動",
//                                                 },
//                                                 {
//                                                     id: "other",
//                                                     label: "其他",
//                                                 },
//                                             ].map((type) => (
//                                                 <label
//                                                     key={type.id}
//                                                     className={`
//                                                     cursor-pointer text-center py-2 rounded-lg border text-sm transition-all
//                                                     ${
//                                                         formActivity.type ===
//                                                         type.id
//                                                             ? `text-white border-transparent`
//                                                             : "border-gray-200 text-gray-600 hover:bg-gray-50"
//                                                     }
//                                                 `}
//                                                     style={
//                                                         formActivity.type ===
//                                                         type.id
//                                                             ? {
//                                                                   backgroundColor:
//                                                                       theme
//                                                                           .categoryColor[
//                                                                           type
//                                                                               .id
//                                                                       ] ||
//                                                                       theme.accentColor,
//                                                                   borderColor:
//                                                                       theme
//                                                                           .categoryColor[
//                                                                           type
//                                                                               .id
//                                                                       ] ||
//                                                                       theme.accentColor,
//                                                               }
//                                                             : {}
//                                                     }
//                                                 >
//                                                     <input
//                                                         type="radio"
//                                                         name="type"
//                                                         value={type.id}
//                                                         checked={
//                                                             formActivity.type ===
//                                                             type.id
//                                                         }
//                                                         onChange={
//                                                             handleActivityFormInputChange
//                                                         }
//                                                         className="hidden"
//                                                     />
//                                                     {type.label}
//                                                 </label>
//                                             ))}
//                                         </div>
//                                     </div>

//                                     {/* Description */}
//                                     <div>
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
//                                             詳細說明
//                                         </label>
//                                         <textarea
//                                             name="desc"
//                                             value={formActivity.desc}
//                                             onChange={
//                                                 handleActivityFormInputChange
//                                             }
//                                             rows="2"
//                                             placeholder="活動的細節或備註..."
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
//                                         />
//                                     </div>

//                                     {/* Link ID */}
//                                     <div>
//                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
//                                             <Tag size={12} className="mr-1" />{" "}
//                                             連結地點 ID (可選)
//                                         </label>
//                                         <input
//                                             name="linkId"
//                                             value={formActivity.linkId}
//                                             onChange={
//                                                 handleActivityFormInputChange
//                                             }
//                                             placeholder="例如: new-1701234567890"
//                                             className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs text-gray-600 font-mono"
//                                         />
//                                         <p className="text-xs text-gray-400 mt-1">
//                                             請輸入景點誌中地點卡片的 ID,
//                                             用於快速導航。
//                                         </p>
//                                     </div>
//                                 </form>
//                             </div>

//                             {/* Modal Footer */}
//                             <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setIsActivityModalOpen(false)
//                                     }
//                                     className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
//                                 >
//                                     取消
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     form="activity-form"
//                                     className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme.accent}`}
//                                 >
//                                     {activityModalMode === "create"
//                                         ? "新增活動"
//                                         : "儲存變更"}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Delete Activity Confirmation Modal */}
//                 {isDeleteActivityModalOpen && (
//                     <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
//                         <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
//                             <div className="flex items-center space-x-3 mb-4">
//                                 <div className="p-2 bg-red-100 rounded-full text-red-600">
//                                     <AlertTriangle size={24} />
//                                 </div>
//                                 <h3 className="text-lg font-bold text-gray-900">
//                                     確定要刪除活動？
//                                 </h3>
//                             </div>
//                             <p className="text-sm text-gray-600 mb-6">
//                                 您即將刪除活動：
//                                 <span className="font-bold text-gray-800">
//                                     {activityToDelete?.activityTitle}
//                                 </span>
//                                 。此動作無法復原。
//                             </p>
//                             <div className="flex justify-end space-x-3">
//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setIsDeleteActivityModalOpen(false)
//                                     }
//                                     className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                                 >
//                                     取消
//                                 </button>
//                                 <button
//                                     type="button"
//                                     onClick={handleConfirmActivityDelete}
//                                     className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
//                                 >
//                                     確認刪除
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ItineraryPage;
