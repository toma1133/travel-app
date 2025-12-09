import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import type { PlaceVM } from "../../models/types/PlacesTypes";

const usePlaceMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationFn: (payload: PlaceVM) => placeRepo.insertPlace(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["places"] });
        },
    });
    const upsert = useMutation({
        mutationFn: (payload: PlaceVM) => placeRepo.upsertPlace(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["place", data.id] });
            qc.invalidateQueries({ queryKey: ["places"] });
        },
    });
    const remove = useMutation({
        mutationFn: (id: string) => placeRepo.deletePlace(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["place", id] });
            qc.invalidateQueries({ queryKey: ["places"] });
        },
    });

    return { insert, upsert, remove };
};

export default usePlaceMutations;
