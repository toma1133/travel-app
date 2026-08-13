import { useState, FormEvent, MouseEventHandler } from "react";
import { UserCheck, Mail, Send, Trash2, Clock, UserX } from "lucide-react";
import type { TripThemeConf, TripVM } from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";
import { useTripInvitations } from "../../hooks/tripInvitation/UseTripInvitations";
import { useTripInvitationMutations } from "../../hooks/tripInvitation/UseTripInvitationMutations";
import { tripInvitationRepo } from "../../services/repositories/TripInvitationRepo";
import FormModal from "../common/FormModal";

type PermissionModalProps = {
    trip?: TripVM;
    currentUserId?: string;
    members?: TripMemberVM[];
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onRemoveMember: (memberId: string) => Promise<void>;
};

const PermissionModal = ({
    trip,
    currentUserId,
    members = [],
    theme,
    onCloseBtnClick,
    onRemoveMember,
}: PermissionModalProps) => {
    const [email, setEmail] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const { data: pendingInvitations = [], isLoading: isInvitationsLoading } =
        useTripInvitations(trip?.id, !!trip?.id);
    const { sendInvitation, cancelInvitation } = useTripInvitationMutations();

    const handleSendInvite = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        const targetEmail = email.trim().toLowerCase();
        if (!targetEmail) {
            setErrorMsg("請輸入 Email");
            return;
        }

        if (!trip?.id || !currentUserId) return;

        // Check if user is already a member
        const isMember = members.some(
            (m) => m.profiles?.email.toLowerCase() === targetEmail
        );
        if (isMember) {
            setErrorMsg("該使用者已經是此旅程的成員");
            return;
        }

        // Check if invitation is already pending
        const isInvited = pendingInvitations.some(
            (inv) => inv.invitee_email.toLowerCase() === targetEmail
        );
        if (isInvited) {
            setErrorMsg("已經發送過邀請給該 Email");
            return;
        }

        // Check if user exists in Supabase profiles
        try {
            const exists = await tripInvitationRepo.checkEmailExists(targetEmail);
            if (!exists) {
                setErrorMsg("找不到該 Email 帳號，請確認該使用者是否已註冊");
                return;
            }

            await sendInvitation.mutateAsync({
                trip_id: trip.id,
                trip_title: trip.title,
                inviter_id: currentUserId,
                invitee_email: targetEmail,
                status: "pending",
            });
            setEmail("");
            setSuccessMsg(`已發送邀請給 ${targetEmail}`);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "發送邀請失敗");
        }
    };

    const handleCancelInvite = async (invitationId: string) => {
        if (!trip?.id) return;
        try {
            await cancelInvitation.mutateAsync({
                invitationId,
                tripId: trip.id,
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <FormModal
            formId="permission-form"
            modalTitle={`成員與權限 - ${trip?.title || ""}`}
            modalSaveTitle="完成"
            theme={theme}
            onCloseBtnClick={onCloseBtnClick}
            onCancelBtnClick={onCloseBtnClick}
            onSubmit={(e) => {
                e.preventDefault();
                onCloseBtnClick(e as any);
            }}
        >
            <div className="space-y-5">
                {/* 邀請表單 */}
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        邀請新成員
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="輸入成員 Supabase Email..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleSendInvite}
                            disabled={sendInvitation.isPending}
                            className="px-3.5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                            <Send size={14} />
                            邀請
                        </button>
                    </div>
                    {errorMsg && (
                        <p className="text-xs text-destructive mt-1 font-medium">{errorMsg}</p>
                    )}
                    {successMsg && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                            {successMsg}
                        </p>
                    )}
                </div>

                <hr className="border-border/60" />

                {/* 現有成員 */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <UserCheck size={14} />
                            現有成員 ({members.length})
                        </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {members.map((member) => {
                            const isOwner = member.user_id === trip?.user_id;
                            const isSelf = member.user_id === currentUserId;

                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-accent/40 border border-border/40 text-sm"
                                >
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="font-semibold text-foreground truncate">
                                            {member.profiles?.username || "未知成員"}
                                            {isOwner && (
                                                <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                                                    建立者
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {member.profiles?.email}
                                        </span>
                                    </div>
                                    {!isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveMember(member.id)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                            title={isSelf ? "離開旅程" : "移除成員"}
                                        >
                                            <UserX size={15} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 待處理邀請 */}
                {pendingInvitations.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Clock size={14} />
                                等待回應的邀請 ({pendingInvitations.length})
                            </span>
                        </div>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                            {pendingInvitations.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm"
                                >
                                    <span className="text-foreground text-xs font-mono truncate">
                                        {inv.invitee_email}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCancelInvite(inv.id)}
                                        disabled={cancelInvitation.isPending}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                        title="取消邀請"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </FormModal>
    );
};

export default PermissionModal;
