import { useEffect, useRef, useState } from "react";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { Wifi, WifiOff } from "lucide-react";
import useAuth from "../hooks/UseAuth";
import LayoutContextType from "../models/types/LayoutContextTypes";
import LoadingMask from "../components/common/LoadingMask";

type ProtectedLayoutProps = {
    isOffline: boolean;
};

const ProtectedLayout = ({ isOffline }: ProtectedLayoutProps) => {
    const { session, loading } = useAuth();
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [showRestored, setShowRestored] = useState(false);
    const prevOfflineRef = useRef(isOffline);
    const location = useLocation();

    useEffect(() => {
        if (prevOfflineRef.current && !isOffline) {
            setShowRestored(true);
            const timer = window.setTimeout(() => setShowRestored(false), 3200);
            return () => clearTimeout(timer);
        }
        prevOfflineRef.current = isOffline;
    }, [isOffline]);

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
            {/* Offline Notification Capsule */}
            {isOffline && (
                <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300 w-[calc(100%-2rem)] max-w-sm">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 dark:bg-amber-400/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 backdrop-blur-xl shadow-lg text-xs font-medium">
                        <WifiOff
                            size={14}
                            className="shrink-0 text-amber-600 dark:text-amber-400 animate-pulse"
                        />
                        <span className="truncate">
                            離線模式中 (Offline Mode) · 本地資料已安全快取
                        </span>
                    </div>
                </div>
            )}

            {/* Online Restored Notification Capsule */}
            {showRestored && (
                <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300 w-[calc(100%-2rem)] max-w-sm">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 dark:bg-emerald-400/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 backdrop-blur-xl shadow-lg text-xs font-medium">
                        <Wifi
                            size={14}
                            className="shrink-0 text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="truncate">網路已恢復 · 資料同步運作中</span>
                    </div>
                </div>
            )}

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
