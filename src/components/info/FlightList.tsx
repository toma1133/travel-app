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
        <div className="bg-white px-4 p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
            <div className="flex items-center justify-between mb-4 text-[#8E354A] print:text-gray-700">
                <div className="flex justify-between">
                    <Plane size={18} className="mr-2" />
                    <h3 className="font-bold text-sm tracking-wider uppercase">
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
        </div>
    );
};

export default FlightList;
