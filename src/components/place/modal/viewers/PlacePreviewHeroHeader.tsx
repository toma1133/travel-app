import React from "react";
import {
    X,
    MapPin,
    Star,
    Clock,
    Volume2,
    Navigation,
    ExternalLink,
    Ticket,
    Globe,
    Phone,
    ShoppingBag,
    Sparkles,
    Pin,
} from "lucide-react";
import type { PlaceVM } from "../../../../models/types/PlaceTypes";
import type { ItineraryActivitiy } from "../../../../models/types/ItineraryTypes";
import { getCategoryTypeName } from "../../../../constants/Categories";
import { isValidPrice } from "../../../../utils/numberFormat";
import {
    getSmartNavigationLabel,
    getSmartNavigationUrl,
} from "../../../../utils/MapNavigationUtil";
import { detectLanguage } from "../../../../utils/SpeechLanguageUtil";

export interface PlacePreviewHeroHeaderProps {
    place: PlaceVM;
    activity?: ItineraryActivitiy | null;
    speaking: boolean;
    onSpeak: () => void;
    onClose: () => void;
    onNavigateToShopping?: () => void;
}

export const PlacePreviewHeroHeader: React.FC<PlacePreviewHeroHeaderProps> = ({
    place,
    activity,
    speaking,
    onSpeak,
    onClose,
    onNavigateToShopping,
}) => {
    const smartNav = getSmartNavigationLabel(place.map_url);
    const mapUrl = getSmartNavigationUrl({
        name: place.name,
        loc: place.info?.loc,
        lat: place.lat,
        lng: place.lng,
        customUrl: place.map_url,
    });

    const detected = place.info?.native_name
        ? detectLanguage(place.info.native_name, {
              address: place.info?.loc,
              currency: place.info?.price,
          })
        : null;

    return (
        <div className="space-y-4">
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
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md rounded-full transition-all shadow-lg z-20 cursor-pointer active:scale-95 border border-white/20"
                    title="關閉"
                >
                    <X size={18} />
                </button>

                {/* 照片底部亮點標籤 */}
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
                            預算: {place.info?.price}
                        </div>
                    )}
                </div>
            </div>

            {/* 內容區塊 */}
            <div className="px-5 sm:px-6 space-y-4">
                {/* 行程排定資訊 */}
                {activity && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap text-xs shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                                <Clock size={13} />
                            </div>
                            <span className="font-bold text-foreground">
                                今日排定：{activity.time}
                            </span>
                            {activity.duration && (
                                <span className="text-muted-foreground font-medium">
                                    • 停留 {activity.duration}
                                </span>
                            )}
                            {activity.isFixed && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    <Pin size={10} className="fill-amber-500" />
                                    <span>固定站點</span>
                                </span>
                            )}
                        </div>
                        {activity.desc &&
                            activity.desc !== place.name &&
                            activity.desc !== place.eng_name &&
                            activity.desc !== place.info?.native_name && (
                                <span className="text-muted-foreground/90 italic truncate max-w-xs text-[11px]">
                                    備註: {activity.desc}
                                </span>
                            )}
                    </div>
                )}

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
                            {place.info?.native_name && detected && (
                                <div className="pt-1.5">
                                    <button
                                        type="button"
                                        onClick={onSpeak}
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

                {/* 行動快捷列 */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* 快速導航按鈕 */}
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

                    {/* 購物願望清單 */}
                    {onNavigateToShopping && (
                        <button
                            type="button"
                            onClick={onNavigateToShopping}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors border border-rose-500/30 cursor-pointer"
                            title="查看或新增此地點之購物願望清單"
                        >
                            <ShoppingBag size={14} />
                            <span>購物願望清單</span>
                        </button>
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
            </div>
        </div>
    );
};
