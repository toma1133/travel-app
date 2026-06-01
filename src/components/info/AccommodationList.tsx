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
            className={
                isPrinting
                    ? "bg-transparent mb-8"
                    : "bg-card p-5 rounded-lg shadow-sm relative group"
            }
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
                {!isPrinting && isEditing && (
                    <div className="flex space-x-2 bg-background/60 backdrop-blur-md p-1 rounded-full border border-border/50 transition-all duration-300 lg:opacity-0 lg:group-hover:opacity-100 z-10">
                        <button
                            onClick={onAddBtnClick}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
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
                        <div className="text-center text-muted-foreground text-xs py-2">
                            尚無住宿資訊
                        </div>
                    )}
            </div>
        </div>
    );
};

export default AccommodationList;
