import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flightRepo } from "../../services/repositories/FlightRepo";
import { FlightRowInsert, FlightRowUpdate } from "../../models/types/FlightTypes";

const useFlightMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["flight", "insert"],
        mutationFn: (payload: FlightRowInsert) => flightRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["flight", data?.id] });
            qc.invalidateQueries({ queryKey: ["flights"] });
        },
    });
    const update = useMutation({
        mutationKey: ["flight", "update"],
        mutationFn: (payload: FlightRowUpdate) => flightRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["flight", data?.id] });
            qc.invalidateQueries({ queryKey: ["flights"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["flight", "upsert"],
        mutationFn: (payload: FlightRowInsert) => flightRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["flight", data?.id] });
            qc.invalidateQueries({ queryKey: ["flights"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["flight", "remove"],
        mutationFn: (id: string) => flightRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["flight", id] });
            qc.invalidateQueries({ queryKey: ["flights"] });
        },
    });
    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default useFlightMutations;
