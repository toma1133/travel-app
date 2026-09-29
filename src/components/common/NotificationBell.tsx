import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, X, MapPin } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import { useMyInvitations } from "../../hooks/tripInvitation/UseTripInvitations";
import { useTripInvitationMutations } from "../../hooks/tripInvitation/UseTripInvitationMutations";
import { hapticFeedback } from "../../utils/HapticUtil";

const NotificationBell = () => {
    const { session } = useAuth();
    const user = session?.user;
    const userEmail = user?.email;

    const [isOpen, setIsOpen] = useState(false);

    const { data: invitations = [] } = useMyInvitations(userEmail, !!userEmail);
    const { acceptInvitation, declineInvitation, anyPending } = useTripInvitationMutations();

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
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartYRef = useRef(0);
    const touchCurrentYRef = useRef(0);

    const handleDismiss = () => {
        hapticFeedback.light();
        setIsOpen(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartYRef.current = touch.clientY;
        touchCurrentYRef.current = touch.clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        touchCurrentYRef.current = touch.clientY;
        const deltaY = touchCurrentYRef.current - touchStartYRef.current;

        if (deltaY > 0) {
            setTranslateY(Math.pow(deltaY, 0.92));
        } else {
            setTranslateY(0);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const deltaY = touchCurrentYRef.current - touchStartYRef.current;
        if (deltaY > 80) {
            handleDismiss();
        } else {
            setTranslateY(0);
        }
    };

    const backdropOpacity = Math.max(0.2, 1 - translateY / 320);

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    hapticFeedback.light();
                    setIsOpen(true);
                }}
                className="relative text-muted-foreground hover:text-foreground transition-colors focus:outline-none flex items-center justify-center p-1 rounded-full hover:bg-muted/50"
                title="通知"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen &&
                createPortal(
                    <div 
                        className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center md:items-center bg-black/60 backdrop-blur-sm animate-in fade-in p-0 md:p-4"
                        style={{ opacity: backdropOpacity }}
                        onClick={handleDismiss}
                    >
                        <div 
                            style={{
                                transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
                                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                            className="bg-card w-full max-w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-6 md:zoom-in-95 border border-border flex flex-col max-h-[85vh] font-[Noto_Sans_TC] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 📱 頂部行動把手 */}
                            <div
                                className="w-full pt-3 pb-1 md:hidden flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/35 hover:bg-muted-foreground/50 transition-colors" />
                            </div>

                            {/* Header */}
                            <div
                                className="p-4 md:p-5 border-b border-border/60 flex items-center justify-between bg-muted/30 touch-none select-none"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className="flex items-center gap-2">
                                    <Bell size={18} className="text-primary shrink-0" />
                                    <h4 className="font-bold text-base text-foreground">旅程邀請通知</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                                            {unreadCount} 則未處理
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleDismiss}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto no-scrollbar p-4 divide-y divide-border/40 flex-1">
                                {invitations.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                        <Bell size={32} className="opacity-30 stroke-1" />
                                        <span>目前沒有新的邀請</span>
                                    </div>
                                ) : (
                                    invitations.map((inv) => (
                                        <div
                                            key={inv.id}
                                            className="p-3.5 rounded-xl hover:bg-accent/30 transition-colors flex flex-col gap-3 my-1"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                                    <MapPin size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="font-bold text-sm text-foreground truncate">
                                                        {inv.trips?.title || "未命名行程"}
                                                    </h5>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        來自 <span className="font-medium text-foreground">{inv.inviter?.username || inv.inviter?.email || "同伴"}</span> 的邀請
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/30">
                                                <button
                                                    type="button"
                                                    disabled={anyPending}
                                                    onClick={() => handleDecline(inv.id)}
                                                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                                >
                                                    拒絕
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={anyPending}
                                                    onClick={() => handleAccept(inv.id, inv.trip_id)}
                                                    className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                                                >
                                                    接受邀請
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default NotificationBell;
