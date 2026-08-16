import { useState } from "react";
import {
    Star,
    Clock,
    MapPin,
    Pencil,
    Trash2,
    ExternalLink,
    CalendarX,
    Phone,
    DollarSign,
    Train,
    Ticket,
    Globe,
    CreditCard,
    Wifi,
    Utensils,
    Navigation,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Volume2,
} from "lucide-react";
import { getCategoryTypeName } from "../../constants/Categories";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import {
    getSmartNavigationUrl,
    getSmartNavigationLabel,
} from "../../utils/MapNavigationUtil";
import {
    formatOpeningHours,
    parseOpeningHours,
    getBusinessStatus,
} from "../../utils/OpeningHoursUtil";
import { detectLanguage, playPronunciation } from "../../utils/SpeechLanguageUtil";

type PlaceCardProps = {
    theme: TripThemeConf | null;
    place: PlaceVM;
    isPrinting?: boolean;
    isPreview: boolean;
    selectedTags?: string[];
    onDelete: (place: PlaceVM) => void;
    onEdit: (place: PlaceVM) => void;
    onTagBtnClick: (tag: string) => void;
};

const PlaceCard = ({
    theme,
    place,
    isPrinting,
    isPreview,
    selectedTags = [],
    onDelete,
    onEdit,
    onTagBtnClick,
}: PlaceCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    const smartNav = getSmartNavigationLabel(place.map_url);
    const mapUrl = getSmartNavigationUrl({
        name: place.name,
        loc: place.info?.loc,
        lat: place.lat,
        lng: place.lng,
        customUrl: place.map_url,
    });
    const businessStatus = getBusinessStatus(place.info?.open, place.info?.closed_days);

    const detectedLang = detectLanguage(place.info?.native_name, {
        address: place.info?.loc,
        currency: place.info?.price,
    });

    const handleSpeak = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!place.info?.native_name) return;
        playPronunciation(place.info.native_name, {
            context: {
                address: place.info?.loc,
                mapUrl: place.map_url,
                currency: place.info?.price,
            },
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: () => setSpeaking(false),
        });
    };

    const paymentList: string[] = Array.isArray(place.info?.payment_methods)
        ? place.info.payment_methods
        : typeof place.info?.payment_methods === "string"
        ? place.info.payment_methods.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const amenitiesList: string[] = Array.isArray(place.info?.amenities)
        ? place.info.amenities
        : typeof place.info?.amenities === "string"
        ? place.info.amenities.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const recommendedItems = place.info?.recommended_items || [];
    const firstRecItem = recommendedItems[0];

    const isHotel = place.type === "hotel" || place.type === "stay";

    // 檢查是否有次要旅遊細節
    const hasSecondaryDetails =
        !!place.description ||
        !!place.tips ||
        (isHotel ? (!!place.info?.check_in || !!place.info?.check_out || true) : !!place.info?.open) ||
        !!place.info?.transit_access ||
        !!place.info?.phone ||
        !!place.info?.booking_status ||
        !!place.info?.booking_url ||
        !!place.info?.website_url ||
        paymentList.length > 0 ||
        amenitiesList.length > 0 ||
        recommendedItems.length > 0;

    // ==========================================
    // 🖨️ 列印模式專屬排版 (Print Mode)
    // ==========================================
    if (isPrinting) {
        const parsedHours = parseOpeningHours(place.info?.open);

        return (
            <div
                id={place.id}
                className="py-5 border-b border-gray-300 break-inside-avoid text-black font-[Noto_Sans_TC] bg-white flex flex-row gap-5 items-start"
            >
                {/* 左側：圖片與分類標籤 */}
                <div className="w-36 shrink-0 flex flex-col items-center">
                    <div className="w-36 h-32 rounded border border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {place.image_url ? (
                            <img
                                src={place.image_url}
                                alt={place.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs text-gray-400">無照片</span>
                        )}
                    </div>
                    <span className="mt-1.5 w-full text-center text-[10px] font-bold bg-black text-white py-0.5 rounded-xs tracking-wider uppercase">
                        {getCategoryTypeName(place.type)}
                    </span>
                </div>

                {/* 右側：主體內容 */}
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="border-b border-gray-200 pb-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-lg font-bold text-black tracking-tight">
                                {place.name}
                            </h3>
                            {place.info?.rating && (
                                <div className="flex items-center text-xs font-bold text-black shrink-0">
                                    <Star size={13} className="text-black fill-black mr-1" />
                                    <span>{place.info.rating}</span>
                                    {place.info.rating_count && (
                                        <span className="text-gray-500 font-normal ml-1">
                                            ({place.info.rating_count})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {(place.eng_name || place.info?.native_name) && (
                            <div className="text-xs text-gray-600 font-mono mt-0.5 space-x-2">
                                {place.eng_name && <span>{place.eng_name}</span>}
                                {place.eng_name && place.info?.native_name && <span>•</span>}
                                {place.info?.native_name && (
                                    <span className="font-sans">{place.info.native_name}</span>
                                )}
                            </div>
                        )}

                        {place.tags && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {place.tags
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                                    .map((tag, tagIdx) => (
                                        <span
                                            key={tagIdx}
                                            className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded border border-gray-300 font-medium"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                            </div>
                        )}
                    </div>

                    {place.description && (
                        <p className="text-xs text-gray-800 leading-relaxed text-justify">
                            {place.description}
                        </p>
                    )}

                    {place.tips && (
                        <div className="bg-gray-100 p-2 rounded border-l-2 border-black text-xs text-black">
                            <strong className="font-bold mr-1">Tips:</strong>
                            {place.tips}
                        </div>
                    )}

                    {/* 實用資訊網格 (列印時完整顯示所有時間，不帶當天營業/休息狀態) */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-800 pt-1 border-t border-gray-200">
                        {/* 營業時間 / 住宿入住退房 (完整顯示全部營業時間) */}
                        {isHotel ? (
                            <div className="flex items-center gap-1.5 col-span-2">
                                <Clock size={12} className="text-gray-600 shrink-0" />
                                <span>
                                    入住：<strong>{place.info?.check_in || "15:00"}</strong>
                                    {" / 退房："}
                                    <strong>{place.info?.check_out || "11:00"}</strong>
                                </span>
                            </div>
                        ) : place.info?.open ? (
                            <div className="flex items-start gap-1.5 col-span-2">
                                <Clock size={12} className="text-gray-600 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                    <span className="font-bold mr-1">營業時間：</span>
                                    <span>
                                        {parsedHours.isPerDay
                                            ? parsedHours.summaryText || businessStatus.allHoursSummary
                                            : place.info.open}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        {place.info?.closed_days && (
                            <div className="flex items-center gap-1.5">
                                <CalendarX size={12} className="text-gray-600 shrink-0" />
                                <span>
                                    公休日：<strong>{place.info.closed_days}</strong>
                                </span>
                            </div>
                        )}

                        {place.info?.stay_duration && (
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-gray-600 shrink-0" />
                                <span>
                                    建議停留：<strong>{place.info.stay_duration}</strong>
                                </span>
                            </div>
                        )}

                        {place.info?.phone && (
                            <div className="flex items-center gap-1.5 font-mono">
                                <Phone size={12} className="text-gray-600 shrink-0" />
                                <span>{place.info.phone}</span>
                            </div>
                        )}

                        {place.info?.price && (
                            <div className="flex items-center gap-1.5">
                                <DollarSign size={12} className="text-gray-600 shrink-0" />
                                <span>預算：{place.info.price}</span>
                            </div>
                        )}

                        {place.info?.booking_status && (
                            <div className="flex items-center gap-1.5">
                                <Ticket size={12} className="text-gray-600 shrink-0" />
                                <span>
                                    預約：
                                    {place.info.booking_status === "required" && "需提前預約"}
                                    {place.info.booking_status === "recommended" && "建議預約"}
                                    {place.info.booking_status === "walk_in" && "現場排隊"}
                                    {place.info.booking_status === "none" && "免預約"}
                                    {!["required", "recommended", "walk_in", "none"].includes(place.info.booking_status) && place.info.booking_status}
                                </span>
                            </div>
                        )}

                        {place.info?.transit_access && (
                            <div className="flex items-center gap-1.5 col-span-2">
                                <Train size={12} className="text-gray-600 shrink-0" />
                                <span>交通：{place.info.transit_access}</span>
                            </div>
                        )}

                        {place.info?.loc && (
                            <div className="flex items-center gap-1.5 col-span-2">
                                <MapPin size={12} className="text-gray-600 shrink-0" />
                                <span>地址：{place.info.loc}</span>
                            </div>
                        )}

                        {paymentList.length > 0 && (
                            <div className="flex items-center gap-1 col-span-2 flex-wrap pt-0.5">
                                <CreditCard size={12} className="text-gray-600 shrink-0 mr-1" />
                                <span className="mr-1">支付方式：</span>
                                {paymentList.map((p, i) => (
                                    <span key={i} className="text-[10px] bg-gray-100 border border-gray-300 px-1.5 py-0.2 rounded">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}

                        {amenitiesList.length > 0 && (
                            <div className="flex items-center gap-1 col-span-2 flex-wrap">
                                <Wifi size={12} className="text-gray-600 shrink-0 mr-1" />
                                <span className="mr-1">設施：</span>
                                {amenitiesList.map((a, i) => (
                                    <span key={i} className="text-[10px] bg-gray-100 border border-gray-300 px-1.5 py-0.2 rounded">
                                        {a}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 🍽️ 推薦品項清單 (列印表格) */}
                    {recommendedItems.length > 0 && (
                        <div className="bg-gray-50 border border-gray-300 rounded p-2.5 mt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-black border-b border-gray-200 pb-1">
                                <span className="flex items-center gap-1.5">
                                    <Utensils size={12} />
                                    <span>{place.type === "shopping" ? "🛍️ 推薦購買商品" : "🍽️ 必點推薦菜色"}</span>
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                    共 {recommendedItems.length} 項
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                                {recommendedItems.map((item, idx) => (
                                    <div key={idx} className="text-xs bg-white border border-gray-200 p-2 rounded space-y-0.5">
                                        <div className="flex items-start justify-between gap-1">
                                            <div className="font-bold text-black">
                                                {item.category && (
                                                    <span className="text-[9px] bg-gray-200 text-gray-800 px-1 py-0.2 rounded mr-1 font-bold">
                                                        {item.category}
                                                    </span>
                                                )}
                                                <span>{item.name}</span>
                                            </div>
                                            {item.price && (
                                                <span className="font-mono font-bold text-gray-900 shrink-0 ml-1">
                                                    {item.price}
                                                </span>
                                            )}
                                        </div>

                                        {(item.native_name || item.romaji) && (
                                            <div className="text-[10px] text-gray-600 font-mono">
                                                {item.native_name && <span className="font-sans font-medium text-gray-800">{item.native_name}</span>}
                                                {item.native_name && item.romaji && <span className="mx-1">•</span>}
                                                {item.romaji && <span className="italic">{item.romaji}</span>}
                                            </div>
                                        )}

                                        {item.note && (
                                            <div className="text-[10px] text-gray-600 pl-1 border-l border-gray-300">
                                                {item.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // 📱 iOS POC 原生卡片風格 (iOS PlaceCard)
    // ==========================================
    return (
        <div
            id={place.id}
            className="w-full p-3.5 sm:p-4 rounded-3xl border border-border/80 bg-card text-card-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-border group"
        >
            {/* 上半部：縮圖 + 主要資訊 */}
            <div className="flex items-start gap-3.5">
                {/* 16:9 圓角縮圖 */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-border/60 shadow-xs bg-muted">
                    {place.image_url ? (
                        <img
                            src={place.image_url}
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 text-[10px] gap-1">
                            <MapPin size={20} className="opacity-40" />
                            <span>無照片</span>
                        </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white font-bold tracking-wider">
                        {getCategoryTypeName(place.type)}
                    </span>
                </div>

                {/* 卡片主體文字資訊 */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-bold leading-tight line-clamp-1 text-foreground">
                                {place.name}
                            </h3>
                            {(place.eng_name || place.info?.native_name) && (
                                <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                                    {place.eng_name}
                                    {place.eng_name && place.info?.native_name && " · "}
                                    {place.info?.native_name}
                                </p>
                            )}
                        </div>

                        {place.info?.native_name && (
                            <button
                                type="button"
                                onClick={handleSpeak}
                                className={`p-1.5 rounded-full hover:bg-muted text-blue-500 transition-colors shrink-0 cursor-pointer ${
                                    speaking ? "animate-pulse scale-110 text-amber-500" : ""
                                }`}
                                title={`播放原文發音 (${detectedLang.name})`}
                            >
                                <Volume2 size={15} />
                            </button>
                        )}
                    </div>

                    {/* 即時營業狀態 / 住宿入住退房 + 評分 */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {isHotel ? (
                            <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-lg font-extrabold text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    🏨 住宿
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                    入住 {place.info?.check_in || "15:00"} · 退房 {place.info?.check_out || "11:00"}
                                </span>
                            </div>
                        ) : place.info?.open ? (
                            <>
                                <span
                                    className={`px-2 py-0.5 rounded-lg font-extrabold text-[11px] ${businessStatus.badgeColor}`}
                                >
                                    {businessStatus.badgeText}
                                </span>
                                <span className="text-muted-foreground text-[11px] truncate max-w-[130px] sm:max-w-none">
                                    {businessStatus.detailText}
                                </span>
                            </>
                        ) : null}

                        {place.info?.rating && (
                            <span className="flex items-center gap-0.5 text-amber-500 text-[11px] font-bold">
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                <span>{place.info.rating}</span>
                                {place.info.rating_count && (
                                    <span className="text-muted-foreground text-[10px] font-normal">
                                        ({place.info.rating_count})
                                    </span>
                                )}
                            </span>
                        )}
                    </div>

                    {/* 必吃 / 必買重點膠囊 or 預算 */}
                    <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                        {firstRecItem ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 truncate max-w-full">
                                <span>{place.type === "shopping" ? "🎁" : "🍽️"}</span>
                                <span className="truncate">{firstRecItem.name}</span>
                                {firstRecItem.price && (
                                    <span className="font-mono opacity-80">{firstRecItem.price}</span>
                                )}
                            </span>
                        ) : place.info?.price ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                <span>預算: {place.info.price}</span>
                            </span>
                        ) : null}

                        {place.info?.stay_duration && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md font-medium">
                                <Clock size={10} />
                                <span>{place.info.stay_duration}</span>
                            </span>
                        )}
                    </div>

                    {/* 🏷️ 標籤列 (直接在卡片正面展示，點擊可立即篩選/切換標籤) */}
                    {place.tags && (
                        <div className="flex flex-wrap gap-1 pt-1 items-center">
                            {place.tags
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)
                                .map((tag) => {
                                    const isTagSelected = selectedTags?.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTagBtnClick(tag);
                                            }}
                                            className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-all cursor-pointer border ${
                                                isTagSelected
                                                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border-border/50"
                                            }`}
                                            title={isTagSelected ? `取消篩選標籤: #${tag}` : `篩選標籤: #${tag}`}
                                        >
                                            <span>#{tag}</span>
                                        </button>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* 卡片底線操作按鈕 (地址 + 編輯/刪除 + 導航) */}
            <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground truncate min-w-0 flex-1">
                    <MapPin size={12} className="text-rose-500 shrink-0" />
                    <span className="truncate">{place.info?.loc || "尚未設定地址"}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {!isPreview && (
                        <>
                            <button
                                type="button"
                                onClick={() => onEdit(place)}
                                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="編輯地點"
                            >
                                <Pencil size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(place)}
                                className="p-1.5 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                                title="刪除地點"
                            >
                                <Trash2 size={13} />
                            </button>
                        </>
                    )}

                    {!isPreview && (
                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            title={`在 ${smartNav.appName} 中開啟導航`}
                        >
                            <Navigation size={12} />
                            <span>導航</span>
                        </a>
                    )}
                </div>
            </div>

            {/* 展開更多細節按鈕 (僅在有次要資訊時顯示，獨立置底整齊排列) */}
            {hasSecondaryDetails && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-2.5 pt-2 border-t border-dashed border-border/70 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all duration-200 cursor-pointer py-1 group/expand"
                >
                    <span className="font-medium">
                        {isExpanded ? "收起詳細資訊" : "查看詳細資訊 (Tips / 推薦 / 交通)"}
                    </span>
                    {isExpanded ? (
                        <ChevronUp size={13} className="transition-transform duration-200 group-hover/expand:-translate-y-0.5" />
                    ) : (
                        <ChevronDown size={13} className="transition-transform duration-200 group-hover/expand:translate-y-0.5" />
                    )}
                </button>
            )}

            {/* 展開後的詳細旅遊資訊 (Tips, 完整推薦菜單, 預約, 支付方式) */}
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
                    {/* Tips 備忘便箋 */}
                    {place.tips && (
                        <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-2xl text-foreground/90 flex items-start gap-2">
                            <Sparkles size={13} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                                <strong className="font-bold text-amber-600 dark:text-amber-400 mr-1">
                                    Tips:
                                </strong>
                                {place.tips}
                            </div>
                        </div>
                    )}

                    {/* 景點描述 */}
                    {place.description && (
                        <p className="text-muted-foreground leading-relaxed">
                            {place.description}
                        </p>
                    )}

                    {/* 實用資訊網格 (電話、交通出口、公休日) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                        {place.info?.transit_access && (
                            <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-xl border border-border/40">
                                <Train size={12} className="text-indigo-500 shrink-0" />
                                <span className="truncate">{place.info.transit_access}</span>
                            </div>
                        )}

                        {place.info?.phone && (
                            <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-xl border border-border/40 font-mono">
                                <Phone size={12} className="text-emerald-500 shrink-0" />
                                <span>{place.info.phone}</span>
                            </div>
                        )}

                        {place.info?.closed_days && (
                            <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2 rounded-xl border border-rose-500/20 font-medium">
                                <CalendarX size={12} className="shrink-0" />
                                <span className="truncate">{place.info.closed_days}</span>
                            </div>
                        )}
                    </div>

                    {/* 完整每週營業時間表 / 住宿入住退房 (展開時呈現) */}
                    {isHotel ? (
                        <div className="bg-muted/20 border border-border/60 p-3 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={13} className="text-blue-500" />
                                    <span>住宿入住 / 退房時間</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    Check-in & Check-out
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                                <div className="bg-background/80 border border-border/50 p-2.5 rounded-xl text-xs space-y-0.5">
                                    <span className="text-muted-foreground text-[11px] block font-medium">
                                        入住時間 (Check-in)
                                    </span>
                                    <span className="font-bold font-mono text-sm text-foreground">
                                        {place.info?.check_in || "15:00"}
                                    </span>
                                </div>
                                <div className="bg-background/80 border border-border/50 p-2.5 rounded-xl text-xs space-y-0.5">
                                    <span className="text-muted-foreground text-[11px] block font-medium">
                                        退房時間 (Check-out)
                                    </span>
                                    <span className="font-bold font-mono text-sm text-foreground">
                                        {place.info?.check_out || "11:00"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : place.info?.open ? (
                        <div className="bg-muted/20 border border-border/60 p-3 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={13} className="text-primary" />
                                    <span>全部營業時間</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${businessStatus.badgeColor}`}>
                                    {businessStatus.badgeText} • {businessStatus.detailText}
                                </span>
                            </div>

                            {businessStatus.parsed.isPerDay ? (
                                <div className="space-y-1.5 pt-0.5">
                                    <span className="text-muted-foreground text-xs block">
                                        {businessStatus.allHoursSummary}
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 pt-1 text-xs font-mono">
                                        {businessStatus.parsed.days.map((d) => (
                                             <div
                                                key={d.dayIndex}
                                                className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                                    d.isToday
                                                        ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold ring-1 ring-blue-500/20"
                                                        : "bg-background/80 border-border/50 text-muted-foreground"
                                                }`}
                                            >
                                                <span className="flex items-center gap-1 shrink-0 font-bold">
                                                    {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 animate-pulse" />}
                                                    <span>{d.dayLabel}</span>
                                                </span>
                                                <span className={`font-mono text-right shrink-0 ${d.isClosed ? "text-rose-500 font-semibold" : "text-foreground"}`}>
                                                    {d.periodsText}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-foreground text-xs font-medium pl-0.5">
                                    {businessStatus.allHoursSummary || place.info.open}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* 預約購票與官方網站列 */}
                    {(place.info?.booking_status || place.info?.booking_url || place.info?.website_url) && (
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                {place.info?.booking_status && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 text-xs">
                                        <Ticket size={12} />
                                        {place.info.booking_status === "required" && "🔴 需提前預約"}
                                        {place.info.booking_status === "recommended" && "🟡 建議預約"}
                                        {place.info.booking_status === "walk_in" && "🚶 現場排隊"}
                                        {place.info.booking_status === "none" && "🟢 免預約自由入場"}
                                        {!["required", "recommended", "walk_in", "none"].includes(place.info.booking_status) && place.info.booking_status}
                                    </span>
                                )}

                                {place.info?.booking_url && !isPreview && (
                                    <a
                                        href={place.info.booking_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                                    >
                                        <span>線上預約 / 購票</span>
                                        <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>

                            {place.info?.website_url && !isPreview && (
                                <a
                                    href={place.info.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                >
                                    <Globe size={12} />
                                    <span>官方網站</span>
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    )}

                    {/* 支付與設施標籤 */}
                    {(paymentList.length > 0 || amenitiesList.length > 0) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs pt-1">
                            {paymentList.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                    <CreditCard size={12} className="text-amber-500 shrink-0 mr-0.5" />
                                    {paymentList.map((pm, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium"
                                        >
                                            {pm}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {amenitiesList.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                    <Wifi size={12} className="text-teal-500 shrink-0 mr-0.5" />
                                    {amenitiesList.map((am, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/20 font-medium"
                                        >
                                            {am}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 🍽️ 推薦菜單 / 必買清單 */}
                    {recommendedItems.length > 0 && (
                        <div className="bg-muted/20 border border-border/70 p-3 rounded-2xl space-y-2 mt-2">
                            <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Utensils size={12} className="text-amber-500" />
                                    <span>
                                        {place.type === "shopping"
                                            ? "🛍️ 推薦購買商品"
                                            : "🍽️ 推薦菜單品項"}
                                    </span>
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    共 {recommendedItems.length} 項
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {recommendedItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs bg-card p-2.5 rounded-xl border border-border/80 space-y-0.5 shadow-2xs"
                                    >
                                        <div className="flex items-start justify-between gap-1">
                                            <div className="font-bold text-foreground truncate">
                                                {item.category && (
                                                    <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded mr-1 font-semibold">
                                                        {item.category}
                                                    </span>
                                                )}
                                                <span>{item.name}</span>
                                            </div>
                                            {item.price && (
                                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    {item.price}
                                                </span>
                                            )}
                                        </div>

                                        {(item.native_name || item.romaji) && (
                                            <div className="text-[10px] text-muted-foreground font-mono truncate">
                                                {item.native_name}
                                                {item.native_name && item.romaji && " · "}
                                                {item.romaji}
                                            </div>
                                        )}

                                        {item.note && (
                                            <p className="text-[10px] text-muted-foreground pl-1 border-l border-blue-500/40 mt-0.5 truncate">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlaceCard;
