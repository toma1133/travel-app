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
            <div className="flex-1 pr-4">
                <div
                    className={`font-bold text-gray-800 mb-1 ${
                        isPrinting ? "text-black text-lg" : "text-sm"
                    }`}
                >
                    {accommodation.name}
                </div>
                <div
                    className={`flex items-center ${
                        isPrinting
                            ? "text-gray-800 text-sm font-medium"
                            : "text-xs text-gray-500"
                    }`}
                >
                    <Calendar
                        size={12}
                        className={`mr-1.5 shrink-0 ${
                            isPrinting ? "text-black" : ""
                        }`}
                    />
                    {accommodation.check_in_date}
                    <span
                        className={`mx-1 ${
                            isPrinting ? "text-black" : "text-gray-300"
                        }`}
                    >
                        -
                    </span>
                    {accommodation.check_out_date}
                </div>
                <div
                    className={`flex items-start mt-1 ${
                        isPrinting
                            ? "text-gray-600 mt-1.5 text-xs"
                            : "text-gray-500 text-xs"
                    }`}
                >
                    <MapPin
                        size={12}
                        className={`mr-1.5 mt-0.5 shrink-0 ${
                            isPrinting ? "mt-1" : ""
                        }`}
                    />
                    <span className="break-words leading-relaxed">
                        {accommodation.address}
                    </span>
                </div>
            </div>

            {!isPrinting && (
                <div className="flex space-x-2 bg-white pr-2 transition-opacity duration-200">
                    {!isEditing && accommodation.link_id && (
                        <button
                            type="button"
                            onClick={() =>
                                onViewBtnClick(accommodation.link_id!)
                            }
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="預覽住宿"
                        >
                            <BookOpen size={14} />
                        </button>
                    )}
                    {isEditing && (
                        <>
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccommodationRecord;
