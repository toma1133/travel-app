import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import useAuth from "../hooks/UseAuth";
import LayoutContextType from "../models/types/LayoutContextTypes";
import LoadingMask from "../components/common/LoadingMask";

type ProtectedLayoutProps = {
    isOffline: boolean;
};

const ProtectedLayout = ({ isOffline }: ProtectedLayoutProps) => {
    const { session, loading, signOut } = useAuth();
    const [isDisplayBackBtn, setIsDisplayBackBtn] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setIsDisplayBackBtn(
            location.pathname !== "/" && location.pathname !== "/trip"
        );
    }, [location]);

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

    const handleBackBtnClick = () => {
        navigate("/", { replace: false });
    };

    return (
        <div
            className={`h-screen w-full bg-[#F9F8F6] font-[Noto_Sans_TC] text-gray-500 overflow-hidden flex flex-col mx-auto max-w-md shadow-2xl relative print:hidden`}
        >
            {isPageLoading && <LoadingMask />}
            <nav className="w-full shrink-0 flex justify-end items-end px-6 py-4 pb-3 absolute top-0 z-20">
                {isDisplayBackBtn && (
                    <button
                        type="button"
                        title="back"
                        onClick={handleBackBtnClick}
                        className="absolute top-3 left-3 z-50 text-white/80 hover:text-white bg-black/20 backdrop-blur-md p-2 rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-4">
                    <span
                        className={`text-xs px-2 py-1 rounded-full ${
                            isOffline
                                ? "bg-gray-500/20 text-gray-400"
                                : "bg-green-500/20 text-green-400"
                        }`}
                    >
                        {isOffline ? "OFFLINE" : "ONLINE"}
                    </span>
                    <button
                        type="button"
                        onClick={signOut}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        登出
                    </button>
                </div>
            </nav>
            {/* Main Content */}
            <Outlet
                context={{ setIsPageLoading } satisfies LayoutContextType}
            />
        </div>
    );
};

export default ProtectedLayout;
