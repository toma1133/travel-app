import { useState } from "react";
import { Pencil, Printer, Trash2, User } from "lucide-react";
import type { TripVM } from "../../models/types/TripTypes";

type TripCardProps = {
    trip: TripVM;
    userId?: string;
    onDeleteBtnClick: (tripItem: TripVM) => void;
    onEditBtnClick: (tripItem: TripVM) => void;
    onPermissionBtnClick: (tripItem: TripVM) => void;
    onPrintBtnClick: (tripItem: TripVM) => void;
    onTripBtnClick: (tripId: string) => void;
};

const TripCard = ({
    trip,
    userId,
    onDeleteBtnClick,
    onEditBtnClick,
    onPermissionBtnClick,
    onPrintBtnClick,
    onTripBtnClick,
}: TripCardProps) => {
    const [showActions, setShowActions] = useState(false);
    const isCompleted = new Date(trip.end_date!) < new Date();

    return (
        <div
            className="relative w-full group cursor-pointer perspective-1000"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
            onClick={() => onTripBtnClick(trip.id)}
        >
            <div className="w-full bg-card rounded-[1.5rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 ease-out border border-border/50 group-hover:-translate-y-2 flex flex-col">
                
                {/* Image Section */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                    {trip.cover_image ? (
                        <img
                            alt={trip.title}
                            src={trip.cover_image}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground/50 tracking-widest text-sm font-medium">NO COVER</span>
                        </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                        {isCompleted ? (
                            <span className="text-[10px] bg-black/40 text-white/90 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full uppercase tracking-wider font-semibold shadow-sm">
                                Completed
                            </span>
                        ) : (
                            <span className="text-[10px] bg-primary/80 text-primary-foreground backdrop-blur-md px-3 py-1.5 rounded-full uppercase tracking-wider font-semibold shadow-sm">
                                Upcoming
                            </span>
                        )}
                    </div>

                    {/* Action Buttons Container - Glass Pill */}
                    <div
                        className={`absolute top-4 right-4 flex space-x-1 p-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10 transition-all duration-300
                            ${
                                showActions
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 -translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0"
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrintBtnClick(trip);
                            }}
                            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                            title="列印"
                        >
                            <Printer size={16} />
                        </button>
                        {userId === trip.user_id && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPermissionBtnClick(trip);
                                }}
                                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                                title="分享"
                            >
                                <User size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditBtnClick(trip);
                            }}
                            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                            title="編輯"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBtnClick(trip);
                            }}
                            className="p-2 rounded-full text-red-300 hover:text-red-100 hover:bg-red-500/40 transition-colors"
                            title="刪除"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Title inside image at bottom */}
                    <div className="absolute bottom-4 left-5 right-5 text-white">
                        <h3 className="text-2xl font-[Noto_Sans_TC] font-bold tracking-tight line-clamp-2 leading-tight drop-shadow-md">
                            {trip.title}
                        </h3>
                    </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex flex-col justify-between bg-card z-10 relative">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1">
                                Duration
                            </div>
                            <div className="text-sm font-mono text-foreground font-medium">
                                {trip.start_date?.replace(/-/g, "/")} &rarr; {trip.end_date?.replace(/-/g, "/")}
                            </div>
                        </div>
                        
                        {/* Elegant Open Button */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                            <span className="text-primary group-hover:text-primary-foreground transition-colors duration-300 font-bold text-lg leading-none mb-0.5">
                                &rarr;
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripCard;
