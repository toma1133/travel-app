import { useState } from "react";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    useLocation,
} from "react-router-dom";
import useAuth from "../hooks/UseAuth";
import LayoutContextType from "../models/types/LayoutContextTypes";
import LoadingMask from "../components/common/LoadingMask";
import OfflineStatusBadge from "../components/common/OfflineStatusBadge";

type ProtectedLayoutProps = {
    isOffline: boolean;
};

const ProtectedLayout = ({ isOffline }: ProtectedLayoutProps) => {
    const { session, loading } = useAuth();
    const [isPageLoading, setIsPageLoading] = useState(false);
    const location = useLocation();

    if (loading) return <LoadingMask />;

    if (!session) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ returnTo: location.pathname }}
            />
        );
    }

    return (
        <div
            className={`
                h-screen w-full bg-background font-[Noto_Sans_TC] text-foreground overflow-hidden flex flex-col 
                mx-auto shadow-2xl relative print:h-auto print:w-full print:max-w-none md:max-w-none max-w-md
                print:shadow-none print:overflow-visible print:bg-white transition-colors duration-300`}
        >
            {/* Liquid Glass Offline Perception Badge */}
            <OfflineStatusBadge isOffline={isOffline} />

            {isPageLoading && <LoadingMask />}

            {/* Main Content */}
            <Outlet
                context={{ setIsPageLoading } satisfies LayoutContextType}
            />
            <ScrollRestoration />
        </div>
    );
};

export default ProtectedLayout;
