import { useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import useTrips from "../hooks/trip/UseTrips";
import LayoutContextType from "../models/types/LayoutContextTypes";

const BookshelfPage = () => {
    const { data, isLoading, error } = useTrips();
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();
    const navigate = useNavigate();

    useEffect(() => {
        setIsPageLoading(isLoading);
        return () => setIsPageLoading(false);
    }, [isLoading, setIsPageLoading]);

    const handleSelectTrip = (tripId: string) => {
        navigate(`/trip/${tripId}`, { replace: false });
    };

    return (
        <div className="pt-6">
            <div className="px-6 py-6">
                <h1 className="text-2xl font-[Noto_Sans_TC] font-bold text-[#111827]">
                    我的旅程
                </h1>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mt-1">
                    Travel Collections
                </p>
            </div>
            <div className="flex-1 px-6 pb-10 space-y-6 overflow-y-auto">
                {Array.isArray(data) &&
                    data.map((trip) => (
                        <div key={trip.id} className="relative w-full">
                            <button
                                type="button"
                                onClick={() => handleSelectTrip(trip.id)}
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
                                        <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                                            {
                                                trip.settings_config
                                                    ?.localCurrency
                                            }{" "}
                                            Trip
                                        </span>
                                        <h3 className="text-xl font-[Noto_Sans_TC] font-bold shadow-black drop-shadow-md">
                                            {trip.title}
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <div className="text-xs text-gray-500 font-mono">
                                        {trip.start_date} - {trip.end_date}
                                    </div>
                                    <div className="text-xs font-bold text-gray-300 group-hover:text-[#111827] transition-colors">
                                        OPEN BOOK &rarr;
                                    </div>
                                </div>
                            </button>
                        </div>
                    ))}
                {/* Add New Placeholder */}
                {/* <button className="w-full border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                <Plus size={24} className="mb-2 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-widest">
                    Create New Trip
                </span>
            </button> */}
            </div>
        </div>
    );
};

export default BookshelfPage;
