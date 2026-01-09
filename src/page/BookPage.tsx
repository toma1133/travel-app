import { useEffect, useRef } from "react";
import {
    Outlet,
    useLocation,
    useOutletContext,
    useParams,
} from "react-router-dom";
import { BookOpen, Info, Map, PieChart, Printer, Sun, X } from "lucide-react";
import useTrip from "../hooks/trip/UseTrip";
import LayoutContextType from "../models/types/LayoutContextTypes";
import TabButton from "../components/common/TabButton";
import BackToTopButton from "../components/common/BackToTopBtn";

const BookPage = () => {
    const { id: tripId } = useParams<{ id: string }>();
    const { data: tripData, isLoading, error } = useTrip(tripId);
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    useEffect(() => {
        setIsPageLoading(isLoading);
        return () => setIsPageLoading(false);
    }, [isLoading, setIsPageLoading]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: 0,
                behavior: "instant" as ScrollBehavior,
            });
        }
    }, [location.pathname]);

    return (
        <div className="w-full h-full overflow-hidden flex flex-col min-h-full">
            {tripData && (
                <>
                    {/* Main Content */}
                    <div
                        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
                        ref={scrollContainerRef}
                    >
                        <Outlet context={{ tripData, setIsPageLoading }} />
                        <BackToTopButton
                            showAt={200}
                            size={24}
                            position={{ right: 25, bottom: 100 }}
                            getTarget={() => scrollContainerRef.current}
                        />
                    </div>
                    {/* Styled Bottom Navigation */}
                    <div
                        className={`border-t border-gray-800 ${tripData.theme_config?.nav} px-6 pb-safe pt-1 shrink-0 z-40 h-70px`}
                    >
                        <div className="flex justify-between items-center max-w-sm mx-auto">
                            <TabButton
                                to={`/trip/${tripId}/cover`}
                                icon={Sun}
                                label="首頁"
                                theme={tripData.theme_config}
                                end
                            />
                            <TabButton
                                to={`/trip/${tripId}/guide`}
                                icon={BookOpen}
                                label="景點"
                                theme={tripData.theme_config}
                            />
                            <TabButton
                                to={`/trip/${tripId}/itinerary`}
                                icon={Map}
                                label="行程"
                                theme={tripData.theme_config}
                            />
                            <TabButton
                                to={`/trip/${tripId}/budget`}
                                icon={PieChart}
                                label="帳本"
                                theme={tripData.theme_config}
                            />
                            <TabButton
                                to={`/trip/${tripId}/info`}
                                icon={Info}
                                label="資訊"
                                theme={tripData.theme_config}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BookPage;
