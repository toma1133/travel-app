import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { itineraryRepo } from "../../services/repositories/ItineraryRepo";
import { toItinerarysVM } from "../../services/mappers/ItineraryMapper";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";

const useItinerarys = (tripId: string | undefined) => {
    return useQuery<ItineraryVM[]>({
        queryKey: ["itinerary_days", tripId],
        queryFn: async () => {
            const rows = await itineraryRepo.list(tripId);
            return toItinerarysVM(rows);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useItinerarys;
