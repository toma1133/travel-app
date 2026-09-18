/**
 * Currency utility functions for travel shopping & budget calculation
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
    JPY: "¥",
    KRW: "₩",
    TWD: "NT$",
    USD: "$",
    EUR: "€",
    GBP: "£",
    THB: "฿",
    VND: "₫",
    SGD: "S$",
    HKD: "HK$",
    AUD: "A$",
    CAD: "C$",
    CNY: "¥",
    PHP: "₱",
    MYR: "RM",
};

export const CURRENCY_NAMES: Record<string, string> = {
    JPY: "日圓",
    KRW: "韓元",
    TWD: "新台幣",
    USD: "美元",
    EUR: "歐元",
    GBP: "英鎊",
    THB: "泰銖",
    VND: "越南盾",
    SGD: "新加坡幣",
    HKD: "港幣",
    AUD: "澳幣",
    CAD: "加幣",
    CNY: "人民幣",
    PHP: "菲律賓披索",
    MYR: "馬來西亞令吉",
};

export const POPULAR_TRAVEL_CURRENCIES = [
    { code: "JPY", symbol: "¥", name: "日圓" },
    { code: "KRW", symbol: "₩", name: "韓元" },
    { code: "THB", symbol: "฿", name: "泰銖" },
    { code: "TWD", symbol: "NT$", name: "新台幣" },
    { code: "USD", symbol: "$", name: "美元" },
    { code: "EUR", symbol: "€", name: "歐元" },
    { code: "VND", symbol: "₫", name: "越南盾" },
    { code: "SGD", symbol: "S$", name: "新加坡幣" },
    { code: "HKD", symbol: "HK$", name: "港幣" },
    { code: "GBP", symbol: "£", name: "英鎊" },
];

/**
 * Returns symbol for a currency code (e.g. "JPY" -> "¥", "TWD" -> "NT$")
 */
export const getCurrencySymbol = (currency?: string | null): string => {
    if (!currency) return "¥";
    const code = currency.toUpperCase().trim();
    return CURRENCY_SYMBOLS[code] || code;
};

/**
 * Returns Chinese name for a currency code (e.g. "JPY" -> "日圓")
 */
export const getCurrencyName = (currency?: string | null): string => {
    if (!currency) return "當地幣";
    const code = currency.toUpperCase().trim();
    return CURRENCY_NAMES[code] || code;
};

/**
 * Convert local currency amount to home currency amount using exchangeRate (1 local = X home)
 */
export const convertToHomeCurrency = (
    amount: number,
    exchangeRate?: number | null
): number => {
    if (!exchangeRate || exchangeRate <= 0) return amount;
    return Math.round(amount * exchangeRate);
};

/**
 * Format string with both local currency and converted home currency
 * Example: "¥1,400 (≈ NT$ 294)"
 */
export const formatPriceWithConversion = (
    localAmount: number,
    localCurrency?: string | null,
    homeCurrency?: string | null,
    exchangeRate?: number | null
): {
    localFormatted: string;
    homeFormatted: string | null;
} => {
    const localCode = localCurrency || "JPY";
    const homeCode = homeCurrency || "TWD";
    const localSym = getCurrencySymbol(localCode);
    const homeSym = getCurrencySymbol(homeCode);

    const localFormatted = `${localSym}${localAmount.toLocaleString()}`;

    if (
        exchangeRate &&
        exchangeRate > 0 &&
        localCode.toUpperCase() !== homeCode.toUpperCase()
    ) {
        const homeAmount = Math.round(localAmount * exchangeRate);
        const homeFormatted = `≈ ${homeSym}${homeAmount.toLocaleString()}`;
        return { localFormatted, homeFormatted };
    }

    return { localFormatted, homeFormatted: null };
};
