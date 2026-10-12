/** Calendar dates stay date-only; actual instants are stored as ISO UTC timestamps. */
export const getBrowserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const formatters = new Map<string, Intl.DateTimeFormat>();
export function utcToLocal(value: string, timeZone = getBrowserTimeZone()) {
    let formatter = formatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone, calendar: "gregory", numberingSystem: "latn", hourCycle: "h23",
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
        formatters.set(timeZone, formatter);
    }
    const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(p => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, seconds: parts.second };
}

/** Reject DST gaps and folds instead of silently saving a different instant. */
export function localToUtc(date: string, time: string, timeZone = getBrowserTimeZone(), existing?: string | null): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
        throw new Error("請輸入完整日期與時間。");
    }
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const wall = Date.parse(`${date}T${normalizedTime}Z`);
    if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 19) !== `${date}T${normalizedTime}`) {
        throw new Error("日期或時間無效。");
    }
    // Preserve seconds and the chosen side of a DST fold when editing unrelated fields.
    if (existing) {
        const local = utcToLocal(existing, timeZone);
        if (local.date === date && local.time === time.slice(0, 5) && (time.length === 5 || local.seconds === time.slice(6))) return existing;
    }
    const offsets = new Set<number>();
    for (const hours of [-48, -24, 0, 24, 48]) {
        const probe = wall + hours * 3600000;
        const local = utcToLocal(new Date(probe).toISOString(), timeZone);
        offsets.add(Date.parse(`${local.date}T${local.time}:${local.seconds}Z`) - probe);
    }
    const candidates = [...offsets].map(offset => new Date(wall - offset).toISOString()).filter(value => {
        const local = utcToLocal(value, timeZone);
        return local.date === date && `${local.time}:${local.seconds}` === normalizedTime;
    });
    if (candidates.length === 0) throw new Error("此時間因夏令時間調整而不存在，請選擇其他時間。");
    if (candidates.length > 1) throw new Error("此時間因夏令時間調整而重複，請切換至 UTC 時區輸入確切時間。");
    return candidates[0];
}

export function getTimeZones(): string[] {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    return [...new Set([getBrowserTimeZone(), "UTC", ...(intl.supportedValuesOf?.("timeZone") || [
        "Asia/Taipei", "Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Hong_Kong",
        "Asia/Singapore", "Asia/Bangkok", "Europe/London", "Europe/Paris", "America/New_York",
        "America/Los_Angeles", "Pacific/Honolulu", "Australia/Sydney",
    ])])].sort();
}
