/**
 * Map Navigation Utilities
 * Provides smart device detection for Apple Maps / Google Maps
 */

/**
 * Detects if the current user is on an Apple device (iOS, iPadOS, macOS)
 */
export function isAppleDevice(): boolean {
    if (typeof window === "undefined" || !navigator) return false;

    const userAgent = navigator.userAgent || navigator.vendor || "";

    // 1. iPhone & iPod
    const isIOS = /iPhone|iPod/.test(userAgent);

    // 2. iPad (including modern iPadOS that reports as MacIntel with touch support)
    const isIPad =
        /iPad/.test(userAgent) ||
        (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);

    // 3. macOS
    const isMac = /Macintosh|Mac OS X/.test(userAgent) && !isIPad;

    return isIOS || isIPad || isMac;
}

export type NavigationTarget = {
    name: string;
    loc?: string | null;
    lat?: number | null;
    lng?: number | null;
};

/**
 * Generate Apple Maps Universal Link
 * On iOS/iPadOS/macOS, this opens the native Apple Maps app.
 */
export function getAppleMapsUrl(target: NavigationTarget): string {
    const query = target.loc ? `${target.name} ${target.loc}` : target.name;
    const encoded = encodeURIComponent(query);
    if (typeof target.lat === "number" && typeof target.lng === "number") {
        return `https://maps.apple.com/?q=${encoded}&ll=${target.lat},${target.lng}`;
    }
    return `https://maps.apple.com/?q=${encoded}`;
}

/**
 * Generate Google Maps Web / App Link
 */
export function getGoogleMapsUrl(target: NavigationTarget): string {
    const query = target.loc ? `${target.name} ${target.loc}` : target.name;
    const encoded = encodeURIComponent(query);
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * Smart Navigation Link - Automatically picks Apple Maps for Apple devices, Google Maps for others
 */
export function getSmartNavigationUrl(target: NavigationTarget): string {
    return isAppleDevice() ? getAppleMapsUrl(target) : getGoogleMapsUrl(target);
}

/**
 * Smart Navigation Label
 */
export function getSmartNavigationLabel(): {
    provider: "apple" | "google";
    label: string;
    appName: string;
} {
    if (isAppleDevice()) {
        return {
            provider: "apple",
            label: "Apple 導航",
            appName: "Apple Maps",
        };
    }
    return {
        provider: "google",
        label: "Google 導航",
        appName: "Google Maps",
    };
}
