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
                flex justify-between items-start pt-4 mb-4 last:mb-0 
                ${index !== 0 ? "border-t border-gray-100" : ""}
                print:border-none print:mb-0 print:py-4
            `}
        >
            <div className="w-full text-sm px-2 print:px-0">
                {/* 資訊區塊：列印時用 Grid 排版比較整齊 */}
                <div className="print:grid print:grid-cols-3 print:gap-4 print:mb-2">
                    <div className="flex justify-between mb-2 print:flex-col print:mb-0 print:justify-start">
                        <span className="text-gray-500 print:text-gray-500 print:text-xs print:uppercase">
                            租車公司
                        </span>
                        <span className="font-bold text-gray-800 print:text-black print:text-base">
                            {carRental.company}
                        </span>
                    </div>
                    <div className="flex justify-between mb-2 print:flex-col print:mb-0 print:justify-start">
                        <span className="text-gray-500 print:text-gray-500 print:text-xs print:uppercase">
                            車型
                        </span>
                        <span className="font-bold text-gray-800 print:text-black print:text-base">
                            {carRental.model}
                        </span>
                    </div>
                    <div className="flex justify-between mb-2 print:flex-col print:mb-0 print:justify-start">
                        <span className="text-gray-500 print:text-gray-500 print:text-xs print:uppercase">
                            保險
                        </span>
                        <span className="font-bold text-gray-800 print:text-black print:text-base">
                            {carRental.insurance_plan || "-"}
                        </span>
                    </div>
                </div>
                {/* 取車/還車區塊 */}
                <div
                    className={`
                    p-4 bg-gray-50 rounded text-xs space-y-2 
                    print:bg-transparent print:border print:border-gray-300 print:rounded-none print:mt-2 print:space-y-1
                `}
                >
                    <div className="flex justify-between print:justify-start print:gap-4 items-center">
                        <span className="text-gray-400 print:text-black print:font-bold print:w-12">
                            取車
                        </span>
                        <span className="text-gray-700 print:text-black print:text-sm">
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
                    <div className="flex justify-between print:justify-start print:gap-4 items-center">
                        <span className="text-gray-400 print:text-black print:font-bold print:w-12">
                            還車
                        </span>
                        <span className="text-gray-700 print:text-black print:text-sm">
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
