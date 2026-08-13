import { useState, useRef, useEffect } from "react";
import { Filter, X, Check, ChevronDown, Tag } from "lucide-react";
import type { PlaceCategory } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type PlaceFilterProps = {
    activeFilterId: string;
    placeCategories: PlaceCategory[];
    selectedTags: string[];
    theme: TripThemeConf | null;
    onFilterBtnClick: (id: string) => void;
    onRemoveTagBtnClick: (tag: string) => void;
    onClearAllFilters?: () => void;
};

const PlaceFilter = ({
    activeFilterId,
    placeCategories,
    selectedTags,
    theme,
    onFilterBtnClick,
    onRemoveTagBtnClick,
    onClearAllFilters,
}: PlaceFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeCategory = placeCategories.find((c) => c.id === activeFilterId);
    const hasActiveFilters = activeFilterId !== "all" || selectedTags.length > 0;

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="mb-4 space-y-3">
            {/* Filter Funnel Control Bar */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative inline-block" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                            hasActiveFilters
                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                : "bg-card text-foreground border-border hover:bg-accent"
                        }`}
                    >
                        <Filter size={15} className="shrink-0" />
                        <span>類別：{activeCategory?.label || "全部"}</span>
                        <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {/* Filter Dropdown Popover */}
                    {isOpen && (
                        <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1 flex items-center justify-between">
                                <span>選擇地點類型</span>
                                <Filter size={12} />
                            </div>
                            <div className="space-y-0.5 max-h-64 overflow-y-auto no-scrollbar">
                                {placeCategories.map((cat) => {
                                    const isSelected = activeFilterId === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                onFilterBtnClick(cat.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                                isSelected
                                                    ? "bg-primary/10 text-primary font-bold"
                                                    : "text-foreground hover:bg-accent/60"
                                            }`}
                                        >
                                            <span>{cat.label}</span>
                                            {isSelected && <Check size={14} className="text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Clear Filters Quick Action */}
                {hasActiveFilters && onClearAllFilters && (
                    <button
                        type="button"
                        onClick={onClearAllFilters}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 font-medium"
                    >
                        重設篩選
                    </button>
                )}
            </div>

            {/* Selected Hashtags Bar */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center pt-1">
                    <span className="text-[10px] text-muted-foreground font-bold mr-1 uppercase tracking-widest flex items-center gap-1">
                        <Tag size={11} />
                        Tags:
                    </span>
                    {selectedTags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/20"
                        >
                            #{tag}
                            <button
                                type="button"
                                onClick={() => onRemoveTagBtnClick(tag)}
                                className="hover:bg-primary/30 rounded-full p-0.5 transition-colors ml-0.5"
                                title="移除標籤"
                            >
                                <X size={12} strokeWidth={2.5} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlaceFilter;
