import type { PlaceCategory } from "../models/types/PlaceTypes";

// 景點誌與行程表共用同步之完整類型清單
export const CATEGORY_DEFINITIONS: { id: string; label: string; engName: string }[] = [
    { id: "sight", label: "觀光", engName: "Sightseeing" },
    { id: "food", label: "美食", engName: "Gourmet" },
    { id: "shopping", label: "購物", engName: "Shopping" },
    { id: "transport", label: "交通/移動", engName: "Transport" },
    { id: "hotel", label: "住宿", engName: "Hotel" },
    { id: "cafe", label: "咖啡/甜點", engName: "Cafe & Dessert" },
    { id: "activity", label: "體驗/活動", engName: "Activity" },
    { id: "nature", label: "戶外/自然", engName: "Nature" },
    { id: "culture", label: "文化/歷史", engName: "Culture & History" },
    { id: "other", label: "其他", engName: "Other" },
];

export const PLACE_CATEGORIES: PlaceCategory[] = [
    { id: "all", label: "全部" },
    ...CATEGORY_DEFINITIONS.map(({ id, label }) => ({ id, label })),
];

export const ITINERARY_CATEGORIES: PlaceCategory[] = CATEGORY_DEFINITIONS.map(
    ({ id, label }) => ({ id, label })
);

export const getCategoryTypeName = (typeId: string | null | undefined): string => {
    const item = CATEGORY_DEFINITIONS.find((c) => c.id === typeId);
    return item ? item.engName : "Other";
};

export const getCategoryLabel = (typeId: string | null | undefined): string => {
    const item = CATEGORY_DEFINITIONS.find((c) => c.id === typeId);
    return item ? item.label : "其他";
};
