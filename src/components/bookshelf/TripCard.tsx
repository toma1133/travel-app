import { useState } from "react";
import type { TripVM } from "../../models/types/TripTypes";
import { Pencil, Trash2, User } from "lucide-react";

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
                className="w-full bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group text-left border border-gray-100"
            >
                <div className="h-40 relative overflow-hidden">
                    {trip.cover_image ? (
                        <img
                            alt={trip.title}
                            src={trip.cover_image}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
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
                        {/* <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrintBtnClick(trip);
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-600 hover:text-blue-600 hover:bg-white shadow-sm transition-colors"
                            title="列印"
                        >
                            <Printer size={14} />
                        </button> */}
                        {userId === trip.user_id && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPermissionBtnClick(trip);
                                }}
                                className="p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-600 hover:text-blue-600 hover:bg-white shadow-sm transition-colors"
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
                            className="p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-600 hover:text-blue-600 hover:bg-white shadow-sm transition-colors"
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
                            className="p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-600 hover:text-red-600 hover:bg-white shadow-sm transition-colors"
                            title="刪除"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                    <div className="text-xs text-gray-500 font-mono">
                        {trip.start_date} ~ {trip.end_date}
                    </div>
                    <button
                        type="button"
                        onClick={() => onTripBtnClick(trip.id)}
                        className="text-xs font-bold text-gray-300 group-hover:text-[#111827] transition-colors"
                    >
                        OPEN BOOK &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripCard;
