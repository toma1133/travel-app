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

    return (
        <div
            className="relative w-full"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
        >
            <div
                role="button"
                onClick={() => onTripBtnClick(trip.id)}
                className="w-full bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group text-left border border-border"
            >
                <div className="h-40 relative overflow-hidden">
                    {trip.cover_image ? (
                        <img
                            alt={trip.title}
                            src={trip.cover_image}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                            無圖片
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                        {new Date(trip.end_date!) < new Date() && (
                            <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                                Completed
                            </span>
                        )}
                        <h3 className="text-xl font-[Noto_Sans_TC] font-bold shadow-black drop-shadow-md">
                            {trip.title}
                        </h3>
                    </div>
                    <div
                        className={`absolute top-3 right-3 flex space-x-2 transition-opacity duration-200
                            ${
                                showActions
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                            }`}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrintBtnClick(trip);
                            }}
                            className="p-1.5 bg-background/80 backdrop-blur-md rounded-full text-foreground/70 hover:text-foreground hover:bg-background shadow-sm transition-colors"
                            title="列印"
                        >
                            <Printer size={14} />
                        </button>
                        {userId === trip.user_id && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPermissionBtnClick(trip);
                                }}
                                className="p-1.5 bg-background/80 backdrop-blur-md rounded-full text-foreground/70 hover:text-foreground hover:bg-background shadow-sm transition-colors"
                                title="分享"
                            >
                                <User size={14} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditBtnClick(trip);
                            }}
                            className="p-1.5 bg-background/80 backdrop-blur-md rounded-full text-foreground/70 hover:text-foreground hover:bg-background shadow-sm transition-colors"
                            title="編輯"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBtnClick(trip);
                            }}
                            className="p-1.5 bg-background/80 backdrop-blur-md rounded-full text-destructive/70 hover:text-destructive hover:bg-background shadow-sm transition-colors"
                            title="刪除"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <div className="p-5 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground font-mono">
                        {trip.start_date} ~ {trip.end_date}
                    </div>
                    <button
                        type="button"
                        onClick={() => onTripBtnClick(trip.id)}
                        className="text-xs font-bold text-muted-foreground/50 group-hover:text-foreground transition-colors"
                    >
                        OPEN BOOK &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripCard;
