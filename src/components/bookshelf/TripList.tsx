import TripCard from "./TripCard";
import type { TripVM } from "../../models/types/TripTypes";

type TripListProps = {
    trips?: TripVM[];
    userId?: string;
    onDeleteBtnClick: (tripItem: TripVM) => void;
    onEditBtnClick: (tripItem: TripVM) => void;
    onPermissionBtnClick: (tripItem: TripVM) => void;
    onPrintBtnClick: (tripItem: TripVM) => void;
    onTripBtnClick: (tripId: string) => void;
};

const TripList = ({
    trips,
    userId,
    onDeleteBtnClick,
    onEditBtnClick,
    onPermissionBtnClick,
    onPrintBtnClick,
    onTripBtnClick,
}: TripListProps) => {
    return (
        <div className="flex-1 px-4 pb-10 space-y-6 overflow-y-auto no-scrollbar scroll-smooth">
            {Array.isArray(trips) &&
                trips.map((trip, i) => (
                    <TripCard
                        key={i}
                        trip={trip}
                        userId={userId}
                        onDeleteBtnClick={onDeleteBtnClick}
                        onEditBtnClick={onEditBtnClick}
                        onPermissionBtnClick={onPermissionBtnClick}
                        onPrintBtnClick={onPrintBtnClick}
                        onTripBtnClick={onTripBtnClick}
                    />
                ))}
        </div>
    );
};

export default TripList;
