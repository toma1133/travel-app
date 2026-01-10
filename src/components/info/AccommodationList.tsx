import { MouseEventHandler } from "react";
import { Bed, Plus } from "lucide-react";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";
import AccommodationRecord from "./AccommodationRecord";

type AccommodationListProps = {
    accommodations: AccommodationRow[] | undefined;
    isEditing: boolean;
    isPrinting?: boolean;
    onAddBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDeleteBtnClick: (accommodation: AccommodationRow) => void;
    onEditBtnClick: (accommodation: AccommodationRow) => void;
    onViewBtnClick: (linkId: string) => void;
};

const AccommodationList = ({
    accommodations,
    isEditing,
    isPrinting,
    onAddBtnClick,
    onDeleteBtnClick,
    onEditBtnClick,
    onViewBtnClick,
}: AccommodationListProps) => {
    return (
        <div
            className={`
                break-inside-avoid-page
                ${
                    isPrinting
                        ? "bg-transparent mb-8"
                        : "bg-white p-5 rounded-lg shadow-sm"
                }
            `}
        >
            <div
                className={`flex items-center justify-between ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : "mb-4 text-[#8E354A]"
                }`}
            >
                <div className="flex items-baseline gap-3">
                    {isPrinting && (
                        <span className="text-3xl font-black text-gray-200 leading-none">
                            02
                        </span>
                    )}
                    <div className="flex items-center">
                        {!isPrinting && <Bed size={18} className="mr-2" />}
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting ? "text-xl text-black" : "text-sm"
                            }`}
                        >
                            Hotels
                        </h3>
                    </div>
                </div>
                {!isPrinting && isEditing && (
                    <div className="flex space-x-2 bg-white pr-2 transition-opacity duration-200">
                        <button
                            onClick={onAddBtnClick}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="新增住宿"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>

            <div
                className={`space-y-0 ${
                    isPrinting ? "grid grid-cols-1 gap-4" : ""
                }`}
            >
                {Array.isArray(accommodations) &&
                    accommodations.map((accommodation, i) => (
                        <AccommodationRecord
                            key={i}
                            accommodation={accommodation}
                            index={i}
                            isEditing={isEditing}
                            isPrinting={isPrinting}
                            onDeleteBtnClick={onDeleteBtnClick}
                            onEditBtnClick={onEditBtnClick}
                            onViewBtnClick={onViewBtnClick}
                        />
                    ))}
                {(!accommodations || accommodations.length === 0) &&
                    !isPrinting && (
                        <div className="text-center text-gray-400 text-xs py-2">
                            尚無住宿資訊
                        </div>
                    )}
            </div>
        </div>
    );
};

export default AccommodationList;
