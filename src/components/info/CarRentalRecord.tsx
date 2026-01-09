import moment from "moment";
import { Pencil, Trash2 } from "lucide-react";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";

type CarRentalRecordProps = {
    carRental: CarRentalRow;
    index: number;
    isEditing: boolean;
    isPrinting?: boolean;
    onDeleteBtnClick: (carRental: CarRentalRow) => void;
    onEditBtnClick: (carRental: CarRentalRow) => void;
};

const CarRentalRecord = ({
    carRental,
    index,
    isEditing,
    isPrinting,
    onDeleteBtnClick,
    onEditBtnClick,
}: CarRentalRecordProps) => {
    return (
        <div
            className={`
                flex justify-between items-start 
                ${
                    isPrinting
                        ? "border-none mb-0 py-4"
                        : `pt-4 mb-4 last:mb-0 ${
                              index !== 0 ? "border-t border-gray-100" : ""
                          }`
                }
            `}
        >
            <div className={`w-full text-sm ${isPrinting ? "px-0" : "px-2"}`}>
                {/* 資訊區塊：列印時轉為 Grid */}
                <div
                    className={`${
                        isPrinting ? "grid grid-cols-3 gap-4 mb-2" : ""
                    }`}
                >
                    {/* 租車公司 */}
                    <div
                        className={`flex justify-between mb-2 ${
                            isPrinting ? "flex-col mb-0 justify-start" : ""
                        }`}
                    >
                        <span
                            className={`text-gray-500 ${
                                isPrinting ? "text-xs uppercase" : ""
                            }`}
                        >
                            租車公司
                        </span>
                        <span
                            className={`font-bold text-gray-800 ${
                                isPrinting ? "text-black text-base" : ""
                            }`}
                        >
                            {carRental.company}
                        </span>
                    </div>
                    {/* 車型 */}
                    <div
                        className={`flex justify-between mb-2 ${
                            isPrinting ? "flex-col mb-0 justify-start" : ""
                        }`}
                    >
                        <span
                            className={`text-gray-500 ${
                                isPrinting ? "text-xs uppercase" : ""
                            }`}
                        >
                            車型
                        </span>
                        <span
                            className={`font-bold text-gray-800 ${
                                isPrinting ? "text-black text-base" : ""
                            }`}
                        >
                            {carRental.model}
                        </span>
                    </div>

                    {/* 保險 */}
                    <div
                        className={`flex justify-between mb-2 ${
                            isPrinting ? "flex-col mb-0 justify-start" : ""
                        }`}
                    >
                        <span
                            className={`text-gray-500 ${
                                isPrinting ? "text-xs uppercase" : ""
                            }`}
                        >
                            保險
                        </span>
                        <span
                            className={`font-bold text-gray-800 ${
                                isPrinting ? "text-black text-base" : ""
                            }`}
                        >
                            {carRental.insurance_plan || "-"}
                        </span>
                    </div>
                </div>
                {/* 取車/還車區塊 */}
                <div
                    className={`
                        p-4 bg-gray-50 rounded text-xs space-y-2
                        ${
                            isPrinting
                                ? "bg-transparent border border-gray-300 rounded-none mt-2 space-y-1"
                                : ""
                        }
                    `}
                >
                    <div
                        className={`flex items-center ${
                            isPrinting
                                ? "justify-start gap-4"
                                : "justify-between"
                        }`}
                    >
                        <span
                            className={`text-gray-400 ${
                                isPrinting ? "text-black font-bold w-12" : ""
                            }`}
                        >
                            取車
                        </span>
                        <span
                            className={`text-gray-700 ${
                                isPrinting ? "text-black text-sm" : ""
                            }`}
                        >
                            <span className="font-bold mr-2">
                                {carRental.pickup_loc}
                            </span>
                            <span className="font-mono">
                                {moment(carRental.pickup_datetime).format(
                                    "YYYY-MM-DD HH:mm"
                                )}
                            </span>
                        </span>
                    </div>
                    <div
                        className={`flex items-center ${
                            isPrinting
                                ? "justify-start gap-4"
                                : "justify-between"
                        }`}
                    >
                        <span
                            className={`text-gray-400 ${
                                isPrinting ? "text-black font-bold w-12" : ""
                            }`}
                        >
                            還車
                        </span>
                        <span
                            className={`text-gray-700 ${
                                isPrinting ? "text-black text-sm" : ""
                            }`}
                        >
                            <span className="font-bold mr-2">
                                {carRental.dropoff_loc}
                            </span>
                            <span className="font-mono">
                                {moment(carRental.dropoff_datetime).format(
                                    "YYYY-MM-DD HH:mm"
                                )}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            {!isPrinting && isEditing && (
                <div className="flex space-x-2 bg-white pr-2 transition-opacity duration-200">
                    <button
                        type="button"
                        onClick={() => onEditBtnClick(carRental)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="編輯租車"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteBtnClick(carRental)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="刪除租車"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CarRentalRecord;
