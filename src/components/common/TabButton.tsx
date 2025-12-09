import { NavLink } from "react-router-dom";
import type { TripThemeConf } from "../../models/types/TripsTypes";
import type { LucideIcon } from "lucide-react";

type TabButtonProps = {
    to: string;
    icon: LucideIcon;
    label: string;
    theme: TripThemeConf | null;
    end?: boolean;
    className?: string;
};

const TabButton = ({
    to,
    icon: Icon,
    label,
    theme,
    end,
    className,
}: TabButtonProps) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            [
                "flex flex-col items-center justify-center w-full py-3 transition-all duration-300",
                isActive ? theme?.navTextActive : theme?.navTextInactive,
                className ?? "",
            ].join(" ")
        }
    >
        {({ isActive }) => (
            <>
                <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="mb-1"
                />
                <span className="text-[10px] font-medium tracking-wider">
                    {label}
                </span>
            </>
        )}
    </NavLink>
);

export default TabButton;
