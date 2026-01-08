import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tripMemberRepo } from "../../services/repositories/TripMemberRepo";
import { toTripMembersVM } from "../../services/mappers/TripMemberMapper";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

const useTripMembers = (tripId: string | undefined, modalOpen: boolean) => {
    return useQuery<TripMemberVM[]>({
        queryKey: ["trip_members", tripId],
        queryFn: async () => {
            const rows = await tripMemberRepo.list(tripId);
            return toTripMembersVM(rows);
        },
        enabled: modalOpen && !!tripId,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useTripMembers;
