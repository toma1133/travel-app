import parseJsonOrString from "../../utils/ParseJsonOrString";
import type {
    ItineraryRow,
    ItineraryRowInsert,
    ItineraryRowUpdate,
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";

export const toItineraryVM = (row: ItineraryRow): ItineraryVM => {
    return {
        ...row,
        activities: parseJsonOrString<ItineraryActivitiy[]>(
            row.activities,
        ),
    };
};

export const toItinerarysVM = (rows: ItineraryRow[]): ItineraryVM[] => {
    return rows.map(toItineraryVM);
};

export const toItineraryInsert = (vm: ItineraryVM): ItineraryRowInsert => {
    return {
        day_number: vm.day_number,
        date: vm.date,
        title: vm.title,
        weekday: vm.weekday,
        activities: vm.activities,
        trip_id: vm.trip_id,
        user_id: vm.user_id,
    };
};

export const toItineraryUpdate = (vm: Partial<ItineraryVM>): ItineraryRowUpdate => {
    return {
        day_number: vm.day_number,
        date: vm.date,
        title: vm.title,
        weekday: vm.weekday,
        activities: vm.activities,
    };
};
