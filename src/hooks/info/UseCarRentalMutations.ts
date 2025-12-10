import { useMutation, useQueryClient } from "@tanstack/react-query";
import { carRentalRepo } from "../../services/repositories/CarRentalRepo";
import { CarRentalRowInsert, CarRentalRowUpdate } from "../../models/types/CarRentalTypes";

const useCarRentalMutations = () => {
    const qc = useQueryClient();
    const insert = useMutation({
        mutationKey: ["car_rental", "insert"],
        mutationFn: (payload: CarRentalRowInsert) => carRentalRepo.insert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["car_rental", data?.id] });
            qc.invalidateQueries({ queryKey: ["car_rentals"] });
        },
    });
    const update = useMutation({
        mutationKey: ["car_rental", "update"],
        mutationFn: (payload: CarRentalRowUpdate) => carRentalRepo.update(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["car_rental", data?.id] });
            qc.invalidateQueries({ queryKey: ["car_rentals"] });
        },
    });
    const upsert = useMutation({
        mutationKey: ["car_rental", "upsert"],
        mutationFn: (payload: CarRentalRowInsert) => carRentalRepo.upsert(payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["car_rental", data?.id] });
            qc.invalidateQueries({ queryKey: ["car_rentals"] });
        },
    });
    const remove = useMutation({
        mutationKey: ["car_rental", "remove"],
        mutationFn: (id: string) => carRentalRepo.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["car_rental", id] });
            qc.invalidateQueries({ queryKey: ["car_rentals"] });
        },
    });
    const anyPending =
        insert.isPending || update.isPending || upsert.isPending || remove.isPending;

    return { insert, update, upsert, remove, anyPending };
};

export default useCarRentalMutations;
