import { useState } from "react";
import {
    Star,
    Clock,
    MapPin,
    Pencil,
    Trash2,
    CalendarX,
    Phone,
    Train,
    Ticket,
    CreditCard,
    Wifi,
    Utensils,
    Navigation,
    Sparkles,
    Volume2,
    Info,
    ChevronRight,
    DollarSign,
} from "lucide-react";
import {
    getCategoryTypeName,
    getCategoryLabel,
    getCategoryIcon,
} from "../../constants/Categories";
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
import { isValidPrice } from "../../utils/numberFormat";

type PlaceCardProps = {
    theme: TripThemeConf | null;
    place: PlaceVM;
    isPrinting?: boolean;
    isPreview: boolean;
    selectedTags?: string[];
    onDelete: (place: PlaceVM) => void;
    onEdit: (place: PlaceVM) => void;
    onTagBtnClick: (tag: string) => void;
    onView?: (place: PlaceVM) => void;
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
    onView,
}: PlaceCardProps) => {
    const [speaking, setSpeaking] = useState(false);
    const CategoryIcon = getCategoryIcon(place.type);

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

                        {isValidPrice(place.info?.price) && (
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
                                            {isValidPrice(item.price) && (
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
    // 📱 iOS 極簡質感卡片風格 (iOS Minimalist PlaceCard)
    // ==========================================
    return (
        <div
            id={place.id}
            onClick={() => onView?.(place)}
            className="group relative flex flex-col rounded-3xl overflow-hidden bg-card text-card-foreground border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full justify-between"
        >
            {/* 頂部：視覺封面圖與微徽章 */}
            <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-muted shrink-0">
                {place.image_url ? (
                    <img
                        src={place.image_url}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/90 via-muted to-muted/50 text-muted-foreground/30 relative">
                        <CategoryIcon size={36} className="opacity-40" />
                    </div>
                )}
                {/* 漸層陰影保障白字對比 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/35 pointer-events-none" />

                {/* 左上角：分類微徽章 */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-xs">
                    <CategoryIcon size={12} className="text-white/90" />
                    <span>{getCategoryLabel(place.type)}</span>
                </div>

                {/* 右上角：星級評分徽章 */}
                {place.info?.rating ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-xs">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{place.info.rating}</span>
                        {place.info.rating_count && (
                            <span className="text-[10px] text-white/75 font-mono font-normal">
                                ({place.info.rating_count})
                            </span>
                        )}
                    </div>
                ) : null}

                {/* 底部浮動狀態膠囊：住宿入住退房時間 或 即時營業狀態 */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    {isHotel ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium shadow-xs">
                            <span className="font-bold text-blue-300">🏨 住宿</span>
                            <span className="text-white/80 text-[10px]">
                                入住 {place.info?.check_in || "15:00"} · 退房 {place.info?.check_out || "11:00"}
                            </span>
                        </div>
                    ) : place.info?.open ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium shadow-xs truncate max-w-full">
                            <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                    businessStatus.badgeColor === "emerald"
                                        ? "bg-emerald-400 ring-2 ring-emerald-400/30"
                                        : businessStatus.badgeColor === "amber"
                                        ? "bg-amber-400 ring-2 ring-amber-400/30"
                                        : businessStatus.badgeColor === "rose"
                                        ? "bg-rose-400 ring-2 ring-rose-400/30"
                                        : "bg-gray-400"
                                }`}
                            />
                            <span className="font-bold text-white shrink-0">{businessStatus.badgeText}</span>
                            {businessStatus.detailText && (
                                <span className="text-white/80 text-[10px] truncate">
                                    {businessStatus.detailText}
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* 卡片本體內容區 */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                    {/* 地標名稱與發音 */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-bold leading-snug line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                                {place.name}
                            </h3>
                            {(place.eng_name || place.info?.native_name) && (
                                <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                                    {place.eng_name}
                                    {place.eng_name && place.info?.native_name && " · "}
                                    {place.info?.native_name}
                                </p>
                            )}
                        </div>

                        {place.info?.native_name && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSpeak();
                                }}
                                className={`p-1.5 rounded-full hover:bg-muted text-blue-500 transition-all shrink-0 cursor-pointer ${
                                    speaking ? "animate-pulse scale-110 text-amber-500" : ""
                                }`}
                                title={`播放原文發音 (${detectedLang.name})`}
                            >
                                <Volume2 size={15} />
                            </button>
                        )}
                    </div>

                    {/* 實用功能資訊 1：交通到達方式 (Transit Access，取代冷冰冰街道地址) */}
                    {place.info?.transit_access && (
                        <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-medium">
                            <Train size={12} className="text-blue-500 shrink-0" />
                            <span className="truncate">{place.info.transit_access}</span>
                        </div>
                    )}

                    {/* 實用功能資訊 2：首選招牌推薦 / 伴手禮 */}
                    {firstRecItem ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                            <Sparkles size={11} className="text-amber-500 shrink-0" />
                            <span className="truncate">招牌：{firstRecItem.name}</span>
                            {isValidPrice(firstRecItem.price) && (
                                <span className="ml-auto font-mono text-[11px] opacity-80">{firstRecItem.price}</span>
                            )}
                        </div>
                    ) : (place.info?.tips || place.description) ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {place.info?.tips || place.description}
                        </p>
                    ) : null}

                    {/* 實用標章群組（預約、預算、停留時間、公休提示） */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        {place.info?.booking_status === "required" && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                                📌 預約制
                            </span>
                        )}
                        {place.info?.booking_status === "recommended" && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                建議預約
                            </span>
                        )}
                        {isValidPrice(place.info?.price) && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                                預算 {place.info.price}
                            </span>
                        )}
                        {place.info?.stay_duration && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                                <Clock size={10} />
                                <span>{place.info.stay_duration}</span>
                            </span>
                        )}
                        {place.info?.closed_days && (
                            <span className="px-2 py-0.5 rounded-md bg-muted text-rose-500 font-medium">
                                {place.info.closed_days}
                            </span>
                        )}
                    </div>

                    {/* 🏷️ 標籤列 (支援點擊過濾) */}
                    {place.tags && (
                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                            {place.tags
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)
                                .slice(0, 4)
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
                                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-all cursor-pointer border ${
                                                isTagSelected
                                                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border-border/50"
                                            }`}
                                            title={isTagSelected ? `取消篩選: #${tag}` : `篩選: #${tag}`}
                                        >
                                            <span>#{tag}</span>
                                        </button>
                                    );
                                })}
                            {place.tags.split(",").filter((t) => t.trim()).length > 4 && (
                                <span className="text-[10px] text-muted-foreground/60 font-mono">
                                    +{place.tags.split(",").filter((t) => t.trim()).length - 4}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* 卡片底線操作列 */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                    {!isPreview ? (
                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
                            title={`在 ${smartNav.appName} 中開啟導航`}
                        >
                            <Navigation size={12} />
                            <span>導航</span>
                        </a>
                    ) : <div />}

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                        <button
                            type="button"
                            onClick={() => onView?.(place)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-all border border-border/70 hover:border-primary/40 cursor-pointer active:scale-95 ml-1 group/btn"
                        >
                            <span>詳情</span>
                            <ChevronRight size={13} className="text-muted-foreground group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;

