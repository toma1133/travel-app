import parseJsonOrString from "../../utils/ParseJsonOrString";
import type {
    PlaceRow,
    PlaceRowInsert,
    PlaceRowUpdate,
    PlaceInfo,
    PlaceVM,
} from "../../models/types/PlacesTypes";

export const toPlaceVM = (row: PlaceRow): PlaceVM => {
    return {
        ...row,
        tags: Array.isArray(row.tags) ? row.tags.join(", ") : "",
        info: parseJsonOrString<PlaceInfo>(row.info),
    };
};

export const toPlacesVM = (rows: PlaceRow[]): PlaceVM[] => {
    return rows.map(toPlaceVM);
};

export const toPlaceInsert = (vm: PlaceVM): PlaceRowInsert => {
    return {
        description: vm.description,
        eng_name: vm.eng_name,
        image_url: vm.image_url,
        info: vm.info,
        name: vm.name,
        tags:
            vm.tags !== null
                ? vm.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter((t) => t)
                : [],
        tips: vm.tips,
        trip_id: vm.trip_id,
        type: vm.type,
        user_id: vm.user_id,
    };
};

export const toPlaceUpdate = (vm: Partial<PlaceVM>): PlaceRowUpdate => {
    return {
        description: vm.description,
        eng_name: vm.eng_name,
        image_url: vm.image_url,
        info: vm.info,
        name: vm.name,
        tags:
            vm.tags !== null && vm.tags !== undefined
                ? vm.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter((t) => t)
                : [],
        tips: vm.tips,
        trip_id: vm.trip_id,
        type: vm.type,
    };
};
