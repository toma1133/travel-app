import { useState, useRef, useEffect } from "react";
import { Bell, Check, X, MapPin } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import { useMyInvitations } from "../../hooks/tripInvitation/UseTripInvitations";
import { useTripInvitationMutations } from "../../hooks/tripInvitation/UseTripInvitationMutations";

const NotificationBell = () => {
    const { session } = useAuth();
    const user = session?.user;
    const userEmail = user?.email;

    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const { data: invitations = [] } = useMyInvitations(userEmail, !!userEmail);
    const { acceptInvitation, declineInvitation, anyPending } = useTripInvitationMutations();

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleAccept = async (invitationId: string, tripId: string) => {
        if (!user?.id) return;
        try {
            await acceptInvitation.mutateAsync({
                invitationId,
                tripId,
                userId: user.id,
            });
        } catch (err) {
            console.error("Accept invitation error:", err);
        }
    };

    const handleDecline = async (invitationId: string) => {
        try {
            await declineInvitation.mutateAsync(invitationId);
        } catch (err) {
            console.error("Decline invitation error:", err);
        }
    };

    const unreadCount = invitations.length;

    return (
        <div className="relative inline-block" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative text-muted-foreground hover:text-foreground transition-colors focus:outline-none flex items-center justify-center"
                title="通知"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-primary" />
                            <h4 className="font-bold text-sm text-foreground">旅程邀請通知</h4>
                        </div>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                                {unreadCount} 則未處理
                            </span>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                        {invitations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                <Bell size={28} className="opacity-30 stroke-1" />
                                <span>目前沒有新的邀請</span>
                            </div>
                        ) : (
                            invitations.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="p-4 hover:bg-accent/30 transition-colors flex flex-col gap-2.5"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="font-bold text-sm text-foreground truncate">
                                                    {inv.trip_title || inv.trips?.title || "未命名旅程"}
                                                </h5>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    邀請人：{inv.inviter?.username || inv.inviter?.email || "旅行夥伴"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleDecline(inv.id)}
                                            disabled={anyPending}
                                            className="px-3 py-1.5 rounded-lg border border-input text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <X size={14} />
                                            拒絕
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAccept(inv.id, inv.trip_id)}
                                            disabled={anyPending}
                                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <Check size={14} />
                                            接受邀請
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
