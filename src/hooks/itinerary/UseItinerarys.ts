import { getBrowserTimeZone } from "../../utils/DateTimeUtil";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { itineraryRepo } from "../../services/repositories/ItineraryRepo";
import { toItinerarysVM } from "../../services/mappers/ItineraryMapper";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";

const useItinerarys = (tripId: string | undefined, timeZone = getBrowserTimeZone()) => {
    return useQuery<ItineraryVM[]>({
        queryKey: QUERY_KEYS.itineraries.list(tripId),
        queryFn: async () => {
            const rows = await itineraryRepo.list(tripId);
            return toItinerarysVM(rows);
        },
        enabled: !!tripId,
        select: rows => toItinerarysVM(rows, timeZone),
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useItinerarys;
