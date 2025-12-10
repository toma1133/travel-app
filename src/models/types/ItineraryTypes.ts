import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type ItineraryRow = Tables<"itinerary_days">;
export type ItineraryRowInsert = TablesInsert<"itinerary_days">;
export type ItineraryRowUpdate = TablesUpdate<"itinerary_days">;

export type ItineraryActivitiy = {
    time: string;
    title: string;
    desc: string;
    type: string;
    linkId: string;
    activityIndex: number;
};

export type ItineraryVM = Omit<ItineraryRow, "activities"> & {
    activities: ItineraryActivitiy[] | null;
};
