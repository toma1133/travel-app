import { MouseEventHandler, useState } from "react";
import { Car, ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";
import CarRentalRecord from "./CarRentalRecord";

type CarRentalListProps = {
    carRentals: CarRentalRow[] | undefined;
    isEditing: boolean;
    isPrinting?: boolean;
    onAddBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDeleteBtnClick: (carRental: CarRentalRow) => void;
    onEditBtnClick: (carRental: CarRentalRow) => void;
};

const CarRentalList = ({
    carRentals,
    isEditing,
    isPrinting,
    onAddBtnClick,
    onDeleteBtnClick,
    onEditBtnClick,
}: CarRentalListProps) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div
            className={
                isPrinting
                    ? "bg-transparent mb-8 break-inside-avoid overflow-visible block"
                    : "liquid-glass-elevated rounded-3xl p-5 md:p-6 border border-white/40 dark:border-white/10 shadow-lg relative transition-all"
            }
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between select-none ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : `${isOpen ? "mb-4" : "mb-0"} cursor-pointer group`
                }`}
                onClick={() => !isPrinting && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2.5">
                    {/* 列印時的章節編號 */}
                    {isPrinting ? (
                        <span className="text-3xl font-black text-gray-400 leading-none mr-2">
                            03
                        </span>
                    ) : (
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <Car size={17} />
                        </div>
                    )}
                    <div>
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting
                                    ? "text-xl text-black"
                                    : "text-sm text-foreground flex items-center gap-2"
                            }`}
                        >
                            <span>租車交通</span>
                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                TRANSPORT
                            </span>
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPrinting && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddBtnClick(e);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer shadow-xs"
                            title="新增租車"
                        >
                            <Plus size={13} />
                            <span>新增</span>
                        </button>
                    )}
                    {!isPrinting && (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-transform duration-200"
                        >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {(isOpen || isPrinting) && (
                <div className={isPrinting ? "space-y-4" : "space-y-3 pt-1"}>
                    {Array.isArray(carRentals) && carRentals.length > 0 ? (
                        carRentals.map((car, i) => (
                            <CarRentalRecord
                                key={car.id ?? i}
                                carRental={car}
                                index={i}
                                isEditing={isEditing}
                                isPrinting={isPrinting}
                                onDeleteBtnClick={() => onDeleteBtnClick(car)}
                                onEditBtnClick={() => onEditBtnClick(car)}
                            />
                        ))
                    ) : (
                        <div className="p-6 rounded-2xl border border-dashed border-border/60 text-center text-xs text-muted-foreground bg-muted/20">
                            尚未安排租車與交通，點擊右上角新增以記錄租車資訊。
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CarRentalList;
