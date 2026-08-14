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
                    ? "bg-transparent mb-8"
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
                            03
                        </span>
                    )}
                    <div className="flex items-center">
                        {!isPrinting && <Car size={18} className="mr-2" />}
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting ? "text-xl text-black" : "text-sm"
                            }`}
                        >
                            Transport
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
                                title="新增租車"
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
                        <p className="text-xs text-muted-foreground italic py-2">
                            尚無交通/租車記錄
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CarRentalList;
