import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlacesVM } from "../../services/mappers/PlaceMapper";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type { PlaceVM } from "../../models/types/PlaceTypes";

const usePlaces = (tripId: string | undefined) => {
    return useQuery<PlaceVM[]>({
        queryKey: QUERY_KEYS.places.list(tripId),
        queryFn: async () => {
            const rows = await placeRepo.list(tripId);
            return toPlacesVM(rows);
        },
        enabled: !!tripId,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default usePlaces;
