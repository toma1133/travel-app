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
    const getMapUrl = () => {
        let query = "";
        if (place.lat && place.lng) {
            query = `${place.lat},${place.lng}`;
        } else {
            query = place.info?.loc || place.name;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            query
        )}`;
    };

    return (
        <div
            id={place.id}
            className={`
                /* 螢幕模式: 卡片樣式 */
                bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all duration-500 group
                /* 列印模式: 轉為 Flex 橫向佈局 (左圖右文)，移除邊框陰影，避免分頁切斷 */
                print:flex print:flex-row print:shadow-none print:border-none print:rounded-none print:py-6 print:break-inside-avoid
            `}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            {/* 圖片區域 */}
            <div className={`
                    relative overflow-hidden
                    /* 螢幕: 滿寬，高度固定 */
                    w-full h-48
                    /* 列印: 左側固定寬度，高度自動，保持比例 */
                    print:w-32 print:h-32 print:shrink-0 print:mr-6
                `}> 
                {place.image_url ? (
                    <img
                        src={place.image_url}
                        alt={place.name}
                        className={`w-full h-full object-cover ${
                            !isPrinting
                                ? "transition-transform duration-700 group-hover:scale-105"
                                : ""
                        } print:rounded-sm`} // 列印時給一點小圓角比較精緻
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-xs print:bg-gray-100">
                        No Image
                    </div>
                )}
                {/* 類型標籤: 螢幕顯示在圖上，列印時也可以保留，或者移到標題旁 */}
                <div className="absolute top-3 left-3 print:top-0 print:left-0">
                    <span className={`
                        backdrop-blur-sm text-white text-[10px] px-2 py-1 uppercase tracking-wider
                        ${isPrinting 
                            ? "bg-black text-white rounded-br-sm" // 列印時用純黑，對比高 
                            : "bg-black/60"}
                    `}>
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
            <div className="p-5 print:p-0 print:flex-1 print:flex print:flex-col">
                {/* 標題列 */}
                <div className="flex justify-between items-start mb-2 print:mb-1">
                    <div className="flex flex-col justify-between items-start">
                        <h3
                            className={`text-xl font-bold ${
                                theme?.primary || "text-gray-800"
                            } font-[Noto_Sans_TC] print:text-black print:text-lg`}
                        >
                            {place.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium print:text-gray-500">
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
                <div className="flex flex-wrap gap-2 mb-4 print:hidden">
                    {!!place.tags &&
                        place.tags.split(",").map((tag) => (
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
                {/* 描述文字 */}
                <p className={`
                    text-sm text-gray-600 leading-relaxed mb-4 text-justify whitespace-pre-wrap
                    /* 列印優化: 自動伸縮高度 */
                    print:text-sm print:text-gray-800 print:mb-3 print:flex-1
                `}>
                    {place.description}
                </p>{/* 資訊區塊 (Footer) */}
                <div className={`
                    bg-[#F9F8F6] p-3 rounded text-xs space-y-2 text-gray-600
                    /* 列印優化: 移除灰色背景，改為緊湊排列 */
                    print:bg-transparent print:p-0 print:mt-auto print:space-y-1
                `}>
                    {place.tips && (
                        <div className="flex items-start">
                            <Star
                                size={14}
                                className={`mr-2 ${
                                    theme?.accentText || "text-gray-600"
                                } shrink-0 print:text-black print:fill-black`} // 實心星星強調 Tips
                            />
                            <span className="print:text-black font-medium">
                                <span className="font-bold text-gray-800 print:text-black">
                                    Tips:
                                </span>{" "}
                                {place.tips}
                            </span>
                        </div>
                    )}
                    
                    {/* 時間與地點在列印時可以並排顯示 (如果空間夠) 或是換行 */}
                    <div className="print:flex print:gap-4 print:flex-wrap">
                        {place?.info?.open && (
                            <div className="flex items-center">
                                <Clock size={14} className="mr-2 text-gray-400 shrink-0 print:text-gray-600" />
                                <span className="print:text-gray-700">{place.info.open}</span>
                            </div>
                        )}
                        {place?.info?.loc && (
                            <div className="flex items-center">
                                <MapPin size={14} className="mr-2 text-gray-400 shrink-0 print:text-gray-600" />
                                <span className="break-all print:text-gray-700">{place.info.loc}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;
