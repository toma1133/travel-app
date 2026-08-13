import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import { useTheme } from "../../contexts/ThemeContext";
import NotificationBell from "./NotificationBell";

type SystemControlsProps = {
    className?: string;
};

const SystemControls = ({ className = "" }: SystemControlsProps) => {
    const { signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isOffline, setIsOffline] = useState(() => {
        if (typeof navigator === "undefined") return false;
        return !navigator.onLine;
    });

    useEffect(() => {
        const handleStatusChange = () => setIsOffline(!navigator.onLine);

        window.addEventListener("online", handleStatusChange);
        window.addEventListener("offline", handleStatusChange);

        return () => {
            window.removeEventListener("online", handleStatusChange);
            window.removeEventListener("offline", handleStatusChange);
        };
    }, []);

    return (
        <div className={`flex items-center gap-3 bg-background/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-sm ${className}`}>
            <NotificationBell />
            <button
                type="button"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Toggle theme"
            >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden md:inline-block ${
                    isOffline
                        ? "bg-muted text-muted-foreground"
                        : "bg-green-500/20 text-green-500"
                }`}
            >
                {isOffline ? "OFFLINE" : "ONLINE"}
            </span>
            <button
                type="button"
                onClick={signOut}
                className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
                登出
            </button>
        </div>
    );
};

export default SystemControls;
