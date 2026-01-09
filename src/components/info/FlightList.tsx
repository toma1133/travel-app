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
                        ? "border border-gray-400 rounded-none p-4 mb-4 bg-white"
                        : "bg-white p-5 rounded-lg shadow-sm"
                }
            `}
        >
            <div
                className={`flex items-center justify-between mb-4 ${
                    isPrinting
                        ? "text-black border-b border-gray-200 pb-2"
                        : "text-[#8E354A]"
                }`}
            >
                <div className="flex items-center">
                    <Plane
                        size={18}
                        className={`mr-2 ${isPrinting ? "text-black" : ""}`}
                    />
                    <h3
                        className={`font-bold tracking-wider uppercase ${
                            isPrinting ? "text-base" : "text-sm"
                        }`}
                    >
                        Flights
                    </h3>
                </div>
                {!isPrinting && isEditing && (
                    <div
                        className={`
                            flex space-x-2 bg-white pr-2
                            transition-opacity duration-200
                        `}
                    >
                        <button
                            type="button"
                            onClick={onAddBtnClick}
                            className={`p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                            title="新增航班"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>
            <div
                className={`space-y-4 ${
                    isPrinting ? "space-y-0 divide-y divide-gray-200" : ""
                }`}
            >
                {" "}
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
