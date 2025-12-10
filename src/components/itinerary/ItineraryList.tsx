import { useRef, useState } from "react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripsTypes";
import ItineraryItem from "./ItineraryItem";

type ItineraryListProps = {
    isEditing: boolean;
    isPrinting?: boolean;
    itinerarys?: ItineraryVM[];
    theme: TripThemeConf | null;
    onAddActivityBtnClick: (itineraryDay: ItineraryVM) => void;
    onDeleteActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy,
    ) => void;
    onDeleteDayBtnClick: (itinerary: ItineraryVM) => void;
    onEditActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy,
    ) => void;
    onEditDayBtnClick: (itinerary: ItineraryVM) => void;
    onViewBtnClick: (linkId: string) => void;
};

const ItineraryList = ({
    isEditing,
    isPrinting,
    itinerarys,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onViewBtnClick,
}: ItineraryListProps) => {
    const [expandedDayNum, setExpandedDayNum] = useState<number | null>(1);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleExpandedBtnClick = (itinerary: ItineraryVM, index: number) => {
        const newDayNum =
            expandedDayNum === itinerary.day_number
                ? null
                : itinerary.day_number;
        setExpandedDayNum(newDayNum);

        if (newDayNum !== null && itemRefs.current[index]) {
            itemRefs.current[index]?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        }
    };

    return (
        <div
            className={`space-y-4 px-4 ${isPrinting ? "print:space-y-3" : ""}`}
        >
            {Array.isArray(itinerarys) && itinerarys.length > 0 ? (
                itinerarys.map((itinerary, i) => (
                    <div
                        key={i}
                        ref={(el: HTMLDivElement | null) => {
                            itemRefs.current[i] = el;
                        }}
                    >
                        <ItineraryItem
                            itinerary={itinerary}
                            theme={theme}
                            isEditing={isEditing}
                            isExpanded={expandedDayNum === itinerary.day_number}
                            isPrinting={isPrinting}
                            onExpandedBtnToggle={() =>
                                handleExpandedBtnClick(itinerary, i)
                            }
                            onAddActivityBtnClick={onAddActivityBtnClick}
                            onDeleteActivityBtnClick={onDeleteActivityBtnClick}
                            onDeleteDayBtnClick={onDeleteDayBtnClick}
                            onEditActivityBtnClick={onEditActivityBtnClick}
                            onEditDayBtnClick={onEditDayBtnClick}
                            onViewBtnClick={onViewBtnClick}
                        />
                    </div>
                ))
            ) : (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">
                        目前沒有任何日程，請點擊上方按鈕開始規劃！
                    </p>
                </div>
            )}
        </div>
    );
};

export default ItineraryList;
