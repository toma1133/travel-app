import { MouseEventHandler, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plane, Plus, Users, Sparkles, Clock, User } from "lucide-react";
import moment from "moment";
import type { FlightRow } from "../../models/types/FlightTypes";
import FlightRecord from "./FlightRecord";

type FlightListProps = {
    flights: FlightRow[] | undefined;
    companionNames?: string[];
    isEditing: boolean;
    isPrinting?: boolean;
    onAddBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDeleteBtnClick: (flight: FlightRow) => void;
    onEditBtnClick: (flight: FlightRow) => void;
};

const FlightList = ({
    flights,
    companionNames = [],
    isEditing,
    isPrinting,
    onAddBtnClick,
    onDeleteBtnClick,
    onEditBtnClick,
}: FlightListProps) => {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedPassenger, setSelectedPassenger] = useState<string>("all");

    // Collect all distinct passenger names recorded in flights
    const recordedPassengers = useMemo(() => {
        if (!flights) return [];
        const set = new Set<string>();
        flights.forEach((f) => {
            if (f.passengers && Array.isArray(f.passengers)) {
                f.passengers.forEach((p) => set.add(p));
            }
        });
        return Array.from(set);
    }, [flights]);

    const hasSpecificPassengers = recordedPassengers.length > 0;

    // Filter flights according to selected passenger
    const filteredFlights = useMemo(() => {
        if (!flights) return [];
        if (selectedPassenger === "all") return flights;
        return flights.filter((f) => {
            if (!f.passengers || f.passengers.length === 0) return true; // 全員搭乘航班也顯示
            return f.passengers.includes(selectedPassenger);
        });
    }, [flights, selectedPassenger]);

    // Calculate airport arrival meeting difference hints
    const arrivalNotices = useMemo(() => {
        if (!flights || flights.length < 2) return [];
        // Group by flight_date + arrival_loc
        const groups: Record<string, FlightRow[]> = {};
        flights.forEach((f) => {
            if (f.flight_date && f.arrival_loc && f.arrival_time) {
                const key = `${f.flight_date}__${f.arrival_loc.trim().toLowerCase()}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(f);
            }
        });

        const notices: { date: string; loc: string; message: string }[] = [];
        Object.entries(groups).forEach(([_, groupFlights]) => {
            if (groupFlights.length >= 2) {
                // Check if they have different arrival times or different passengers
                const sorted = [...groupFlights].sort((a, b) =>
                    (a.arrival_time || "").localeCompare(b.arrival_time || "")
                );
                const first = sorted[0];
                const last = sorted[sorted.length - 1];

                if (first.arrival_time && last.arrival_time && first.id !== last.id) {
                    const t1 = moment(first.arrival_time, "HH:mm:ss");
                    const t2 = moment(last.arrival_time, "HH:mm:ss");
                    const diffMins = Math.round(moment.duration(t2.diff(t1)).asMinutes());

                    if (diffMins > 0) {
                        const h = Math.floor(diffMins / 60);
                        const m = diffMins % 60;
                        const diffStr = h > 0 ? `${h} 小時 ${m > 0 ? `${m} 分` : ""}` : `${m} 分鐘`;
                        const firstWho = first.passengers?.length ? ` (${first.passengers.join(",")})` : "";
                        const lastWho = last.passengers?.length ? ` (${last.passengers.join(",")})` : "";

                        notices.push({
                            date: first.flight_date || "",
                            loc: first.arrival_loc || "",
                            message: `${first.code}${firstWho} 預計 ${moment(first.arrival_time, "HH:mm:ss").format("HH:mm")} 抵達，比 ${last.code}${lastWho} (抵達 ${moment(last.arrival_time, "HH:mm:ss").format("HH:mm")}) 早約 ${diffStr}。建議相約入境大廳會合！`,
                        });
                    }
                }
            }
        });
        return notices;
    }, [flights]);

    return (
        <div
            className={
                isPrinting
                    ? "bg-transparent mb-8 break-inside-avoid overflow-visible block"
                    : "liquid-glass-elevated rounded-3xl p-5 md:p-6 border border-white/40 dark:border-white/10 shadow-lg relative transition-all"
            }
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between select-none ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : `${isOpen ? "mb-4" : "mb-0"} cursor-pointer group`
                }`}
                onClick={() => !isPrinting && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2.5">
                    {/* 列印時的章節編號 */}
                    {isPrinting ? (
                        <span className="text-3xl font-black text-gray-400 leading-none mr-2">
                            01
                        </span>
                    ) : (
                        <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <Plane size={17} />
                        </div>
                    )}
                    <div>
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting
                                    ? "text-xl text-black"
                                    : "text-sm text-foreground flex items-center gap-2"
                            }`}
                        >
                            <span>航班資訊</span>
                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                FLIGHTS
                            </span>
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPrinting && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddBtnClick(e);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer shadow-xs"
                            title="新增航班"
                        >
                            <Plus size={13} />
                            <span>新增</span>
                        </button>
                    )}
                    {!isPrinting && (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-transform duration-200"
                        >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {(isOpen || isPrinting) && (
                <div className={isPrinting ? "space-y-4" : "space-y-3 pt-1"}>
                    {/* 機場抵達會合提示 */}
                    {!isPrinting && arrivalNotices.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {arrivalNotices.map((notice, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-2xs backdrop-blur-xs"
                                >
                                    <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                    <div>
                                        <span className="font-bold">機場抵達會合提示 ({notice.loc})：</span>
                                        <span>{notice.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 旅客篩選膠囊列 */}
                    {!isPrinting && hasSpecificPassengers && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
                            <span className="text-[11px] font-bold text-muted-foreground shrink-0 flex items-center gap-1 mr-1">
                                <Users size={12} />
                                <span>旅客:</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedPassenger("all")}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all border ${
                                    selectedPassenger === "all"
                                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                        : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                全部 ({flights?.length || 0})
                            </button>
                            {recordedPassengers.map((name) => {
                                const count =
                                    flights?.filter(
                                        (f) =>
                                            !f.passengers ||
                                            f.passengers.length === 0 ||
                                            f.passengers.includes(name)
                                    ).length || 0;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => setSelectedPassenger(name)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all border ${
                                            selectedPassenger === name
                                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {name} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 航班卡片列表 */}
                    {Array.isArray(isPrinting ? flights : filteredFlights) &&
                    (isPrinting ? flights : filteredFlights)!.length > 0 ? (
                        (isPrinting ? flights! : filteredFlights).map((flight, i) => (
                            <FlightRecord
                                key={flight.id ?? i}
                                flight={flight}
                                index={i}
                                isEditing={isEditing}
                                isPrinting={isPrinting}
                                onDeleteBtnClick={() => onDeleteBtnClick(flight)}
                                onEditBtnClick={() => onEditBtnClick(flight)}
                            />
                        ))
                    ) : (
                        <div className="p-6 rounded-2xl border border-dashed border-border/60 text-center text-xs text-muted-foreground bg-muted/20">
                            {selectedPassenger !== "all"
                                ? `目前沒有 ${selectedPassenger} 的專屬航班紀錄。`
                                : "尚未安排航班資訊，點擊右上角新增以記錄航班。"}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FlightList;
