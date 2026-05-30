import { useEffect, useState } from "react";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import useAuth from "../hooks/UseAuth";
import LayoutContextType from "../models/types/LayoutContextTypes";
import LoadingMask from "../components/common/LoadingMask";
import { useTheme } from "../contexts/ThemeContext";

type ProtectedLayoutProps = {
    isOffline: boolean;
};

const ProtectedLayout = ({ isOffline }: ProtectedLayoutProps) => {
    const { session, loading, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
            className={`
                h-screen w-full bg-background font-[Noto_Sans_TC] text-foreground overflow-hidden flex flex-col 
                mx-auto shadow-2xl relative print:h-auto print:w-full print:max-w-none md:max-w-none max-w-md
                print:shadow-none print:overflow-visible print:bg-white transition-colors duration-300`}
        >
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
