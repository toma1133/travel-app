import { NavLink } from "react-router-dom";
import type { TripThemeConf } from "../../models/types/TripTypes";
import type { LucideIcon } from "lucide-react";

type TabButtonProps = {
    to: string;
    icon: LucideIcon;
    label: string;
    theme: TripThemeConf | null;
    end?: boolean;
    className?: string;
    isSidebar?: boolean;
};

const TabButton = ({
    to,
    icon: Icon,
    label,
    theme,
    end,
    className,
    isSidebar = false,
}: TabButtonProps) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            [
                isSidebar
                    ? "flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
                    : "flex flex-col items-center justify-center w-full py-3 transition-all duration-300 hover:opacity-80",
                isActive && isSidebar ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "",
                isActive && !isSidebar ? theme?.navTextActive || "text-primary" : "",
                !isActive && !isSidebar ? theme?.navTextInactive || "text-muted-foreground" : "",
                !isActive && isSidebar ? "text-muted-foreground" : "",
                className ?? "",
            ].join(" ")
        }
    >
        {({ isActive }) => (
            <>
                <Icon
                    size={isSidebar ? 20 : 22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isSidebar ? "" : "mb-1"}
                />
                <span className={`${isSidebar ? 'text-sm font-medium' : 'text-[10px] font-medium tracking-wider'}`}>
                    {label}
                </span>
            </>
        )}
    </NavLink>
);

export default TabButton;
