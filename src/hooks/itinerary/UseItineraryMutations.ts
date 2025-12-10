import { useMutation, useQueryClient } from "@tanstack/react-query";
import { itineraryRepo } from "../../services/repositories/ItineraryRepo";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";

const useItineraryMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["itinerary_day", "insert"],
        mutationFn: (payload: ItineraryVM) => itineraryRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["itinerary_day", data?.id] });
            qc.invalidateQueries({ queryKey: ["itinerary_days"] });
        },
    });
    const update = useMutation({
        mutationKey: ["itinerary_day", "update"],
        mutationFn: (payload: ItineraryVM) => itineraryRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["itinerary_day", data?.id] });
            qc.invalidateQueries({ queryKey: ["itinerary_days"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["itinerary_day", "upsert"],
        mutationFn: (payload: ItineraryVM) => itineraryRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["itinerary_day", data?.id] });
            qc.invalidateQueries({ queryKey: ["itinerary_days"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["itinerary_day", "remove"],
        mutationFn: (id: string) => itineraryRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["itinerary_day", id] });
            qc.invalidateQueries({ queryKey: ["itinerary_days"] });
        },
    });
    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default useItineraryMutations;
