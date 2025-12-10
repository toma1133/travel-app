import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { flightRepo } from "../../services/repositories/FlightRepo";
import type { FlightRow } from "../../models/types/FlightTypes";

const useFlights = (tripId: string | undefined) => {
    return useQuery<FlightRow[]>({
        queryKey: ["flights", tripId],
        queryFn: async () => {
            return await flightRepo.list(tripId);
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useFlights;
