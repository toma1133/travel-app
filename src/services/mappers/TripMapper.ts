import parseJsonOrString from "../../utils/ParseJsonOrString";
import type { TripRow, TripRowInsert, TripRowUpdate, TripSettingConf, TripThemeConf, TripVM } from "../../models/types/TripsTypes";

export function toTripVM(row: TripRow): TripVM {
    return {
        ...row,
        settings_config: parseJsonOrString<TripSettingConf>(row.settings_config),
        theme_config: parseJsonOrString<TripThemeConf>(row.theme_config),
    };
}

export function toTripsVM(rows: TripRow[]): TripVM[] {
    return rows.map(toTripVM);
}

export function toTripInsert(vm: TripVM): TripRowInsert {
    return {
        cover_image: vm.cover_image,
        description: vm.title,
        end_date: vm.end_date,
        settings_config: vm.settings_config,
        start_date: vm.start_date,
        subtitle: vm.subtitle,
        theme_config: vm.theme_config,
        title: vm.title,
        user_id: vm.user_id,
    };
}

export function toTripUpdate(vm: Partial<TripVM>): TripRowUpdate {
    return {
        cover_image: vm.cover_image,
        description: vm.title,
        end_date: vm.end_date,
        settings_config: vm.settings_config,
        start_date: vm.start_date,
        subtitle: vm.subtitle,
        theme_config: vm.theme_config,
        title: vm.title,
    };
}
