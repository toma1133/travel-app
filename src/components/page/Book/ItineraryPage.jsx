import { useState } from "react";
import DayItem from "../../common/DayItem";
import SectionHeader from "../../common/SectionHeader";

const ItineraryPage = ({ itinerary, theme, isPrinting, onNavigateToPlace }) => {
    const [expandedDay, setExpandedDay] = useState(1);

    return (
        <div
            className={`min-h-full font-sans text-gray-800 ${
                isPrinting
                    ? "p-0 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                    : `${theme.bg || "bg-gray-100"} py-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="旅程表"
                    subtitle="時間與移動的軌跡"
                    theme={theme}
                />
            )}
            {/* 行程清單 */}
            <div
                className={`space-y-4 px-4 ${
                    isPrinting ? "print:space-y-3" : ""
                }`}
            >
                {Array.isArray(itinerary) &&
                    itinerary.map((day) => (
                        <DayItem
                            key={day.id}
                            day={day}
                            theme={theme}
                            isPrinting={isPrinting}
                            categoryColor={theme.categoryColor}
                            expanded={expandedDay === day.day_number}
                            onToggle={() =>
                                setExpandedDay(
                                    expandedDay === day.day_number
                                        ? null
                                        : day.day_number
                                )
                            }
                            onNavigate={onNavigateToPlace}
                        />
                    ))}
            </div>
        </div>
    );
};

export default ItineraryPage;
