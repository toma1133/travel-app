
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tripRepo } from "../../services/repositories/TripRepo";
import { toTripVM } from "../../services/mappers/TripMapper";
import type { TripVM } from "../../models/types/TripsTypes";

export function useBook(id: string | undefined) {
    return useQuery<TripVM>({
        queryKey: ["trip", id],
        queryFn: async () => {
            const row = await tripRepo.getTrip(id);
            if (!row) throw new Error("Trip not found");
            return toTripVM(row);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData
    });
}
