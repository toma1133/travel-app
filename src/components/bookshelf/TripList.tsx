import { useRef } from "react";
import { Plus } from "lucide-react";
import TripCard from "./TripCard";
import type { TripVM } from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

type TripListProps = {
    trips?: TripVM[];
    userId?: string;
    membersByTrip?: Record<string, TripMemberVM[]>;
    onDeleteBtnClick: (tripItem: TripVM) => void;
    onEditBtnClick: (tripItem: TripVM) => void;
    onPermissionBtnClick: (tripItem: TripVM) => void;
    onPrintBtnClick: (tripItem: TripVM) => void;
    onTripBtnClick: (tripId: string) => void;
    onAddTripBtnClick?: () => void;
};

const TripList = ({
    trips,
    userId,
    membersByTrip = {},
    onDeleteBtnClick,
    onEditBtnClick,
    onPermissionBtnClick,
    onPrintBtnClick,
    onTripBtnClick,
    onAddTripBtnClick,
}: TripListProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div 
            className="flex-1 px-4 md:px-8 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 overflow-y-auto no-scrollbar scroll-smooth content-start relative"
            ref={scrollContainerRef}
        >
            {/* 規劃新旅程引導卡片 */}
            {onAddTripBtnClick && (
                <button
                    type="button"
                    onClick={onAddTripBtnClick}
                    className="w-full min-h-[280px] h-full rounded-3xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-card/40 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center gap-3.5 p-6 text-center cursor-pointer shadow-2xs hover:shadow-xl active:scale-[0.98] group select-none"
                    title="建立新旅程"
                >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                        <Plus size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                            規劃新旅程
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                            建立下一個夢想景點與冒險行事曆
                        </p>
                    </div>
                </button>
            )}

            {Array.isArray(trips) &&
                trips.map((trip) => (
                    <TripCard
                        key={trip.id}
                        trip={trip}
                        userId={userId}
                        members={membersByTrip[trip.id] || []}
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
