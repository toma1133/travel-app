import moment from "moment";
import { Pencil, Trash2 } from "lucide-react";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";

type CarRentalRecordProps = {
    carRental: CarRentalRow;
    index: number;
    isEditing: boolean;
    isPrinting?: boolean;
    onDeleteBtnClick: (carRental: CarRentalRow) => void;
    onEditBtnClick: (carRental: CarRentalRow) => void;
};

const CarRentalRecord = ({
    carRental,
    index,
    isEditing,
    isPrinting,
    onDeleteBtnClick,
    onEditBtnClick,
}: CarRentalRecordProps) => {
    // --- 列印模式：規格表風格 ---
    if (isPrinting) {
        return (
            <div className="border border-black break-inside-avoid text-sm">
                {/* Header: 公司與車型 */}
                <div className="bg-black text-white p-2 flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider">
                        {carRental.company}
                    </span>
                    <span className="font-mono text-xs">{carRental.model}</span>
                </div>

                {/* 內容表格 */}
                <div className="grid grid-cols-2 divide-x divide-black">
                    {/* 取車 */}
                    <div className="p-3">
                        <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Pick-up
                        </div>
                        <div className="font-bold text-black">
                            {carRental.pickup_loc}
                        </div>
                        <div className="font-mono text-xs mt-1">
                            {moment(carRental.pickup_datetime).format(
                                "YYYY-MM-DD HH:mm"
                            )}
                        </div>
                    </div>
                    {/* 還車 */}
                    <div className="p-3">
                        <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Drop-off
                        </div>
                        <div className="font-bold text-black">
                            {carRental.dropoff_loc}
                        </div>
                        <div className="font-mono text-xs mt-1">
                            {moment(carRental.dropoff_datetime).format(
                                "YYYY-MM-DD HH:mm"
                            )}
                        </div>
                    </div>
                </div>

                {/* 保險資訊 (如有) */}
                {carRental.insurance_plan && (
                    <div className="border-t border-black p-2 bg-gray-100 text-xs flex justify-between">
                        <span className="font-bold text-gray-600">
                            INSURANCE
                        </span>
                        <span className="font-mono">
                            {carRental.insurance_plan}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // --- 螢幕模式 (保持原樣) ---
    return (
        <div
            className={`flex justify-between items-start pt-4 mb-4 last:mb-0 relative group ${
                index !== 0 ? "border-t border-border" : ""
            }`}
        >
            <div className="w-full text-sm px-2">
                {/* ... (螢幕模式內容保持不變) ... */}
                <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase">
                            租車公司
                        </span>
                        <span className="font-bold text-foreground">
                            {carRental.company}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase">
                            車型
                        </span>
                        <span className="font-bold text-foreground">
                            {carRental.model}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase">
                            保險
                        </span>
                        <span className="font-bold text-foreground">
                            {carRental.insurance_plan || "-"}
                        </span>
                    </div>
                </div>
                {/* ... */}
                <div className="p-4 bg-muted rounded text-xs space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">取車</span>
                        <span className="text-foreground">
                            <span className="font-bold mr-2">
                                {carRental.pickup_loc}
                            </span>
                            <span className="font-mono">
                                {moment(carRental.pickup_datetime).format(
                                    "YYYY-MM-DD HH:mm"
                                )}
                            </span>
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">還車</span>
                        <span className="text-foreground">
                            <span className="font-bold mr-2">
                                {carRental.dropoff_loc}
                            </span>
                            <span className="font-mono">
                                {moment(carRental.dropoff_datetime).format(
                                    "YYYY-MM-DD HH:mm"
                                )}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1 bg-background/60 backdrop-blur-md rounded-full shadow-md border border-border/50 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 z-10">
                    <button
                        onClick={() => onEditBtnClick(carRental)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="編輯"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDeleteBtnClick(carRental)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="刪除"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CarRentalRecord;
