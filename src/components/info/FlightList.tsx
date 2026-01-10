import { MouseEventHandler } from "react";
import { Plane, Plus } from "lucide-react";
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
    return (
        <div
            className={`
                break-inside-avoid-page
                ${
                    isPrinting
                        ? "bg-transparent mb-8" // 列印：透明背景
                        : "bg-white p-5 rounded-lg shadow-sm" // 螢幕：卡片
                }
            `}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : "mb-4 text-[#8E354A]"
                }`}
            >
                <div className="flex items-baseline gap-3">
                    {/* 列印時的章節編號 */}
                    {isPrinting && (
                        <span className="text-3xl font-black text-gray-200 leading-none">
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
                {!isPrinting && isEditing && (
                    <div className="flex space-x-2 bg-white pr-2 transition-opacity duration-200">
                        <button
                            onClick={onAddBtnClick}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="新增航班"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>
            {/* List */}
            <div
                className={`space-y-4 ${
                    isPrinting ? "space-y-6" : "space-y-0"
                }`}
            >
                {Array.isArray(flights) &&
                    flights.map((flight, i) => (
                        <FlightRecord
                            key={i}
                            flight={flight}
                            index={i}
                            isEditing={isEditing}
                            isPrinting={isPrinting}
                            onDeleteBtnClick={onDeleteBtnClick}
                            onEditBtnClick={onEditBtnClick}
                        />
                    ))}
                {(!flights || flights.length === 0) && !isPrinting && (
                    <div className="text-center text-gray-400 text-xs py-2">
                        尚無航班資訊
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightList;
