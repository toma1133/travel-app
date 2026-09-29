import React from "react";
import { Train, MapPin, Ticket, Copy, Check } from "lucide-react";

export interface PlaceTransitLocationViewerProps {
    transitAccess?: string;
    loc?: string;
    bookingStatus?: string;
    copied?: boolean;
    onCopyAddress?: () => void;
}

export const PlaceTransitLocationViewer: React.FC<PlaceTransitLocationViewerProps> = ({
    transitAccess,
    loc,
    bookingStatus,
    copied = false,
    onCopyAddress,
}) => {
    if (!transitAccess && !loc && !bookingStatus) {
        return null;
    }

    return (
        <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 text-xs">
            {/* 交通指引 */}
            {transitAccess && (
                <div className="p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                        <Train size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">
                            交通方式 / 鄰近地鐵出口
                        </span>
                        <p className="text-foreground font-medium leading-relaxed">
                            {transitAccess}
                        </p>
                    </div>
                </div>
            )}

            {/* 詳細地址 */}
            {loc && (
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
                                {loc}
                            </p>
                        </div>
                    </div>
                    {onCopyAddress && (
                        <button
                            type="button"
                            onClick={onCopyAddress}
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
                    )}
                </div>
            )}

            {/* 預約規定 */}
            {bookingStatus && (
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
                        {bookingStatus === "required" && "🔴 需提前預約"}
                        {bookingStatus === "recommended" && "🟡 建議預約"}
                        {bookingStatus === "walk_in" && "🚶 現場排隊入場"}
                        {bookingStatus === "none" && "🟢 免預約自由入場"}
                        {!["required", "recommended", "walk_in", "none"].includes(bookingStatus) && bookingStatus}
                    </span>
                </div>
            )}
        </div>
    );
};
