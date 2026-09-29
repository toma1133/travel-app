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
                            02
                        </span>
                    ) : (
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <Bed size={17} />
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
                            <span>住宿清單</span>
                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                HOTELS
                            </span>
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPrinting && isEditing && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddBtnClick(e);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer shadow-xs"
                            title="新增住宿"
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
                        <div className="p-6 rounded-2xl border border-dashed border-border/60 text-center text-xs text-muted-foreground bg-muted/20">
                            尚未安排住宿，點擊右上角新增以記錄飯店與民宿。
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccommodationList;
