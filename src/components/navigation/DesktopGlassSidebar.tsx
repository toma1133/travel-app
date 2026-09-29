import { Link, NavLink } from "react-router-dom";
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Compass,
    Info,
    Map,
    PieChart,
    ShoppingBag,
    Sun,
} from "lucide-react";
import type { TripVM } from "../../models/types/TripTypes";

type DesktopGlassSidebarProps = {
    tripData: TripVM;
};

const sidebarItems = [
    { to: "cover", label: "首頁總覽", icon: Sun, end: true },
    { to: "guide", label: "景點探索", icon: BookOpen },
    { to: "itinerary", label: "每日行程", icon: Map },
    { to: "shopping", label: "購物清單", icon: ShoppingBag },
    { to: "budget", label: "記帳預算", icon: PieChart },
    { to: "info", label: "實用資訊", icon: Info },
];

const DesktopGlassSidebar = ({ tripData }: DesktopGlassSidebarProps) => {
    const formattedDates =
        tripData.start_date && tripData.end_date
            ? `${tripData.start_date.replace(/-/g, ".")} — ${tripData.end_date.replace(/-/g, ".")}`
            : null;

    return (
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-full border-r border-border/60 bg-card/70 backdrop-blur-2xl transition-colors duration-300 relative z-30 select-none">
            {/* Header / Trip Context */}
            <div className="p-5 pb-4 border-b border-border/50">
                <Link
                    to="/trip"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4 px-2.5 py-1 rounded-full liquid-glass-pill hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 group"
                    title="返回旅程書架"
                >
                    <ArrowLeft
                        size={13}
                        className="transition-transform group-hover:-translate-x-0.5"
                    />
                    <span>我的旅程</span>
                </Link>

                <div className="space-y-1.5">
                    <h1
                        className="text-lg font-bold tracking-tight text-foreground line-clamp-2 leading-snug"
                        title={tripData.title}
                    >
                        {tripData.title}
                    </h1>

                    {formattedDates && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-mono">
                            <Calendar size={12} className="shrink-0" />
                            <span className="truncate">{formattedDates}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
                <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                    旅途導航
                </div>

                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const path = `/trip/${tripData.id}/${item.to}`;

                    return (
                        <NavLink
                            key={item.to}
                            to={path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={18}
                                        className={`shrink-0 transition-transform duration-200 ${
                                            isActive
                                                ? "scale-110"
                                                : "group-hover:scale-105"
                                        }`}
                                    />
                                    <span className="truncate">{item.label}</span>

                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/90 animate-pulse" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer / Companion Info */}
            <div className="p-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Compass size={14} className="text-primary/70 animate-spin-slow" />
                        <span className="font-medium">Trip Companion</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/60">v2.0</span>
                </div>
            </div>
        </aside>
    );
};

export default DesktopGlassSidebar;
