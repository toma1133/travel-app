import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripInvitationRepo } from "../../services/repositories/TripInvitationRepo";
import { tripMemberRepo } from "../../services/repositories/TripMemberRepo";
import type { TripInvitationRowInsert } from "../../models/types/TripInvitationTypes";

export const useTripInvitationMutations = () => {
    const qc = useQueryClient();

    const sendInvitation = useMutation({
        mutationFn: async (payload: TripInvitationRowInsert) => {
            return await tripInvitationRepo.createInvitation(payload);
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ["trip_invitations", variables.trip_id] });
        },
    });

    const cancelInvitation = useMutation({
        mutationFn: async ({ invitationId, tripId }: { invitationId: string; tripId: string }) => {
            await tripInvitationRepo.deleteInvitation(invitationId);
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ["trip_invitations", variables.tripId] });
        },
    });

    const acceptInvitation = useMutation({
        mutationFn: async ({
            invitationId,
            tripId,
            userId,
        }: {
            invitationId: string;
            tripId: string;
            userId: string;
        }) => {
            // 1. Add to trip_members
            await tripMemberRepo.insert({
                trip_id: tripId,
                user_id: userId,
            });
            // 2. Remove invitation
            await tripInvitationRepo.deleteInvitation(invitationId);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["my_trip_invitations"] });
            qc.invalidateQueries({ queryKey: ["trips"] });
            qc.invalidateQueries({ queryKey: ["trip_members"] });
        },
    });

    const declineInvitation = useMutation({
        mutationFn: async (invitationId: string) => {
            await tripInvitationRepo.deleteInvitation(invitationId);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["my_trip_invitations"] });
        },
    });

    return {
        sendInvitation,
        cancelInvitation,
        acceptInvitation,
        declineInvitation,
        anyPending:
            sendInvitation.isPending ||
            cancelInvitation.isPending ||
            acceptInvitation.isPending ||
            declineInvitation.isPending,
    };
};
