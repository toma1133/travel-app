import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripRepo } from "../../services/repositories/TripRepo";
import type { TripVM } from "../../models/types/TripTypes";

import { syncTripItineraryDays } from "../../services/ItinerarySyncService";
import { planItinerarySync } from "../../utils/ItinerarySyncUtil";
import { QUERY_KEYS } from "../../constants/QueryKeys";

const useTripMutations = () => {
    const qc = useQueryClient();
    const [syncWarning, setSyncWarning] = useState("");
    const syncSavedTrip = async (trip: TripVM | Awaited<ReturnType<typeof tripRepo.insert>>) => {
        if (!trip) return;
        try {
            await syncTripItineraryDays(trip);
        } catch (error) {
            console.error("Itinerary synchronization failed", error);
            setSyncWarning("旅程已儲存，但每日行程同步失敗。請至行程表按「同步旅程天數」重試。");
        }
    };
    const insert = useMutation({
        mutationFn: async (payload: TripVM) => {
            setSyncWarning("");
            planItinerarySync(payload, []);
            const trip = await tripRepo.insert(payload);
            await syncSavedTrip(trip);
            return trip;
        },
        onSettled: (_, __, payload) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(payload.id) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.trips.all });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.itineraries.list(payload.id) });
            qc.invalidateQueries({ queryKey: ["itinerary_day"] });
        },
    });
    const update = useMutation({
        mutationFn: async (payload: TripVM) => {
            setSyncWarning("");
            planItinerarySync(payload, []);
            const trip = await tripRepo.update(payload);
            await syncSavedTrip(trip);
            return trip;
        },
        onSettled: (_, __, payload) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(payload.id) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.trips.all });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.itineraries.list(payload.id) });
            qc.invalidateQueries({ queryKey: ["itinerary_day"] });
        },
    });
    const upsert = useMutation({
        mutationFn: async (payload: TripVM) => {
            setSyncWarning("");
            planItinerarySync(payload, []);
            const trip = await tripRepo.upsert(payload);
            await syncSavedTrip(trip);
            return trip;
        },
        onSettled: (_, __, payload) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(payload.id) });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.trips.all });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.itineraries.list(payload.id) });
            qc.invalidateQueries({ queryKey: ["itinerary_day"] });
        },
    });
    const remove = useMutation({
        mutationFn: (id: string) => tripRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["trip", id] });
            qc.invalidateQueries({ queryKey: ["trips"] });
        },
    });
    const anyPending =
        insert.isPending ||
        update.isPending ||
        upsert.isPending ||
        remove.isPending;

    return { insert, update, upsert, remove, anyPending, syncWarning };
};

export default useTripMutations;
