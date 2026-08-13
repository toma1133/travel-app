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
        <div
            className={`flex items-center gap-3 bg-card/85 dark:bg-card/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/80 shadow-md text-foreground transition-all ${className}`}
        >
            <NotificationBell />
            <button
                type="button"
                onClick={toggleTheme}
                className="text-foreground/80 hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted/50"
                title="Toggle theme"
            >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden md:inline-block ${
                    isOffline
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
            >
                {isOffline ? "OFFLINE" : "ONLINE"}
            </span>
            <button
                type="button"
                onClick={signOut}
                className="text-[12px] font-bold text-foreground/80 hover:text-foreground transition-colors"
            >
                登出
            </button>
        </div>
    );
};

export default SystemControls;
