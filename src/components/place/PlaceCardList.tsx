import { PlaceVM } from "../../models/types/PlacesTypes";
import { TripThemeConf } from "../../models/types/TripsTypes";
import PlaceCard from "./PlaceCard";

type PlaceCardListProps = {
    isPrinting: boolean | undefined;
    places: PlaceVM[] | null;
    theme: TripThemeConf | null;
    onOpenDeleteModal: (place: PlaceVM) => void;
    onOpenEditModal: (place: PlaceVM) => void;
};

const PlaceCardList = ({
    isPrinting,
    places,
    theme,
    onOpenDeleteModal,
    onOpenEditModal,
}: PlaceCardListProps) => (
    <div className="space-y-6 px-4 print:space-y-4">
        {Array.isArray(places) ? (
            places.map((place) => (
                <PlaceCard
                    key={place.id}
                    theme={theme}
                    place={place}
                    isPrinting={isPrinting}
                    isPreview={false}
                    onDelete={onOpenDeleteModal}
                    onEdit={onOpenEditModal}
                />
            ))
        ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
                此分類尚無地點，點擊右上角新增。
            </div>
        )}
    </div>
);

export default PlaceCardList;
