import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import type { PlaceVM } from "../../models/types/PlacesTypes";

const usePlaceMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["place", "insert"],
        mutationFn: (payload: PlaceVM) => placeRepo.insertPlace(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["places"] });
        },
    });
    const update = useMutation({
        mutationKey: ["place", "update"],
        mutationFn: (payload: PlaceVM) => placeRepo.updatePlace(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["place", data.id] });
            qc.invalidateQueries({ queryKey: ["places"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["place", "upsert"],
        mutationFn: (payload: PlaceVM) => placeRepo.upsertPlace(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["place", data.id] });
            qc.invalidateQueries({ queryKey: ["places"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["place", "remove"],
        mutationFn: (id: string) => placeRepo.deletePlace(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["place", id] });
            qc.invalidateQueries({ queryKey: ["places"] });
        },
    });
    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default usePlaceMutations;
