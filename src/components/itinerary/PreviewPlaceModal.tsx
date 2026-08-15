import React, { JSX, MouseEventHandler, useState } from "react";
import {
    X,
    Navigation,
    ExternalLink,
    Star,
    Clock,
    CalendarX,
    Train,
    MapPin,
    Phone,
    Globe,
    Ticket,
    Sparkles,
    CreditCard,
    Utensils,
    Copy,
    Check,
} from "lucide-react";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import { getCategoryTypeName } from "../../constants/Categories";
import {
    getSmartNavigationLabel,
    getSmartNavigationUrl,
} from "../../utils/MapNavigationUtil";
import {
    formatOpeningHours,
    parseOpeningHours,
    getBusinessStatus,
} from "../../utils/OpeningHoursUtil";

type PreviewPlaceModalProps = {
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    place?: PlaceVM | null;
    theme?: TripThemeConf | null;
    children?: JSX.Element;
};

const PreviewPlaceModal = ({
    onCloseBtnClick,
    place,
    theme,
    children,
}: PreviewPlaceModalProps) => {
    const [copied, setCopied] = useState(false);

    if (!place) {
        return (
            <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div
                    className="w-full max-w-lg bg-card text-foreground rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden border border-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-full transition-colors z-20 cursor-pointer"
                        title="關閉"
                    >
                        <X size={20} />
                    </button>
                    {children}
                </div>
            </div>
        );
    }

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

    const handleCopyAddress = () => {
        const text = place.info?.loc || place.name;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div
            className="fixed inset-0 z-100 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    (onCloseBtnClick as any)(e);
                }
            }}
        >
            <div
                className="w-full max-w-2xl max-h-[90vh] bg-card text-foreground rounded-3xl shadow-2xl border border-border/80 flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 頂部 Hero 圖片區塊 */}
                <div className="relative w-full h-56 sm:h-64 shrink-0 bg-muted overflow-hidden">
                    {place.image_url ? (
                        <img
                            src={place.image_url}
                            alt={place.name}
                            className="w-full h-full object-cover object-center"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-2 bg-gradient-to-br from-muted/80 to-muted">
                            <MapPin size={40} className="opacity-30" />
                            <span className="text-sm font-medium">尚未設定景點照片</span>
                        </div>
                    )}

                    {/* 漸層遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 pointer-events-none" />

                    {/* 分類標籤 */}
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-3.5 py-1 uppercase tracking-widest font-bold shadow-md text-xs bg-background/90 backdrop-blur-md text-foreground rounded-full border border-border/40">
                            {getCategoryTypeName(place.type)}
                        </span>
                    </div>

                    {/* 關閉按鈕 */}
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md rounded-full transition-all shadow-lg z-20 cursor-pointer active:scale-95 border border-white/20"
                        title="關閉"
                    >
                        <X size={18} />
                    </button>

                    {/* 照片底部亮點標籤 (評分、停留時間、預算) */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 z-10 flex-wrap text-white">
                        <div className="flex items-center gap-2 flex-wrap">
                            {place.info?.rating && (
                                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold border border-white/15">
                                    <Star size={13} className="text-amber-400 fill-amber-400" />
                                    <span>{place.info.rating}</span>
                                    {place.info.rating_count && (
                                        <span className="text-[10px] text-white/75 font-normal">
                                            ({place.info.rating_count}
                                            {place.info.rating_source ? ` ${place.info.rating_source}` : ""})
                                        </span>
                                    )}
                                </div>
                            )}

                            {place.info?.stay_duration && (
                                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-medium border border-white/15 text-white/90">
                                    <Clock size={12} className="text-primary" />
                                    <span>建議停留 {place.info.stay_duration}</span>
                                </div>
                            )}
                        </div>

                        {place.info?.price && (
                            <div className="bg-emerald-500/90 text-white backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono font-bold border border-emerald-400/30 shadow-xs">
                                預算: {place.info.price}
                            </div>
                        )}
                    </div>
                </div>

                {/* 滾動內容本體 */}
                <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-4.5 flex-1">
                    {/* 地點名稱與原文稱呼 */}
                    <div className="space-y-1.5 border-b border-border/60 pb-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold font-[Noto_Sans_TC] tracking-tight text-foreground">
                                    {place.name}
                                </h2>
                                {(place.eng_name || place.info?.native_name) && (
                                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-2 flex-wrap mt-1">
                                        {place.eng_name && <span className="font-semibold">{place.eng_name}</span>}
                                        {place.eng_name && place.info?.native_name && <span>•</span>}
                                        {place.info?.native_name && (
                                            <span className="font-sans font-medium text-foreground/90">
                                                {place.info.native_name}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 標籤列 */}
                        {!!place.tags && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {place.tags.split(",").map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg border border-primary/20"
                                    >
                                        #{tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 行動快捷列 (導航、線上預約、官方網站、撥打電話) */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* 快速導航按鈕 (智慧判斷 Google / Apple 地圖) */}
                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs active:scale-95 cursor-pointer"
                            title={`在 ${smartNav.appName} 中開啟`}
                        >
                            <Navigation size={14} />
                            <span>{smartNav.label}</span>
                            <ExternalLink size={11} className="opacity-75" />
                        </a>

                        {/* 線上預約 */}
                        {place.info?.booking_url && (
                            <a
                                href={place.info.booking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                                <Ticket size={14} />
                                <span>線上預約 / 購票</span>
                                <ExternalLink size={11} className="opacity-75" />
                            </a>
                        )}

                        {/* 官網 */}
                        {place.info?.website_url && (
                            <a
                                href={place.info.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border/70"
                            >
                                <Globe size={14} className="text-purple-500" />
                                <span>官方網站</span>
                                <ExternalLink size={11} className="opacity-60" />
                            </a>
                        )}

                        {/* 電話撥打 */}
                        {place.info?.phone && (
                            <a
                                href={`tel:${place.info.phone}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border/70 font-mono"
                            >
                                <Phone size={14} className="text-emerald-500" />
                                <span>{place.info.phone}</span>
                            </a>
                        )}
                    </div>

                    {/* 景點描述 */}
                    {place.description && (
                        <div className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-3.5 rounded-2xl border border-border/50">
                            {place.description}
                        </div>
                    )}

                    {/* 旅遊備忘 / Tips */}
                    {place.tips && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs sm:text-sm text-foreground flex items-start gap-2.5">
                            <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-bold text-amber-600 dark:text-amber-400 mr-1.5">
                                    旅遊備忘 (Tips):
                                </strong>
                                {place.tips}
                            </div>
                        </div>
                    )}

                    {/* 重點資訊卡片網格 (營業時間、公休日、交通、地址) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {/* 營業時間 / 入住退房 */}
                        {place.info?.check_in ? (
                            <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-2xl border border-border/60">
                                <Clock size={15} className="text-primary shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">
                                        入住 / 退房時間
                                    </span>
                                    <span className="text-foreground font-medium">
                                        入住 {place.info.check_in}
                                        {place.info.check_out && ` / 退房 ${place.info.check_out}`}
                                    </span>
                                </div>
                            </div>
                        ) : place.info?.open ? (
                            <div className="flex items-start gap-2.5 bg-muted/40 p-3.5 rounded-2xl border border-border/60 sm:col-span-2">
                                <Clock size={16} className="text-primary shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    {(() => {
                                        const businessStatus = getBusinessStatus(place.info.open, place.info.closed_days);
                                        return (
                                            <>
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <span className="font-bold text-muted-foreground block text-[11px]">
                                                        營業時間
                                                    </span>
                                                    {/* 營業狀態標籤 (Google 地圖效果) */}
                                                    <div className="flex items-center gap-1.5">
                                                        {businessStatus.status === "open" && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                {businessStatus.detailText}
                                                            </span>
                                                        )}
                                                        {businessStatus.status === "closing_soon" && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                {businessStatus.detailText}
                                                            </span>
                                                        )}
                                                        {businessStatus.status === "closed" && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                {businessStatus.detailText}
                                                            </span>
                                                        )}
                                                        {businessStatus.status === "closed_today" && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                今日公休
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {businessStatus.parsed.isPerDay ? (
                                                    <div className="space-y-1.5 pt-0.5">
                                                        <span className="text-foreground font-semibold text-xs block">
                                                            {businessStatus.allHoursSummary}
                                                        </span>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[11px] font-mono">
                                                            {businessStatus.parsed.days.map((d) => (
                                                                <div
                                                                    key={d.dayIndex}
                                                                    className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 ${
                                                                        d.isToday
                                                                            ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-2xs"
                                                                            : "bg-background/70 border-border/60 text-muted-foreground"
                                                                    }`}
                                                                >
                                                                    <span className="flex items-center gap-1">
                                                                        {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                                        {d.dayLabel}
                                                                    </span>
                                                                    <span className={d.isClosed ? "text-rose-500 font-bold" : "text-foreground font-medium"}>
                                                                        {d.periodsText}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-foreground font-medium text-xs sm:text-sm block">
                                                        {businessStatus.allHoursSummary}
                                                    </span>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : null}

                        {/* 公休日 */}
                        {place.info?.closed_days && (
                            <div className="flex items-start gap-2 bg-rose-500/10 text-rose-700 dark:text-rose-300 p-3 rounded-2xl border border-rose-500/20">
                                <CalendarX size={15} className="shrink-0 mt-0.5 text-rose-500" />
                                <div>
                                    <span className="font-bold text-rose-600/80 dark:text-rose-400/80 block text-[11px] mb-0.5">
                                        公休日
                                    </span>
                                    <span className="font-semibold">{place.info.closed_days}</span>
                                </div>
                            </div>
                        )}

                        {/* 交通指引 */}
                        {place.info?.transit_access && (
                            <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-2xl border border-border/60">
                                <Train size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">
                                        交通方式 / 地鐵出口
                                    </span>
                                    <span className="text-foreground font-medium">{place.info.transit_access}</span>
                                </div>
                            </div>
                        )}

                        {/* 預約規定 */}
                        {place.info?.booking_status && (
                            <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-2xl border border-border/60">
                                <Ticket size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">
                                        預約規定
                                    </span>
                                    <span className="text-foreground font-medium">
                                        {place.info.booking_status === "required" && "🔴 需提前預約"}
                                        {place.info.booking_status === "recommended" && "🟡 建議預約"}
                                        {place.info.booking_status === "walk_in" && "🚶 現場排隊入場"}
                                        {place.info.booking_status === "none" && "🟢 免預約自由入場"}
                                        {!["required", "recommended", "walk_in", "none"].includes(place.info.booking_status) && place.info.booking_status}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 詳細地址 */}
                        {place.info?.loc && (
                            <div className="flex items-start justify-between gap-2 bg-muted/40 p-3 rounded-2xl border border-border/60 sm:col-span-2">
                                <div className="flex items-start gap-2 min-w-0">
                                    <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">
                                            地點地址
                                        </span>
                                        <span className="text-foreground font-medium break-all select-all">
                                            {place.info.loc}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyAddress}
                                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0 cursor-pointer"
                                    title="複製地址"
                                >
                                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 必吃招牌 / 推薦品項與伴手禮 */}
                    {recommendedItems.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/60">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <Utensils size={13} className="text-amber-500" />
                                <span>推薦必點招牌 / 必買伴手禮 ({recommendedItems.length} 項)</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {recommendedItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-card border border-border/80 p-3 rounded-2xl space-y-1 shadow-2xs hover:border-primary/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {item.category && (
                                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md shrink-0">
                                                        {item.category}
                                                    </span>
                                                )}
                                                <span className="font-bold text-xs text-foreground truncate">
                                                    {item.name}
                                                </span>
                                            </div>
                                            {item.price && (
                                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    {item.price}
                                                </span>
                                            )}
                                        </div>

                                        {(item.native_name || item.romaji) && (
                                            <div className="text-[11px] text-muted-foreground font-mono">
                                                {item.native_name && <span>{item.native_name}</span>}
                                                {item.native_name && item.romaji && <span> </span>}
                                                {item.romaji && <span className="opacity-80">({item.romaji})</span>}
                                            </div>
                                        )}

                                        {item.note && (
                                            <p className="text-[11px] text-muted-foreground/90 pl-1.5 border-l-2 border-primary/30 pt-0.5">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 支付方式與設施標籤 */}
                    {(paymentList.length > 0 || amenitiesList.length > 0) && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60 text-xs">
                            {paymentList.map((pay) => (
                                <span
                                    key={pay}
                                    className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-xl font-medium border border-border/50 text-[11px]"
                                >
                                    <CreditCard size={11} className="text-primary" />
                                    <span>{pay}</span>
                                </span>
                            ))}
                            {amenitiesList.map((amenity) => (
                                <span
                                    key={amenity}
                                    className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-xl font-medium border border-border/50 text-[11px]"
                                >
                                    <Sparkles size={11} className="text-amber-500" />
                                    <span>{amenity}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewPlaceModal;
