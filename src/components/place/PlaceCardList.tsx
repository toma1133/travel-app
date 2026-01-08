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
            /* 螢幕模式: 垂直間距 */
            space-y-6 
            /* 列印模式: 移除間距，改用分隔線，看起來像列表 */
            print:space-y-0 print:divide-y print:divide-gray-200
        `}
    >
        {Array.isArray(places) ? (
            places.map((place) => (
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
        ) : (
            <div className="text-center py-10 text-gray-400 text-sm print:hidden">
                此分類尚無地點，點擊右上角新增。
            </div>
        )}
    </div>
);

export default PlaceCardList;
