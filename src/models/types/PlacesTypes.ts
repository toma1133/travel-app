import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type PlaceRow = Tables<"places">;
export type PlaceRowInsert = TablesInsert<"places">;
export type PlaceRowUpdate = TablesUpdate<"places">;

export type PlaceInfo = {
    open?: string | null;
    price?: string | null;
    loc?: string | null;
};

export type PlaceVM = Omit<PlaceRow, "type" | "tags" | "info"> & {
    info: PlaceInfo | null;
    type: string | null;
    tags: string | null;
};
