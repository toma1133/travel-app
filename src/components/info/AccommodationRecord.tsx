import { Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";

type AccommodationRecordProps = {
    accommodation: AccommodationRow;
    index: number;
    isEditing: boolean;
    isPrinting?: boolean;
    onDeleteBtnClick: (accommodation: AccommodationRow) => void;
    onEditBtnClick: (accommodation: AccommodationRow) => void;
};

const AccommodationRecord = ({
    accommodation,
    index,
    isEditing,
    isPrinting,
    onDeleteBtnClick,
    onEditBtnClick,
}: AccommodationRecordProps) => {
    return (
        <div
            className={`flex justify-between items-start pt-4 mb-4 last:mb-0 ${
                index !== 0
                    ? "border-t border-gray-100 print:border-gray-200"
                    : ""
            }`}
        >
            <div>
                <div className="font-bold text-gray-800 text-sm mb-1 print:text-base">
                    {accommodation.name}
                </div>
                <div className="flex items-start text-xs text-gray-500 print:text-gray-600">
                    <Calendar size={12} className="mr-1.5 mt-0.5" />
                    {accommodation.check_in_date} -{" "}
                    {accommodation.check_out_date}
                </div>
                <div className="flex items-start text-xs text-gray-500 mt-1 print:text-gray-600">
                    <MapPin size={12} className="mr-1.5 mt-0.5 shrink-0" />
                    <span className="truncate">{accommodation.address}</span>
                </div>
            </div>
            {!isPrinting && isEditing && (
                <div
                    className={`flex space-x-2 bg-white pr-2 transition-opacity duration-200`}
                >
                    <button
                        type="button"
                        onClick={() => onEditBtnClick(accommodation)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="編輯住宿"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteBtnClick(accommodation)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="刪除住宿"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AccommodationRecord;
