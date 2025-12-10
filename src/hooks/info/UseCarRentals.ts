import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { carRentalRepo } from "../../services/repositories/CarRentalRepo";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";

const useCarRentals = (tripId: string | undefined) => {
    return useQuery<CarRentalRow[]>({
        queryKey: ["car_rentals", tripId],
        queryFn: async () => {
            return await carRentalRepo.list(tripId);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useCarRentals;
