import { useState, useEffect } from "react";
import PlaceCard from "../../common/PlaceCard";
import SectionHeader from "../../common/SectionHeader";

const GuidePage = ({ places, targetPlaceId, theme, isPrinting }) => {
    const [filter, setFilter] = useState("all");
    const filteredPlaces = Array.isArray(places)
        ? places.filter((p) => filter === "all" || p.type === filter)
        : [];

    useEffect(() => {
        if (targetPlaceId) {
            const element = document.getElementById(`place-${targetPlaceId}`);
            if (element)
                element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [targetPlaceId]);

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
                    title="景點誌"
                    subtitle="探索與收藏的美好事物"
                    theme={theme}
                />
            )}
            {!isPrinting && (
                <div className="flex space-x-2 px-4 mb-6 overflow-x-auto no-scrollbar">
                    {[
                        { id: "all", label: "全部" },
                        { id: "sight", label: "觀光" },
                        { id: "food", label: "美食" },
                        { id: "shopping", label: "購物" },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-1.5 rounded-full text-xs transition-colors ${
                                filter === f.id
                                    ? `${theme.accent} text-white`
                                    : "bg-white text-gray-500 border border-gray-200"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}
            <div className="space-y-6 px-4 print:space-y-4">
                {filteredPlaces.map((place) => (
                    <PlaceCard
                        key={place.id}
                        place={place}
                        isHighlighted={targetPlaceId === place.id}
                        theme={theme}
                        isPrinting={isPrinting}
                    />
                ))}
            </div>
        </div>
    );
};

export default GuidePage;
