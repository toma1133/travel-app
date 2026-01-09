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
                flex justify-between items-start pt-4 mb-4 last:mb-0 
                ${index !== 0 ? "border-t border-gray-100" : ""}
                /* 列印: 移除 margin, 改用 padding 配合父層的 divide-y */
                print:border-none print:mb-0 print:py-3
            `}
        >
            <div className="flex-1">
                {/* 地點 */}
                <div className="font-bold text-gray-800 text-base print:text-black print:text-lg flex items-center gap-2">
                    <span>{flight.departure_loc}</span>
                    <span className="text-gray-400 print:text-gray-600 font-light text-sm">➝</span>
                    <span>{flight.arrival_loc}</span>
                </div>
                {/* 日期與代號 */}
                <div className="text-xs text-gray-400 mt-1 print:text-gray-600 print:text-sm print:mt-0.5 flex gap-3">
                    <span className="font-mono bg-gray-100 px-1 rounded print:bg-transparent print:p-0 print:font-bold print:text-black">
                        {flight.code}
                    </span>
                    <span>|</span>
                    <span>{flight.flight_date}</span>
                </div>
            </div>
            {/* 時間區域 */}
            <div className="text-right flex flex-col items-end">
                <div className="font-mono text-gray-600 font-bold print:text-black print:text-lg">
                    {moment(flight.departure_time, "HH:mm:ss").format("HH:mm")}
                    <span className="mx-1 text-gray-300 print:text-gray-500">-</span>
                    {moment(flight.arrival_time, "HH:mm:ss").format("HH:mm")}
                </div>
                
                {/* [新增] 飛行時間 */}
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 print:text-gray-600">
                    <Clock size={10} className="print:hidden" />
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
