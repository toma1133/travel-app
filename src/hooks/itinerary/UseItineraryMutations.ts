import { useMutation, useQueryClient } from "@tanstack/react-query";
import { itineraryRepo } from "../../services/repositories/ItineraryRepo";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";

import { syncTripItineraryDays } from "../../services/ItinerarySyncService";
import type { TripRow } from "../../models/types/TripTypes";

export const useItineraryMutations = (tripId?: string) => {
    const qc = useQueryClient();

    const invalidateItineraryData = (targetTripId?: string, dayId?: string) => {
        if (dayId) {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.itineraries.detail(dayId) });
        }
        if (targetTripId) {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.itineraries.list(targetTripId) });
        }
        qc.invalidateQueries({ queryKey: QUERY_KEYS.itineraries.all });
    };

    const insert = useMutation({
        mutationKey: ["itinerary_day", "insert"],
        mutationFn: (payload: ItineraryVM) => itineraryRepo.insert(payload),
        onSuccess: (data, variables) => {
            invalidateItineraryData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const update = useMutation({
        mutationKey: ["itinerary_day", "update"],
        mutationFn: (payload: ItineraryVM) => itineraryRepo.update(payload),
        onSuccess: (data, variables) => {
            invalidateItineraryData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const upsert = useMutation({
        mutationKey: ["itinerary_day", "upsert"],
        mutationFn: (payload: ItineraryVM) => itineraryRepo.upsert(payload),
        onSuccess: (data, variables) => {
            invalidateItineraryData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const remove = useMutation({
        mutationKey: ["itinerary_day", "remove"],
        mutationFn: (id: string) => itineraryRepo.delete(id),
        onSuccess: (_, id) => {
            invalidateItineraryData(tripId, id);
        },
    });

    const sync = useMutation({
        mutationKey: ["itinerary_day", "sync"],
        mutationFn: (trip: TripRow) => syncTripItineraryDays(trip),
        onSettled: (_, __, trip) => {
            invalidateItineraryData(trip.id);
            qc.invalidateQueries({ queryKey: ["itinerary_day"] });
        },
    });

    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending || sync.isPending;

    return { insert, update, upsert, remove, sync, anyPending };
};

export default useItineraryMutations;
