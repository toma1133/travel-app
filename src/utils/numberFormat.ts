import React from 'react';

/**
 * Strips all commas and non-numeric characters (except optional decimal point) from a string.
 */
export function cleanNumberString(value: string | number | null | undefined, allowDecimal = true): string {
    if (value === null || value === undefined) return '';
    let str = String(value).trim();
    if (allowDecimal) {
        // Keep digits and at most one decimal point
        str = str.replace(/[^0-9.]/g, '');
        const dotIndex = str.indexOf('.');
        if (dotIndex !== -1) {
            str = str.slice(0, dotIndex + 1) + str.slice(dotIndex + 1).replace(/\./g, '');
        }
    } else {
        str = str.replace(/[^0-9]/g, '');
    }
    return str;
}

/**
 * Formats a pure number or numeric string with thousand separators (commas).
 * Handles decimals and leading zeros properly.
 * E.g., "1000" -> "1,000", "1000.5" -> "1,000.5", "0.5" -> "0.5", "" -> ""
 */
export function formatThousands(value: string | number | null | undefined, allowDecimal = true): string {
    if (value === null || value === undefined || value === '') return '';
    const clean = cleanNumberString(value, allowDecimal);
    if (clean === '') return '';

    const parts = clean.split('.');
    let integerPart = parts[0] || '';
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Handle leading zeros: e.g. "05" -> "5", but keep single "0" or "0."
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
        integerPart = integerPart.replace(/^0+/, '') || '0';
    }

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formattedInteger + decimalPart;
}

/**
 * Formats all numeric sequences inside a free-form text string with thousand separators.
 * E.g. "2000 - 3000 / 人" -> "2,000 - 3,000 / 人"
 * E.g. "1200" -> "1,200"
 */
export function formatTextWithThousands(text: string | number | null | undefined): string {
    if (text === null || text === undefined) return '';
    const str = String(text);
    // Normalize existing digit-comma groups before re-formatting to prevent comma duplication
    const normalized = str.replace(/(\d),(\d)/g, '$1$2');
    return normalized.replace(/\d+/g, (match) => {
        return match.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });
}

/**
 * Parses a thousand-separated string back to a Javascript Number.
 * E.g. "1,234,567.89" -> 1234567.89, "" -> 0
 */
export function parseThousandsToNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const clean = cleanNumberString(value, true);
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

/**
 * Helper to handle input `onChange` with thousand separator formatting and CURSOR POSITION PRESERVATION.
 * 
 * When typing into a controlled input, React re-renders `input.value`, which by default resets
 * the cursor to the end of the input or jumps across commas.
 * This function calculates the correct new cursor position and restores it reliably.
 * 
 * @param e React ChangeEvent on HTMLInputElement
 * @param onValueChange Callback receiving (newFormattedString, newNumericValue)
 * @param options Options for formatting: allowDecimal, isFreeText
 */
export function handleThousandsInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
    onValueChange: (formatted: string, numericValue: number) => void,
    options: { allowDecimal?: boolean; isFreeText?: boolean } = {}
): void {
    const input = e.target;
    const rawVal = input.value;
    const selectionStart = input.selectionStart ?? rawVal.length;

    // Count non-comma characters before cursor in current raw input
    const nonCommasBeforeCursor = rawVal
        .slice(0, selectionStart)
        .replace(/,/g, '').length;

    // Determine formatting mode
    let formatted: string;
    let numericVal = 0;

    if (options.isFreeText) {
        formatted = formatTextWithThousands(rawVal);
        numericVal = parseThousandsToNumber(rawVal);
    } else {
        formatted = formatThousands(rawVal, options.allowDecimal !== false);
        numericVal = parseThousandsToNumber(formatted);
    }

    // Calculate new cursor position in the formatted string
    let newCursorPos = 0;
    let nonCommaCount = 0;

    for (let i = 0; i < formatted.length; i++) {
        if (nonCommaCount === nonCommasBeforeCursor) {
            newCursorPos = i;
            break;
        }
        if (formatted[i] !== ',') {
            nonCommaCount++;
        }
        if (nonCommaCount === nonCommasBeforeCursor) {
            newCursorPos = i + 1;
            break;
        }
    }

    if (nonCommaCount < nonCommasBeforeCursor) {
        newCursorPos = formatted.length;
    }

    // Call user's update callback
    onValueChange(formatted, numericVal);

    // Restore cursor position in next tick after React update
    requestAnimationFrame(() => {
        if (input && document.activeElement === input) {
            input.setSelectionRange(newCursorPos, newCursorPos);
        }
    });
}

/**
 * Checks if a price string contains a valid price/amount (and is not just empty or a standalone currency code like "KRW", "JPY", "USD", etc.)
 * E.g.:
 * - "KRW 10,000" -> true
 * - "2,000 - 3,000" -> true
 * - "免費" -> true
 * - "KRW " -> false
 * - "JPY" -> false
 * - "" / null / undefined -> false
 */
export function isValidPrice(price?: string | null): boolean {
    if (!price || typeof price !== 'string') return false;
    const trimmed = price.trim();
    if (!trimmed) return false;
    // Remove leading 3-letter currency code (e.g. KRW, JPY, TWD, USD, EUR, NOK, CAD...) or currency symbols (¥, $, €, ₩, NT$, kr, fr, ₫, ₱, zł, ₺, Kč, Ft, RM, DH, etc.)
    const amountOnly = trimmed
        .replace(/^[A-Z]{3}\s*/i, '')
        .replace(/^(¥|\$|€|₩|NT\$|NT|£|฿|kr|fr|₫|₱|zł|₺|Kč|Ft|RM|DH)\s*/i, '')
        .trim();
    return amountOnly.length > 0;
}

