import { PlaceCategory } from "../../models/types/PlaceTypes";
import { TripThemeConf } from "../../models/types/TripTypes";

type PlaceFilterProps = {
    activeFilterId: string;
    placeCategories: PlaceCategory[];
    theme: TripThemeConf | null;
    onFilterBtnClick: (id: string) => void;
};

const PlaceFilter = ({
    activeFilterId,
    placeCategories,
    theme,
    onFilterBtnClick,
}: PlaceFilterProps) => (
    <div className="flex justify-between items-center px-4 mb-6">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
            {placeCategories.map((f) => (
                <button
                    key={f.id}
                    type="button"
                    onClick={() => onFilterBtnClick(f.id)}
                    className={`px-4 py-1.5 rounded-full text-xs transition-colors ${
                        activeFilterId === f.id
                            ? `${theme?.accent} text-white`
                            : "bg-white text-gray-500 border border-gray-200"
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
    </div>
);

export default PlaceFilter;
