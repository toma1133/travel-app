/**
 * Map Navigation Utilities
 * Provides smart device detection for Apple Maps / Google Maps / Naver Map / Kakao Map
 */

export type NavigationTarget = {
    name: string;
    loc?: string | null;
    lat?: number | null;
    lng?: number | null;
    customUrl?: string | null;
};

/**
 * Detects if the current user is on an Apple device (iOS, iPadOS, macOS)
 */
export function isAppleDevice(): boolean {
    if (typeof window === "undefined" || !navigator) return false;

    const userAgent = navigator.userAgent || navigator.vendor || "";

    // 1. iPhone & iPod
    const isIOS = /iPhone|iPod/i.test(userAgent);

    // 2. iPad (including modern iPadOS that reports as MacIntel with touch support)
    const isIPad =
        /iPad/i.test(userAgent) ||
        (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);

    // 3. macOS (strictly check that it is not iPad)
    const isMac = /Macintosh|Mac OS X/i.test(userAgent) && !isIPad;

    return isIOS || isIPad || isMac;
}

/**
 * Generate Naver Map Link (Web & App compatible)
 */
export function getNaverMapsUrl(target: NavigationTarget): string {
    if (typeof target.lat === "number" && typeof target.lng === "number") {
        return `https://map.naver.com/p/search/${encodeURIComponent(target.name)}?c=15.00,${target.lng},${target.lat},0,0,0,dh`;
    }
    return `https://map.naver.com/p/search/${encodeURIComponent(target.name)}`;
}

/**
 * Generate Kakao Map Link
 */
export function getKakaoMapsUrl(target: NavigationTarget): string {
    if (typeof target.lat === "number" && typeof target.lng === "number") {
        return `https://map.kakao.com/link/map/${encodeURIComponent(target.name)},${target.lat},${target.lng}`;
    }
    return `https://map.kakao.com/link/search/${encodeURIComponent(target.name)}`;
}

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
    if (typeof target.lat === "number" && typeof target.lng === "number") {
        return `https://www.google.com/maps/search/?api=1&query=${encoded}&query_place_id=&center=${target.lat},${target.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * Smart Navigation Link - Automatically picks appropriate map provider
 * 
 * If a customUrl is provided:
 * - Naver Map links (map.naver.com, naver.me, nmap://) are preserved for seamless Korean travel navigation
 * - Kakao Map links (map.kakao.com, kko.to) are preserved
 * - Apple Maps links convert to Google Maps on non-Apple devices
 */
export function getSmartNavigationUrl(target: NavigationTarget): string {
    const isApple = isAppleDevice();
    const custom = target.customUrl?.trim();

    if (custom) {
        // 1. Naver Map
        if (custom.includes("naver.com") || custom.includes("naver.me") || custom.startsWith("nmap:")) {
            return custom;
        }

        // 2. Kakao Map
        if (custom.includes("kakao.com") || custom.includes("kko.to")) {
            return custom;
        }

        // 3. Apple Maps
        const isAppleUrl = /maps\.apple\.com/i.test(custom);
        if (isApple) {
            return custom;
        } else {
            // Non-Apple device fallback
            if (isAppleUrl) {
                return getGoogleMapsUrl(target);
            }
            return custom;
        }
    }

    return isApple ? getAppleMapsUrl(target) : getGoogleMapsUrl(target);
}

/**
 * Smart Navigation Label & Metadata
 */
export function getSmartNavigationLabel(customUrl?: string | null): {
    provider: "apple" | "google" | "naver" | "kakao";
    label: string;
    appName: string;
} {
    const custom = customUrl?.trim();
    if (custom) {
        if (custom.includes("naver.com") || custom.includes("naver.me") || custom.startsWith("nmap:")) {
            return {
                provider: "naver",
                label: "Naver 導航",
                appName: "Naver Map",
            };
        }
        if (custom.includes("kakao.com") || custom.includes("kko.to")) {
            return {
                provider: "kakao",
                label: "Kakao 導航",
                appName: "Kakao Map",
            };
        }
    }

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
