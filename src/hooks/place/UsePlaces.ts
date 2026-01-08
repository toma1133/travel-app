import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlacesVM } from "../../services/mappers/PlaceMapper";
import type { PlaceVM } from "../../models/types/PlaceTypes";

const usePlaces = (tripId: string | undefined, query?: string | undefined) => {
    return useQuery<PlaceVM[]>({
        queryKey: ["places", tripId, query],
        queryFn: async () => {
            const rows = await placeRepo.list(tripId, query);
            return toPlacesVM(rows);
        },
        staleTime: 60_000,
        enabled: query ? query.length > 0 : true,
        placeholderData: keepPreviousData,
    });
};

export default usePlaces;
