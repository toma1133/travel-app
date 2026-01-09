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
                bg-white p-5 rounded-lg shadow-sm 
                /* 螢幕: 避免內容被切斷 */
                break-inside-avoid-page
                /* 列印: 移除陰影，改用深色邊框，移除圓角 */
                print:shadow-none print:border print:border-gray-400 print:rounded-none print:p-4 print:mb-4
            `}
        >
            <div className="flex items-center justify-between mb-4 text-[#8E354A] print:text-black print:border-b print:border-gray-200 print:pb-2">
                <div className="flex items-center"> {/* 修正 justify-between 為 items-center */}
                    <Plane size={18} className="mr-2 print:text-black" />
                    <h3 className="font-bold text-sm tracking-wider uppercase print:text-base">
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
            <div className="space-y-4 print:space-y-0 print:divide-y print:divide-gray-200">
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
                {(!flights || flights.length === 0) && (
                    <div className="text-center text-gray-400 text-xs py-2 print:hidden">
                        尚無航班資訊
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightList;
