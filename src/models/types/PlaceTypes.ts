import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type PlaceRow = Tables<"places">;
export type PlaceRowInsert = TablesInsert<"places">;
export type PlaceRowUpdate = TablesUpdate<"places">;

export type PlaceCategory = {
    id: string;
    label: string;
}

export type RecommendedItem = {
    name: string;
    native_name?: string | null;
    romaji?: string | null;
    price?: string | null;
    category?: string | null;
    note?: string | null;
};

export type PlaceInfo = {
    open?: string | null;
    closed_days?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    native_name?: string | null;
    price?: string | null;
    loc?: string | null;
    phone?: string | null;
    rating?: number | string | null;
    rating_count?: number | string | null;
    rating_source?: string | null;
    stay_duration?: string | null;
    booking_url?: string | null;
    booking_status?: "required" | "recommended" | "none" | "walk_in" | string | null;
    transit_access?: string | null;
    payment_methods?: string[] | string | null;
    amenities?: string[] | string | null;
    website_url?: string | null;
    recommended_items?: RecommendedItem[] | null;
};

export type PlaceVM = Omit<PlaceRow, "type" | "tags" | "info"> & {
    info: PlaceInfo | null;
    type: string | null;
    tags: string | null;
};

