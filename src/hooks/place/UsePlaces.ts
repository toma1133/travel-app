import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlacesVM } from "../../services/mappers/PlaceMapper";
import type { PlaceVM } from "../../models/types/PlaceTypes";

const usePlaces = (tripId: string | undefined) => {
    return useQuery<PlaceVM[]>({
        queryKey: ["places", tripId],
        queryFn: async () => {
            const rows = await placeRepo.list(tripId);
            return toPlacesVM(rows);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default usePlaces;
