import { useState } from "react";
import {
    Star,
    Clock,
    MapPin,
    Pencil,
    Trash2,
    ExternalLink,
} from "lucide-react";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type PlaceCardProps = {
    theme: TripThemeConf | null;
    place: PlaceVM;
    isPrinting?: boolean;
    isPreview: boolean;
    onDelete: (place: PlaceVM) => void;
    onEdit: (place: PlaceVM) => void;
    onTagBtnClick: (tag: string) => void;
};

const PlaceCard = ({
    theme,
    place,
    isPrinting,
    isPreview,
    onDelete,
    onEdit,
    onTagBtnClick,
}: PlaceCardProps) => {
    const [showActions, setShowActions] = useState(false);
    const getPlaceTypeName = (param: string | null) => {
        switch (param) {
            case "sight":
                return "Sightseeing";
            case "food":
                return "Gourmet";
            case "shopping":
                return "Shop";
            case "hotel":
                return "Hotel";
            default:
                return "Other";
        }
    };
    const getMapUrl = () =>
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            place.info?.loc || place.name
        )}`;

    return (
        <div
            id={place.id}
            className={`
                ${
                    isPrinting
                        ? "flex flex-row shadow-none border-none rounded-none py-6 break-inside-avoid"
                        : "bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all duration-500 group"
                }
            `}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            {/* 圖片區域 */}
            <div
                className={`
                    relative overflow-hidden
                    /* 螢幕: 滿寬，高度固定 */
                    ${
                        isPrinting
                            ? "w-32 h-32 shrink-0 mr-6 rounded-sm"
                            : "w-full h-48"
                    }
                `}
            >
                {place.image_url ? (
                    <img
                        src={place.image_url}
                        alt={place.name}
                        className={`w-full h-full object-cover 
                            ${
                                !isPrinting
                                    ? "transition-transform duration-700 group-hover:scale-105"
                                    : ""
                            }
                        `}
                    />
                ) : (
                    <div
                        className={`w-full h-full flex items-center justify-center text-xs ${
                            isPrinting
                                ? "bg-gray-100 text-gray-400"
                                : "bg-gray-50 text-gray-300"
                        }`}
                    >
                        No Image
                    </div>
                )}
                {/* 類型標籤 */}
                <div
                    className={`absolute top-0 left-0 ${
                        !isPrinting && "top-3 left-3"
                    }`}
                >
                    <span
                        className={`
                            backdrop-blur-sm text-[10px] px-2 py-1 uppercase tracking-wider
                            ${
                                isPrinting
                                    ? "bg-black text-white rounded-br-sm" // 列印：高對比
                                    : "bg-black/60 text-white" // 螢幕：半透明
                            }
                        `}
                    >
                        {getPlaceTypeName(place.type)}
                    </span>
                </div>
                {/* 編輯與刪除按鈕 (僅非列印模式顯示) */}
                {!isPrinting && !isPreview && (
                    <div
                        className={`absolute top-3 right-3 flex space-x-2 transition-opacity duration-200
                            ${
                                showActions
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                            }`}
                    >
                        <button
                            type="button"
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
                            type="button"
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
            {/* --- 內容區域 --- */}
            <div
                className={`
                    ${
                        isPrinting
                            ? "flex-1 flex flex-col p-0" // 列印：填滿右側
                            : "p-5" // 螢幕：一般內距
                    }
                `}
            >
                {/* 標題列 */}
                <div
                    className={`flex justify-between items-start ${
                        isPrinting ? "mb-1" : "mb-2"
                    }`}
                >
                    <div className="flex flex-col justify-between items-start">
                        <h3
                            className={`text-xl font-bold ${
                                theme?.primary || "text-gray-800"
                            } font-[Noto_Sans_TC] ${
                                isPrinting ? "text-black text-lg" : ""
                            }`}
                        >
                            {place.name}
                        </h3>
                        <p
                            className={`text-xs text-gray-400 font-medium ${
                                isPrinting ? "text-gray-500" : ""
                            }`}
                        >
                            {place.eng_name}
                        </p>
                    </div>
                    {/* 外部連結 (列印隱藏) */}
                    {!isPrinting && !isPreview && (
                        <a
                            href={place.map_url || getMapUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                            title="在 Maps 中查看"
                        >
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>
                {/* Tags (列印隱藏，保持版面乾淨) */}
                {!isPrinting && !!place.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {place.tags.split(",").map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onTagBtnClick(tag.trim())}
                                className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 hover:text-gray-800 transition-colors"
                            >
                                #{tag.trim()}
                            </button>
                        ))}
                    </div>
                )}
                {/* 描述文字 */}
                <p
                    className={`
                        text-sm leading-relaxed text-justify whitespace-pre-wrap
                        ${
                            isPrinting
                                ? "text-gray-800 mb-3 flex-1" // 列印：深色字，撐開高度
                                : "text-gray-600 mb-4"
                        }
                    `}
                >
                    {place.description}
                </p>
                {/* 資訊區塊 (Footer) */}
                <div
                    className={`
                        text-xs space-y-2
                        ${
                            isPrinting
                                ? "bg-transparent p-0 mt-auto space-y-1" // 列印：無背景，置底
                                : "bg-[#F9F8F6] p-3 rounded text-gray-600" // 螢幕：有背景卡片
                        }
                    `}
                >
                    {place.tips && (
                        <div className="flex items-start">
                            <Star
                                size={14}
                                className={`
                                    mr-2 shrink-0
                                    ${
                                        isPrinting
                                            ? "text-black fill-black" // 列印：實心黑星
                                            : theme?.accentText ||
                                              "text-gray-600"
                                    }
                                `}
                            />
                            <span
                                className={`font-medium ${
                                    isPrinting ? "text-black" : ""
                                }`}
                            >
                                <span
                                    className={`font-bold ${
                                        isPrinting
                                            ? "text-black"
                                            : "text-gray-800"
                                    }`}
                                >
                                    Tips:
                                </span>{" "}
                                {place.tips}
                            </span>
                        </div>
                    )}

                    <div className={isPrinting ? "flex gap-4 flex-wrap" : ""}>
                        {place?.info?.open && (
                            <div className="flex items-center">
                                <Clock
                                    size={14}
                                    className={`mr-2 shrink-0 ${
                                        isPrinting
                                            ? "text-gray-600"
                                            : "text-gray-400"
                                    }`}
                                />
                                <span
                                    className={
                                        isPrinting ? "text-gray-700" : ""
                                    }
                                >
                                    {place.info.open}
                                </span>
                            </div>
                        )}
                        {place?.info?.loc && (
                            <div className="flex items-center">
                                <MapPin
                                    size={14}
                                    className={`mr-2 shrink-0 ${
                                        isPrinting
                                            ? "text-gray-600"
                                            : "text-gray-400"
                                    }`}
                                />
                                <span
                                    className={`break-all ${
                                        isPrinting ? "text-gray-700" : ""
                                    }`}
                                >
                                    {place.info.loc}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;
