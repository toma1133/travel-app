import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tripInvitationRepo } from "../../services/repositories/TripInvitationRepo";
import type { TripInvitationVM } from "../../models/types/TripInvitationTypes";

export const useTripInvitations = (tripId: string | undefined, enabled: boolean = true) => {
    return useQuery<TripInvitationVM[]>({
        queryKey: ["trip_invitations", tripId],
        queryFn: async () => {
            return await tripInvitationRepo.getByTripId(tripId);
        },
        enabled: enabled && !!tripId,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
};

export const useMyInvitations = (email: string | undefined, enabled: boolean = true) => {
    return useQuery<TripInvitationVM[]>({
        queryKey: ["my_trip_invitations", email],
        queryFn: async () => {
            return await tripInvitationRepo.getByInviteeEmail(email);
        },
        enabled: enabled && !!email,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
};
