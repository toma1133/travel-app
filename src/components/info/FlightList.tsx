import { MouseEventHandler, useState } from "react";
import { ChevronDown, ChevronUp, Plane, Plus } from "lucide-react";
import type { FlightRow } from "../../models/types/FlightTypes";
import FlightRecord from "./FlightRecord";

type FlightListProps = {
    flights: FlightRow[] | undefined;
    isEditing: boolean;
    isPrinting?: boolean;
    onAddBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDeleteBtnClick: (flight: FlightRow) => void;
    onEditBtnClick: (flight: FlightRow) => void;
};

const FlightList = ({
    flights,
    isEditing,
    isPrinting,
    onAddBtnClick,
    onDeleteBtnClick,
    onEditBtnClick,
}: FlightListProps) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div
            className={
                isPrinting
                    ? "bg-transparent mb-8"
                    : "bg-card p-5 rounded-xl shadow-sm relative transition-all"
            }
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between select-none ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : `${isOpen ? "mb-4" : "mb-0"} text-[#8E354A] cursor-pointer`
                }`}
                onClick={() => !isPrinting && setIsOpen(!isOpen)}
            >
                <div className="flex items-baseline gap-3">
                    {/* 列印時的章節編號 */}
                    {isPrinting && (
                        <span className="text-3xl font-black text-gray-400 leading-none">
                            01
                        </span>
                    )}
                    <div className="flex items-center">
                        {!isPrinting && <Plane size={18} className="mr-2" />}
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting ? "text-xl text-black" : "text-sm"
                            }`}
                        >
                            Flights
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPrinting && isEditing && (
                        <div 
                            className="flex space-x-2 bg-background/60 backdrop-blur-md p-1 rounded-full border border-border/50 transition-all duration-300 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={onAddBtnClick}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="新增航班"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                    {!isPrinting && (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-1 transition-transform duration-200"
                        >
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {(isOpen || isPrinting) && (
                <div className="space-y-4">
                    {Array.isArray(flights) && flights.length > 0 ? (
                        flights.map((flight, i) => (
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
                        <p className="text-xs text-muted-foreground italic py-2">
                            尚無航班記錄
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FlightList;
