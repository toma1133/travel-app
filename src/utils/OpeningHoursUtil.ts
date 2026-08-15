import moment from "moment";

export type DaySchedule = {
    dayIndex: number; // 1 (Mon) - 7 (Sun)
    dayLabel: string; // "週一", "週二", ... "週日"
    shortLabel: string; // "一", "二", ... "日"
    periods: string[]; // ["09:00 - 17:00"]
    periodsText: string;
    isClosed: boolean;
    isToday: boolean;
};

export type ParsedOpeningHours = {
    isPerDay: boolean;
    rawText: string;
    schedule: Record<number, string[]>;
    days: DaySchedule[];
    todaySchedule?: DaySchedule;
    summaryText: string;
};

export type BusinessStatus = {
    isOpen: boolean;
    status: "open" | "closing_soon" | "closed" | "closed_today" | "unknown";
    badgeText: string;
    badgeColor: "emerald" | "amber" | "rose" | "muted";
    detailText: string;
    todayHoursText: string;
    allHoursSummary: string;
    parsed: ParsedOpeningHours;
};

const DAY_LABELS: Record<number, { full: string; short: string }> = {
    1: { full: "週一", short: "一" },
    2: { full: "週二", short: "二" },
    3: { full: "週三", short: "三" },
    4: { full: "週四", short: "四" },
    5: { full: "週五", short: "五" },
    6: { full: "週六", short: "六" },
    7: { full: "週日", short: "日" },
};

/**
 * Get current day of week in device local timezone (1 for Monday, ..., 7 for Sunday)
 */
export function getCurrentDayIndex(now: moment.Moment = moment()): number {
    return now.isoWeekday(); // Moment isoWeekday: 1 (Mon) to 7 (Sun)
}

/**
 * Parse raw opening hours string (plain text or JSON per_day)
 */
export function parseOpeningHours(rawOpen?: string | null): ParsedOpeningHours {
    if (!rawOpen || typeof rawOpen !== "string") {
        return {
            isPerDay: false,
            rawText: "",
            schedule: {},
            days: [],
            summaryText: "",
        };
    }

    const trimmed = rawOpen.trim();
    const currentDay = getCurrentDayIndex();

    // Check if JSON format
    if (trimmed.startsWith("{") && (trimmed.includes('"type":"per_day"') || trimmed.includes('"schedule"'))) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && (parsed.type === "per_day" || parsed.schedule)) {
                const schedule: Record<number, string[]> = {};
                const rawSchedule = parsed.schedule || {};

                for (let d = 1; d <= 7; d++) {
                    const val = rawSchedule[d] || rawSchedule[String(d)];
                    if (Array.isArray(val)) {
                        schedule[d] = val.filter((p) => typeof p === "string" && p.trim() !== "");
                    } else if (typeof val === "string" && val.trim() !== "") {
                        schedule[d] = [val.trim()];
                    } else {
                        schedule[d] = [];
                    }
                }

                const days: DaySchedule[] = [];
                for (let d = 1; d <= 7; d++) {
                    const periods = schedule[d] || [];
                    const is24Hours = periods.some(
                        (p) =>
                            p.includes("24小時") ||
                            p.includes("24 Hours") ||
                            p.includes("24hr") ||
                            p === "00:00 - 24:00" ||
                            p === "00:00 - 00:00"
                    );
                    const isClosed =
                        !is24Hours &&
                        (periods.length === 0 ||
                            periods.some(
                                (p) =>
                                    p.includes("公休") ||
                                    p.includes("休館") ||
                                    p === "休息"
                            ));
                    const periodsText = is24Hours
                        ? "24小時"
                        : isClosed
                        ? "公休"
                        : periods.join(", ");

                    days.push({
                        dayIndex: d,
                        dayLabel: DAY_LABELS[d].full,
                        shortLabel: DAY_LABELS[d].short,
                        periods: is24Hours ? ["24小時營業"] : periods,
                        periodsText,
                        isClosed,
                        isToday: d === currentDay,
                    });
                }

                const todaySchedule = days.find((d) => d.dayIndex === currentDay);
                const summaryText = generateScheduleSummary(days);

                return {
                    isPerDay: true,
                    rawText: trimmed,
                    schedule,
                    days,
                    todaySchedule,
                    summaryText,
                };
            }
        } catch (e) {
            console.warn("Failed to parse per_day opening hours JSON:", e);
        }
    }

    // Regular plain text string (e.g. "09:00 - 17:00")
    return {
        isPerDay: false,
        rawText: trimmed,
        schedule: {},
        days: [],
        summaryText: trimmed,
    };
}

/**
 * Generate human-readable concise summary text for 7-day schedule
 */
function generateScheduleSummary(days: DaySchedule[]): string {
    if (days.length !== 7) return "";

    // 1. All 7 days are identical
    const firstText = days[0].periodsText;
    const allSame = days.every((d) => d.periodsText === firstText);
    if (allSame) {
        if (days[0].isClosed) return "全週公休";
        return `每日 ${firstText}`;
    }

    // 2. Weekdays (1-5) identical and Weekend (6-7) identical
    const weekdaysSame = days.slice(0, 5).every((d) => d.periodsText === days[0].periodsText);
    const weekendSame = days[5].periodsText === days[6].periodsText;

    if (weekdaysSame && weekendSame) {
        const weekdayText = days[0].isClosed ? "週一至週五公休" : `週一至週五 ${days[0].periodsText}`;
        const weekendText = days[5].isClosed ? "週末公休" : `週末 ${days[5].periodsText}`;
        return `${weekdayText} / ${weekendText}`;
    }

    // 3. Consecutive day grouping
    const groups: { startDay: number; endDay: number; text: string; isClosed: boolean }[] = [];
    let curGroup = {
        startDay: days[0].dayIndex,
        endDay: days[0].dayIndex,
        text: days[0].periodsText,
        isClosed: days[0].isClosed,
    };

    for (let i = 1; i < days.length; i++) {
        const d = days[i];
        if (d.periodsText === curGroup.text) {
            curGroup.endDay = d.dayIndex;
        } else {
            groups.push({ ...curGroup });
            curGroup = {
                startDay: d.dayIndex,
                endDay: d.dayIndex,
                text: d.periodsText,
                isClosed: d.isClosed,
            };
        }
    }
    groups.push(curGroup);

    // Format grouped string
    const parts = groups.map((g) => {
        const label =
            g.startDay === g.endDay
                ? DAY_LABELS[g.startDay].full
                : `${DAY_LABELS[g.startDay].short}至${DAY_LABELS[g.endDay].short}`;

        if (g.isClosed) {
            return `${label}公休`;
        }
        return `${label} ${g.text}`;
    });

    return parts.join("、");
}

/**
 * Format opening hours for single line display (Cards, Popups, etc.)
 */
export function formatOpeningHours(rawOpen?: string | null): string {
    const parsed = parseOpeningHours(rawOpen);
    return parsed.summaryText;
}

/**
 * Format today's opening hours
 */
export function formatTodayOpeningHours(rawOpen?: string | null): string {
    const parsed = parseOpeningHours(rawOpen);
    if (!parsed.isPerDay) {
        return parsed.summaryText;
    }
    if (parsed.todaySchedule) {
        return `今日(${parsed.todaySchedule.shortLabel}) ${parsed.todaySchedule.periodsText}`;
    }
    return parsed.summaryText;
}

type TimeInterval = {
    startMins: number;
    endMins: number;
    startStr: string;
    endStr: string;
    isOvernight: boolean;
};

/**
 * Extract time intervals from string (e.g. "09:00 - 17:00", "11:00~14:30, 17:00-21:00")
 */
function parseIntervalsFromText(text: string): TimeInterval[] {
    const intervals: TimeInterval[] = [];
    if (!text) return intervals;

    const regex = /(\d{1,2}):(\d{2})\s*[-~～至到]\s*(\d{1,2}):(\d{2})/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        const h1 = parseInt(match[1], 10);
        const m1 = parseInt(match[2], 10);
        const h2 = parseInt(match[3], 10);
        const m2 = parseInt(match[4], 10);

        const startMins = h1 * 60 + m1;
        const endMins = h2 * 60 + m2;
        const startStr = `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`;
        const endStr = `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`;
        const isOvernight = endMins < startMins;

        intervals.push({
            startMins,
            endMins,
            startStr,
            endStr,
            isOvernight,
        });
    }

    return intervals;
}

/**
 * Check if today is matching explicit closed_days text
 */
function isDayMatchingClosedDays(closedDays?: string | null, dayIndex: number = getCurrentDayIndex()): boolean {
    if (!closedDays || typeof closedDays !== "string") return false;
    const text = closedDays.trim();
    if (!text) return false;

    const dayInfo = DAY_LABELS[dayIndex];
    if (!dayInfo) return false;

    if (text.includes(dayInfo.full) || text.includes(dayInfo.short)) {
        return true;
    }
    // Check English day names
    const enDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const enDay = enDays[dayIndex - 1];
    if (text.toLowerCase().includes(enDay)) {
        return true;
    }

    return false;
}

/**
 * Compute Real-Time Business Status (Google Maps-like "營業中 / 休息中 / 即將打烊 / 今日公休")
 * Automatically checks current device timezone and time against place schedule.
 */
export function getBusinessStatus(
    rawOpen?: string | null,
    closedDays?: string | null,
    now: moment.Moment = moment()
): BusinessStatus {
    const parsed = parseOpeningHours(rawOpen);

    if (!rawOpen || !rawOpen.trim()) {
        return {
            isOpen: false,
            status: "unknown",
            badgeText: "營業資訊未填",
            badgeColor: "muted",
            detailText: "尚未設定營業時間",
            todayHoursText: "未設定",
            allHoursSummary: "",
            parsed,
        };
    }

    // Check 24-hour open indicators
    const lowerRaw = rawOpen.toLowerCase();
    if (
        lowerRaw.includes("24小時") ||
        lowerRaw.includes("24 hours") ||
        lowerRaw.includes("24hr") ||
        lowerRaw.includes("全天開放") ||
        lowerRaw.includes("全年無休")
    ) {
        return {
            isOpen: true,
            status: "open",
            badgeText: "24小時營業",
            badgeColor: "emerald",
            detailText: "全天開放",
            todayHoursText: "24 小時營業",
            allHoursSummary: "24 小時營業",
            parsed,
        };
    }

    const currentDay = getCurrentDayIndex(now);
    const currentMins = now.hours() * 60 + now.minutes();

    // 1. Check if today is a closed day
    const isClosedByField = isDayMatchingClosedDays(closedDays, currentDay);
    if (isClosedByField) {
        return {
            isOpen: false,
            status: "closed_today",
            badgeText: "今日公休",
            badgeColor: "rose",
            detailText: "今日公休日",
            todayHoursText: "公休",
            allHoursSummary: parsed.summaryText,
            parsed,
        };
    }

    // 2. Extract today's intervals
    let todayPeriods: string[] = [];
    if (parsed.isPerDay) {
        if (parsed.todaySchedule?.isClosed) {
            return {
                isOpen: false,
                status: "closed_today",
                badgeText: "今日公休",
                badgeColor: "rose",
                detailText: "今日公休日",
                todayHoursText: "公休",
                allHoursSummary: parsed.summaryText,
                parsed,
            };
        }
        todayPeriods = parsed.todaySchedule?.periods || [];
    } else {
        todayPeriods = [parsed.rawText];
    }

    // Combine intervals
    let intervals: TimeInterval[] = [];
    todayPeriods.forEach((p) => {
        intervals.push(...parseIntervalsFromText(p));
    });

    // Check yesterday's overnight shift (e.g. yesterday 18:00 - 02:00, and now it's 01:30 today)
    const yesterdayDay = currentDay === 1 ? 7 : currentDay - 1;
    if (parsed.isPerDay) {
        const yesterdayPeriods = parsed.schedule[yesterdayDay] || [];
        yesterdayPeriods.forEach((p) => {
            const yIntervals = parseIntervalsFromText(p);
            yIntervals.forEach((yi) => {
                if (yi.isOvernight && currentMins < yi.endMins) {
                    // Still open from yesterday's shift!
                    intervals.push({
                        ...yi,
                        startMins: 0, // open since start of today
                    });
                }
            });
        });
    }

    if (intervals.length === 0) {
        // Non-standard text format (e.g. "預約制", "依活動現場為準")
        return {
            isOpen: false,
            status: "unknown",
            badgeText: "營業資訊",
            badgeColor: "muted",
            detailText: parsed.summaryText,
            todayHoursText: parsed.summaryText,
            allHoursSummary: parsed.summaryText,
            parsed,
        };
    }

    // Sort intervals by start time
    intervals.sort((a, b) => a.startMins - b.startMins);

    // 3. Test if currently inside any interval
    for (const interval of intervals) {
        let isInside = false;
        let remainingMinutes = 0;

        if (interval.isOvernight) {
            isInside = currentMins >= interval.startMins || currentMins < interval.endMins;
            if (isInside) {
                remainingMinutes = currentMins >= interval.startMins
                    ? (1440 - currentMins) + interval.endMins
                    : interval.endMins - currentMins;
            }
        } else {
            isInside = currentMins >= interval.startMins && currentMins < interval.endMins;
            if (isInside) {
                remainingMinutes = interval.endMins - currentMins;
            }
        }

        if (isInside) {
            // Check closing soon (within 30 minutes)
            if (remainingMinutes > 0 && remainingMinutes <= 30) {
                return {
                    isOpen: true,
                    status: "closing_soon",
                    badgeText: "即將打烊",
                    badgeColor: "amber",
                    detailText: `即將打烊 • 結束營業 ${interval.endStr}`,
                    todayHoursText: todayPeriods.join(", "),
                    allHoursSummary: parsed.summaryText,
                    parsed,
                };
            }

            return {
                isOpen: true,
                status: "open",
                badgeText: "營業中",
                badgeColor: "emerald",
                detailText: `營業中 • 結束營業 ${interval.endStr}`,
                todayHoursText: todayPeriods.join(", "),
                allHoursSummary: parsed.summaryText,
                parsed,
            };
        }
    }

    // 4. Currently Closed: Find next upcoming opening time today
    const nextInterval = intervals.find((i) => i.startMins > currentMins);
    if (nextInterval) {
        return {
            isOpen: false,
            status: "closed",
            badgeText: "休息中",
            badgeColor: "rose",
            detailText: `休息中 • 開始營業 ${nextInterval.startStr}`,
            todayHoursText: todayPeriods.join(", "),
            allHoursSummary: parsed.summaryText,
            parsed,
        };
    }

    // After all intervals ended today
    return {
        isOpen: false,
        status: "closed",
        badgeText: "休息中",
        badgeColor: "rose",
        detailText: "休息中 • 明日開始營業",
        todayHoursText: todayPeriods.join(", "),
        allHoursSummary: parsed.summaryText,
        parsed,
    };
}
