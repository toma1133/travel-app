import React from "react";
import { Utensils, Volume2 } from "lucide-react";
import type { RecommendedItem } from "../../../../models/types/PlaceTypes";
import { isValidPrice } from "../../../../utils/numberFormat";

export interface RecommendedItemsViewerProps {
    items?: RecommendedItem[];
    onSpeakItem?: (item: RecommendedItem, idx: number, e?: React.MouseEvent) => void;
    speakingItemIdx?: number | null;
}

export const RecommendedItemsViewer: React.FC<RecommendedItemsViewerProps> = ({
    items = [],
    onSpeakItem,
    speakingItemIdx,
}) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <Utensils size={13} />
                    </div>
                    <span>推薦必點招牌 / 必買伴手禮</span>
                </h4>
                <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                    {items.length} 項精選
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="bg-card/90 dark:bg-card/50 backdrop-blur-xs border border-border/70 hover:border-primary/40 p-3 sm:p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-all group flex gap-3 items-start"
                    >
                        {/* 品項圖片 */}
                        {item.image_url && (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-muted/60 border border-border/60 shadow-2xs">
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        const parent = (e.target as HTMLElement).parentElement;
                                        if (parent) parent.style.display = "none";
                                    }}
                                />
                            </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1 space-y-1">
                                    {item.category && (
                                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full ring-1 ring-primary/20 shrink-0 inline-block">
                                            {item.category}
                                        </span>
                                    )}
                                    <h5 className="font-bold text-xs sm:text-sm text-foreground break-words leading-snug group-hover:text-primary transition-colors">
                                        {item.name}
                                    </h5>
                                </div>

                                {isValidPrice(item.price) && (
                                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 shrink-0 whitespace-nowrap">
                                        {item.price}
                                    </span>
                                )}
                            </div>

                            {(item.native_name || item.romaji) && (
                                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 flex-wrap break-words">
                                    {item.native_name && (
                                        <span className="font-medium text-foreground/85 font-sans">
                                            {item.native_name}
                                        </span>
                                    )}
                                    {item.native_name && onSpeakItem && (
                                        <button
                                            type="button"
                                            onClick={(e) => onSpeakItem(item, idx, e)}
                                            disabled={speakingItemIdx === idx}
                                            className={`p-1 rounded-full border transition-all cursor-pointer inline-flex items-center justify-center shrink-0 ${
                                                speakingItemIdx === idx
                                                    ? "bg-blue-500 text-white border-blue-500 animate-pulse"
                                                    : "bg-blue-500/10 text-blue-500 hover:text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 shadow-2xs active:scale-95"
                                            }`}
                                            title={`播放語音 (${item.native_name})`}
                                        >
                                            <Volume2
                                                size={11}
                                                className={`transition-transform ${
                                                    speakingItemIdx === idx ? "scale-110" : ""
                                                }`}
                                            />
                                        </button>
                                    )}
                                    {item.native_name && item.romaji && (
                                        <span className="opacity-40">•</span>
                                    )}
                                    {item.romaji && (
                                        <span className="opacity-75">{item.romaji}</span>
                                    )}
                                </div>
                            )}

                            {item.note && (
                                <p className="text-[11px] text-muted-foreground/90 bg-muted/40 p-2 rounded-xl border border-border/40 leading-relaxed break-words">
                                    {item.note}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
