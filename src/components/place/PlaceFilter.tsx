import { useState, useRef, useEffect, useMemo } from "react";
import { Filter, X, Check, ChevronDown, Tag, Search, RotateCcw } from "lucide-react";
import type { PlaceCategory } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

export type TagItem = {
    tag: string;
    count: number;
};

type PlaceFilterProps = {
    activeFilterId: string;
    placeCategories: PlaceCategory[];
    availableTags?: TagItem[];
    selectedTags: string[];
    filteredPlacesCount?: number;
    theme: TripThemeConf | null;
    onFilterBtnClick: (id: string) => void;
    onTagBtnClick: (tag: string) => void;
    onRemoveTagBtnClick: (tag: string) => void;
    onClearAllFilters?: () => void;
};

const PlaceFilter = ({
    activeFilterId,
    placeCategories,
    availableTags = [],
    selectedTags,
    filteredPlacesCount,
    theme,
    onFilterBtnClick,
    onTagBtnClick,
    onRemoveTagBtnClick,
    onClearAllFilters,
}: PlaceFilterProps) => {
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isTagOpen, setIsTagOpen] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState("");

    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const tagDropdownRef = useRef<HTMLDivElement>(null);

    const activeCategory = placeCategories.find((c) => c.id === activeFilterId);
    const hasActiveFilters = activeFilterId !== "all" || selectedTags.length > 0;

    // 依搜尋字串過濾下拉選單中的標籤
    const filteredAvailableTags = useMemo(() => {
        if (!tagSearchQuery.trim()) return availableTags;
        const q = tagSearchQuery.trim().toLowerCase();
        return availableTags.filter((t) => t.tag.toLowerCase().includes(q));
    }, [availableTags, tagSearchQuery]);

    // 點擊外部自動關閉下拉選單
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(e.target as Node)
            ) {
                setIsCategoryOpen(false);
            }
            if (
                tagDropdownRef.current &&
                !tagDropdownRef.current.contains(e.target as Node)
            ) {
                setIsTagOpen(false);
            }
        };
        if (isCategoryOpen || isTagOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCategoryOpen, isTagOpen]);

    return (
        <div className="mb-4 space-y-3">
            {/* 上方篩選控制工具列 */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. 類別下拉篩選按鈕 */}
                    <div className="relative inline-block" ref={categoryDropdownRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCategoryOpen((prev) => !prev);
                                setIsTagOpen(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer active:scale-95 ${
                                activeFilterId !== "all"
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-card text-foreground border-border/80 hover:bg-muted"
                            }`}
                        >
                            <Filter size={14} className="shrink-0" />
                            <span>類別：{activeCategory?.label || "全部"}</span>
                            <ChevronDown
                                size={13}
                                className={`transition-transform duration-200 ${
                                    isCategoryOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* 類別選單 Popover */}
                        {isCategoryOpen && (
                            <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-card text-card-foreground border border-border shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1 flex items-center justify-between">
                                    <span>選擇地點類型</span>
                                    <Filter size={12} />
                                </div>
                                <div className="space-y-0.5 max-h-60 overflow-y-auto no-scrollbar">
                                    {placeCategories.map((cat) => {
                                        const isSelected = activeFilterId === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                    onFilterBtnClick(cat.id);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? "bg-primary/15 text-primary font-bold"
                                                        : "text-foreground hover:bg-muted"
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

                    {/* 2. 標籤篩選下拉按鈕 (若此行程有標籤時顯示) */}
                    {availableTags.length > 0 && (
                        <div className="relative inline-block" ref={tagDropdownRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsTagOpen((prev) => !prev);
                                    setIsCategoryOpen(false);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer active:scale-95 ${
                                    selectedTags.length > 0
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-card text-foreground border-border/80 hover:bg-muted"
                                }`}
                            >
                                <Tag size={13} className="shrink-0" />
                                <span>
                                    標籤
                                    {selectedTags.length > 0 ? ` (${selectedTags.length})` : ""}
                                </span>
                                <ChevronDown
                                    size={13}
                                    className={`transition-transform duration-200 ${
                                        isTagOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {/* 標籤選單 Popover (支援搜尋與多選) */}
                            {isTagOpen && (
                                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-card text-card-foreground border border-border shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/50 mb-2">
                                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                                            <Tag size={12} className="text-primary" />
                                            選擇標籤過濾
                                        </span>
                                        {selectedTags.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    selectedTags.forEach((t) => onRemoveTagBtnClick(t));
                                                }}
                                                className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                清除標籤
                                            </button>
                                        )}
                                    </div>

                                    {/* 標籤搜尋框 */}
                                    <div className="relative mb-2">
                                        <Search
                                            size={13}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        />
                                        <input
                                            type="text"
                                            value={tagSearchQuery}
                                            onChange={(e) => setTagSearchQuery(e.target.value)}
                                            placeholder="搜尋標籤..."
                                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 border border-border/70 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                                        />
                                        {tagSearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setTagSearchQuery("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    {/* 標籤列表 */}
                                    <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar pt-0.5">
                                        {filteredAvailableTags.length > 0 ? (
                                            filteredAvailableTags.map(({ tag, count }) => {
                                                const isSelected = selectedTags.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => onTagBtnClick(tag)}
                                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? "bg-primary/15 text-primary font-bold"
                                                                : "text-foreground hover:bg-muted"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            <div
                                                                className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                                                                    isSelected
                                                                        ? "bg-primary border-primary text-primary-foreground"
                                                                        : "border-border/80 bg-background"
                                                                }`}
                                                            >
                                                                {isSelected && <Check size={11} strokeWidth={3} />}
                                                            </div>
                                                            <span className="truncate">#{tag}</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.2 rounded-md">
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-4 text-xs text-muted-foreground">
                                                無符合標籤
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 右側資訊與重設按鈕 */}
                <div className="flex items-center gap-2.5 text-xs">
                    {typeof filteredPlacesCount === "number" && (
                        <span className="text-muted-foreground text-[11px] font-medium">
                            共 <strong className="text-foreground">{filteredPlacesCount}</strong> 個地點
                        </span>
                    )}

                    {hasActiveFilters && onClearAllFilters && (
                        <button
                            type="button"
                            onClick={onClearAllFilters}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer font-medium border border-border/50"
                            title="重設所有篩選條件"
                        >
                            <RotateCcw size={11} />
                            <span>重設</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 3. 標籤快速切換橫列 (精簡取前 5 個熱門標籤與當前已選取標籤，乾淨不佔空間) */}
            {availableTags.length > 0 && (() => {
                const top5 = availableTags.slice(0, 5);
                const top5Set = new Set(top5.map((t) => t.tag));
                const extraSelected = availableTags.filter(
                    (t) => selectedTags.includes(t.tag) && !top5Set.has(t.tag)
                );
                const displayQuickTags = [...top5, ...extraSelected];

                return (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                        <span className="text-[10px] text-muted-foreground font-bold shrink-0 uppercase tracking-wider flex items-center gap-1 mr-0.5">
                            <Tag size={10} />
                            熱門:
                        </span>
                        {displayQuickTags.map(({ tag, count }) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => onTagBtnClick(tag)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium shrink-0 transition-all cursor-pointer border ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                            : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/80"
                                    }`}
                                    title={isSelected ? `取消篩選 #${tag}` : `篩選 #${tag}`}
                                >
                                    <span>#{tag}</span>
                                    {!isSelected && (
                                        <span className="text-[10px] font-mono text-muted-foreground/80 bg-muted px-1 rounded-sm">
                                            {count}
                                        </span>
                                    )}
                                    {isSelected && <X size={11} strokeWidth={2.5} className="ml-0.5" />}
                                </button>
                            );
                        })}
                    </div>
                );
            })()}
        </div>
    );
};

export default PlaceFilter;
