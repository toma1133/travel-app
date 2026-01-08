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
        <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
            <div className="flex items-center justify-between mb-4 text-[#8E354A] print:text-gray-700">
                <div className="flex justify-between">
                    <Bed size={18} className="mr-2" />
                    <h3 className="font-bold text-sm tracking-wider uppercase">
                        Hotels
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
                            title="新增住宿"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>
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
        </div>
    );
};

export default AccommodationList;
