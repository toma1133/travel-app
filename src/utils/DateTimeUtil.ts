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

export const CURRENCY_TIMEZONE_MAP: Record<string, string> = {
    // 亞洲主要 (Asia)
    TWD: "Asia/Taipei",
    JPY: "Asia/Tokyo",
    KRW: "Asia/Seoul",
    CNY: "Asia/Shanghai",
    HKD: "Asia/Hong_Kong",
    MOP: "Asia/Macau",
    THB: "Asia/Bangkok",
    SGD: "Asia/Singapore",
    MYR: "Asia/Kuala_Lumpur",
    VND: "Asia/Ho_Chi_Minh",
    PHP: "Asia/Manila",
    IDR: "Asia/Jakarta",

    // 美洲與大洋洲 (Americas & Oceania)
    USD: "America/New_York",
    CAD: "America/Toronto",
    AUD: "Australia/Sydney",
    NZD: "Pacific/Auckland",

    // 歐洲與北歐 (Europe & Nordics)
    EUR: "Europe/Paris",
    GBP: "Europe/London",
    CHF: "Europe/Zurich",
    NOK: "Europe/Oslo",
    SEK: "Europe/Stockholm",
    DKK: "Europe/Copenhagen",
    ISK: "Atlantic/Reykjavik",
    CZK: "Europe/Prague",
    HUF: "Europe/Budapest",
    PLN: "Europe/Warsaw",
    TRY: "Europe/Istanbul",

    // 中東與其他 (Middle East & Others)
    AED: "Asia/Dubai",
    SAR: "Asia/Riyadh",
    QAR: "Asia/Qatar",
    EGP: "Africa/Cairo",
};

export function currencyToTimeZone(currencyCode?: string | null): string | undefined {
    if (!currencyCode) return undefined;
    return CURRENCY_TIMEZONE_MAP[currencyCode.trim().toUpperCase()];
}

export function getTimeZones(): string[] {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    return [...new Set([getBrowserTimeZone(), "UTC", ...Object.values(CURRENCY_TIMEZONE_MAP), ...(intl.supportedValuesOf?.("timeZone") || [
        "Asia/Taipei", "Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Hong_Kong",
        "Asia/Singapore", "Asia/Bangkok", "Europe/London", "Europe/Paris", "America/New_York",
        "America/Los_Angeles", "Pacific/Honolulu", "Australia/Sydney", "Atlantic/Reykjavik", "Asia/Dubai",
    ])])].sort();
}

export const AIRPORT_TIMEZONE_MAP: Record<string, string> = {
    // 中東轉機樞紐
    DXB: "Asia/Dubai",
    DWC: "Asia/Dubai",
    AUH: "Asia/Dubai",
    DOH: "Asia/Qatar",
    // 英國與歐洲樞紐
    LGW: "Europe/London",
    LHR: "Europe/London",
    STN: "Europe/London",
    LTN: "Europe/London",
    LCY: "Europe/London",
    MAN: "Europe/London",
    EDI: "Europe/London",
    CDG: "Europe/Paris",
    ORY: "Europe/Paris",
    FRA: "Europe/Berlin",
    MUC: "Europe/Berlin",
    BER: "Europe/Berlin",
    AMS: "Europe/Amsterdam",
    FCO: "Europe/Rome",
    MXP: "Europe/Rome",
    MAD: "Europe/Madrid",
    BCN: "Europe/Madrid",
    ZRH: "Europe/Zurich",
    GVA: "Europe/Zurich",
    VIE: "Europe/Vienna",
    PRG: "Europe/Prague",
    BUD: "Europe/Budapest",
    WAW: "Europe/Warsaw",
    CPH: "Europe/Copenhagen",
    ARN: "Europe/Stockholm",
    OSL: "Europe/Oslo",
    HEL: "Europe/Helsinki",
    KEF: "Atlantic/Reykjavik",
    IST: "Europe/Istanbul",
    SAW: "Europe/Istanbul",
    ATH: "Europe/Athens",
    // 亞洲主要機場
    TPE: "Asia/Taipei",
    TSA: "Asia/Taipei",
    KHH: "Asia/Taipei",
    RMQ: "Asia/Taipei",
    NRT: "Asia/Tokyo",
    HND: "Asia/Tokyo",
    KIX: "Asia/Tokyo",
    FUK: "Asia/Tokyo",
    CTS: "Asia/Tokyo",
    OKA: "Asia/Tokyo",
    NGO: "Asia/Tokyo",
    ICN: "Asia/Seoul",
    GMP: "Asia/Seoul",
    PUS: "Asia/Seoul",
    CJU: "Asia/Seoul",
    HKG: "Asia/Hong_Kong",
    MFM: "Asia/Macau",
    BKK: "Asia/Bangkok",
    DMK: "Asia/Bangkok",
    HKT: "Asia/Bangkok",
    CNX: "Asia/Bangkok",
    SIN: "Asia/Singapore",
    KUL: "Asia/Kuala_Lumpur",
    SGN: "Asia/Ho_Chi_Minh",
    HAN: "Asia/Ho_Chi_Minh",
    MNL: "Asia/Manila",
    CGK: "Asia/Jakarta",
    DPS: "Asia/Jakarta",
    PVG: "Asia/Shanghai",
    SHA: "Asia/Shanghai",
    PEK: "Asia/Shanghai",
    PKX: "Asia/Shanghai",
    CAN: "Asia/Shanghai",
    SZX: "Asia/Shanghai",
    // 美洲與大洋洲
    JFK: "America/New_York",
    EWR: "America/New_York",
    LGA: "America/New_York",
    BOS: "America/New_York",
    IAD: "America/New_York",
    DCA: "America/New_York",
    ORD: "America/Chicago",
    DFW: "America/Chicago",
    LAX: "America/Los_Angeles",
    SFO: "America/Los_Angeles",
    SEA: "America/Los_Angeles",
    LAS: "America/Los_Angeles",
    YVR: "America/Vancouver",
    YYZ: "America/Toronto",
    YUL: "America/Toronto",
    HNL: "Pacific/Honolulu",
    SYD: "Australia/Sydney",
    MEL: "Australia/Melbourne",
    BNE: "Australia/Sydney",
    PER: "Australia/Perth",
    AKL: "Pacific/Auckland",
    CHC: "Pacific/Auckland",
};

export const TIMEZONE_ALIASES: Record<string, string> = {
    // 機場與城市地名中文對照
    桃園: "Asia/Taipei",
    桃機: "Asia/Taipei",
    松山: "Asia/Taipei",
    小港: "Asia/Taipei",
    高雄: "Asia/Taipei",
    台北: "Asia/Taipei",
    臺北: "Asia/Taipei",
    台灣: "Asia/Taipei",
    臺灣: "Asia/Taipei",
    成田: "Asia/Tokyo",
    羽田: "Asia/Tokyo",
    關西: "Asia/Tokyo",
    福岡: "Asia/Tokyo",
    新千歲: "Asia/Tokyo",
    那霸: "Asia/Tokyo",
    中部: "Asia/Tokyo",
    名古屋: "Asia/Tokyo",
    大阪: "Asia/Tokyo",
    東京: "Asia/Tokyo",
    沖繩: "Asia/Tokyo",
    北海道: "Asia/Tokyo",
    日本: "Asia/Tokyo",
    仁川: "Asia/Seoul",
    金浦: "Asia/Seoul",
    釜山: "Asia/Seoul",
    濟州: "Asia/Seoul",
    首爾: "Asia/Seoul",
    韓國: "Asia/Seoul",
    香港: "Asia/Hong_Kong",
    赤鱲角: "Asia/Hong_Kong",
    澳門: "Asia/Macau",
    樟宜: "Asia/Singapore",
    新加坡: "Asia/Singapore",
    素萬那普: "Asia/Bangkok",
    廊曼: "Asia/Bangkok",
    曼谷: "Asia/Bangkok",
    清邁: "Asia/Bangkok",
    普吉: "Asia/Bangkok",
    泰國: "Asia/Bangkok",
    吉隆坡: "Asia/Kuala_Lumpur",
    新山: "Asia/Kuala_Lumpur",
    檳城: "Asia/Kuala_Lumpur",
    馬來西亞: "Asia/Kuala_Lumpur",
    胡志明: "Asia/Ho_Chi_Minh",
    河內: "Asia/Ho_Chi_Minh",
    峴港: "Asia/Ho_Chi_Minh",
    越南: "Asia/Ho_Chi_Minh",
    馬尼拉: "Asia/Manila",
    宿霧: "Asia/Manila",
    雅加達: "Asia/Jakarta",
    峇里島: "Asia/Jakarta",
    登巴薩: "Asia/Jakarta",
    杜拜: "Asia/Dubai",
    阿聯酋: "Asia/Dubai",
    多哈: "Asia/Qatar",
    卡達: "Asia/Qatar",
    蓋威克: "Europe/London",
    希斯洛: "Europe/London",
    倫敦: "Europe/London",
    曼徹斯特: "Europe/London",
    英國: "Europe/London",
    戴高樂: "Europe/Paris",
    奧利: "Europe/Paris",
    巴黎: "Europe/Paris",
    法國: "Europe/Paris",
    法蘭克福: "Europe/Berlin",
    慕尼黑: "Europe/Berlin",
    柏林: "Europe/Berlin",
    德國: "Europe/Berlin",
    史基浦: "Europe/Amsterdam",
    阿姆斯特丹: "Europe/Amsterdam",
    荷蘭: "Europe/Amsterdam",
    蘇黎世: "Europe/Zurich",
    日內瓦: "Europe/Zurich",
    瑞士: "Europe/Zurich",
    羅馬: "Europe/Rome",
    米蘭: "Europe/Rome",
    義大利: "Europe/Rome",
    馬德里: "Europe/Madrid",
    巴塞隆納: "Europe/Madrid",
    西班牙: "Europe/Madrid",
    凱夫拉維克: "Atlantic/Reykjavik",
    雷克雅維克: "Atlantic/Reykjavik",
    冰島: "Atlantic/Reykjavik",
    伊斯坦堡: "Europe/Istanbul",
    土耳其: "Europe/Istanbul",
    甘迺迪: "America/New_York",
    紐華克: "America/New_York",
    拉瓜地亞: "America/New_York",
    紐約: "America/New_York",
    洛杉磯: "America/Los_Angeles",
    舊金山: "America/Los_Angeles",
    西雅圖: "America/Los_Angeles",
    芝加哥: "America/Chicago",
    檀香山: "Pacific/Honolulu",
    夏威夷: "Pacific/Honolulu",
    溫哥華: "America/Vancouver",
    多倫多: "America/Toronto",
    雪梨: "Australia/Sydney",
    墨爾本: "Australia/Melbourne",
    奧克蘭: "Pacific/Auckland",
    基督城: "Pacific/Auckland",
    紐西蘭: "Pacific/Auckland",
};

/**
 * 依據使用者輸入的機場名稱、代號或城市關鍵字自動偵測時區
 * 例如："TPE" -> "Asia/Taipei", "DXB 杜拜" -> "Asia/Dubai", "LGW" -> "Europe/London"
 */
export function detectTimeZoneFromLocation(loc?: string | null): string | undefined {
    if (!loc || typeof loc !== "string") return undefined;
    const trimmed = loc.trim();
    if (!trimmed) return undefined;

    // 1. 優先檢查字串中是否包含三字機場 IATA 代碼（如 "TPE", "DXB", "LGW", "KEF"）
    const iataMatches = trimmed.toUpperCase().match(/\b[A-Z]{3}\b/g) || trimmed.toUpperCase().match(/[A-Z]{3}/g);
    if (iataMatches) {
        for (const code of iataMatches) {
            if (AIRPORT_TIMEZONE_MAP[code]) {
                return AIRPORT_TIMEZONE_MAP[code];
            }
        }
    }

    // 2. 檢查中文地名或機場關鍵字
    const lower = trimmed.toLowerCase();
    for (const [alias, zone] of Object.entries(TIMEZONE_ALIASES)) {
        if (lower.includes(alias.toLowerCase())) {
            return zone;
        }
    }

    // 3. 檢查 IANA 英文城市名（例如 "Tokyo", "London", "Reykjavik"）
    for (const zone of getTimeZones()) {
        const city = zone.split("/")[1]?.replace(/_/g, " ").toLowerCase();
        if (city && lower.includes(city)) {
            return zone;
        }
    }

    return undefined;
}
