import React, { useState } from "react";
import { Clock, CalendarX, ChevronDown, ChevronUp } from "lucide-react";
import { getBusinessStatus } from "../../../../utils/OpeningHoursUtil";

export interface OpeningHoursViewerProps {
    open?: string;
    closedDays?: string;
    checkIn?: string;
    checkOut?: string;
    type?: string;
}

export const OpeningHoursViewer: React.FC<OpeningHoursViewerProps> = ({
    open,
    closedDays,
    checkIn,
    checkOut,
    type,
}) => {
    const [showAllHours, setShowAllHours] = useState(false);

    if (type === "hotel" || type === "stay" || checkIn) {
        return (
            <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <Clock size={14} className="text-primary" />
                    <span>入住與退房時間</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-background/80 dark:bg-card/60 p-3 rounded-xl border border-border/50 flex flex-col">
                        <span className="text-[11px] text-muted-foreground font-medium">最早入住</span>
                        <span className="text-base font-bold text-foreground font-mono mt-0.5">
                            {checkIn || "15:00"}
                        </span>
                    </div>
                    <div className="bg-background/80 dark:bg-card/60 p-3 rounded-xl border border-border/50 flex flex-col">
                        <span className="text-[11px] text-muted-foreground font-medium">最晚退房</span>
                        <span className="text-base font-bold text-foreground font-mono mt-0.5">
                            {checkOut || "11:00"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!open) return null;

    const businessStatus = getBusinessStatus(open, closedDays);

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

                {/* 即時營業狀態標籤 */}
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

            {/* 公休日提醒 */}
            {closedDays && (
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 font-medium">
                    <CalendarX size={14} className="shrink-0 text-rose-500" />
                    <span>公休資訊：{closedDays}</span>
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
                                        {d.isToday && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                                        )}
                                        <span>{d.dayLabel}</span>
                                    </span>
                                    <span
                                        className={`font-mono text-right shrink-0 ${
                                            d.isClosed
                                                ? "text-rose-500 font-bold"
                                                : "text-foreground font-medium"
                                        }`}
                                    >
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
};
