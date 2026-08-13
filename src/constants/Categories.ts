import {
    Camera,
    Utensils,
    ShoppingBag,
    Bus,
    Bed,
    Coffee,
    Ticket,
    Trees,
    Landmark,
    MoreHorizontal,
    Plane,
    Train,
    Car,
    Footprints,
    LucideIcon,
} from "lucide-react";
import type { PlaceCategory } from "../models/types/PlaceTypes";

export type CategoryDefinition = {
    id: string;
    label: string;
    engName: string;
    icon: LucideIcon;
};

// 景點誌與行程表共用同步之完整類型清單 (含 Font Icon)
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    { id: "sight", label: "觀光", engName: "Sightseeing", icon: Camera },
    { id: "food", label: "美食", engName: "Gourmet", icon: Utensils },
    { id: "shopping", label: "購物", engName: "Shopping", icon: ShoppingBag },
    { id: "transport", label: "交通/移動", engName: "Transport", icon: Bus },
    { id: "hotel", label: "住宿", engName: "Hotel", icon: Bed },
    { id: "cafe", label: "咖啡/甜點", engName: "Cafe & Dessert", icon: Coffee },
    { id: "activity", label: "體驗/活動", engName: "Activity", icon: Ticket },
    { id: "nature", label: "戶外/自然", engName: "Nature", icon: Trees },
    { id: "culture", label: "文化/歷史", engName: "Culture & History", icon: Landmark },
    { id: "other", label: "其他", engName: "Other", icon: MoreHorizontal },
];

export const TRANSIT_MODES: { id: string; label: string; icon: LucideIcon }[] = [
    { id: "none", label: "無 (定點活動)", icon: MoreHorizontal },
    { id: "flight", label: "搭乘飛機", icon: Plane },
    { id: "train", label: "電車/新幹線/火車", icon: Train },
    { id: "bus", label: "公車/巴士", icon: Bus },
    { id: "taxi", label: "計程車/包車/接送", icon: Car },
    { id: "car", label: "自駕/租車", icon: Car },
    { id: "walk", label: "步行", icon: Footprints },
];

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
    sight: "#059669",     // 翡翠綠 (Emerald Green)
    food: "#d97706",      // 濃郁琥珀橘 (Amber)
    shopping: "#db2777",  // 亮桃粉 (Rose)
    transport: "#dc2626", // 經典紅 (Red)
    hotel: "#2563eb",     // 皇家藍 (Royal Blue)
    stay: "#2563eb",      // 皇家藍 (Stay)
    cafe: "#b45309",      // 暖咖啡 (Coffee)
    activity: "#7c3aed",  // 紫羅蘭 (Violet)
    nature: "#16a34a",    // 森林綠 (Forest)
    culture: "#4f46e5",   // 靛藍 (Indigo)
    other: "#6b7280",     // 質感灰 (Slate)
};

export const PLACE_CATEGORIES: PlaceCategory[] = [
    { id: "all", label: "全部" },
    ...CATEGORY_DEFINITIONS.map(({ id, label }) => ({ id, label })),
];

export const ITINERARY_CATEGORIES: PlaceCategory[] = CATEGORY_DEFINITIONS.map(
    ({ id, label }) => ({ id, label })
);

export const getCategoryIcon = (typeId: string | null | undefined): LucideIcon => {
    const item = CATEGORY_DEFINITIONS.find((c) => c.id === typeId);
    return item ? item.icon : MoreHorizontal;
};

export const getTransitIcon = (modeId: string | null | undefined): LucideIcon => {
    const item = TRANSIT_MODES.find((m) => m.id === modeId);
    return item ? item.icon : Bus;
};

export const getCategoryTypeName = (typeId: string | null | undefined): string => {
    const item = CATEGORY_DEFINITIONS.find((c) => c.id === typeId);
    return item ? item.engName : "Other";
};

export const getCategoryLabel = (typeId: string | null | undefined): string => {
    const item = CATEGORY_DEFINITIONS.find((c) => c.id === typeId);
    return item ? item.label : "其他";
};
