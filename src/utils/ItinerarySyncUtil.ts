import moment from "moment";
import type { TripRow } from "../models/types/TripTypes";
import type { ItineraryRow, ItineraryRowInsert } from "../models/types/ItineraryTypes";

export function planItinerarySync(trip: TripRow, existing: ItineraryRow[]) {
    const start = moment(trip.start_date, "YYYY-MM-DD", true);
    const end = moment(trip.end_date, "YYYY-MM-DD", true);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        throw new Error("請確認旅程開始與結束日期，結束日期不可早於開始日期。");
    }
    const totalDays = end.diff(start, "days") + 1;
    const inRange = existing.filter(day => day.date >= start.format("YYYY-MM-DD") && day.date <= end.format("YYYY-MM-DD"));
    if (new Set(inRange.map(day => day.date)).size !== inRange.length) {
        throw new Error("同一日期存在多筆日程，請先合併或移除重複日程後再同步。");
    }
    const deletes = existing.filter(day => day.date < start.format("YYYY-MM-DD") || day.date > end.format("YYYY-MM-DD")).map(day => day.id);
    const updates = inRange.flatMap(day => {
        const date = moment(day.date, "YYYY-MM-DD", true);
        if (!date.isValid()) return [];
        const dayNumber = date.diff(start, "days") + 1;
        return day.day_number === dayNumber ? [] : [{ id: day.id, day_number: dayNumber }];
    });
    const existingDates = new Set(inRange.map(day => day.date));
    const inserts: ItineraryRowInsert[] = [];
    for (let index = 0; index < totalDays; index++) {
        const date = start.clone().add(index, "days");
        if (existingDates.has(date.format("YYYY-MM-DD"))) continue;
        inserts.push({ trip_id: trip.id, user_id: trip.user_id, day_number: index + 1, date: date.format("YYYY-MM-DD"), weekday: date.locale("en").format("ddd"), title: "", activities: [] });
    }
    return { updates, inserts, deletes, totalDays };
}

/** Move free targets first; break numbering cycles with one unused positive number. */
export function planSafeDayRenumbering(existing: Pick<ItineraryRow, "id" | "day_number">[], updates: { id: string; day_number: number }[]) {
    const current = new Map(existing.map(day => [day.id, day.day_number]));
    const occupied = new Map(existing.map(day => [day.day_number, day.id]));
    const pending = [...updates];
    const operations: { id: string; day_number: number }[] = [];
    const temporaryNumber = Math.max(0, ...existing.map(day => day.day_number), ...updates.map(day => day.day_number)) + 1;
    const move = (operation: { id: string; day_number: number }) => {
        const old = current.get(operation.id);
        if (old !== undefined && occupied.get(old) === operation.id) occupied.delete(old);
        occupied.set(operation.day_number, operation.id);
        current.set(operation.id, operation.day_number);
        operations.push(operation);
    };
    while (pending.length) {
        const index = pending.findIndex(update => !occupied.has(update.day_number) || occupied.get(update.day_number) === update.id);
        if (index >= 0) {
            move(pending.splice(index, 1)[0]);
        } else {
            move({ id: pending[0].id, day_number: temporaryNumber });
        }
    }
    return operations;
}

export function getItinerarySyncErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        const code = "code" in error && typeof error.code === "string" ? `（${error.code}）` : "";
        return `同步失敗：${error.message}${code}`;
    }
    return "同步失敗，請稍後重試。";
}
