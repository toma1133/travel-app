import { MouseEventHandler, useState } from "react";
import { Calendar } from "lucide-react";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripsTypes";
import ItineraryItem from "./ItineraryItem";

type ItineraryListProps = {
    activeDayNum: number;
    isEditing: boolean;
    isPrinting: boolean;
    itinerarys: ItineraryVM[];
    theme: TripThemeConf | null;
    onAddBtnClick: MouseEventHandler<HTMLButtonElement>;
};

const ItineraryList = ({
    activeDayNum,
    isEditing,
    isPrinting,
    itinerarys,
    theme,
    onAddBtnClick,
}: ItineraryListProps) => {
    const [expandedDay, setExpandedDay] = useState<number | null>(1);

    return (
        <div
            className={`space-y-4 px-4 ${isPrinting ? "print:space-y-3" : ""}`}
        >
            {Array.isArray(itinerarys) ? (
                itinerarys.map((itinerary, i) => (
                    <ItineraryItem
                        key={i}
                        categoryColor={theme?.categoryColor}
                        itinerary={itinerary}
                        theme={theme}
                        isEditing={isEditing}
                        isExpanded={activeDayNum === itinerary.day_number}
                        isPrinting={isPrinting}
                        onToggle={() =>
                            setExpandedDay(
                                expandedDay === itinerary.day_number
                                    ? null
                                    : itinerary.day_number
                            )
                        }
                        // onNavigate={onNavigateToPlace}
                        // onAddActivity={handleOpenCreateActivityModal}
                        // onEditActivity={handleOpenEditActivityModal}
                        // onDeleteActivity={handleOpenDeleteActivityModal}
                        // onEditDay={handleOpenEditDayModal}
                        // onDeleteDay={handleOpenDeleteDayModal}
                    />
                ))
            ) : (
                // 提示新增日程
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300 mx-4">
                    <p className="text-gray-500 mb-4">
                        目前沒有任何日程，請點擊上方按鈕開始規劃！
                    </p>
                    <button
                        type="button"
                        onClick={onAddBtnClick}
                        className={`flex items-center mx-auto text-xs font-medium text-white px-3 py-1.5 rounded-full shadow-sm ${theme?.accent} hover:opacity-90 transition-opacity`}
                    >
                        <Calendar size={12} className="mr-1" />
                        新增第一個日程
                    </button>
                </div>
            )}
        </div>
    );
};

export default ItineraryList;
