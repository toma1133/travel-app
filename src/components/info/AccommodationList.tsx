import { MouseEventHandler, useState } from "react";
import { Bed, ChevronDown, ChevronUp, Plus } from "lucide-react";
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
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div
            className={
                isPrinting
                    ? "bg-transparent mb-8 break-inside-avoid overflow-visible block"
                    : "bg-card p-5 rounded-xl shadow-sm relative transition-all"
            }
        >
            <div
                className={`flex items-center justify-between select-none ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : `${isOpen ? "mb-4" : "mb-0"} text-[#8E354A] cursor-pointer`
                }`}
                onClick={() => !isPrinting && setIsOpen(!isOpen)}
            >
                <div className="flex items-baseline gap-3">
                    {isPrinting && (
                        <span className="text-3xl font-black text-gray-400 leading-none">
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

                <div className="flex items-center gap-2">
                    {!isPrinting && isEditing && (
                        <div 
                            className="flex space-x-2 bg-background/60 backdrop-blur-md p-1 rounded-full border border-border/50 transition-all duration-300 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={onAddBtnClick}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="新增住宿"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                    {!isPrinting && (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-1 transition-transform duration-200"
                        >
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {(isOpen || isPrinting) && (
                <div className="space-y-4">
                    {Array.isArray(accommodations) && accommodations.length > 0 ? (
                        accommodations.map((acc, i) => (
                            <AccommodationRecord
                                key={acc.id ?? i}
                                accommodation={acc}
                                index={i}
                                isEditing={isEditing}
                                isPrinting={isPrinting}
                                onDeleteBtnClick={() => onDeleteBtnClick(acc)}
                                onEditBtnClick={() => onEditBtnClick(acc)}
                                onViewBtnClick={onViewBtnClick}
                            />
                        ))
                    ) : (
                        <p className="text-xs text-muted-foreground italic py-2">
                            尚無住宿記錄
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccommodationList;
