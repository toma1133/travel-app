import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import PlaceCard from "./PlaceCard";

type PlaceCardListProps = {
    isPrinting: boolean | undefined;
    places: PlaceVM[] | null;
    theme: TripThemeConf | null;
    onDeleteBtnClick: (place: PlaceVM) => void;
    onEditBtnClick: (place: PlaceVM) => void;
    onTagBtnClick: (tag: string) => void;
};

const PlaceCardList = ({
    isPrinting,
    places,
    theme,
    onDeleteBtnClick,
    onEditBtnClick,
    onTagBtnClick,
}: PlaceCardListProps) => (
    <div
        className={`
            w-full 
            ${isPrinting ? "space-y-0 divide-y divide-black" : "space-y-6 w-full"}
        `}
    >
        {Array.isArray(places) && places.length > 0
            ? places.map((place) => (
                  <PlaceCard
                      key={place.id}
                      theme={theme}
                      place={place}
                      isPrinting={isPrinting}
                      isPreview={false}
                      onDelete={onDeleteBtnClick}
                      onEdit={onEditBtnClick}
                      onTagBtnClick={onTagBtnClick}
                  />
              ))
            : !isPrinting && (
                  <div className="text-center py-20 text-muted-foreground text-sm col-span-full border-2 border-dashed border-border rounded-2xl">
                      此分類尚無地點，點擊右上角新增。
                  </div>
              )}
    </div>
);

export default PlaceCardList;
