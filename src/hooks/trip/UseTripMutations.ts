import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripRepo } from "../../services/repositories/TripRepo";
import type { TripVM } from "../../models/types/TripTypes";

const useTripMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationFn: (payload: TripVM) => tripRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trip", data?.id] });
            qc.invalidateQueries({ queryKey: ["trips"] });
        },
    });
    const update = useMutation({
        mutationFn: (payload: TripVM) => tripRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trip", data?.id] });
            qc.invalidateQueries({ queryKey: ["trips"] });
        },
    });
    const upsert = useMutation({
        mutationFn: (payload: TripVM) => tripRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trip", data?.id] });
            qc.invalidateQueries({ queryKey: ["trips"] });
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

    return { insert, update, upsert, remove, anyPending };
};

export default useTripMutations;
