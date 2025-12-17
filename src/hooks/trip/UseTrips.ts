import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tripRepo } from "../../services/repositories/TripRepo";
import { toTripsVM } from "../../services/mappers/TripMapper";
import type { TripVM } from "../../models/types/TripTypes";

const useTrips = (userId: string | undefined) => {
    return useQuery<TripVM[]>({
        queryKey: ["trips", userId],
        queryFn: async () => {
            const rows = await tripRepo.list();
            return toTripsVM(rows);
        },
        enabled: !!userId,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useTrips;
