import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type ItineraryRow = Tables<"itinerary_days">;
export type ItineraryRowInsert = TablesInsert<"itinerary_days">;
export type ItineraryRowUpdate = TablesUpdate<"itinerary_days">;

export type TransitScheduleItem = {
    name: string; // 車次 / 班次名稱 (例如 "Haruka 16号")
    departureTime?: string; // 出發時間 (例如 "10:44")
    arrivalTime?: string; // 到達時間 (例如 "11:31")
    platform?: string; // 月台 (例如 "4番月台")
};

export type TransitDetails = {
    ticketType?: string; // Pass / 單程票 / IC卡 / 自訂
    passName?: string; // 例如 "關西廣域周遊券 5 Days"
    fare?: string; // 例如 "JPY 420" 或 "JPY 1,800"
    startLocation?: string; // 例如 "林口家中出發"
    isReservationRequired?: boolean; // 是否需預約 / 已預約接送
    carRentalCompany?: string; // 租車公司名稱 (例如 "Toyota Rent a Car")
    carRentalBranch?: string; // 租車分店 (例如 "那霸機場店")
    companyAndLine?: string; // 例如 "JR神戶京都琵琶湖線"
    destination?: string; // 例如 "姬路" 或 "關西機場"
    platform?: string; // 例如 "5番ホーム" 或 "4番月台"
    schedules?: string; // (防呆保留) 舊多行文字備註
    scheduleList?: TransitScheduleItem[]; // 🆕 動態班次列表
    flightNumber?: string; // 航班編號 (例如 "JX820")
    gate?: string; // 登機門/航廈 (例如 "T1 B5登機門")
};

export type ItineraryActivitiy = {
    time: string;
    title: string;
    desc: string;
    type: string;
    linkId: string;
    activityIndex: number;
    duration?: string; // 景點/活動停留時間 (例如 "1.5小時")
    transitMode?: string; // 移動交通方式 (例如 "walk", "car", "train", "flight", "bus")
    transitDuration?: string; // 移動路程時間 (例如 "30分鐘")
};

export type ItineraryVM = Omit<ItineraryRow, "activities"> & {
    activities: ItineraryActivitiy[] | null;
};
