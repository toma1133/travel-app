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

    // --- 列印模式：飯店預約單風格 (保持 100% 原樣不變) ---
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

    // --- 螢幕模式：Liquid Glass 卡片風格 ---
    return (
        <div
            className="liquid-glass-interactive rounded-2xl p-4 border border-white/35 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] shadow-xs hover:shadow-md transition-all relative group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                    <span className="truncate">{accommodation.name}</span>
                    {accommodation.link_id && (
                        <button
                            type="button"
                            onClick={() => onViewBtnClick(accommodation.link_id!)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors shrink-0"
                            title="查看關聯景點資訊"
                        >
                            <BookOpen size={11} />
                            <span>景點詳情</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center text-xs text-muted-foreground gap-1.5 font-mono">
                    <Calendar size={12} className="shrink-0 text-indigo-500/70" />
                    <span>{accommodation.check_in_date}</span>
                    <span className="text-muted-foreground/60">➝</span>
                    <span>{accommodation.check_out_date}</span>
                </div>

                {accommodation.address && (
                    <div className="flex items-start text-xs text-muted-foreground/80 leading-relaxed">
                        <MapPin size={12} className="mr-1.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                        <span className="break-words line-clamp-1">
                            {accommodation.address}
                        </span>
                    </div>
                )}
            </div>

            {/* 右側操作按鈕 */}
            {isEditing && (
                <div
                    className={`flex items-center gap-1 p-1 liquid-glass-pill shadow-sm transition-all duration-200 shrink-0 self-end sm:self-center ${
                        showActions
                            ? "opacity-100"
                            : "lg:opacity-0 lg:group-hover:opacity-100"
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => onEditBtnClick(accommodation)}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="編輯"
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteBtnClick(accommodation)}
                        className="p-1.5 rounded-full text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors"
                        title="刪除"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AccommodationRecord;
