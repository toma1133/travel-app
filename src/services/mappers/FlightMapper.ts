import type { FlightRow, FlightRowInsert, FlightRowUpdate } from "../../models/types/FlightTypes";
import { getBrowserTimeZone, localToUtc, utcToLocal } from "../../utils/DateTimeUtil";

export function toFlightVM(row: FlightRow, zone = getBrowserTimeZone()): FlightRow {
    if (!row.is_utc) return row;
    const departure = row.departure_at_utc ? utcToLocal(row.departure_at_utc, zone) : null;
    const arrival = row.arrival_at_utc ? utcToLocal(row.arrival_at_utc, zone) : null;
    return { ...row, flight_date: departure?.date ?? row.flight_date, departure_time: departure?.time ?? row.departure_time,
        arrival_date: arrival?.date ?? row.arrival_date, arrival_time: arrival?.time ?? row.arrival_time,
        display_time_zone: zone };
}

/** Restore each endpoint's saved zone before populating editable local fields. */
export function toFlightForm(row: FlightRow): FlightRow {
    const form = { ...row };
    delete form.display_time_zone;
    if (!row.is_utc) return form;
    const departureZone = row.departure_time_zone || getBrowserTimeZone();
    const arrivalZone = row.arrival_time_zone || getBrowserTimeZone();
    const departure = row.departure_at_utc ? utcToLocal(row.departure_at_utc, departureZone) : null;
    const arrival = row.arrival_at_utc ? utcToLocal(row.arrival_at_utc, arrivalZone) : null;
    return { ...form, flight_date: departure?.date ?? row.flight_date, departure_time: departure?.time ?? row.departure_time,
        arrival_date: arrival?.date ?? row.arrival_date, arrival_time: arrival?.time ?? row.arrival_time,
        departure_time_zone: departureZone, arrival_time_zone: arrivalZone };
}

export function toFlightStorage<T extends FlightRowInsert | FlightRowUpdate>(payload: T): T {
    const presentation = payload as T & { display_time_zone?: string };
    if (presentation.display_time_zone) payload = toFlightForm(presentation as FlightRow) as T;
    const clean = { ...payload } as T & { display_time_zone?: string };
    delete clean.display_time_zone;
    payload = clean;
    if (!payload.is_utc) {
        return payload.is_utc === false ? { ...payload, departure_at_utc: null, arrival_at_utc: null } : payload;
    }
    const departureZone = payload.departure_time_zone || getBrowserTimeZone();
    const arrivalZone = payload.arrival_time_zone || getBrowserTimeZone();
    const departure = localToUtc(payload.flight_date || "", payload.departure_time || "", departureZone, payload.departure_at_utc);
    const arrival = localToUtc(payload.arrival_date || "", payload.arrival_time || "", arrivalZone, payload.arrival_at_utc);
    if (Date.parse(arrival) <= Date.parse(departure)) throw new Error("抵達時間必須晚於起飛時間，請確認日期與時區。");
    return { ...payload, departure_time_zone: departureZone, arrival_time_zone: arrivalZone,
        departure_at_utc: departure, arrival_at_utc: arrival };
}
