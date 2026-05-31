import { X } from "lucide-react";
import { PlaceCategory } from "../../models/types/PlaceTypes";
import { TripThemeConf } from "../../models/types/TripTypes";

type PlaceFilterProps = {
    activeFilterId: string;
    placeCategories: PlaceCategory[];
    selectedTags: string[];
    theme: TripThemeConf | null;
    onFilterBtnClick: (id: string) => void;
    onRemoveTagBtnClick: (tag: string) => void;
};

const PlaceFilter = ({
    activeFilterId,
    placeCategories,
    selectedTags,
    theme,
    onFilterBtnClick,
    onRemoveTagBtnClick,
}: PlaceFilterProps) => (
    <div className="mb-4 space-y-3">
        {/* 類別過濾 */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
            {placeCategories.map((f) => (
                <button
                    key={f.id}
                    type="button"
                    onClick={() => onFilterBtnClick(f.id)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase whitespace-nowrap transition-all shadow-sm ${
                        activeFilterId === f.id
                            ? "bg-primary text-primary-foreground border-transparent shadow-md"
                            : "bg-card text-muted-foreground border border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
        {/* 新增：選取的 Hashtags 顯示區域 */}
        {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] text-muted-foreground font-bold mr-1 uppercase tracking-widest">
                    Tags:
                </span>
                {selectedTags.map((tag) => (
                    <span
                        key={tag}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground shadow-sm`}
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={() => onRemoveTagBtnClick(tag)}
                            className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors ml-1"
                            title="Remove"
                        >
                            <X size={12} strokeWidth={2.5} />
                        </button>
                    </span>
                ))}
            </div>
        )}
    </div>
);

export default PlaceFilter;
