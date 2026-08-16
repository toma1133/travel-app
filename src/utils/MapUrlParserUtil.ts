/**
 * Map URL & Coordinate Parsing Utility
 * Supports Google Maps, Apple Maps, Naver Map (네이버 지도), and Kakao Map (카카오맵)
 */

export type ParsedMapResult = {
    source: "Google Maps" | "Apple Maps" | "Naver Map" | "Kakao Map" | "Direct Coordinate" | "Unknown";
    lat: number;
    lng: number;
    placeName?: string;
    placeId?: string;
    originalUrl: string;
};

/**
 * Heuristic check if coordinate values match South Korea geographic boundaries
 * (Lat ~33.0 to ~39.0, Lng ~124.0 to ~132.0)
 */
function isKoreaLatitude(lat: number): boolean {
    return lat >= 33.0 && lat <= 39.5;
}

function isKoreaLongitude(lng: number): boolean {
    return lng >= 124.0 && lng <= 132.5;
}

/**
 * Parse any Map URL or text string to extract GPS coordinates (lat, lng) and metadata
 */
export function parseMapUrl(url: string): ParsedMapResult | null {
    if (!url || !url.trim()) return null;
    const cleanUrl = url.trim();

    try {
        // =========================================================================
        // 1. 🇰🇷 Naver Map (네이버 지도) - map.naver.com, m.map.naver.com, naver.me, nmap://
        // =========================================================================
        if (
            cleanUrl.includes("naver.com") ||
            cleanUrl.includes("naver.me") ||
            cleanUrl.startsWith("nmap:")
        ) {
            let lat: number | null = null;
            let lng: number | null = null;
            let placeName: string | undefined;
            let placeId: string | undefined;

            // 1.1 嘗試從 URL query 參數提取 lat / lng / x / y
            try {
                // 如果沒有 protocol，補上 https:// 方便 URL 物件解析
                const parseableUrl = cleanUrl.startsWith("http")
                    ? cleanUrl
                    : `https://${cleanUrl.replace(/^\/\//, "")}`;
                const urlObj = new URL(parseableUrl);
                const params = urlObj.searchParams;

                // 檢查 lat / lng 參數 (大小寫皆有支援)
                const paramLat = params.get("lat") || params.get("latitude") || params.get("y");
                const paramLng = params.get("lng") || params.get("longitude") || params.get("x");

                if (paramLat && paramLng) {
                    const parsedLat = parseFloat(paramLat);
                    const parsedLng = parseFloat(paramLng);
                    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                        lat = parsedLat;
                        lng = parsedLng;
                    }
                }

                // 檢查 query 名稱或名稱參數
                const queryName = params.get("name") || params.get("query") || params.get("q") || params.get("title");
                if (queryName) {
                    placeName = decodeURIComponent(queryName);
                }

                // 檢查 pinId / code
                const code = params.get("code") || params.get("pinId") || params.get("id");
                if (code) {
                    placeId = code;
                }

                // 1.2 檢查 Naver 特有的 c= 參數 (例如 c=15.00,126.9780,37.5665,0,0,0,dh 或 c=126.9780,37.5665)
                const cParam = params.get("c");
                if (cParam && (lat === null || lng === null)) {
                    const numbers = cParam
                        .split(",")
                        .map((n) => parseFloat(n.trim()))
                        .filter((n) => !isNaN(n));

                    // 智慧識別韓國經緯度數值特徵 (Lat ~33-39, Lng ~124-132)
                    let foundLat: number | null = null;
                    let foundLng: number | null = null;

                    for (const num of numbers) {
                        if (foundLat === null && isKoreaLatitude(num)) {
                            foundLat = num;
                        } else if (foundLng === null && isKoreaLongitude(num)) {
                            foundLng = num;
                        }
                    }

                    if (foundLat !== null && foundLng !== null) {
                        lat = foundLat;
                        lng = foundLng;
                    } else if (numbers.length >= 2) {
                        // 若不在韓國範圍 (如海外)，依常規順序判斷
                        // Naver c 參數通常為 (zoom, lng, lat) 或 (lng, lat)
                        if (numbers.length >= 3) {
                            lng = numbers[1];
                            lat = numbers[2];
                        } else {
                            lng = numbers[0];
                            lat = numbers[1];
                        }
                    }
                }

                // 1.3 嘗試從路徑中提取地名與 Place ID (如 /p/search/{query}/place/{id} 或 /p/entry/place/{id})
                const pathParts = urlObj.pathname.split("/").filter(Boolean);
                const searchIdx = pathParts.indexOf("search");
                if (searchIdx !== -1 && pathParts[searchIdx + 1]) {
                    try {
                        placeName = decodeURIComponent(pathParts[searchIdx + 1]);
                    } catch (e) {
                        placeName = pathParts[searchIdx + 1];
                    }
                }

                const placeIdx = pathParts.indexOf("place");
                if (placeIdx !== -1 && pathParts[placeIdx + 1]) {
                    placeId = pathParts[placeIdx + 1];
                }
            } catch (e) {
                // Ignore URL parse error, fallback to regex
            }

            // 1.4 Regex Fallback: 在網址字串中尋找 c= 或經緯度
            if (lat === null || lng === null) {
                const cMatch = cleanUrl.match(/[?&]c=([^&#]+)/);
                if (cMatch) {
                    const numbers = cMatch[1]
                        .split(",")
                        .map((n) => parseFloat(n.trim()))
                        .filter((n) => !isNaN(n));

                    for (const num of numbers) {
                        if (lat === null && isKoreaLatitude(num)) lat = num;
                        if (lng === null && isKoreaLongitude(num)) lng = num;
                    }
                }
            }

            // 1.5 若成功解析出非零有效經緯度
            if (
                lat !== null &&
                lng !== null &&
                !isNaN(lat) &&
                !isNaN(lng) &&
                !(lat === 0 && lng === 0)
            ) {
                return {
                    source: "Naver Map",
                    lat,
                    lng,
                    placeName,
                    placeId,
                    originalUrl: cleanUrl,
                };
            }

            // 1.6 若雖為 Naver 網址但為 c=15.00,0,0,0 等未帶座標網址，回傳帶有 placeId/placeName 的結構 (經緯度為 0 供上層判定)
            return null;
        }

        // =========================================================================
        // 2. 🇰🇷 Kakao Map (카카오맵) - map.kakao.com, kko.to
        // =========================================================================
        if (cleanUrl.includes("kakao.com") || cleanUrl.includes("kko.to")) {
            // 2.1 尋找 link/map/{name},{lat},{lng} 或 link/to/{name},{lat},{lng}
            const kakaoLinkMatch = cleanUrl.match(/link\/(?:map|to)\/([^,]+),(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (kakaoLinkMatch) {
                return {
                    source: "Kakao Map",
                    lat: parseFloat(kakaoLinkMatch[2]),
                    lng: parseFloat(kakaoLinkMatch[3]),
                    placeName: decodeURIComponent(kakaoLinkMatch[1]),
                    originalUrl: cleanUrl,
                };
            }

            // 2.2 檢查 query 參數 (?q=lat,lng 或 ?urlX=...&urlY=...)
            try {
                const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
                const qParam = urlObj.searchParams.get("q");
                if (qParam && qParam.includes(",")) {
                    const [p1, p2] = qParam.split(",").map((s) => parseFloat(s.trim()));
                    if (!isNaN(p1) && !isNaN(p2)) {
                        return {
                            source: "Kakao Map",
                            lat: p1,
                            lng: p2,
                            originalUrl: cleanUrl,
                        };
                    }
                }
            } catch (e) {
                // Ignore
            }
        }

        // =========================================================================
        // 3. 🍎 Apple Maps - maps.apple.com
        // =========================================================================
        if (cleanUrl.includes("maps.apple.com")) {
            try {
                const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
                const params = urlObj.searchParams;

                const coordinate =
                    params.get("coordinate") ||
                    params.get("ll") ||
                    params.get("sll") ||
                    params.get("center");

                if (coordinate && coordinate.includes(",")) {
                    const [p1, p2] = coordinate.split(",").map((s) => parseFloat(s.trim()));
                    if (!isNaN(p1) && !isNaN(p2)) {
                        return {
                            source: "Apple Maps",
                            lat: p1,
                            lng: p2,
                            placeName: params.get("q") ? decodeURIComponent(params.get("q")!) : undefined,
                            originalUrl: cleanUrl,
                        };
                    }
                }

                const qParam = params.get("q");
                if (qParam && qParam.includes(",")) {
                    const [p1, p2] = qParam.split(",").map((s) => parseFloat(s.trim()));
                    if (!isNaN(p1) && !isNaN(p2)) {
                        return {
                            source: "Apple Maps",
                            lat: p1,
                            lng: p2,
                            originalUrl: cleanUrl,
                        };
                    }
                }
            } catch (e) {
                // Ignore
            }
        }

        // =========================================================================
        // 4. 🌐 Google Maps - google.com/maps, maps.app.goo.gl, goo.gl/maps
        // =========================================================================
        if (cleanUrl.includes("google") && cleanUrl.includes("maps")) {
            // 4.1 視窗中心點 (@lat,lng)
            const atMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (atMatch) {
                return {
                    source: "Google Maps",
                    lat: parseFloat(atMatch[1]),
                    lng: parseFloat(atMatch[2]),
                    originalUrl: cleanUrl,
                };
            }

            // 4.2 圖釘資料 (!3dlat!4dlng)
            const latPinMatch = cleanUrl.match(/!3d(-?\d+\.\d+)/);
            const lngPinMatch = cleanUrl.match(/!4d(-?\d+\.\d+)/);
            if (latPinMatch && lngPinMatch) {
                return {
                    source: "Google Maps",
                    lat: parseFloat(latPinMatch[1]),
                    lng: parseFloat(lngPinMatch[2]),
                    originalUrl: cleanUrl,
                };
            }

            // 4.3 搜尋參數 (?q=lat,lng 或 ?center=lat,lng 或 ?ll=lat,lng)
            try {
                const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
                const q = urlObj.searchParams.get("q") || urlObj.searchParams.get("center") || urlObj.searchParams.get("ll");
                if (q && q.includes(",")) {
                    const [p1, p2] = q.split(",").map((s) => parseFloat(s.trim()));
                    if (!isNaN(p1) && !isNaN(p2)) {
                        return {
                            source: "Google Maps",
                            lat: p1,
                            lng: p2,
                            originalUrl: cleanUrl,
                        };
                    }
                }
            } catch (e) {
                // Ignore
            }
        }

        // =========================================================================
        // 5. 📍 通用經緯度格式解析 (例: "37.5665, 126.9780" 或 "37.5665,126.9780")
        // =========================================================================
        const directCoordMatch = cleanUrl.match(/(-?\d{1,3}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/);
        if (directCoordMatch) {
            const p1 = parseFloat(directCoordMatch[1]);
            const p2 = parseFloat(directCoordMatch[2]);
            if (!isNaN(p1) && !isNaN(p2)) {
                // 檢查是否需調整經緯度順序 (Latitude -90~90, Longitude -180~180)
                let latVal = p1;
                let lngVal = p2;
                if (Math.abs(p1) > 90 && Math.abs(p2) <= 90) {
                    latVal = p2;
                    lngVal = p1;
                }

                return {
                    source: "Direct Coordinate",
                    lat: latVal,
                    lng: lngVal,
                    originalUrl: cleanUrl,
                };
            }
        }
    } catch (err) {
        console.error("Error parsing map URL:", err);
    }

    return null;
}
