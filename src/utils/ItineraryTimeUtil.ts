/**
 * ItineraryTimeUtil.ts
 * Utility functions for itinerary timeline schedule calculations,
 * duration parsing, transit intervals, and smart time flow rendering.
 */

import type { ItineraryActivitiy } from "../models/types/ItineraryTypes";
import { getBrowserTimeZone, localToUtc, utcToLocal } from "./DateTimeUtil";

/**
 * Parses free-form duration string into total minutes.
 * Supports:
 * - "1.5小時", "1.5hr", "1.5h", "1.5 hours" -> 90
 * - "1小時30分", "1小時30分鐘", "1h 30m" -> 90
 * - "45分鐘", "45分", "45m", "45min" -> 45
 * - "半小時" -> 30, "半天" -> 240, "整天" / "一天" -> 480
 * - "約 30 分鐘 (2.5 km)" / "30 mins (1.2 km)" -> 30
 * - "90" -> 90
 */
export function parseDurationToMinutes(durationStr?: string | null): number | null {
    if (!durationStr || typeof durationStr !== "string") return null;
    const str = durationStr.trim().toLowerCase();
    if (!str) return null;

    // Special Chinese keywords
    if (str.includes("半小時") || str.includes("半個小時")) return 30;
    if (str.includes("半天")) return 240;
    if (str.includes("整天") || str.includes("一天")) return 480;

    // Compound hours and minutes: e.g. "1小時30分", "1小時30分鐘", "1h 30m", "1hr 30min"
    const compoundMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:小時|時|h|hr|hrs|hours?)\s*(\d+)\s*(?:分鐘|分|m|min|mins?)/i);
    if (compoundMatch) {
        const hours = parseFloat(compoundMatch[1]);
        const mins = parseFloat(compoundMatch[2]);
        if (!isNaN(hours) && !isNaN(mins)) {
            return Math.round(hours * 60 + mins);
        }
    }

    // Decimal or single hours: e.g. "1.5小時", "2小時", "1.5h", "2 hrs"
    const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:小時|時|h|hr|hrs|hours?)/i);
    if (hoursMatch) {
        const hours = parseFloat(hoursMatch[1]);
        if (!isNaN(hours)) {
            return Math.round(hours * 60);
        }
    }

    // Single minutes: e.g. "45分鐘", "45分", "45m", "45min", "45 mins"
    const minsMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:分鐘|分|m|min|mins?)/i);
    if (minsMatch) {
        const mins = parseFloat(minsMatch[1]);
        if (!isNaN(mins)) {
            return Math.round(mins);
        }
    }

    // Pure number
    const pureNum = parseFloat(str);
    if (!isNaN(pureNum) && pureNum > 0) {
        return Math.round(pureNum);
    }

    return null;
}

/**
 * Formats minutes into user-friendly Chinese duration string.
 * E.g.:
 * - 90 -> "1.5 小時"
 * - 60 -> "1 小時"
 * - 45 -> "45 分鐘"
 * - 135 -> "2 小時 15 分"
 */
export function formatMinutesToDuration(minutes: number): string {
    if (minutes <= 0) return "0 分鐘";
    if (minutes < 60) return `${minutes} 分鐘`;

    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;

    if (remMins === 0) {
        return `${hours} 小時`;
    }
    if (remMins === 30) {
        return `${hours + 0.5} 小時`;
    }
    return `${hours} 小時 ${remMins} 分`;
}

/**
 * Converts "HH:mm" time string to minutes from 00:00.
 */
export function timeToMinutes(timeStr?: string | null): number {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const parts = timeStr.trim().split(":");
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return 0;
    return (h * 60 + m) % 1440;
}

/**
 * Converts minutes from 00:00 back to "HH:mm" 24-hour string.
 */
export function minutesToTime(totalMinutes: number): string {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Adds minutes to a "HH:mm" time string.
 * E.g. addMinutesToTime("09:00", 90) -> "10:30"
 */
export function addMinutesToTime(timeStr: string, minutes: number): string {
    const current = timeToMinutes(timeStr);
    return minutesToTime(current + minutes);
}

/**
 * Calculates minutes difference from startTime to endTime.
 * Handles next-day overflow if endTime is earlier than startTime.
 */
export function calculateTimeDiffMinutes(startTimeStr: string, endTimeStr: string): number {
    const start = timeToMinutes(startTimeStr);
    let end = timeToMinutes(endTimeStr);
    if (end < start) {
        end += 1440; // Crossed midnight
    }
    return end - start;
}

type TimelineContext = { date?: string; is_utc?: boolean; time_zone?: string | null; display_time_zone?: string };

/** UTC is authoritative; legacy clock values keep their browser-local interpretation. */
export function getActivityStartMs(activity: ItineraryActivitiy, day: TimelineContext = {}): number {
    const isUtc = activity.is_utc ?? day.is_utc ?? !!activity.time_utc;
    if (isUtc && activity.time_utc) {
        const instant = Date.parse(activity.time_utc);
        if (Number.isFinite(instant)) return instant;
    }
    const date = activity.time_date || day.date || "2000-01-01";
    if (isUtc) {
        try {
            return Date.parse(localToUtc(date, activity.time || "09:00", activity.display_time_zone || activity.time_zone || day.time_zone || getBrowserTimeZone()));
        } catch { return NaN; }
    }
    return Date.parse(`${date}T${activity.time || "09:00"}`);
}

export function compareItineraryActivities(a: ItineraryActivitiy, b: ItineraryActivitiy, day: TimelineContext = {}): number {
    const diff = getActivityStartMs(a, day) - getActivityStartMs(b, day);
    return Number.isFinite(diff) && diff !== 0 ? diff : (a.activityIndex || 0) - (b.activityIndex || 0);
}

export type ActivityScheduleMeta = {
    startAtMs: number;
    endAtMs: number;
    startDate: string;
    endDate: string;
    activity: ItineraryActivitiy;
    index: number;
    // Activity Time Interval
    startTime: string; // e.g. "09:00"
    stayMinutes: number | null; // e.g. 90
    endTime: string; // e.g. "10:30"
    hasStayDuration: boolean;
    durationFormatted: string; // e.g. "停留 1.5 小時"

    // Transit to Next Stop
    transit: {
        arrivalAtMs: number;
        departureDate: string;
        arrivalDate: string;
        hasTransit: boolean;
        mode: string; // e.g. "walk", "car", "train"
        transitMinutes: number | null; // e.g. 30
        departureTime: string; // e.g. "10:30"
        arrivalTime: string; // e.g. "11:00"
        durationFormatted: string; // e.g. "路程約 30 分鐘"
        rawDuration: string;
    };

    // Free Time Gap before next activity starts
    gapToNext: {
        hasGap: boolean; // true if gap >= 15 mins
        gapMinutes: number;
        gapStartTime: string;
        gapEndTime: string;
        formatted: string; // e.g. "自由活動 30 分鐘"
    } | null;
};

/** Shared by connectors and activity delay badges; includes the full calendar date. */
export function getTimelineConnection(current: ActivityScheduleMeta, next?: ActivityScheduleMeta) {
    const difference = next ? (next.startAtMs - current.transit.arrivalAtMs) / 60000 : 0;
    return {
        gapMinutes: Number.isFinite(difference) ? Math.max(0, difference) : 0,
        delayMinutes: Number.isFinite(difference) ? Math.max(0, -difference) : 0,
    };
}

/**
 * Computes the continuous time schedule for an itinerary day's activities.
 */
export function computeDayTimelineSchedule(
    activities: ItineraryActivitiy[] | null | undefined,
    day: TimelineContext = {},
): ActivityScheduleMeta[] {
    if (!Array.isArray(activities) || activities.length === 0) {
        return [];
    }

    let previousStart = -Infinity;
    const starts = activities.map(act => {
        let start = getActivityStartMs(act, day);
        // Undated historical overnight schedules used clock-only values.
        if (!act.time_date && !act.time_utc && start < previousStart - 12 * 3600000) {
            while (start < previousStart) start += 86400000;
        }
        previousStart = start;
        return start;
    });
    const localParts = (instant: number, act: ItineraryActivitiy) => {
        if (!Number.isFinite(instant)) return { date: act.time_date || day.date || "", time: act.time || "09:00" };
        if ((act.is_utc ?? day.is_utc ?? !!act.time_utc) && act.time_utc) {
            return utcToLocal(new Date(instant).toISOString(), act.display_time_zone || day.display_time_zone || getBrowserTimeZone());
        }
        const local = new Date(instant);
        const pad = (n: number) => String(n).padStart(2, "0");
        return { date: `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`, time: `${pad(local.getHours())}:${pad(local.getMinutes())}` };
    };
    return activities.map((act, idx) => {
        const startAtMs = starts[idx];
        const start = localParts(startAtMs, act);
        const startTime = start.time;
        const stayMinutes = parseDurationToMinutes(act.duration);
        const hasStayDuration = typeof stayMinutes === "number" && stayMinutes > 0;
        const endAtMs = startAtMs + (hasStayDuration ? stayMinutes! * 60000 : 0);
        const end = localParts(endAtMs, act);
        const endTime = end.time;

        const durationFormatted = hasStayDuration
            ? formatMinutesToDuration(stayMinutes!)
            : (act.duration?.trim() || "");

        // Transit Segment
        const rawTransit = act.transitDuration?.trim() || "";
        const transitMinutes = parseDurationToMinutes(rawTransit);
        const hasTransitMode = !!act.transitMode && act.transitMode !== "none";
        const hasTransitDuration = !!rawTransit || (typeof transitMinutes === "number" && transitMinutes > 0);
        const hasTransit = hasTransitMode || hasTransitDuration;

        const departureTime = endTime;
        const arrivalAtMs = endAtMs + (typeof transitMinutes === "number" && transitMinutes > 0 ? transitMinutes * 60000 : 0);
        const arrival = localParts(arrivalAtMs, act);
        const arrivalTime = arrival.time;

        const transitDurationFormatted =
            typeof transitMinutes === "number" && transitMinutes > 0
                ? formatMinutesToDuration(transitMinutes)
                : rawTransit;

        // Check gap to next activity
        let gapToNext: ActivityScheduleMeta["gapToNext"] = null;
        if (idx < activities.length - 1) {
            const nextAct = activities[idx + 1];
            if (nextAct && nextAct.time) {
                const nextStartTime = nextAct.time;
                const diff = (starts[idx + 1] - arrivalAtMs) / 60000;
                if (diff >= 15) {
                    gapToNext = {
                        hasGap: true,
                        gapMinutes: diff,
                        gapStartTime: hasTransitDuration ? arrivalTime : endTime,
                        gapEndTime: nextStartTime,
                        formatted: formatMinutesToDuration(diff),
                    };
                }
            }
        }

        return {
            startAtMs,
            endAtMs,
            startDate: start.date,
            endDate: end.date,
            activity: act,
            index: idx,
            startTime,
            stayMinutes,
            endTime,
            hasStayDuration,
            durationFormatted,
            transit: {
                arrivalAtMs,
                departureDate: end.date,
                arrivalDate: arrival.date,
                hasTransit,
                mode: act.transitMode || "walk",
                transitMinutes,
                departureTime,
                arrivalTime,
                durationFormatted: transitDurationFormatted,
                rawDuration: rawTransit,
            },
            gapToNext,
        };
    });
}
