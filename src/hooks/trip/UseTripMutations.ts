import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripRepo } from "../../services/repositories/TripRepo";
import type { TripVM } from "../../models/types/TripsTypes";

const useTripMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationFn: (payload: TripVM) => tripRepo.insertTrip(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trips"] });
            qc.invalidateQueries({ queryKey: ["bookshelf"] });
        },
    });
    const upsert = useMutation({
        mutationFn: (payload: TripVM) => tripRepo.upsertTrip(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["trip", data.id] });
            qc.invalidateQueries({ queryKey: ["bookshelf"] });
        },
    });
    const remove = useMutation({
        mutationFn: (id: string) => tripRepo.deleteTrip(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["trip", id] });
            qc.invalidateQueries({ queryKey: ["bookshelf"] });
        },
    });

    return { insert, upsert, remove };
};

export default useTripMutations;
