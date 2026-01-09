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
        <div
            className={`
                break-inside-avoid-page
                ${
                    isPrinting
                        ? "border border-gray-400 rounded-none p-4 mb-4 bg-white"
                        : "bg-white p-5 rounded-lg shadow-sm"
                }
            `}
        >
            <div
                className={`flex items-center justify-between mb-4 ${
                    isPrinting
                        ? "text-black border-b border-gray-200 pb-2"
                        : "text-[#8E354A]"
                }`}
            >
                <div className="flex items-center">
                    <Car
                        size={18}
                        className={`mr-2 ${isPrinting ? "text-black" : ""}`}
                    />
                    <h3
                        className={`font-bold tracking-wider uppercase ${
                            isPrinting ? "text-base" : "text-sm"
                        }`}
                    >
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
            <div
                className={`space-y-0 ${
                    isPrinting ? "divide-y divide-gray-200" : ""
                }`}
            >
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
                {(!carRentals || carRentals.length === 0) && !isPrinting && (
                    <div className="text-center text-gray-400 text-xs py-2">
                        尚無租車資訊
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarRentalList;
