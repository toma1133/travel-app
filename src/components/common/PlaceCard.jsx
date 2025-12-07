import { useState } from "react";
import { Star, Clock, MapPin, Pencil, Trash2 } from "lucide-react";

const PlaceCard = ({
    theme,
    place,
    isHighlighted,
    isPrinting,
    isPreview,
    onEdit,
    onDelete,
}) => {
    const [showActions, setShowActions] = useState(false);
    const getPlaceTypeName = (param) => {
        switch (param) {
            case "sight":
                return "Sightseeing";
            case "food":
                return "Gourmet";
            case "shopping":
                return "Shop";
            default:
                return "Other";
        }
    };

    return (
        <div
            id={place.id}
            className={`
                bg-white rounded-lg overflow-hidden shadow-sm border transition-all duration-500 group
                ${
                    isHighlighted && !isPrinting
                        ? "border-[#8E354A] ring-2 ring-[#8E354A]/20 scale-[1.02]"
                        : "border-gray-100"
                }
                ${
                    isPrinting
                        ? "print:shadow-none print:border-gray-300 print:mb-4 print:break-inside-avoid-page"
                        : "break-inside-avoid"
                }
            `}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            <div className="relative h-48 overflow-hidden">
                {place.image_url ? (
                    <img
                        src={place.image_url}
                        alt={place.name}
                        className={`w-full h-full object-cover ${
                            !isPrinting
                                ? "transition-transform duration-700 group-hover:scale-105"
                                : ""
                        }`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        無圖片
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 uppercase tracking-wider">
                        {getPlaceTypeName(place.type)}
                    </span>
                </div>

                {/* 編輯與刪除按鈕 (僅非列印模式顯示) */}
                {!isPrinting && !isPreview && (
                    <div
                        className={`absolute top-3 right-3 flex space-x-2 transition-opacity duration-200
                            ${showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(place);
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-600 hover:text-blue-600 hover:bg-white shadow-sm transition-colors"
                            title="編輯"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(place);
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-600 hover:text-red-600 hover:bg-white shadow-sm transition-colors"
                            title="刪除"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>
            <div className="p-5 print:p-4">
                <h3
                    className={`text-xl font-bold ${
                        theme.primary || "text-gray-800"
                    } font-[Noto_Sans_TC] print:text-lg print:text-gray-900`}
                >
                    {place.name}
                </h3>
                <p className="text-xs text-gray-400 font-medium mb-2 print:text-gray-600">
                    {place.eng_name}
                </p>
                <div className="flex flex-wrap gap-2 mb-4 print:hidden">
                    {Array.isArray(place.tags) &&
                        place.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                                #{tag}
                            </span>
                        ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 text-justify print:text-sm print:text-gray-700">
                    {place.description}
                </p>
                <div className="bg-[#F9F8F6] p-3 rounded text-xs space-y-2 text-gray-600 print:bg-white print:border print:border-gray-200 print:text-gray-700">
                    {/* Tips */}
                    {place.tips && (
                        <div className="flex items-start">
                            <Star
                                size={14}
                                className={`mr-2 ${
                                    theme.accentText || "text-gray-600"
                                } shrink-0 print:text-gray-500`}
                            />
                            <span>
                                <span className="font-bold text-gray-800 print:text-gray-800">
                                    Tips:
                                </span>{" "}
                                {place.tips}
                            </span>
                        </div>
                    )}
                    {place.info.open && (
                        <div className="flex items-center">
                            <Clock
                                size={14}
                                className="mr-2 text-gray-400 shrink-0 print:text-gray-500"
                            />
                            <span>{place.info.open}</span>
                        </div>
                    )}
                    {place.info.loc && (
                        <div className="flex items-center">
                            <MapPin
                                size={14}
                                className="mr-2 text-gray-400 shrink-0 print:text-gray-500"
                            />
                            <span>{place.info.loc}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;
