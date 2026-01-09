import moment from "moment";
import { Clock, Pencil, Trash2 } from "lucide-react";
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
    // 計算飛行時間
    const getDuration = () => {
        if (!flight.departure_time || !flight.arrival_time) return "";

        const start = moment(flight.departure_time, "HH:mm:ss");
        const end = moment(flight.arrival_time, "HH:mm:ss");

        // 處理跨日航班 (假設抵達時間小於起飛時間代表跨日)
        if (end.isBefore(start)) {
            end.add(1, "day");
        }

        const diff = moment.duration(end.diff(start));
        const hours = Math.floor(diff.asHours());
        const minutes = diff.minutes();

        return `${hours}h ${minutes}m`;
    };

    return (
        <div
            className={`
                flex justify-between items-start 
                ${
                    isPrinting
                        ? "border-none mb-0 py-3"
                        : `pt-4 mb-4 last:mb-0 ${
                              index !== 0 ? "border-t border-gray-100" : ""
                          }`
                }
            `}
        >
            <div className="flex-1">
                {/* 地點 */}
                <div
                    className={`font-bold flex items-center gap-2 ${
                        isPrinting
                            ? "text-black text-lg"
                            : "text-gray-800 text-base"
                    }`}
                >
                    <span>{flight.departure_loc}</span>
                    <span
                        className={`font-light text-sm ${
                            isPrinting ? "text-gray-600" : "text-gray-400"
                        }`}
                    >
                        ➝
                    </span>
                    <span>{flight.arrival_loc}</span>
                </div>
                {/* 日期與代號 */}
                <div
                    className={`flex gap-3 ${
                        isPrinting
                            ? "text-gray-600 text-sm mt-0.5"
                            : "text-xs text-gray-400 mt-1"
                    }`}
                >
                    <span
                        className={`font-mono rounded ${
                            isPrinting
                                ? "p-0 font-bold text-black"
                                : "bg-gray-100 px-1"
                        }`}
                    >
                        {flight.code}
                    </span>
                    <span>|</span>
                    <span>{flight.flight_date}</span>
                </div>
            </div>
            {/* 時間區域 */}
            <div className="text-right flex flex-col items-end">
                <div
                    className={`font-mono font-bold ${
                        isPrinting ? "text-black text-lg" : "text-gray-600"
                    }`}
                >
                    {moment(flight.departure_time, "HH:mm:ss").format("HH:mm")}
                    <span
                        className={`mx-1 ${
                            isPrinting ? "text-gray-500" : "text-gray-300"
                        }`}
                    >
                        -
                    </span>
                    {moment(flight.arrival_time, "HH:mm:ss").format("HH:mm")}
                </div>

                {/* 飛行時間 */}
                <div
                    className={`flex items-center gap-1 mt-1 ${
                        isPrinting
                            ? "text-gray-600 text-[10px]"
                            : "text-gray-400 text-[10px]"
                    }`}
                >
                    {!isPrinting && <Clock size={10} />}
                    <span>{getDuration()}</span>
                </div>
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
