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
    duration?: string;        // 景點/活動停留時間 (例如 "1.5小時")
    transitMode?: string;     // 移動交通方式 (例如 "walk", "car", "train", "flight", "bus")
    transitDuration?: string; // 移動路程時間 (例如 "30分鐘")
};

export type ItineraryVM = Omit<ItineraryRow, "activities"> & {
    activities: ItineraryActivitiy[] | null;
};
