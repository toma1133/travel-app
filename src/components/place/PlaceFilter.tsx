import { Plus } from "lucide-react";
import { PlaceCategory } from "../../models/types/PlacesTypes";
import { TripThemeConf } from "../../models/types/TripsTypes";
import { MouseEventHandler } from "react";

type PlaceFilterProps = {
    activeFilterId: string;
    placeCategories: PlaceCategory[];
    theme: TripThemeConf | null;
    onFilterBtnClick: (id: string) => void;
    onOpenCreateModal: MouseEventHandler<HTMLButtonElement>;
};

const PlaceFilter = ({
    activeFilterId,
    placeCategories,
    theme,
    onFilterBtnClick,
    onOpenCreateModal,
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
        <button
            type="button"
            onClick={onOpenCreateModal}
            className={`ml-2 flex px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-sm ${theme?.accent} hover:opacity-90 transition-opacity whitespace-nowrap`}
        >
            <Plus size={14} className="mr-1" />
            新增
        </button>
    </div>
);

export default PlaceFilter;
