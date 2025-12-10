import moment from "moment";
import { Pencil, Trash2 } from "lucide-react";
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
    return (
        <div
            className={`flex justify-between items-start pt-4 mb-4 last:mb-0 ${
                index !== 0
                    ? "border-t border-gray-100 print:border-gray-200"
                    : ""
            }`}
        >
            <div>
                <div className="font-bold text-gray-800 print:text-base">
                    {flight.departure_loc} - {flight.arrival_loc}
                </div>
                <div className="text-xs text-gray-400 print:text-gray-600">
                    {flight.flight_date}・{flight.code}
                </div>
            </div>
            <div className="font-mono text-gray-600 print:text-gray-800">
                {moment(flight.departure_time, "HH:mm:ss").format("HH:mm")}-
                {moment(flight.arrival_time, "HH:mm:ss").format("HH:mm")}
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
                        onClick={() => onEditBtnClick(flight)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="編輯航班"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteBtnClick(flight)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="刪除航班"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FlightRecord;
