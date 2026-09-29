import { useMemo, useState } from "react";
import { Calendar, Clock, Pencil, Printer, Sparkles, Trash2, Users } from "lucide-react";
import moment from "moment";
import type { TripVM } from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

type TripCardProps = {
    trip: TripVM;
    userId?: string;
    members?: TripMemberVM[];
    onDeleteBtnClick: (tripItem: TripVM) => void;
    onEditBtnClick: (tripItem: TripVM) => void;
    onPermissionBtnClick: (tripItem: TripVM) => void;
    onPrintBtnClick: (tripItem: TripVM) => void;
    onTripBtnClick: (tripId: string) => void;
};

const AVATAR_COLORS = [
    "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
    "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
    "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
    "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30",
];

const getMemberInitial = (member: TripMemberVM) => {
    const raw = member.profiles?.username || member.profiles?.email || "";
    const clean = raw.split("@")[0].trim();
    return clean ? clean.charAt(0).toUpperCase() : "友";
};

const getMemberName = (member: TripMemberVM) => {
    return member.profiles?.username || member.profiles?.email || "夥伴";
};

const getColorClass = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
};

const TripCard = ({
    trip,
    userId,
    members = [],
    onDeleteBtnClick,
    onEditBtnClick,
    onPermissionBtnClick,
    onPrintBtnClick,
    onTripBtnClick,
}: TripCardProps) => {
    const [showActions, setShowActions] = useState(false);

    // Compute status and countdown
    const { statusBadge, totalDays } = useMemo(() => {
        if (!trip.start_date || !trip.end_date) {
            return {
                statusBadge: { text: "未定日期", style: "bg-muted text-muted-foreground" },
                totalDays: 1,
            };
        }

        const today = moment().startOf("day");
        const start = moment(trip.start_date).startOf("day");
        const end = moment(trip.end_date).endOf("day");
        const days = Math.max(1, moment(trip.end_date).diff(moment(trip.start_date), "days") + 1);

        if (today.isAfter(end)) {
            return {
                statusBadge: {
                    text: "已完成",
                    style: "bg-black/50 text-white/80 border border-white/15 backdrop-blur-md",
                },
                totalDays: days,
            };
        }

        if (today.isBetween(start, end, undefined, "[]")) {
            return {
                statusBadge: {
                    text: "旅程進行中 🟢",
                    style: "bg-emerald-500/80 text-white border border-emerald-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.4)]",
                },
                totalDays: days,
            };
        }

        const diffDays = start.diff(today, "days");
        if (diffDays === 0) {
            return {
                statusBadge: {
                    text: "今天出發！ 🎉",
                    style: "bg-gradient-to-r from-amber-500 to-rose-500 text-white border border-white/30 backdrop-blur-md shadow-md animate-pulse",
                },
                totalDays: days,
            };
        }

        return {
            statusBadge: {
                text: `倒數 ${diffDays} 天`,
                style: "bg-gradient-to-r from-rose-500/90 to-orange-500/90 text-white border border-white/30 backdrop-blur-md shadow-md",
            },
            totalDays: days,
        };
    }, [trip.start_date, trip.end_date]);

    return (
        <div
            className="relative w-full group cursor-pointer select-none"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onTouchStart={() => setShowActions(true)}
            onClick={() => onTripBtnClick(trip.id)}
        >
            <div className="w-full liquid-glass-interactive rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col bg-card/80">
                {/* Image & Specular Reflection Section */}
                <div className="relative h-52 sm:h-60 overflow-hidden bg-muted">
                    {trip.cover_image ? (
                        <img
                            alt={trip.title}
                            src={trip.cover_image}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-accent/20">
                            <span className="text-muted-foreground/60 tracking-widest text-xs font-semibold uppercase">
                                Travel Book
                            </span>
                        </div>
                    )}

                    {/* Specular Liquid Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Gradient Overlay for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity duration-300" />

                    {/* Status Capsule Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <span
                            className={`text-xs px-3 py-1 rounded-full font-medium tracking-wide shadow-sm flex items-center gap-1.5 ${statusBadge.style}`}
                        >
                            <Sparkles size={11} className="shrink-0" />
                            <span>{statusBadge.text}</span>
                        </span>
                    </div>

                    {/* Action Pill Container */}
                    <div
                        className={`absolute top-4 right-4 z-20 flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 shadow-md transition-all duration-300 ${
                            showActions
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 -translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrintBtnClick(trip);
                            }}
                            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-90"
                            title="列印行程"
                        >
                            <Printer size={15} />
                        </button>
                        {userId === trip.user_id && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPermissionBtnClick(trip);
                                }}
                                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-90"
                                title="成員權限"
                            >
                                <Users size={15} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditBtnClick(trip);
                            }}
                            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-90"
                            title="編輯設定"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBtnClick(trip);
                            }}
                            className="p-1.5 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/40 transition-all active:scale-90"
                            title="刪除旅程"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>

                    {/* Title & Subtitle at bottom of cover */}
                    <div className="absolute bottom-4 left-5 right-5 text-white z-10 space-y-1">
                        {trip.subtitle && (
                            <div className="text-xs text-white/75 font-medium tracking-wider uppercase truncate">
                                {trip.subtitle}
                            </div>
                        )}
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight line-clamp-2 leading-tight drop-shadow-md text-white">
                            {trip.title}
                        </h3>
                    </div>
                </div>

                {/* Content Footer Details */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-card/60 backdrop-blur-md">
                    <div className="space-y-1 min-w-0">
                        {/* Dates with Icon */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Calendar size={13} className="shrink-0 text-primary/70" />
                            <span className="truncate">
                                {trip.start_date?.replace(/-/g, ".")} — {trip.end_date?.replace(/-/g, ".")}
                            </span>
                        </div>

                        {/* Duration & Companion Avatars */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground/90 bg-muted/60 px-2 py-0.5 rounded-md shrink-0">
                                <Clock size={11} className="text-muted-foreground" />
                                {totalDays} 天
                            </span>

                            {/* Companion Initial Avatars */}
                            {members && members.length > 0 ? (
                                <div
                                    className="flex items-center -space-x-1.5 overflow-hidden ml-1"
                                    title={`旅途夥伴 (${members.length} 人)`}
                                >
                                    {members.slice(0, 4).map((member) => {
                                        const initial = getMemberInitial(member);
                                        const name = getMemberName(member);
                                        const isOwner = member.user_id === trip.user_id;
                                        const colorCls = getColorClass(name);

                                        return (
                                            <div
                                                key={member.id}
                                                className={`w-6 h-6 rounded-full border border-card ring-1 ring-border/50 flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform hover:scale-110 hover:z-20 shrink-0 ${colorCls}`}
                                                title={`${name}${isOwner ? " (建立者)" : ""}`}
                                            >
                                                {initial}
                                            </div>
                                        );
                                    })}
                                    {members.length > 4 && (
                                        <div
                                            className="w-6 h-6 rounded-full bg-muted/80 text-muted-foreground border border-card ring-1 ring-border/50 flex items-center justify-center text-[9px] font-bold shadow-xs shrink-0"
                                            title={`還有 ${members.length - 4} 位夥伴`}
                                        >
                                            +{members.length - 4}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center -space-x-1.5 overflow-hidden ml-1">
                                    <div
                                        className="w-6 h-6 rounded-full bg-primary/10 text-primary border border-card ring-1 ring-border/50 flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0"
                                        title="個人旅程"
                                    >
                                        我
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subtle Open Arrow Action */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-sm shrink-0">
                        <span className="font-bold text-base leading-none mb-0.5">
                            &rarr;
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripCard;
