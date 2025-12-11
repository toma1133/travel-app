import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type ItineraryItemProps = {
    itinerary: ItineraryVM;
    isEditing: boolean;
    isExpanded: boolean;
    isPrinting?: boolean;
    theme: TripThemeConf | null;
    onAddActivityBtnClick: (itineraryDay: ItineraryVM) => void;
    onDeleteActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => void;
    onDeleteDayBtnClick: (itinerary: ItineraryVM) => void;
    onEditActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => void;
    onEditDayBtnClick: (itinerary: ItineraryVM) => void;
    onExpandedBtnToggle: (itinerary: ItineraryVM) => void;
    onViewBtnClick: (linkId: string) => void;
};

const ItineraryItem = ({
    itinerary,
    isEditing,
    isExpanded,
    isPrinting,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onExpandedBtnToggle,
    onViewBtnClick,
}: ItineraryItemProps) => (
    <div
        className={`bg-white rounded-lg shadow-sm border-l-4 border-gray-200 overflow-hidden break-inside-avoid print:shadow-none print:border print:border-gray-300 ${
            isExpanded && !isPrinting
                ? "border-l-[#8E354A]"
                : "border-l-[E5E7EB]"
        }`}
    >
        <div
            onClick={
                isEditing ? () => {} : () => onExpandedBtnToggle(itinerary)
            }
            className={`w-full flex items-center justify-between p-4 bg-white transition-colors ${
                !isPrinting && !isEditing
                    ? "hover:bg-gray-50"
                    : "print:cursor-default"
            } ${isEditing ? "cursor-default opacity-80" : ""}`}
        >
            <div className="flex items-center">
                <div className="flex flex-col items-center mr-4 pr-4 border-r border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest print:text-gray-600">
                        {itinerary.weekday}
                    </span>
                    <span
                        className={`text-2xl font-[Noto_Sans_TC] font-bold ${
                            theme?.primary || "text-gray-900"
                        } print:text-gray-900`}
                    >
                        {itinerary.date.split("-")[2]}
                    </span>
                </div>
                <div className="text-left">
                    <div className={`font-bold ${theme?.primary}`}>
                        Day {itinerary.day_number}
                    </div>
                    <div className="text-sm text-gray-500">
                        {itinerary.title}
                    </div>
                </div>
            </div>
            {!isPrinting && isEditing && (
                <div
                    className={`flex space-x-2 bg-white pr-2
                    ${
                        isEditing
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                    } 
                    transition-opacity duration-200
                `}
                >
                    <button
                        type="button"
                        onClick={() => onAddActivityBtnClick(itinerary)}
                        className={`p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                        title="新增活動"
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onEditDayBtnClick(itinerary)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="編輯日程"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteDayBtnClick(itinerary)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="刪除日程"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
            {!isPrinting &&
                !isEditing &&
                (isExpanded ? (
                    <ChevronUp size={20} className="text-gray-300" />
                ) : (
                    <ChevronDown size={20} className="text-gray-300" />
                ))}
        </div>
        {(isExpanded || isPrinting) && (
            <div className="px-4 pb-6 bg-white relative">
                <div className="space-y-4 ml-2 border-l border-dashed border-gray-200 pl-4">
                    {Array.isArray(itinerary.activities) &&
                        itinerary.activities.map((activity, activityIdx) => (
                            <div key={activityIdx} className="relative">
                                <div
                                    className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ring-2 ring-white print:ring-0 print:border print:border-gray-500`}
                                    style={{
                                        backgroundColor:
                                            theme?.categoryColor[
                                                activity.type
                                            ] ||
                                            theme?.categoryColor["shopping"],
                                    }}
                                ></div>
                                {!isPrinting && (
                                    <div
                                        className={`
                                        absolute right-0 top-0 flex space-x-2 bg-white pr-2
                                        transition-opacity duration-200
                                    `}
                                    >
                                        {!isEditing && activity.linkId && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onViewBtnClick(
                                                        activity.linkId
                                                    )
                                                }
                                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="View"
                                            >
                                                <BookOpen size={14} />
                                            </button>
                                        )}
                                        {isEditing && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onEditActivityBtnClick(
                                                            itinerary,
                                                            activity
                                                        )
                                                    }
                                                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="編輯活動"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDeleteActivityBtnClick(
                                                            itinerary,
                                                            activity
                                                        )
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="刪除活動"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-baseline">
                                    <span className="font-mono text-xs text-gray-400 w-12 shrink-0 pt-0.5 print:text-gray-600">
                                        {activity.time}
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${
                                            theme?.primary || "text-gray-800"
                                        } truncate pr-2 print:text-gray-900`}
                                    >
                                        {activity.title}
                                    </span>
                                </div>
                                {activity.desc && (
                                    <p className="text-xs text-gray-500 ml-12 mt-0.5 print:text-gray-700">
                                        {activity.desc}
                                    </p>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        )}
    </div>
);

export default ItineraryItem;
