import { useQuery } from "@tanstack/react-query";
import { tripMemberRepo } from "../../services/repositories/TripMemberRepo";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

export const useTripsMembersBatch = (tripIds: string[]) => {
    // Sort keys to provide stable query cache key
    const sortedKey = [...tripIds].sort().join(",");

    return useQuery<Record<string, TripMemberVM[]>>({
        queryKey: ["trips_members_batch", sortedKey],
        queryFn: async () => {
            if (!tripIds.length) return {};
            // If repository has listByTripIds
            if ("listByTripIds" in tripMemberRepo && typeof (tripMemberRepo as any).listByTripIds === "function") {
                const members = await (tripMemberRepo as any).listByTripIds(tripIds);
                const map: Record<string, TripMemberVM[]> = {};
                members.forEach((m: TripMemberVM) => {
                    if (!map[m.trip_id]) map[m.trip_id] = [];
                    map[m.trip_id].push(m);
                });
                return map;
            }
            return {};
        },
        enabled: tripIds.length > 0,
        staleTime: 60_000,
    });
};

export default useTripsMembersBatch;
