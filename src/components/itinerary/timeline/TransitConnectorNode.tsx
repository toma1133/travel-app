import React from "react";
import { AlertTriangle } from "lucide-react";
import { getTransitIcon } from "../../../constants/Categories";
import type { ItineraryActivitiy } from "../../../models/types/ItineraryTypes";

type TransitConnectorNodeProps = {
    transit: {
        hasTransit: boolean;
        mode?: string;
        duration?: number;
        durationFormatted?: string;
        departureTime?: string;
        arrivalTime?: string;
    };
    transitDetails?: ItineraryActivitiy["transitDetails"];
    isLateConflict: boolean;
    delayMinutes: number;
    freeGapMinutes: number;
    isPrinting?: boolean;
};

export const TransitConnectorNode: React.FC<TransitConnectorNodeProps> = ({
    transit,
    transitDetails,
    isLateConflict,
    delayMinutes,
    freeGapMinutes,
    isPrinting = false,
}) => {
    if (!transit.hasTransit) return null;

    const TransitIconComp = getTransitIcon(transit.mode);
    const transitNote =
        transitDetails?.flightNumber ||
        transitDetails?.companyAndLine ||
        transitDetails?.carRentalCompany ||
        transitDetails?.passName ||
        transitDetails?.startLocation;

    return (
        <div
            className={`flex items-center my-1.5 sm:my-2 ${
                isPrinting ? "py-1 break-inside-avoid" : ""
            }`}
        >
            {/* 左側：連接軌道圖標 + 出發時間 (垂直時間軸接續) */}
            <div className="w-12 sm:w-14 shrink-0 flex flex-col items-center justify-center z-10">
                <div
                    className={`flex items-center justify-center rounded-full ${
                        isPrinting
                            ? "w-4 h-4 bg-gray-100 border border-gray-400 text-black"
                            : isLateConflict
                            ? "w-5 h-5 bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-2xs"
                            : "w-5 h-5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-black/10 dark:border-white/10 text-muted-foreground shadow-2xs"
                    }`}
                >
                    <TransitIconComp
                        size={10}
                        className={
                            isPrinting
                                ? "text-black"
                                : isLateConflict
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-blue-500"
                        }
                    />
                </div>
                {transit.departureTime && (
                    <span
                        className={`font-mono text-[9px] sm:text-[10px] mt-0.5 tracking-tighter ${
                            isPrinting ? "text-black" : "text-muted-foreground/80 font-semibold"
                        }`}
                        title={`預計 ${transit.departureTime} 出發`}
                    >
                        {transit.departureTime}
                    </span>
                )}
            </div>

            {/* 右側：磨砂交通膠囊 + 智慧時序與衝突偵測 */}
            <div className="flex-1 min-w-0 pr-1 sm:pr-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] ${
                        isPrinting
                            ? "bg-gray-100 border border-gray-400 text-black text-[9px]"
                            : isLateConflict
                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-2xs"
                            : "glass-pill text-foreground/80 shadow-2xs hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
                    }`}
                >
                    <span className={`font-semibold flex items-center gap-1 flex-wrap ${isPrinting ? "text-black" : "text-foreground"}`}>
                        {transit.arrivalTime ? (
                            <>
                                <span className={isPrinting ? "text-black" : ""}>
                                    {transit.durationFormatted ? transit.durationFormatted : "移動"}
                                </span>
                                <span className={isPrinting ? "text-black font-bold" : "opacity-40"}>➔</span>
                                <span className={isPrinting ? "text-black font-extrabold" : isLateConflict ? "text-rose-600 dark:text-rose-400 font-bold" : "text-primary font-bold"}>
                                    預計 {transit.arrivalTime} 抵達
                                </span>
                            </>
                        ) : transit.durationFormatted ? (
                            <span className={isPrinting ? "text-black" : ""}>
                                {`移動約 ${transit.durationFormatted}`}
                            </span>
                        ) : (
                            <span className={isPrinting ? "text-black" : ""}>
                                前往下一站
                            </span>
                        )}
                    </span>
                    {transitNote && (
                        <>
                            <span className={isPrinting ? "text-black font-bold opacity-60" : "opacity-30"}>·</span>
                            <span className={`font-mono text-[9px] sm:text-[10px] truncate max-w-[120px] sm:max-w-[200px] ${isPrinting ? "text-black font-medium" : "text-muted-foreground"}`}>
                                {transitNote}
                            </span>
                        </>
                    )}
                </div>

                {/* ⚠️ 智慧偵測：時間不合理警告標籤 (抵達時間晚於下一站開始時間) */}
                {!isPrinting && isLateConflict && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                        <AlertTriangle size={9} className="shrink-0" />
                        <span>時間不及：晚於下站開始時間（延誤約 {delayMinutes} 分）</span>
                    </span>
                )}

                {/* ☕ 自由空檔提示 (抵達後距下站開始 >= 15 分鐘) */}
                {!isPrinting && !isLateConflict && freeGapMinutes >= 15 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ☕ 留有 {freeGapMinutes < 60 ? `${freeGapMinutes} 分鐘` : `${(freeGapMinutes / 60).toFixed(1)} 小時`} 空檔
                    </span>
                )}

                {/* 細緻虛線延展 */}
                <div
                    className={`flex-1 h-[1px] min-w-[20px] ${
                        isPrinting
                            ? "border-b border-gray-300 border-dashed"
                            : isLateConflict
                            ? "border-b border-rose-500/30 border-dashed"
                            : "border-b border-black/[0.08] dark:border-white/[0.1] border-dashed"
                    }`}
                />
            </div>
        </div>
    );
};

export default TransitConnectorNode;
