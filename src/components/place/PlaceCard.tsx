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
} from "lucide-react";
import { getCategoryTypeName } from "../../constants/Categories";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import {
    getSmartNavigationUrl,
    getSmartNavigationLabel,
} from "../../utils/MapNavigationUtil";

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
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const smartNav = getSmartNavigationLabel();
    const mapUrl = getSmartNavigationUrl({
        name: place.name,
        loc: place.info?.loc,
        lat: place.lat,
        lng: place.lng,
        customUrl: place.map_url,
    });

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

    // 檢查是否有額外旅遊細節（用於手機端判斷是否需要展開按鈕）
    const hasSecondaryDetails =
        !!place.info?.transit_access ||
        !!place.info?.booking_status ||
        !!place.info?.booking_url ||
        !!place.info?.website_url ||
        paymentList.length > 0 ||
        amenitiesList.length > 0 ||
        recommendedItems.length > 0;

    // ==========================================
    // 🖨️ 列印模式專屬排版 (Print / Preview Mode)
    // ==========================================
    if (isPrinting) {
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
                    {/* 標題與副標題 */}
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
                                    {place.info.rating_source && (
                                        <span className="ml-1 text-[9px] bg-gray-200 px-1 rounded text-gray-700">
                                            {place.info.rating_source}
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

                        {/* 標籤 (列印呈現) */}
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

                    {/* 景點描述 */}
                    {place.description && (
                        <p className="text-xs text-gray-800 leading-relaxed text-justify">
                            {place.description}
                        </p>
                    )}

                    {/* 景點 Tips 備忘 */}
                    {place.tips && (
                        <div className="bg-gray-100 p-2 rounded border-l-2 border-black text-xs text-black">
                            <strong className="font-bold mr-1">Tips:</strong>
                            {place.tips}
                        </div>
                    )}

                    {/* 實用資訊 2 欄網格 */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-800 pt-1 border-t border-gray-200">
                        {place.info?.check_in ? (
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-gray-600 shrink-0" />
                                <span>
                                    入住 {place.info.check_in}
                                    {place.info.check_out && ` / 退房 ${place.info.check_out}`}
                                </span>
                            </div>
                        ) : place.info?.open ? (
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-gray-600 shrink-0" />
                                <span className="truncate">{place.info.open}</span>
                            </div>
                        ) : null}

                        {place.info?.closed_days && (
                            <div className="flex items-center gap-1.5">
                                <CalendarX size={12} className="text-rose-700 shrink-0" />
                                <span className="font-medium text-rose-800">
                                    {place.info.closed_days}
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

                        {place.info?.transit_access && (
                            <div className="flex items-center gap-1.5">
                                <Train size={12} className="text-gray-600 shrink-0" />
                                <span className="truncate">{place.info.transit_access}</span>
                            </div>
                        )}

                        {place.info?.loc && (
                            <div className="flex items-center gap-1.5 col-span-2">
                                <MapPin size={12} className="text-gray-600 shrink-0" />
                                <span className="truncate">{place.info.loc}</span>
                            </div>
                        )}

                        {place.info?.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone size={12} className="text-gray-600 shrink-0" />
                                <span className="font-mono">{place.info.phone}</span>
                            </div>
                        )}

                        {place.info?.price && (
                            <div className="flex items-center gap-1.5">
                                <DollarSign size={12} className="text-gray-600 shrink-0" />
                                <span>預算: {place.info.price}</span>
                            </div>
                        )}

                        {place.info?.booking_status && (
                            <div className="flex items-center gap-1.5">
                                <Ticket size={12} className="text-gray-600 shrink-0" />
                                <span className="font-medium">
                                    {place.info.booking_status === "required" && "🔴 需提前預約"}
                                    {place.info.booking_status === "recommended" && "🟡 建議預約"}
                                    {place.info.booking_status === "walk_in" && "🚶 現場排隊"}
                                    {place.info.booking_status === "none" && "🟢 免預約"}
                                    {!["required", "recommended", "walk_in", "none"].includes(place.info.booking_status) && place.info.booking_status}
                                </span>
                            </div>
                        )}

                        {paymentList.length > 0 && (
                            <div className="flex items-center gap-1 col-span-2 flex-wrap pt-0.5">
                                <CreditCard size={12} className="text-gray-600 shrink-0 mr-1" />
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
                                {amenitiesList.map((a, i) => (
                                    <span key={i} className="text-[10px] bg-gray-100 border border-gray-300 px-1.5 py-0.2 rounded">
                                        {a}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 🍽️ 推薦菜單 / 必買商品 (列印紙本表格) */}
                    {recommendedItems.length > 0 && (
                        <div className="bg-gray-50 border border-gray-300 rounded p-2.5 mt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-black border-b border-gray-200 pb-1">
                                <span className="flex items-center gap-1.5">
                                    <Utensils size={12} />
                                    <span>{place.type === "shopping" ? "🛍️ 必買推薦商品清單" : "🍽️ 必點推薦菜色清單"}</span>
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
    // 💻 現代化橫式雜誌卡片 (Desktop & Responsive Mobile)
    // ==========================================
    return (
        <div
            id={place.id}
            className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/80 transition-all duration-300 group hover:shadow-lg flex flex-col md:flex-row w-full"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            {/* 左側照片區塊 (固定黃金比例裁切壓縮，避免直式長圖撐大卡片) */}
            <div className="relative overflow-hidden shrink-0 w-full md:w-72 lg:w-80 h-56 sm:h-64 md:h-auto md:min-h-[260px] md:self-stretch bg-muted">
                {place.image_url ? (
                    <img
                        src={place.image_url}
                        alt={place.name}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground/50 gap-1.5 p-4">
                        <MapPin size={28} className="opacity-30" />
                        <span>尚未設定照片</span>
                    </div>
                )}

                {/* 漸層遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />

                {/* 分類標籤 */}
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 uppercase tracking-widest font-bold shadow-md text-[11px] bg-background/90 backdrop-blur-md text-foreground rounded-full border border-border/40">
                        {getCategoryTypeName(place.type)}
                    </span>
                </div>

                {/* 浮動操作按鈕 (編輯 / 刪除) */}
                {!isPreview && (
                    <div
                        className={`absolute top-4 right-4 flex space-x-1.5 p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 transition-all duration-300 z-10 ${
                            showActions
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 -translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(place);
                            }}
                            className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
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
                            className="p-2 rounded-full text-white/90 hover:text-rose-400 hover:bg-white/20 transition-colors cursor-pointer"
                            title="刪除"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                {/* 左側照片底部亮點標籤 (評分、停留時間、預算) */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10 flex-wrap text-white">
                    {place.info?.rating ? (
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold border border-white/10">
                            <Star size={13} className="text-amber-400 fill-amber-400" />
                            <span>{place.info.rating}</span>
                            {place.info.rating_count && (
                                <span className="text-[10px] text-white/70 font-normal">
                                    ({place.info.rating_count})
                                </span>
                            )}
                        </div>
                    ) : (
                        <div />
                    )}

                    {place.info?.stay_duration && (
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-xl text-[11px] font-medium border border-white/10 text-white/90">
                            <Clock size={11} className="text-primary" />
                            <span>{place.info.stay_duration}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 右側主體內容區 (PC 寬版水平展開) */}
            <div className="p-5 md:p-6 flex flex-col justify-between flex-1 min-w-0 space-y-3.5">
                {/* 頂部：標題、副標題與導航按鈕 */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 border-b border-border/50 pb-3">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl md:text-2xl font-bold font-[Noto_Sans_TC] tracking-tight text-foreground">
                                {place.name}
                            </h3>
                            {place.info?.price && (
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                    {place.info.price}
                                </span>
                            )}
                        </div>

                        {(place.eng_name || place.info?.native_name) && (
                            <div className="text-xs text-muted-foreground font-mono flex items-center gap-2 flex-wrap">
                                {place.eng_name && <span>{place.eng_name}</span>}
                                {place.eng_name && place.info?.native_name && <span>•</span>}
                                {place.info?.native_name && (
                                    <span className="font-sans font-medium text-foreground/80">
                                        {place.info.native_name}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 快速導航按鈕 (連動 Apple / Google 地圖) */}
                    {!isPreview && (
                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs shrink-0 self-start cursor-pointer active:scale-95"
                            title={`在 ${smartNav.appName} 中開啟`}
                        >
                            <Navigation size={13} />
                            <span>{smartNav.label}</span>
                            <ExternalLink size={10} className="opacity-70" />
                        </a>
                    )}
                </div>

                {/* 標籤列 */}
                {!!place.tags && (
                    <div className="flex flex-wrap gap-1.5">
                        {place.tags.split(",").map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onTagBtnClick(tag.trim())}
                                className="text-[11px] font-medium bg-muted/60 text-muted-foreground px-2.5 py-0.5 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer border border-border/50"
                            >
                                #{tag.trim()}
                            </button>
                        ))}
                    </div>
                )}

                {/* 景點描述 */}
                {place.description && (
                    <p className="text-xs md:text-sm leading-relaxed text-justify text-muted-foreground/90 line-clamp-2 md:line-clamp-3">
                        {place.description}
                    </p>
                )}

                {/* Tips 備忘筆記 */}
                {place.tips && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs text-foreground/90 flex items-start gap-2">
                        <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-bold text-amber-600 dark:text-amber-400 mr-1">
                                Tips:
                            </strong>
                            {place.tips}
                        </div>
                    </div>
                )}

                {/* 常用重要資訊網格 (營業、地址、電話、交通) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-muted-foreground pt-1">
                    {/* 營業時間 / 入住退房 */}
                    {place.info?.check_in ? (
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-xl border border-border/40">
                            <Clock size={13} className="text-primary shrink-0" />
                            <span className="truncate">
                                入住 {place.info.check_in}
                                {place.info.check_out && ` / 退房 ${place.info.check_out}`}
                            </span>
                        </div>
                    ) : place.info?.open ? (
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-xl border border-border/40">
                            <Clock size={13} className="text-muted-foreground/80 shrink-0" />
                            <span className="truncate">{place.info.open}</span>
                        </div>
                    ) : null}

                    {/* 公休日 */}
                    {place.info?.closed_days && (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 p-2 rounded-xl border border-rose-500/20 font-medium">
                            <CalendarX size={13} className="shrink-0" />
                            <span className="truncate">{place.info.closed_days}</span>
                        </div>
                    )}

                    {/* 交通指引 */}
                    {place.info?.transit_access && (
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-xl border border-border/40">
                            <Train size={13} className="text-indigo-500 shrink-0" />
                            <span className="truncate">{place.info.transit_access}</span>
                        </div>
                    )}

                    {/* 詳細地址 */}
                    {place.info?.loc && (
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-xl border border-border/40 sm:col-span-2">
                            <MapPin size={13} className="text-rose-500 shrink-0" />
                            <span className="truncate">{place.info.loc}</span>
                        </div>
                    )}

                    {/* 電話 */}
                    {place.info?.phone && (
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-xl border border-border/40 font-mono">
                            <Phone size={13} className="text-muted-foreground/80 shrink-0" />
                            <span>{place.info.phone}</span>
                        </div>
                    )}
                </div>

                {/* 手機端「展開/收起」控制紐 (在 PC 上一律自動完整展開) */}
                {hasSecondaryDetails && (
                    <button
                        type="button"
                        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                        className="md:hidden flex items-center justify-center gap-1.5 py-2 px-3 bg-muted/60 text-xs font-semibold text-foreground rounded-xl border border-border/60 hover:bg-muted transition-colors cursor-pointer w-full mt-1"
                    >
                        <span>
                            {isMobileExpanded
                                ? "收起詳細旅遊資訊 ▴"
                                : `展開更多旅遊細節 & 推薦品項 (${recommendedItems.length > 0 ? `推薦 ${recommendedItems.length} 項` : "預約/支付/設施"}) ▾`}
                        </span>
                    </button>
                )}

                {/* 次要細節與推薦菜單 (PC 寬版直接展開 / Mobile 依開關展開) */}
                <div
                    className={`space-y-3 pt-2 border-t border-border/50 ${
                        isMobileExpanded ? "block" : "hidden md:block"
                    }`}
                >
                    {/* 預約購票 & 官方網站行動列 */}
                    {(place.info?.booking_status || place.info?.booking_url || place.info?.website_url) && (
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                {place.info?.booking_status && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
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
                                    <span>官方網站 / 社群</span>
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    )}

                    {/* 支付方式與便利設施標籤 */}
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

                    {/* 🍽️ 推薦菜單 / 必買商品清單 (PC: 多欄美觀卡片 / Mobile: 清爽卡片) */}
                    {recommendedItems.length > 0 && (
                        <div className="mt-2 pt-2.5 bg-muted/20 border border-border/70 p-3.5 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Utensils size={13} className="text-amber-500" />
                                    <span>
                                        {place.type === "shopping"
                                            ? "🛍️ 推薦購買商品 / 必買清單"
                                            : "🍽️ 推薦菜單 / 必點品項"}
                                    </span>
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    共 {recommendedItems.length} 項推薦
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                                {recommendedItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs bg-card p-3 rounded-xl border border-border/80 space-y-1 shadow-2xs hover:border-primary/40 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5 font-bold text-foreground min-w-0">
                                                {item.category && (
                                                    <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                                        {item.category}
                                                    </span>
                                                )}
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                            {item.price && (
                                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    {item.price}
                                                </span>
                                            )}
                                        </div>

                                        {(item.native_name || item.romaji) && (
                                            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 flex-wrap">
                                                {item.native_name && (
                                                    <span className="font-sans text-foreground/90 font-medium">
                                                        {item.native_name}
                                                    </span>
                                                )}
                                                {item.native_name && item.romaji && <span>•</span>}
                                                {item.romaji && (
                                                    <span className="text-muted-foreground italic">
                                                        {item.romaji}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {item.note && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 pl-1.5 border-l-2 border-primary/40 mt-1">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceCard;
