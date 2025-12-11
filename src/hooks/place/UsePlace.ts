import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlaceVM } from "../../services/mappers/PlaceMapper";
import type { PlaceVM } from "../../models/types/PlaceTypes";

const usePlace = (placeId: string | undefined) => {
    return useQuery<PlaceVM>({
        queryKey: ["place", placeId],
        queryFn: async () => {
            if (!placeId) throw new Error("No place ID provided");
            const row = await placeRepo.getById(placeId);
            return toPlaceVM(row!);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
        enabled: !!placeId,
    });
};

export default usePlace;
