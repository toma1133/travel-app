import type { Tables, TablesInsert, TablesUpdate } from "./DatabaseTypes";

export type TripRow = Tables<"trips">;
export type TripRowInsert = TablesInsert<"trips">;
export type TripRowUpdate = TablesUpdate<"trips">;

export type TripSettingConf = {
    exchangeRate: number;
    homeCurrency: string;
    localCurrency: string;
}

export type TripThemeConf = {
    [key: string]: string;
}

export type TripVM = Omit<TripRow, "settings_config" | "theme_config"> & {
    settings_config: TripSettingConf | null;
    theme_config: TripThemeConf | null;
};
