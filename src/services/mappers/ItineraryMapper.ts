import parseJsonOrString from "../../utils/ParseJsonOrString";
import { getBrowserTimeZone, localToUtc, utcToLocal } from "../../utils/DateTimeUtil";
import { compareItineraryActivities } from "../../utils/ItineraryTimeUtil";
import type { ItineraryRow, ItineraryRowInsert, ItineraryRowUpdate, ItineraryActivitiy, ItineraryVM } from "../../models/types/ItineraryTypes";

const usesUtc = (activity: ItineraryActivitiy, day: { is_utc?: boolean }) => activity.is_utc ?? day.is_utc ?? false;

function projectActivity(activity: ItineraryActivitiy, zone: string): ItineraryActivitiy {
    const local = activity.time_utc ? utcToLocal(activity.time_utc, zone) : null;
    return { ...activity, time: local?.time ?? activity.time, time_date: local?.date ?? activity.time_date,
        transitDetails: activity.transitDetails ? { ...activity.transitDetails,
            scheduleList: activity.transitDetails.scheduleList?.map(schedule => {
                const departure = schedule.departureUtc ? utcToLocal(schedule.departureUtc, zone) : null;
                const arrival = schedule.arrivalUtc ? utcToLocal(schedule.arrivalUtc, zone) : null;
                return { ...schedule, departureTime: departure?.time ?? schedule.departureTime,
                    arrivalTime: arrival?.time ?? schedule.arrivalTime,
                    departureDate: departure?.date ?? schedule.departureDate,
                    arrivalDate: arrival?.date ?? schedule.arrivalDate };
            }),
        } : undefined };
}

export const toItineraryVM = (row: ItineraryRow, zone = getBrowserTimeZone()): ItineraryVM => {
    const activities = parseJsonOrString<ItineraryActivitiy[]>(row.activities);
    return { ...row, original_date: row.date, display_time_zone: zone,
        activities: activities?.map(activity => usesUtc(activity, row)
            ? { ...projectActivity(activity, zone), time_zone: activity.time_zone || row.time_zone || zone, display_time_zone: zone }
            : activity).sort((a, b) => compareItineraryActivities(a, b, row)) ?? activities };
};

export const toItinerarysVM = (rows: ItineraryRow[], zone = getBrowserTimeZone()): ItineraryVM[] => rows.map(row => toItineraryVM(row, zone));

/** Edit in the activity's own saved zone, even after the list display zone changes. */
export function toItineraryActivityForm(activity: ItineraryActivitiy, day: ItineraryVM): ItineraryActivitiy {
    const time_zone = activity.time_zone || day.time_zone || getBrowserTimeZone();
    const form = usesUtc(activity, day) ? projectActivity(activity, time_zone) : { ...activity };
    delete form.display_time_zone;
    return { ...form, is_utc: usesUtc(activity, day), time_zone };
}

const utcFields = (vm: Partial<ItineraryVM>) => {
    const zone = vm.time_zone || getBrowserTimeZone();
    const dateChanged = !!vm.original_date && vm.date !== undefined && vm.original_date !== vm.date;
    const activities = vm.activities?.map(activity => {
        const isUtc = usesUtc(activity, vm);
        // Preserve legacy JSON exactly when no UTC metadata exists.
        if (!isUtc && !activity.time_utc && !activity.display_time_zone) return activity;
        const sourceZone = activity.time_zone || zone;
        const inputZone = activity.display_time_zone || sourceZone;
        const date = dateChanged ? vm.date : activity.time_date || vm.date;
        const time_utc = isUtc && activity.time ? localToUtc(date || "", activity.time, inputZone, dateChanged ? null : activity.time_utc) : undefined;
        const local = time_utc ? utcToLocal(time_utc, sourceZone) : null;
        const result = { ...activity, time_zone: sourceZone,
            time: local?.time ?? activity.time, time_date: isUtc ? local?.date ?? date : undefined, time_utc,
            transitDetails: activity.transitDetails ? { ...activity.transitDetails,
                scheduleList: activity.transitDetails.scheduleList?.map(schedule => {
                    const departureDate = dateChanged ? vm.date : schedule.departureDate || date;
                    const arrivalDate = dateChanged ? vm.date : schedule.arrivalDate || departureDate;
                    const departureUtc = isUtc && schedule.departureTime ? localToUtc(departureDate || "", schedule.departureTime, inputZone, dateChanged ? null : schedule.departureUtc) : undefined;
                    const arrivalUtc = isUtc && schedule.arrivalTime ? localToUtc(arrivalDate || "", schedule.arrivalTime, inputZone, dateChanged ? null : schedule.arrivalUtc) : undefined;
                    const departure = departureUtc ? utcToLocal(departureUtc, sourceZone) : null;
                    const arrival = arrivalUtc ? utcToLocal(arrivalUtc, sourceZone) : null;
                    return { ...schedule, departureUtc, arrivalUtc,
                        departureTime: departure?.time ?? schedule.departureTime, departureDate: departure?.date ?? schedule.departureDate,
                        arrivalTime: arrival?.time ?? schedule.arrivalTime, arrivalDate: arrival?.date ?? schedule.arrivalDate };
                }),
            } : undefined };
        delete result.display_time_zone;
        return result;
    }) ?? vm.activities;
    if (vm.is_utc === undefined) return { activities };
    return { is_utc: vm.is_utc, time_zone: zone,
        date_utc: vm.is_utc ? (!dateChanged && vm.date_utc || localToUtc(vm.date || "", "00:00", zone)) : null,
        activities };
};

export const toItineraryInsert = (vm: ItineraryVM): ItineraryRowInsert => ({
    day_number: vm.day_number, date: vm.date, title: vm.title, weekday: vm.weekday,
    ...utcFields(vm), trip_id: vm.trip_id, user_id: vm.user_id,
});

export const toItineraryUpdate = (vm: Partial<ItineraryVM>): ItineraryRowUpdate => ({
    day_number: vm.day_number, date: vm.date, title: vm.title, weekday: vm.weekday, ...utcFields(vm),
});
