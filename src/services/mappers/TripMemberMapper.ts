import type { TripMemberRow, TripMemberVM } from "../../models/types/TripMemberTypes";

export const toTripMemberVM = (row: TripMemberRow): TripMemberVM => {
    return {
        ...row,
        profiles: {
            username: (row as any).profiles.username,
            email: (row as any).profiles.email,
        }
    };
};

export const toTripMembersVM = (rows: TripMemberRow[]): TripMemberVM[] => {
    return rows.map(toTripMemberVM);
};
