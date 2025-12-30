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
    <div className="px-4 mb-4 space-y-3">
        {/* 類別過濾 */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
            {placeCategories.map((f) => (
                <button
                    key={f.id}
                    type="button"
                    onClick={() => onFilterBtnClick(f.id)}
                    className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                        activeFilterId === f.id
                            ? `${
                                  theme?.accent || "bg-blue-500"
                              } text-white shadow-sm`
                            : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
        {/* 新增：選取的 Hashtags 顯示區域 */}
        {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] text-gray-400 font-medium mr-1 uppercase tracking-wider">
                    Tags:
                </span>
                {selectedTags.map((tag) => (
                    <span
                        key={tag}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-white ${
                            theme?.accent || "bg-blue-500"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => onRemoveTagBtnClick(tag)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            title="Remove"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                        #{tag}
                    </span>
                ))}
            </div>
        )}
    </div>
    // <div className="flex justify-between items-center px-4 mb-6">
    //     <div className="flex space-x-2 overflow-x-auto no-scrollbar">
    //         {placeCategories.map((f) => (
    //             <button
    //                 key={f.id}
    //                 type="button"
    //                 onClick={() => onFilterBtnClick(f.id)}
    //                 className={`px-4 py-1.5 rounded-full text-xs transition-colors ${
    //                     activeFilterId === f.id
    //                         ? `${theme?.accent} text-white`
    //                         : "bg-white text-gray-500 border border-gray-200"
    //                 }`}
    //             >
    //                 {f.label}
    //             </button>
    //         ))}
    //     </div>
    // </div>
);

export default PlaceFilter;
