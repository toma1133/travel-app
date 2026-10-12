import { toFlightVM } from "../../services/mappers/FlightMapper";
import { getBrowserTimeZone } from "../../utils/DateTimeUtil";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { flightRepo } from "../../services/repositories/FlightRepo";
import type { FlightRow } from "../../models/types/FlightTypes";

const useFlights = (tripId: string | undefined, timeZone = getBrowserTimeZone()) => {
    return useQuery<FlightRow[]>({
        queryKey: ["flights", tripId],
        queryFn: async () => {
            return await flightRepo.list(tripId);
        },
        select: rows => rows.map(row => toFlightVM(row, timeZone)).sort((a, b) =>
            `${a.flight_date || ""}T${a.departure_time || ""}`.localeCompare(`${b.flight_date || ""}T${b.departure_time || ""}`)),
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useFlights;
