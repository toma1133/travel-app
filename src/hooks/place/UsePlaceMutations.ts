import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type { PlaceVM } from "../../models/types/PlaceTypes";

export const usePlaceMutations = (tripId?: string) => {
    const qc = useQueryClient();

    const invalidatePlaceData = (targetTripId?: string, placeId?: string) => {
        if (placeId) {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.places.detail(placeId) });
        }
        if (targetTripId) {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.places.list(targetTripId) });
        }
        qc.invalidateQueries({ queryKey: QUERY_KEYS.places.all });
    };

    const insert = useMutation({
        mutationKey: ["place", "insert"],
        mutationFn: (payload: PlaceVM) => placeRepo.insert(payload),
        onSuccess: (data, variables) => {
            invalidatePlaceData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const update = useMutation({
        mutationKey: ["place", "update"],
        mutationFn: (payload: PlaceVM) => placeRepo.update(payload),
        onSuccess: (data, variables) => {
            invalidatePlaceData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const upsert = useMutation({
        mutationKey: ["place", "upsert"],
        mutationFn: (payload: PlaceVM) => placeRepo.upsert(payload),
        onSuccess: (data, variables) => {
            invalidatePlaceData(variables.trip_id ?? tripId, data?.id);
        },
    });

    const remove = useMutation({
        mutationKey: ["place", "remove"],
        mutationFn: (id: string) => placeRepo.delete(id),
        onSuccess: (_, id) => {
            invalidatePlaceData(tripId, id);
        },
    });

    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default usePlaceMutations;
