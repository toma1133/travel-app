import { useEffect, useRef, useState } from "react";
import {
    Outlet,
    useLocation,
    useOutletContext,
    useParams,
} from "react-router-dom";
import useTrip from "../hooks/trip/UseTrip";
import LayoutContextType from "../models/types/LayoutContextTypes";
import BackToTopButton from "../components/common/BackToTopBtn";
import LiquidGlassBottomNav from "../components/navigation/LiquidGlassBottomNav";
import DesktopGlassSidebar from "../components/navigation/DesktopGlassSidebar";

const BookPage = () => {
    const { id: tripId } = useParams<{ id: string }>();
    const { data: tripData, isLoading } = useTrip(tripId);
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

    if (!tripData && !isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground">
                查無此旅程資料
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-hidden flex flex-col md:flex-row min-h-full bg-background transition-colors duration-300 relative">
            {tripData && (
                <>
                    {/* Modern Glass Sidebar for Desktop */}
                    <DesktopGlassSidebar tripData={tripData} />

                    {/* Main Content Area */}
                    <main
                        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative flex flex-col min-h-0"
                        ref={scrollContainerRef}
                    >
                        <Outlet context={{ tripData, setIsPageLoading }} />

                        {/* Bottom scroll clearance cushion so last items scroll comfortably above floating LiquidGlassBottomNav */}
                        <div
                            className="w-full shrink-0 h-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:h-8 pointer-events-none"
                            aria-hidden="true"
                        />

                        <BackToTopButton
                            showAt={200}
                            size={20}
                            getTarget={() => scrollContainerRef.current}
                        />
                    </main>

                    {/* Floating Liquid Glass Navigation Dock for Mobile */}
                    <LiquidGlassBottomNav
                        tripId={tripId!}
                        theme={tripData.theme_config}
                    />
                </>
            )}
        </div>
    );
};

export default BookPage;
