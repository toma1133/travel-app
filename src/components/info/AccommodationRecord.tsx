import { useState } from "react";
import { BookOpen, Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";

type AccommodationRecordProps = {
    accommodation: AccommodationRow;
    index: number;
    isEditing: boolean;
    isPrinting?: boolean;
    onDeleteBtnClick: (accommodation: AccommodationRow) => void;
    onEditBtnClick: (accommodation: AccommodationRow) => void;
    onViewBtnClick: (linkId: string) => void;
};

const AccommodationRecord = ({
    accommodation,
    index,
    isEditing,
    isPrinting,
    onDeleteBtnClick,
    onEditBtnClick,
    onViewBtnClick,
}: AccommodationRecordProps) => {
    const [showActions, setShowActions] = useState(false);

    // --- 列印模式：飯店預約單風格 ---
    if (isPrinting) {
        return (
            <div className="border-2 border-gray-100 rounded-sm p-4 break-inside-avoid flex flex-col gap-3">
                {/* 飯店名稱與地址 */}
                <div>
                    <h4 className="text-xl font-black text-black leading-tight mb-1">
                        {accommodation.name}
                    </h4>
                    <div className="flex items-start text-sm text-gray-600">
                        <MapPin size={14} className="mr-1 mt-0.5 shrink-0" />
                        <span className="break-words">
                            {accommodation.address}
                        </span>
                    </div>
                </div>

                {/* 日期區塊 - 雙欄 */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-gray-200">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Check-in
                        </span>
                        <span className="text-lg font-bold font-mono text-black">
                            {accommodation.check_in_date}
                        </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Check-out
                        </span>
                        <span className="text-lg font-bold font-mono text-black">
                            {accommodation.check_out_date}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // --- 螢幕模式 (保持原樣) ---
    return (
        <div
            className={`flex justify-between items-start pt-4 mb-4 last:mb-0 relative group ${
                index !== 0 ? "border-t border-border" : ""
            }`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            <div className="flex-1 pr-16">
                <div className="font-bold text-foreground text-sm mb-1">
                    {accommodation.name}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar size={12} className="mr-1.5 shrink-0" />
                    {accommodation.check_in_date}
                    <span className="mx-1 text-muted-foreground">-</span>
                    {accommodation.check_out_date}
                </div>
                <div className="flex items-start text-xs text-muted-foreground mt-1">
                    <MapPin size={12} className="mr-1.5 mt-0.5 shrink-0" />
                    <span className="break-words leading-relaxed">
                        {accommodation.address}
                    </span>
                </div>
            </div>
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1 bg-background/60 backdrop-blur-md rounded-full shadow-md border border-border/50 transition-all duration-300 z-10 ${showActions ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}>
                {!isEditing && accommodation.link_id && (
                    <button
                        onClick={() => onViewBtnClick(accommodation.link_id!)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="查看"
                    >
                        <BookOpen size={14} />
                    </button>
                )}
                {isEditing && (
                    <>
                        <button
                            onClick={() => onEditBtnClick(accommodation)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="編輯"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={() => onDeleteBtnClick(accommodation)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="刪除"
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccommodationRecord;
