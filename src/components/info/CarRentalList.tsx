import { MouseEventHandler } from "react";
import { Car, Plus } from "lucide-react";
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
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm break-inside-avoid-page print:shadow-none print:border print:border-gray-300 print:p-4">
            <div className="flex items-center justify-between mb-4 text-[#8E354A] print:text-gray-700">
                <div className="flex justify-between">
                    <Car size={18} className="mr-2" />
                    <h3 className="font-bold text-sm tracking-wider uppercase">
                        Rental Car
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
                            title="新增租車"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>
            {Array.isArray(carRentals) &&
                carRentals.map((carRental, i) => (
                    <CarRentalRecord
                        key={i}
                        carRental={carRental}
                        index={i}
                        isEditing={isEditing}
                        isPrinting={isPrinting}
                        onDeleteBtnClick={onDeleteBtnClick}
                        onEditBtnClick={onEditBtnClick}
                    />
                ))}
        </div>
    );
};

export default CarRentalList;
