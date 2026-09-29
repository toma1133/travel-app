import { useState } from "react";
import moment from "moment";
import { Car, Clock, MapPin, Pencil, Shield, Trash2 } from "lucide-react";
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
    const [showActions, setShowActions] = useState(false);

    // --- 列印模式：規格表風格 (保持 100% 原樣不變) ---
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

    // --- 螢幕模式：Liquid Glass 卡片風格 ---
    return (
        <div
            className="liquid-glass-interactive rounded-2xl p-4 border border-white/35 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] shadow-xs hover:shadow-md transition-all relative group flex flex-col gap-3"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            {/* 頂部：公司、車型、保險 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-foreground text-sm sm:text-base flex items-center gap-1.5">
                        <Car size={15} className="text-amber-500 shrink-0" />
                        <span>{carRental.company}</span>
                    </div>
                    {carRental.model && (
                        <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-muted/70 text-foreground font-medium">
                            {carRental.model}
                        </span>
                    )}
                </div>

                {/* 保險與編輯按鈕 */}
                <div className="flex items-center gap-2">
                    {carRental.insurance_plan && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                            <Shield size={11} />
                            <span>{carRental.insurance_plan}</span>
                        </span>
                    )}

                    {isEditing && (
                        <div
                            className={`flex items-center gap-1 p-1 liquid-glass-pill shadow-sm transition-all duration-200 ${
                                showActions
                                    ? "opacity-100"
                                    : "lg:opacity-0 lg:group-hover:opacity-100"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => onEditBtnClick(carRental)}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                title="編輯"
                            >
                                <Pencil size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDeleteBtnClick(carRental)}
                                className="p-1.5 rounded-full text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors"
                                title="刪除"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 中間：取車與還車行程雙欄排版 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <MapPin size={11} className="text-primary/70" />
                        <span>取車地點 (Pick-up)</span>
                    </div>
                    <div className="font-semibold text-foreground text-xs line-clamp-1">
                        {carRental.pickup_loc}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                        {moment(carRental.pickup_datetime).format("YYYY-MM-DD HH:mm")}
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <MapPin size={11} className="text-amber-500/70" />
                        <span>還車地點 (Drop-off)</span>
                    </div>
                    <div className="font-semibold text-foreground text-xs line-clamp-1">
                        {carRental.dropoff_loc}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                        {moment(carRental.dropoff_datetime).format("YYYY-MM-DD HH:mm")}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarRentalRecord;
