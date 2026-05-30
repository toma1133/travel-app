import { useRef } from "react";
import TripCard from "./TripCard";
import type { TripVM } from "../../models/types/TripTypes";
import BackToTopButton from "../common/BackToTopBtn";

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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div 
            className="flex-1 px-4 md:px-8 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 overflow-y-auto no-scrollbar scroll-smooth content-start relative"
            ref={scrollContainerRef}
        >
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
            <BackToTopButton
                showAt={160}
                size={22}
                getTarget={() => scrollContainerRef.current}
            />
        </div>
    );
};

export default TripList;
