/**
 * NavigationUtil.ts
 * 一鍵導航快捷工具 (Smart Navigation Utilities)
 * 自動依使用者裝置（iOS / Android / Desktop）與地點資訊開啟原生 Apple Maps、Google Maps 或亞洲本地地圖 (Naver/Kakao)。
 */

import {
    isAppleDevice,
    getAppleMapsUrl,
    getGoogleMapsUrl,
    getNaverMapsUrl,
    getKakaoMapsUrl,
    getSmartNavigationUrl,
    getSmartNavigationLabel,
    type NavigationTarget,
} from "./MapNavigationUtil";

export type { NavigationTarget };
export {
    isAppleDevice,
    getAppleMapsUrl,
    getGoogleMapsUrl,
    getNaverMapsUrl,
    getKakaoMapsUrl,
    getSmartNavigationUrl,
    getSmartNavigationLabel,
};

/**
 * 取得一鍵路線導航網址 (Directions / Turn-by-turn Navigation URL)
 * 優先導引到「路線規劃」而非單純地標查看
 */
export function getDirectionsUrl(target: NavigationTarget): string {
    const isApple = isAppleDevice();
    const destName = target.name || "目的地";
    const destLoc = target.loc || "";
    const hasCoords = typeof target.lat === "number" && typeof target.lng === "number";

    // 自訂地圖連結優先 (Naver / Kakao 等)
    if (target.customUrl?.trim()) {
        const custom = target.customUrl.trim();
        if (custom.includes("naver.com") || custom.includes("naver.me") || custom.startsWith("nmap:")) {
            return custom;
        }
        if (custom.includes("kakao.com") || custom.includes("kko.to")) {
            return custom;
        }
        if (isApple && /maps\.apple\.com/i.test(custom)) {
            return custom;
        }
    }

    if (isApple) {
        // Apple Maps Directions URL Scheme
        // daddr: Destination Address or Lat,Lng
        if (hasCoords) {
            return `https://maps.apple.com/?daddr=${target.lat},${target.lng}&q=${encodeURIComponent(destName)}&dirflg=d`;
        }
        const query = destLoc ? `${destName} ${destLoc}` : destName;
        return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=d`;
    }

    // Google Maps Directions URL Scheme
    if (hasCoords) {
        return `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&destination_place_id=&travelmode=transit`;
    }
    const query = destLoc ? `${destName} ${destLoc}` : destName;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=transit`;
}

/**
 * 一鍵開啟導航 (Open Navigation in Maps App or Browser)
 */
export function openNavigation(target: NavigationTarget, preferDirections = true): void {
    if (typeof window === "undefined") return;

    const url = preferDirections ? getDirectionsUrl(target) : getSmartNavigationUrl(target);
    window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * 導航按鈕標籤與圖示建議
 */
export function getNavigationBadgeInfo(target: NavigationTarget): {
    provider: "apple" | "google" | "naver" | "kakao";
    label: string;
    appName: string;
} {
    return getSmartNavigationLabel(target.customUrl);
}
