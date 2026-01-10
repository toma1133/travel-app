import { BookOpen, Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";

type AccommodationRecordProps = {
    accommodation: AccommodationRow;
    index: number;
    isEditing: boolean;
    isPrinting?: boolean;
    onDeleteBtnClick: (accommodation: AccommodationRow) => void;
    onEditBtnClick: (accommodation: AccommodationRow) => void;
    onViewBtnClick: (linkId: string) => void;
};

const AccommodationRecord = ({
    accommodation,
    index,
    isEditing,
    isPrinting,
    onDeleteBtnClick,
    onEditBtnClick,
    onViewBtnClick,
}: AccommodationRecordProps) => {
    // --- 列印模式：飯店預約單風格 ---
    if (isPrinting) {
        return (
            <div className="border-2 border-gray-100 rounded-sm p-4 break-inside-avoid flex flex-col gap-3">
                {/* 飯店名稱與地址 */}
                <div>
                    <h4 className="text-xl font-black text-black leading-tight mb-1">
                        {accommodation.name}
                    </h4>
                    <div className="flex items-start text-sm text-gray-600">
                        <MapPin size={14} className="mr-1 mt-0.5 shrink-0" />
                        <span className="break-words">
                            {accommodation.address}
                        </span>
                    </div>
                </div>

                {/* 日期區塊 - 雙欄 */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-gray-200">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Check-in
                        </span>
                        <span className="text-lg font-bold font-mono text-black">
                            {accommodation.check_in_date}
                        </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Check-out
                        </span>
                        <span className="text-lg font-bold font-mono text-black">
                            {accommodation.check_out_date}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // --- 螢幕模式 (保持原樣) ---
    return (
        <div
            className={`flex justify-between items-start pt-4 mb-4 last:mb-0 ${
                index !== 0 ? "border-t border-gray-100" : ""
            }`}
        >
            <div className="flex-1 pr-4">
                <div className="font-bold text-gray-800 text-sm mb-1">
                    {accommodation.name}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                    <Calendar size={12} className="mr-1.5 shrink-0" />
                    {accommodation.check_in_date}
                    <span className="mx-1 text-gray-300">-</span>
                    {accommodation.check_out_date}
                </div>
                <div className="flex items-start text-xs text-gray-500 mt-1">
                    <MapPin size={12} className="mr-1.5 mt-0.5 shrink-0" />
                    <span className="break-words leading-relaxed">
                        {accommodation.address}
                    </span>
                </div>
            </div>
            <div className="flex space-x-2 bg-white pr-2 transition-opacity duration-200">
                {!isEditing && accommodation.link_id && (
                    <button
                        onClick={() => onViewBtnClick(accommodation.link_id!)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        <BookOpen size={14} />
                    </button>
                )}
                {isEditing && (
                    <>
                        <button
                            onClick={() => onEditBtnClick(accommodation)}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={() => onDeleteBtnClick(accommodation)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccommodationRecord;
