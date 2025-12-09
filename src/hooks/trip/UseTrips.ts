import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tripRepo } from "../../services/repositories/TripRepo";
import { toTripsVM } from "../../services/mappers/TripMapper";
import type { TripVM } from "../../models/types/TripsTypes";

const useTrips = () => {
    return useQuery<TripVM[]>({
        queryKey: ["trips"],
        queryFn: async () => {
            const rows = await tripRepo.listTrips();
            return toTripsVM(rows);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useTrips;
