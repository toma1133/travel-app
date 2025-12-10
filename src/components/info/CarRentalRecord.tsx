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
            className={`flex justify-between items-start pt-4 mb-4 last:mb-0 ${
                index !== 0
                    ? "border-t border-gray-100 print:border-gray-200"
                    : ""
            }`}
        >
            <div className="w-full text-sm px-2">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500 print:text-gray-600">
                        租車公司
                    </span>
                    <span className="font-bold text-gray-800">
                        {carRental.company}
                    </span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500 print:text-gray-600">
                        車型
                    </span>
                    <span className="font-bold text-gray-800">
                        {carRental.model}
                    </span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500 print:text-gray-600">
                        保險
                    </span>
                    <span className="font-bold text-gray-800">
                        {carRental.insurance_plan}
                    </span>
                </div>
                <div className="p-4 bg-gray-50 rounded text-xs space-y-2 print:bg-white print:border print:border-gray-200 print:mt-4">
                    <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">
                            取車
                        </span>
                        <span className="text-gray-700 print:text-gray-800">
                            {carRental.pickup_loc}{" "}
                            {moment(carRental.pickup_datetime).format(
                                "YYYY-MM-DD HH:mm"
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400 print:text-gray-600">
                            還車
                        </span>
                        <span className="text-gray-700 print:text-gray-800">
                            {carRental.dropoff_loc}{" "}
                            {moment(carRental.dropoff_datetime).format(
                                "YYYY-MM-DD HH:mm"
                            )}
                        </span>
                    </div>
                </div>
            </div>
            {!isPrinting && isEditing && (
                <div
                    className={`flex space-x-2 bg-white pr-2 transition-opacity duration-200`}
                >
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
