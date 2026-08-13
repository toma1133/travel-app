import { useState } from "react";
import {
    Star,
    Clock,
    MapPin,
    Pencil,
    Trash2,
    ExternalLink,
} from "lucide-react";
import { getCategoryTypeName } from "../../constants/Categories";
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
                        : "bg-card rounded-2xl overflow-hidden shadow-sm border border-border transition-all duration-300 group hover:shadow-md flex flex-col h-full"
                }
            `}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            {/* 圖片區域 */}
            <div
                className={`
                    relative overflow-hidden shrink-0
                    ${
                        isPrinting
                            ? "w-32 h-32 mr-6 rounded-sm"
                            : "w-full h-48 sm:h-56"
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
                                : "bg-muted text-muted-foreground/50"
                        }`}
                    >
                        No Image
                    </div>
                )}
                
                {/* 漸層遮罩 */}
                {!isPrinting && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                )}

                {/* 類型標籤 */}
                <div
                    className={`absolute top-0 left-0 ${
                        !isPrinting && "top-4 left-4 z-10"
                    }`}
                >
                    <span
                        className={`
                            px-3 py-1.5 uppercase tracking-widest font-bold shadow-sm
                            ${
                                isPrinting
                                    ? "text-[10px] bg-black text-white rounded-br-sm"
                                    : "text-[10px] bg-background/80 backdrop-blur-md text-foreground rounded-full"
                            }
                        `}
                    >
                        {getCategoryTypeName(place.type)}
                    </span>
                </div>

                {/* 編輯與刪除按鈕 (僅非列印模式顯示) */}
                {!isPrinting && !isPreview && (
                    
                    <div
                        className={`absolute top-4 right-4 flex space-x-1 p-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10 transition-all duration-300
                            ${
                                showActions
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 -translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0"
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(place);
                            }}
                            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
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
                            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
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
                            ? "flex-1 flex flex-col p-0"
                            : "p-5 sm:p-6 flex flex-col flex-1"
                    }
                `}
            >
                {/* 標題列 */}
                <div
                    className={`flex justify-between items-start ${
                        isPrinting ? "mb-1" : "mb-3"
                    }`}
                >
                    <div className="flex flex-col justify-between items-start">
                        <h3
                            className={`text-xl font-bold font-[Noto_Sans_TC] tracking-tight ${
                                isPrinting ? "text-black print:text-lg" : "text-foreground"
                            }`}
                        >
                            {place.name}
                        </h3>
                        {place.eng_name && (
                            <p className="text-xs text-muted-foreground font-medium mt-1 print:text-gray-500">
                                {place.eng_name}
                            </p>
                        )}
                    </div>
                    {/* 外部連結 (列印隱藏) */}
                    {!isPrinting && !isPreview && (
                        <a
                            href={place.map_url || getMapUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                            title="在 Maps 中查看"
                        >
                            <ExternalLink size={18} />
                        </a>
                    )}
                </div>

                {/* Tags */}
                {!isPrinting && !!place.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {place.tags.split(",").map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onTagBtnClick(tag.trim())}
                                className="text-[10px] font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-md hover:bg-primary/20 hover:text-primary transition-colors uppercase tracking-wider"
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
                                ? "text-gray-800 mb-3 flex-1"
                                : "text-muted-foreground/90 mb-6 flex-1 line-clamp-4"
                        }
                    `}
                >
                    {place.description}
                </p>

                {/* 資訊區塊 (Footer) */}
                <div
                    className={`
                        text-xs space-y-2.5
                        ${
                            isPrinting
                                ? "bg-transparent p-0 mt-auto space-y-1"
                                : "mt-auto pt-4 border-t border-border/50 text-muted-foreground"
                        }
                    `}
                >
                    {place.tips && (
                        <div className="flex items-start">
                            <Star
                                size={14}
                                className={`
                                    mr-2.5 shrink-0 mt-0.5
                                    ${
                                        isPrinting
                                            ? "text-black fill-black"
                                            : "text-primary fill-primary/20"
                                    }
                                `}
                            />
                            <span
                                className={`font-medium leading-snug ${
                                    isPrinting ? "text-black" : "text-foreground/80"
                                }`}
                            >
                                <span
                                    className={`font-bold mr-1 ${
                                        isPrinting
                                            ? "text-black"
                                            : "text-foreground"
                                    }`}
                                >
                                    Tips:
                                </span>
                                {place.tips}
                            </span>
                        </div>
                    )}

                    <div className={isPrinting ? "flex gap-4 flex-wrap" : "space-y-2.5"}>
                        {place?.info?.rating && (
                            <div className="flex items-center">
                                <Star
                                    size={14}
                                    className={`mr-2.5 shrink-0 ${
                                        isPrinting
                                            ? "text-amber-600 fill-amber-600"
                                            : "text-amber-500 fill-amber-500"
                                    }`}
                                />
                                <span className="font-semibold text-foreground mr-1">
                                    {place.info.rating}
                                </span>
                                {place.info.rating_count && (
                                    <span className="text-muted-foreground mr-1.5">
                                        ({place.info.rating_count}則評價)
                                    </span>
                                )}
                                {place.info.rating_source && (
                                    <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                                        {place.info.rating_source}
                                    </span>
                                )}
                            </div>
                        )}
                        {place?.info?.open && (
                            <div className="flex items-center">
                                <Clock
                                    size={14}
                                    className={`mr-2.5 shrink-0 ${
                                        isPrinting
                                            ? "text-gray-600"
                                            : "text-muted-foreground/70"
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
                                    className={`mr-2.5 shrink-0 ${
                                        isPrinting
                                            ? "text-gray-600"
                                            : "text-muted-foreground/70"
                                    }`}
                                />
                                <span
                                    className={`break-all line-clamp-1 ${
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
