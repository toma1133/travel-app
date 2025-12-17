import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tripMemberRepo } from "../../services/repositories/TripMemberRepo";
import type { TripMemberRow } from "../../models/types/TripMemberTypes";

const useTripMembers = (tripId: string | undefined) => {
    return useQuery<TripMemberRow[]>({
        queryKey: ["trip_members", tripId],
        queryFn: async () => {
            return await tripMemberRepo.list(tripId);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useTripMembers;
