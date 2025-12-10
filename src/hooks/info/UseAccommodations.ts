import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { accommodationRepo } from "../../services/repositories/AccommodationRepo";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";

const useAccommodations = (tripId: string | undefined) => {
    return useQuery<AccommodationRow[]>({
        queryKey: ["accommodations", tripId],
        queryFn: async () => {
            return await accommodationRepo.list(tripId);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useAccommodations;
