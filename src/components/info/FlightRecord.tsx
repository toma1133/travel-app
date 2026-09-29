import { useState } from "react";
import moment from "moment";
import { Clock, Pencil, Trash2, MoveRight, ArrowRight, Users, User } from "lucide-react";
import type { FlightRow } from "../../models/types/FlightTypes";

type FlightRecordProps = {
    flight: FlightRow;
    index: number;
    isEditing: boolean;
    isPrinting?: boolean;
    onDeleteBtnClick: (flight: FlightRow) => void;
    onEditBtnClick: (flight: FlightRow) => void;
};

const FlightRecord = ({
    flight,
    index,
    isEditing,
    isPrinting,
    onDeleteBtnClick,
    onEditBtnClick,
}: FlightRecordProps) => {
    const [showActions, setShowActions] = useState(false);

    const getDuration = () => {
        if (!flight.departure_time || !flight.arrival_time) return "";
        const start = moment(flight.departure_time, "HH:mm:ss");
        const end = moment(flight.arrival_time, "HH:mm:ss");
        if (end.isBefore(start)) end.add(1, "day");
        const diff = moment.duration(end.diff(start));
        const hours = Math.floor(diff.asHours());
        const minutes = diff.minutes();
        return `${hours}h ${minutes}m`;
    };

    // --- 列印模式：登機證風格 (Boarding Pass Style) 保持原樣不變 ---
    if (isPrinting) {
        return (
            <div className="flex border border-black rounded-sm overflow-hidden break-inside-avoid">
                {/* 1. 左側：日期與代號 */}
                <div className="bg-black text-white p-3 flex flex-col items-center justify-center min-w-20">
                    <span className="text-xs font-bold uppercase tracking-widest">
                        {moment(flight.flight_date).format("MMM")}
                    </span>
                    <span className="text-2xl font-black leading-none">
                        {moment(flight.flight_date).format("DD")}
                    </span>
                    <span className="text-[10px] mt-2 font-mono opacity-80">
                        {flight.code}
                    </span>
                </div>

                {/* 2. 中間：航程資訊 */}
                <div className="flex-1 p-3 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-black leading-none">
                                {moment(
                                    flight.departure_time,
                                    "HH:mm:ss"
                                ).format("HH:mm")}
                            </span>
                            <span className="text-sm font-bold text-gray-600">
                                {flight.departure_loc}
                            </span>
                        </div>

                        {/* 飛機航線圖示 */}
                        <div className="flex-1 px-4 pb-2 flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 font-medium mb-1.5">
                                {getDuration()}
                            </span>
                            <div className="w-full h-px bg-gray-300 relative flex items-center justify-center">
                                <div className="absolute bg-white px-1">
                                    <MoveRight
                                        size={14}
                                        className="text-gray-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-black text-black leading-none">
                                {moment(flight.arrival_time, "HH:mm:ss").format(
                                    "HH:mm"
                                )}
                            </span>
                            <span className="text-sm font-bold text-gray-600">
                                {flight.arrival_loc}
                            </span>
                        </div>
                    </div>

                    {/* 登機證旅客標註 */}
                    <div className="mt-2 flex items-center justify-between text-[10px] border-t border-gray-200 pt-1">
                        <span className="font-mono text-gray-500 font-bold uppercase">
                            PASSENGER(S):
                        </span>
                        <span className="font-bold text-black uppercase">
                            {flight.passengers && flight.passengers.length > 0
                                ? flight.passengers.join(", ")
                                : "ALL TRAVELERS (全體搭乘)"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // --- 螢幕模式：Liquid Glass 卡片風格 ---
    return (
        <div
            className="liquid-glass-interactive rounded-2xl p-4 border border-white/35 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] shadow-xs hover:shadow-md transition-all relative group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            <div className="flex-1 min-w-0 space-y-2">
                <div className="font-bold text-foreground text-base flex items-center gap-2">
                    <span className="truncate">{flight.departure_loc}</span>
                    <ArrowRight size={15} className="text-primary/70 shrink-0" />
                    <span className="truncate">{flight.arrival_loc}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span className="font-mono bg-sky-500/15 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {flight.code}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{flight.flight_date}</span>
                    <span>•</span>
                    {flight.passengers && flight.passengers.length > 0 ? (
                        <div className="inline-flex items-center gap-1 flex-wrap">
                            <User size={11} className="text-primary shrink-0" />
                            {flight.passengers.map((p) => (
                                <span
                                    key={p}
                                    className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25"
                                >
                                    {p}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
                            <Users size={10} />
                            <span>全員搭乘</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
                <div>
                    <div className="font-mono text-foreground font-bold text-sm tracking-tight">
                        {moment(flight.departure_time, "HH:mm:ss").format("HH:mm")}
                        <span className="mx-1 text-muted-foreground font-light">➝</span>
                        {moment(flight.arrival_time, "HH:mm:ss").format("HH:mm")}
                    </div>
                    {getDuration() && (
                        <div className="flex items-center sm:justify-end gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Clock size={11} className="text-muted-foreground/70" />
                            <span>{getDuration()}</span>
                        </div>
                    )}
                </div>

                {isEditing && (
                    <div
                        className={`flex items-center gap-1 p-1 liquid-glass-pill shadow-sm transition-all duration-200 ${
                            showActions
                                ? "opacity-100"
                                : "lg:opacity-0 lg:group-hover:opacity-100"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => onEditBtnClick(flight)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            title="編輯"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteBtnClick(flight)}
                            className="p-1.5 rounded-full text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors"
                            title="刪除"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightRecord;
