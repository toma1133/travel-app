import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripMemberRepo } from "../../services/repositories/TripMemberRepo";
import {
    TripMemberRowInsert,
    TripMemberRowUpdate,
} from "../../models/types/TripMemberTypes";

const useTripMemberMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["trip_members", "insert"],
        mutationFn: (payload: TripMemberRowInsert) =>
            tripMemberRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trip_member", data?.id] });
            qc.invalidateQueries({ queryKey: ["trip_members"] });
        },
    });
    const update = useMutation({
        mutationKey: ["trip_members", "update"],
        mutationFn: (payload: TripMemberRowUpdate) =>
            tripMemberRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trip_member", data?.id] });
            qc.invalidateQueries({ queryKey: ["trip_members"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["trip_members", "upsert"],
        mutationFn: (payload: TripMemberRowInsert) =>
            tripMemberRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trip_member", data?.id] });
            qc.invalidateQueries({ queryKey: ["trip_members"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["trip_members", "remove"],
        mutationFn: (id: string) => tripMemberRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["trip_member", id] });
            qc.invalidateQueries({ queryKey: ["trip_members"] });
        },
    });
    const anyPending =
        insert.isPending ||
        update.isPending ||
        upsert.isPending ||
        remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default useTripMemberMutations;
