import moment from "moment";
import { Clock, Pencil, Trash2, MoveRight } from "lucide-react";
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

    // --- 列印模式：登機證風格 (Boarding Pass Style) ---
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
                </div>
            </div>
        );
    }

    // --- 螢幕模式 (保持原樣) ---
    return (
        <div
            className={`flex justify-between items-start pt-4 mb-4 last:mb-0 relative group ${
                index !== 0 ? "border-t border-border" : ""
            }`}
        >
            <div className="flex-1 pr-16">
                <div className="font-bold text-foreground text-base flex items-center gap-2">
                    <span>{flight.departure_loc}</span>
                    <span className="text-muted-foreground font-light text-sm">➝</span>
                    <span>{flight.arrival_loc}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                    <span className="font-mono bg-muted px-1 rounded text-foreground">
                        {flight.code}
                    </span>
                    <span>|</span>
                    <span>{flight.flight_date}</span>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
                <div className="font-mono text-foreground font-bold">
                    {moment(flight.departure_time, "HH:mm:ss").format("HH:mm")}
                    <span className="mx-1 text-muted-foreground">-</span>
                    {moment(flight.arrival_time, "HH:mm:ss").format("HH:mm")}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                    <Clock size={10} />
                    <span>{getDuration()}</span>
                </div>
            </div>

            {isEditing && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1 bg-background/60 backdrop-blur-md rounded-full shadow-md border border-border/50 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 z-10">
                    <button
                        onClick={() => onEditBtnClick(flight)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="編輯"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDeleteBtnClick(flight)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="刪除"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FlightRecord;
