import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accommodationRepo } from "../../services/repositories/AccommodationRepo";
import { AccommodationRowInsert, AccommodationRowUpdate } from "../../models/types/AccommodationTypes";

const useAccommodationMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["accommodation", "insert"],
        mutationFn: (payload: AccommodationRowInsert) => accommodationRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["accommodation", data?.id] });
            qc.invalidateQueries({ queryKey: ["accommodations"] });
        },
    });
    const update = useMutation({
        mutationKey: ["accommodation", "update"],
        mutationFn: (payload: AccommodationRowUpdate) => accommodationRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["accommodation", data?.id] });
            qc.invalidateQueries({ queryKey: ["accommodations"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["accommodation", "upsert"],
        mutationFn: (payload: AccommodationRowInsert) => accommodationRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["accommodation", data?.id] });
            qc.invalidateQueries({ queryKey: ["accommodations"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["accommodation", "remove"],
        mutationFn: (id: string) => accommodationRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["accommodation", id] });
            qc.invalidateQueries({ queryKey: ["accommodations"] });
        },
    });
    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default useAccommodationMutations;
