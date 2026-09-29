import { NavLink } from "react-router-dom";
import { BookOpen, Info, Map, PieChart, ShoppingBag, Sun } from "lucide-react";
import type { TripThemeConf } from "../../models/types/TripTypes";

type LiquidGlassBottomNavProps = {
    tripId: string;
    theme?: TripThemeConf | null;
};

const navItems = [
    { to: "cover", label: "首頁", icon: Sun, end: true },
    { to: "guide", label: "景點", icon: BookOpen },
    { to: "itinerary", label: "行程", icon: Map },
    { to: "shopping", label: "購物", icon: ShoppingBag },
    { to: "budget", label: "帳本", icon: PieChart },
    { to: "info", label: "資訊", icon: Info },
];

const LiquidGlassBottomNav = ({
    tripId,
    theme,
}: LiquidGlassBottomNavProps) => {
    return (
        <nav
            aria-label="主要底部導航"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md md:hidden pointer-events-auto"
        >
            <div className="relative liquid-glass-elevated rounded-2xl p-1.5 px-2 flex items-center justify-between border border-white/60 dark:border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const path = `/trip/${tripId}/${item.to}`;

                    return (
                        <NavLink
                            key={item.to}
                            to={path}
                            end={item.end}
                            className={({ isActive }) =>
                                `relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-300 flex-1 active:scale-90 select-none ${
                                    isActive
                                        ? "text-primary dark:text-white font-semibold"
                                        : "text-muted-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active Liquid Pill Backdrop */}
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-white/10 border border-primary/20 dark:border-white/20 shadow-sm animate-in fade-in zoom-in-95 duration-200"
                                        />
                                    )}

                                    {/* Icon with subtle float */}
                                    <div
                                        className={`relative z-10 transition-transform duration-300 ${
                                            isActive
                                                ? "scale-110 -translate-y-0.5"
                                                : "group-hover:scale-105"
                                        }`}
                                    >
                                        <Icon
                                            size={20}
                                            strokeWidth={isActive ? 2.4 : 1.9}
                                        />
                                    </div>

                                    {/* Label */}
                                    <span
                                        className={`relative z-10 text-[10px] tracking-tight mt-0.5 transition-colors duration-200 ${
                                            isActive
                                                ? "font-bold"
                                                : "font-normal"
                                        }`}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Active Highlight Dot */}
                                    {isActive && (
                                        <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary dark:bg-white animate-pulse" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default LiquidGlassBottomNav;
