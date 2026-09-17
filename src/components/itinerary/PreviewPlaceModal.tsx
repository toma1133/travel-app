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
    ChevronDown,
    ChevronUp,
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
import { Volume2 } from "lucide-react";
import { detectLanguage, playPronunciation } from "../../utils/SpeechLanguageUtil";
import { isValidPrice } from "../../utils/numberFormat";

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
    const [speaking, setSpeaking] = useState(false);
    const [showAllHours, setShowAllHours] = useState(false);

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

    const smartNav = getSmartNavigationLabel(place.map_url);
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

                        {isValidPrice(place.info?.price) && (
                            <div className="bg-emerald-500/90 text-white backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono font-bold border border-emerald-400/30 shadow-xs">
                                預算: {place.info.price}
                            </div>
                        )}
                    </div>
                </div>

                {/* 滾動內容本體 */}
                <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-4.5 flex-1">
                    {/* 地點名稱與原文稱呼 */}
                    <div className="space-y-2 border-b border-border/60 pb-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl sm:text-3xl font-black font-[Noto_Sans_TC] tracking-tight text-foreground leading-tight">
                                    {place.name}
                                </h2>
                                {place.eng_name && (
                                    <div className="text-xs text-muted-foreground font-mono mt-1 leading-normal">
                                        {place.eng_name}
                                    </div>
                                )}
                                {place.info?.native_name && (() => {
                                    const detected = detectLanguage(place.info?.native_name, {
                                        address: place.info?.loc,
                                        currency: place.info?.price,
                                    });
                                    return (
                                        <div className="pt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    playPronunciation(place.info?.native_name, {
                                                        context: {
                                                            address: place.info?.loc,
                                                            mapUrl: place.map_url,
                                                            currency: place.info?.price,
                                                        },
                                                        onStart: () => setSpeaking(true),
                                                        onEnd: () => setSpeaking(false),
                                                        onError: () => setSpeaking(false),
                                                    });
                                                }}
                                                className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2.5 py-1 bg-blue-500/10 rounded-xl border border-blue-500/25 transition-all cursor-pointer group shadow-2xs hover:bg-blue-500/15"
                                                title={`以 ${detected.name} 發音`}
                                            >
                                                <Volume2
                                                    size={13}
                                                    className={`shrink-0 transition-transform ${
                                                        speaking ? "scale-125 text-amber-500 animate-pulse" : "group-hover:scale-110"
                                                    }`}
                                                />
                                                <span className="font-sans font-semibold tracking-wide text-foreground">
                                                    {place.info.native_name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                                                    <span>{detected.flag}</span>
                                                    <span>{detected.name}</span>
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })()}
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

                    {/* 營業時間 / 入住退房資訊 */}
                    {place.type === "hotel" || place.type === "stay" || place.info?.check_in ? (
                        <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <Clock size={14} className="text-primary" />
                                <span>入住與退房時間</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="bg-background/80 dark:bg-card/60 p-3 rounded-xl border border-border/50 flex flex-col">
                                    <span className="text-[11px] text-muted-foreground font-medium">最早入住</span>
                                    <span className="text-base font-bold text-foreground font-mono mt-0.5">
                                        {place.info?.check_in || "15:00"}
                                    </span>
                                </div>
                                <div className="bg-background/80 dark:bg-card/60 p-3 rounded-xl border border-border/50 flex flex-col">
                                    <span className="text-[11px] text-muted-foreground font-medium">最晚退房</span>
                                    <span className="text-base font-bold text-foreground font-mono mt-0.5">
                                        {place.info?.check_out || "11:00"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : place.info?.open ? (
                        (() => {
                            const businessStatus = getBusinessStatus(place.info.open, place.info.closed_days);
                            return (
                                <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl p-3.5 sm:p-4 space-y-3">
                                    {/* 頂部狀態列 */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-foreground block">
                                                    營業時間
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {businessStatus.allHoursSummary}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 即時營業狀態標籤 (Apple / Google 地圖質感膠囊) */}
                                        <div className="flex items-center gap-1.5">
                                            {businessStatus.status === "open" && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-2xs">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    營業中 • {businessStatus.detailText}
                                                </span>
                                            )}
                                            {businessStatus.status === "closing_soon" && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-2xs">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                    即將打烊 • {businessStatus.detailText}
                                                </span>
                                            )}
                                            {businessStatus.status === "closed" && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 shadow-2xs">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                    休息中 • {businessStatus.detailText}
                                                </span>
                                            )}
                                            {businessStatus.status === "closed_today" && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30 shadow-2xs">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                    今日公休 • {businessStatus.detailText}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 公休日提醒 (若有設定) */}
                                    {place.info.closed_days && (
                                        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 font-medium">
                                            <CalendarX size={14} className="shrink-0 text-rose-500" />
                                            <span>公休資訊：{place.info.closed_days}</span>
                                        </div>
                                    )}

                                    {/* 一週完整營業時段 (可收合/展開) */}
                                    {businessStatus.parsed.isPerDay && (
                                        <div className="pt-1 border-t border-border/40">
                                            <button
                                                type="button"
                                                onClick={() => setShowAllHours((prev) => !prev)}
                                                className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground py-1 transition-colors cursor-pointer"
                                            >
                                                <span>查看一週詳細時段</span>
                                                <span className="flex items-center gap-1 text-[11px] text-primary font-bold">
                                                    {showAllHours ? "收合時段" : "展開時段"}
                                                    {showAllHours ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                </span>
                                            </button>

                                            {showAllHours && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 animate-in fade-in duration-200">
                                                    {businessStatus.parsed.days.map((d) => (
                                                        <div
                                                            key={d.dayIndex}
                                                            className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                                                                d.isToday
                                                                    ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-2xs"
                                                                    : "bg-background/70 dark:bg-card/50 border-border/50 text-muted-foreground"
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-1.5 shrink-0">
                                                                {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                                                                <span>{d.dayLabel}</span>
                                                            </span>
                                                            <span className={`font-mono text-right shrink-0 ${d.isClosed ? "text-rose-500 font-bold" : "text-foreground font-medium"}`}>
                                                                {d.periodsText}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    ) : null}

                    {/* 地點前往與入場規定群組 (iOS Inset Grouped 清爽質感排版) */}
                    {(place.info?.transit_access || place.info?.loc || place.info?.booking_status) && (
                        <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 text-xs">
                            {/* 交通指引 */}
                            {place.info?.transit_access && (
                                <div className="p-3.5 flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                                        <Train size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">
                                            交通方式 / 鄰近地鐵出口
                                        </span>
                                        <p className="text-foreground font-medium leading-relaxed">
                                            {place.info.transit_access}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 詳細地址 */}
                            {place.info?.loc && (
                                <div className="p-3.5 flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                                            <MapPin size={15} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">
                                                地點地址
                                            </span>
                                            <p className="text-foreground font-medium break-all select-all leading-relaxed">
                                                {place.info.loc}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyAddress}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/90 hover:bg-background text-muted-foreground hover:text-foreground border border-border/60 transition-all shrink-0 active:scale-95 cursor-pointer shadow-2xs"
                                        title="複製地址"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={13} className="text-emerald-500" />
                                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">已複製</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={13} />
                                                <span className="text-[11px] font-medium">複製</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* 預約規定 */}
                            {place.info?.booking_status && (
                                <div className="p-3.5 flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                                            <Ticket size={15} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-muted-foreground block text-[11px]">
                                                入場與預約方式
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-xs px-3 py-1 rounded-full bg-background dark:bg-card border border-border/50 text-foreground shadow-2xs">
                                        {place.info.booking_status === "required" && "🔴 需提前預約"}
                                        {place.info.booking_status === "recommended" && "🟡 建議預約"}
                                        {place.info.booking_status === "walk_in" && "🚶 現場排隊入場"}
                                        {place.info.booking_status === "none" && "🟢 免預約自由入場"}
                                        {!["required", "recommended", "walk_in", "none"].includes(place.info.booking_status) && place.info.booking_status}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 必吃招牌 / 推薦品項與伴手禮 (米其林精品卡片美學) */}
                    {recommendedItems.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border/60">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Utensils size={13} />
                                    </div>
                                    <span>推薦必點招牌 / 必買伴手禮</span>
                                </h4>
                                <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                                    {recommendedItems.length} 項精選
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {recommendedItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-card/90 dark:bg-card/50 backdrop-blur-xs border border-border/70 hover:border-primary/40 p-3.5 rounded-2xl space-y-1.5 shadow-2xs hover:shadow-xs transition-all group"
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                {item.category && (
                                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full ring-1 ring-primary/20 shrink-0">
                                                        {item.category}
                                                    </span>
                                                )}
                                                <span className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {item.name}
                                                </span>
                                            </div>
                                            {isValidPrice(item.price) && (
                                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                                                    {item.price}
                                                </span>
                                            )}
                                        </div>

                                        {(item.native_name || item.romaji) && (
                                            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 flex-wrap">
                                                {item.native_name && <span className="font-medium text-foreground/85">{item.native_name}</span>}
                                                {item.native_name && item.romaji && <span className="opacity-40">•</span>}
                                                {item.romaji && <span className="opacity-75">{item.romaji}</span>}
                                            </div>
                                        )}

                                        {item.note && (
                                            <p className="text-[11px] text-muted-foreground/90 bg-muted/40 p-2 rounded-xl border border-border/40 mt-1 leading-relaxed">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 實用資訊與設施服務 */}
                    {(paymentList.length > 0 || amenitiesList.length > 0) && (
                        <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs">
                            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <CreditCard size={13} className="text-primary" />
                                <span>實用資訊與設施服務</span>
                            </h4>

                            <div className="space-y-2">
                                {paymentList.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                                            付款方式：
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {paymentList.map((pay) => (
                                                <span
                                                    key={pay}
                                                    className="inline-flex items-center gap-1 bg-background dark:bg-muted/40 text-foreground/80 px-2.5 py-1 rounded-xl font-medium border border-border/60 text-[11px] shadow-2xs"
                                                >
                                                    <CreditCard size={11} className="text-primary opacity-80" />
                                                    <span>{pay}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {amenitiesList.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                                            設施服務：
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {amenitiesList.map((amenity) => (
                                                <span
                                                    key={amenity}
                                                    className="inline-flex items-center gap-1 bg-primary/5 text-primary-900 dark:text-primary-200 px-2.5 py-1 rounded-xl font-medium border border-primary/20 text-[11px]"
                                                >
                                                    <Sparkles size={11} className="text-amber-500" />
                                                    <span>{amenity}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewPlaceModal;
