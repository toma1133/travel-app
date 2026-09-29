import React, { useState } from "react";
import {
    X,
    Navigation,
    ExternalLink,
    Clock,
    Hourglass,
    Pin,
    Copy,
    Check,
    Train,
    AlertCircle,
    Info,
} from "lucide-react";
import type { ItineraryActivitiy } from "../../../../models/types/ItineraryTypes";
import {
    getCategoryIcon,
    getTransitIcon,
    getCategoryTypeName,
} from "../../../../constants/Categories";
import {
    getSmartNavigationLabel,
    getSmartNavigationUrl,
} from "../../../../utils/MapNavigationUtil";

function getHeroGradient(type?: string): string {
    switch (type) {
        case "transport":
            return "from-blue-600 via-indigo-600 to-sky-700";
        case "food":
            return "from-amber-600 via-orange-600 to-rose-600";
        case "cafe":
            return "from-amber-700 via-yellow-700 to-amber-600";
        case "hotel":
        case "stay":
            return "from-purple-700 via-indigo-700 to-pink-600";
        case "attraction":
            return "from-emerald-600 via-teal-600 to-cyan-700";
        case "shopping":
            return "from-rose-600 via-pink-600 to-purple-700";
        case "activity":
            return "from-violet-600 via-purple-600 to-indigo-700";
        default:
            return "from-slate-700 via-zinc-800 to-neutral-900";
    }
}

export interface ActivityPreviewContentProps {
    activity: ItineraryActivitiy;
    onClose: () => void;
}

export const ActivityPreviewContent: React.FC<ActivityPreviewContentProps> = ({
    activity,
    onClose,
}) => {
    const [copied, setCopied] = useState(false);

    const CategoryIcon = getCategoryIcon(activity.type);
    const TransitIcon = activity.transitMode ? getTransitIcon(activity.transitMode) : null;
    const navUrl = getSmartNavigationUrl({
        name: activity.title,
        loc: activity.transitDetails?.destination || activity.transitDetails?.startLocation,
    });
    const smartNav = getSmartNavigationLabel("");
    const td = activity.transitDetails;
    const hasTransitDetails = td && (
        td.flightNumber ||
        td.gate ||
        td.companyAndLine ||
        td.platform ||
        td.destination ||
        td.carRentalCompany ||
        td.carRentalBranch ||
        td.ticketType ||
        td.passName ||
        td.fare ||
        td.startLocation ||
        typeof td.isReservationRequired === "boolean" ||
        (td.scheduleList && td.scheduleList.length > 0) ||
        td.schedules
    );

    const handleCopyActivityTitle = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(activity.title);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* 頂部 Hero 區塊 */}
            <div className={`relative w-full p-5 sm:p-7 shrink-0 overflow-hidden bg-gradient-to-br ${getHeroGradient(activity.type)} text-white`}>
                {/* 背景裝飾光暈 */}
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-black/15 blur-xl pointer-events-none" />

                {/* 分類標籤 (左上) 與關閉按鈕 (右上) */}
                <div className="flex items-center justify-between gap-2 z-10 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md text-xs font-bold text-white border border-white/20 shadow-xs">
                        <CategoryIcon size={13} className="text-white drop-shadow-xs" />
                        <span>{getCategoryTypeName(activity.type)}</span>
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 bg-black/40 hover:bg-black/70 text-white backdrop-blur-md rounded-full transition-all shadow-lg cursor-pointer active:scale-95 border border-white/20"
                        title="關閉"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 標題與大圖標 */}
                <div className="flex items-center gap-3.5 sm:gap-4 my-2">
                    <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-lg">
                        <CategoryIcon size={26} className="drop-shadow-md" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight drop-shadow-xs break-words">
                            {activity.title}
                        </h2>
                    </div>
                </div>

                {/* 底部時間與狀態膠囊 */}
                <div className="pt-3 flex items-center gap-2 flex-wrap text-white">
                    <div className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/20">
                        <Clock size={12} className="text-amber-300" />
                        <span>排定時間 {activity.time}</span>
                    </div>
                    {activity.duration && (
                        <div className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-medium border border-white/20 text-white/90">
                            <Hourglass size={12} className="text-sky-300" />
                            <span>預計停留 {activity.duration}</span>
                        </div>
                    )}
                    {activity.isFixed && (
                        <div className="inline-flex items-center gap-1.5 bg-amber-500/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-amber-300/30 text-white">
                            <Pin size={12} className="fill-white" />
                            <span>動線固定站</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 滾動內容本體 */}
            <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-4 flex-1">
                {/* 行動快捷列 */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <a
                        href={navUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs active:scale-95 cursor-pointer"
                        title={`在 ${smartNav.appName} 中搜尋`}
                    >
                        <Navigation size={14} />
                        <span>在地圖搜尋此活動</span>
                        <ExternalLink size={11} className="opacity-75" />
                    </a>

                    <button
                        type="button"
                        onClick={handleCopyActivityTitle}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border/70 cursor-pointer active:scale-95"
                        title="複製活動名稱"
                    >
                        {copied ? (
                            <>
                                <Check size={14} className="text-emerald-500" />
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">已複製名稱</span>
                            </>
                        ) : (
                            <>
                                <Copy size={14} />
                                <span>複製名稱</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 活動說明與備註 */}
                {activity.desc && (
                    <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                            <Info size={14} className="text-primary" />
                            <span>活動備註與說明</span>
                        </span>
                        <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                            {activity.desc}
                        </p>
                    </div>
                )}

                {/* 交通細節卡片 */}
                {hasTransitDetails && td && (
                    <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl p-4 sm:p-5 space-y-3.5">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                {TransitIcon ? <TransitIcon size={16} /> : <Train size={16} />}
                            </div>
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                交通班次詳細資訊
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            {td.companyAndLine && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">路線 / 營運公司</span>
                                    <span className="font-bold text-foreground">{td.companyAndLine}</span>
                                </div>
                            )}
                            {td.flightNumber && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">航班代碼</span>
                                    <span className="font-bold text-foreground font-mono">{td.flightNumber}</span>
                                </div>
                            )}
                            {td.gate && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">登機門 / 閘口</span>
                                    <span className="font-bold text-foreground font-mono">{td.gate}</span>
                                </div>
                            )}
                            {td.platform && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">乘車月台</span>
                                    <span className="font-bold text-foreground font-mono">{td.platform}</span>
                                </div>
                            )}
                            {td.destination && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">行駛方向 / 目的地</span>
                                    <span className="font-bold text-foreground">{td.destination}</span>
                                </div>
                            )}
                            {td.fare && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">票價 / 費用</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{td.fare}</span>
                                </div>
                            )}
                            {td.ticketType && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">座席 / 票券類型</span>
                                    <span className="font-bold text-foreground">{td.ticketType}</span>
                                </div>
                            )}
                            {td.passName && (
                                <div className="bg-background/80 dark:bg-card/60 p-2.5 rounded-xl border border-border/50">
                                    <span className="text-[11px] text-muted-foreground block">適用周遊券 / Pass</span>
                                    <span className="font-bold text-foreground">{td.passName}</span>
                                </div>
                            )}
                            {typeof td.isReservationRequired === "boolean" && (
                                <div className="bg-background/80 dark:bg-card/60 p-3 rounded-xl border border-border/50 flex items-center justify-between sm:col-span-2">
                                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                        <AlertCircle size={13} className="text-amber-500" />
                                        <span>班次預約規定</span>
                                    </span>
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                        td.isReservationRequired
                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    }`}>
                                        {td.isReservationRequired ? "🔴 需提前預約 / 指定座" : "🟢 免預約 / 自由座"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 動態班次清單 */}
                        {td.scheduleList && td.scheduleList.length > 0 && (
                            <div className="pt-2 border-t border-border/40 space-y-2">
                                <span className="text-xs font-bold text-foreground block">
                                    預計班次時刻表
                                </span>
                                <div className="rounded-xl border border-border/60 overflow-hidden bg-background/60">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/50 border-b border-border/50 text-[11px] text-muted-foreground font-medium">
                                            <tr>
                                                <th className="px-3 py-2">班次名稱</th>
                                                <th className="px-3 py-2">出發時間</th>
                                                <th className="px-3 py-2">到達時間</th>
                                                <th className="px-3 py-2">月台</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {td.scheduleList.map((item, i) => (
                                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2 font-bold text-foreground">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-muted-foreground">
                                                        {item.departureTime || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-muted-foreground">
                                                        {item.arrivalTime || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-muted-foreground">
                                                        {item.platform || "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 備註文字 */}
                        {td.schedules && (
                            <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground whitespace-pre-line">
                                <span className="font-semibold text-foreground mr-1">班次備忘:</span>
                                {td.schedules}
                            </div>
                        )}
                    </div>
                )}

                {/* 前往下一站交通方式 */}
                {(activity.transitMode || activity.transitDuration) && (
                    <div className="bg-muted/30 dark:bg-muted/20 border border-border/60 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                {TransitIcon ? <TransitIcon size={16} /> : <Train size={16} />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-foreground block">
                                    前往下一站交通
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    {activity.transitMode ? `方式：${activity.transitMode}` : "接續交通"}
                                </span>
                            </div>
                        </div>

                        {activity.transitDuration && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                <Clock size={12} />
                                <span>車程約 {activity.transitDuration}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
