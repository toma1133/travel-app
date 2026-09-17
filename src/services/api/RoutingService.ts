export type RouteMode = "driving" | "walking" | "cycling" | "motorcycle" | "direct";

export type RouteResult = {
    distanceMeters: number;
    distanceKm: number;
    distanceFormatted: string;
    durationSeconds: number;
    durationMinutes: number;
    durationFormatted: string;
    coordinates: [number, number][]; // [lat, lng] array formatted for Leaflet
    isEstimated?: boolean;
};

export type MultiStopRouteResult = {
    totalDistanceKm: number;
    totalDistanceFormatted: string;
    totalDurationMinutes: number;
    totalDurationFormatted: string;
    legs: {
        distanceKm: number;
        durationMinutes: number;
        durationFormatted: string;
        distanceFormatted: string;
    }[];
    coordinates: [number, number][]; // [lat, lng] array formatted for Leaflet
    isEstimated?: boolean;
    mode: RouteMode;
};

export type TripOptimizationResult = {
    optimizedOrder: number[]; // Array of originalIndices in the new optimized sequence, e.g. [0, 3, 1, 2]
    originalDistanceKm: number;
    originalDistanceFormatted: string;
    originalDurationMinutes: number;
    originalDurationFormatted: string;
    optimizedDistanceKm: number;
    optimizedDistanceFormatted: string;
    optimizedDurationMinutes: number;
    optimizedDurationFormatted: string;
    savedDistanceKm: number;
    savedDistanceFormatted: string;
    savedDurationMinutes: number;
    savedDurationFormatted: string;
    coordinates: [number, number][]; // [lat, lng] array for Leaflet
    isEstimated?: boolean;
    mode: RouteMode;
};

export type TripOptimizeOptions = {
    mode?: RouteMode;
    fixStart?: boolean; // Default true (source=first in OSRM)
    fixEnd?: boolean;   // Default false (destination=any vs destination=last)
    roundtrip?: boolean;// Default false (one-way day tour vs circular tour)
    fixedIndices?: number[]; // Array of indices in stops that must stay fixed in order
};

// Stadia Maps API Key (Optional, uses Valhalla routing engine with motorcycle/pedestrian costing)
const STADIA_API_KEY = import.meta.env.VITE_STADIA_MAPS_API_KEY?.trim() || "";

/**
 * Decodes a Valhalla 6-decimal precision encoded polyline string into Leaflet coordinates [[lat, lng], ...]
 */
export function decodeValhallaPolyline(encoded: string, precision = 6): [number, number][] {
    let index = 0;
    let lat = 0;
    let lng = 0;
    const coordinates: [number, number][] = [];
    const factor = Math.pow(10, precision);

    while (index < encoded.length) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += dlng;

        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
}

// In-memory cache for route requests to prevent redundant API calls
const routeCache = new Map<string, RouteResult>();
const multiStopCache = new Map<string, MultiStopRouteResult>();

/**
 * Calculate Great-Circle distance between two coordinates in meters (Haversine formula)
 */
export function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin(deltaLambda / 2) *
            Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
}

/**
 * Calculate travel duration in minutes based on real distance and transportation mode.
 * Realistic speeds:
 * - Walking: 4.5 km/h (75 meters / min)
 * - Cycling: 15.0 km/h (250 meters / min)
 * - Motorcycle: ~15% faster than car in urban traffic
 * - Driving: Uses OSRM car routing engine duration (fallback 40 km/h)
 * - Direct: Flight / straight line 500 km/h
 */
export function calculateDurationByMode(
    distanceMeters: number,
    osrmDrivingDurationSeconds: number,
    mode: RouteMode
): number {
    const distanceKm = distanceMeters / 1000;

    switch (mode) {
        case "walking": {
            // 重要：OSRM 公共 Demo 伺服器 (router.project-osrm.org) 後端只部署了「汽車 (car)」單一 Profile。
            // 無論請求 /foot/ 還是 /driving/，OSRM 回傳的 duration 都是汽車秒數！
            // 因此步行時間必須依據實際路網距離，以正常行人均速 4.5 km/h (約 75m/分) 精準換算。
            const mins = (distanceKm / 4.5) * 60;
            return Math.max(1, Math.round(mins));
        }
        case "cycling": {
            // 自行車以城市均速 15 km/h (約 250m/分) 精準換算
            const mins = (distanceKm / 15.0) * 60;
            return Math.max(1, Math.round(mins));
        }
        case "motorcycle": {
            // Motorcycle in city traffic is ~15% faster than car
            const carMins = osrmDrivingDurationSeconds > 0
                ? osrmDrivingDurationSeconds / 60
                : (distanceKm / 40.0) * 60;
            return Math.max(1, Math.round(carMins * 0.85));
        }
        case "direct": {
            const mins = (distanceKm / 500.0) * 60;
            return Math.max(1, Math.round(mins));
        }
        case "driving":
        default: {
            if (osrmDrivingDurationSeconds > 0) {
                return Math.max(1, Math.round(osrmDrivingDurationSeconds / 60));
            }
            const mins = (distanceKm / 40.0) * 60;
            return Math.max(1, Math.round(mins));
        }
    }
}

/**
 * Calculate fallback travel duration in minutes based on distance and mode
 */
export function estimateDurationMinutes(meters: number, mode: RouteMode): number {
    return calculateDurationByMode(meters, 0, mode);
}

/**
 * Format duration in minutes into friendly localized text
 * e.g., 45 -> "約 45 分鐘", 85 -> "約 1 小時 25 分鐘"
 */
export function formatDuration(minutes: number): string {
    if (minutes <= 0) return "0 分鐘";
    if (minutes < 60) return `約 ${minutes} 分鐘`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) return `約 ${hours} 小時`;
    return `約 ${hours} 小時 ${remainingMins} 分鐘`;
}

/**
 * Format distance in meters into friendly text
 * e.g., 600 -> "600 公尺", 5400 -> "5.4 公里"
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} 公尺`;
    }
    const km = meters / 1000;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} 公里`;
}

/**
 * Pure TypeScript 2-Opt local search TSP algorithm (fallback solver when offline or API fails)
 */
export function solve2OptTSP(
    stops: { lat: number; lng: number }[],
    fixStart = true,
    fixEnd = false
): number[] {
    const n = stops.length;
    if (n <= 2) return stops.map((_, i) => i);

    // Build distance matrix
    const distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const d = calculateHaversineDistance(
                stops[i].lat,
                stops[i].lng,
                stops[j].lat,
                stops[j].lng
            );
            distMatrix[i][j] = d;
            distMatrix[j][i] = d;
        }
    }

    // 1. Initial route using Nearest Neighbor
    const visited = new Set<number>();
    const route: number[] = [];

    const startIdx = 0;
    route.push(startIdx);
    visited.add(startIdx);

    if (fixEnd && n > 1) {
        visited.add(n - 1); // reserve last point for the end
    }

    while (route.length < (fixEnd ? n - 1 : n)) {
        const current = route[route.length - 1];
        let nearest = -1;
        let minDist = Infinity;

        for (let i = 0; i < n; i++) {
            if (!visited.has(i) && distMatrix[current][i] < minDist) {
                minDist = distMatrix[current][i];
                nearest = i;
            }
        }

        if (nearest !== -1) {
            route.push(nearest);
            visited.add(nearest);
        } else {
            break;
        }
    }

    if (fixEnd && n > 1) {
        route.push(n - 1);
    }

    // 2. 2-Opt Iterative Improvement (untangling crossed segments)
    let improved = true;
    let iterations = 0;
    const maxIterations = 100;

    const startIndex = fixStart ? 1 : 0;
    const endIndex = fixEnd ? route.length - 2 : route.length - 1;

    const calcTotalDistance = (order: number[]) => {
        let total = 0;
        for (let i = 0; i < order.length - 1; i++) {
            total += distMatrix[order[i]][order[i + 1]];
        }
        return total;
    };

    let bestDist = calcTotalDistance(route);

    while (improved && iterations < maxIterations) {
        improved = false;
        iterations++;

        for (let i = startIndex; i <= endIndex - 1; i++) {
            for (let k = i + 1; k <= endIndex; k++) {
                // Reverse subsegment between i and k
                const newRoute = [
                    ...route.slice(0, i),
                    ...route.slice(i, k + 1).reverse(),
                    ...route.slice(k + 1),
                ];
                const newDist = calcTotalDistance(newRoute);
                if (newDist < bestDist - 1) { // >1 meter improvement
                    bestDist = newDist;
                    for (let idx = 0; idx < route.length; idx++) {
                        route[idx] = newRoute[idx];
                    }
                    improved = true;
                }
            }
        }
    }

    return route;
}

export class RoutingService {
    /**
     * Map app transit mode string to OSRM profile
     */
    static mapTransitModeToProfile(mode?: string): RouteMode {
        switch (mode) {
            case "walk":
                return "walking";
            case "bike":
            case "cycling":
                return "cycling";
            case "motorcycle":
            case "scooter":
                return "motorcycle";
            case "direct":
            case "flight":
                return "direct";
            case "car":
            case "taxi":
            case "bus":
            default:
                return "driving";
        }
    }

    /**
     * Map RouteMode to public OSRM profile endpoint:
     * - "walking" -> "foot" (pedestrian paths, crosswalks, no car U-turn constraints)
     * - "cycling" -> "bicycle"
     * - "driving", "motorcycle", default -> "driving"
     */
    static getOsrmProfile(mode: RouteMode): string {
        switch (mode) {
            case "walking":
                return "foot";
            case "cycling":
                return "bicycle";
            case "driving":
            case "motorcycle":
            default:
                return "driving";
        }
    }

    /**
     * Map RouteMode to Stadia Maps (Valhalla) costing model:
     * - "walking" -> "pedestrian"
     * - "cycling" -> "bicycle"
     * - "motorcycle" -> "motorcycle"
     * - "driving" -> "auto"
     */
    static getValhallaCosting(mode: RouteMode): string {
        switch (mode) {
            case "walking":
                return "pedestrian";
            case "cycling":
                return "bicycle";
            case "motorcycle":
                return "motorcycle";
            case "driving":
            default:
                return "auto";
        }
    }

    /**
     * Fallback multi-stop generator using straight-line geodesic distances
     */
    static generateFallbackMultiStop(
        stops: { lat: number; lng: number }[],
        mode: RouteMode
    ): MultiStopRouteResult {
        let totalDistanceMeters = 0;
        const straightCoords: [number, number][] = stops.map((s) => [s.lat, s.lng]);
        const legs = [];

        for (let i = 0; i < stops.length - 1; i++) {
            const dist = calculateHaversineDistance(
                stops[i].lat,
                stops[i].lng,
                stops[i + 1].lat,
                stops[i + 1].lng
            );
            // Add ~20% routing detour factor for road modes compared to straight line
            const adjustedDist = mode === "direct" ? dist : dist * 1.25;
            totalDistanceMeters += adjustedDist;

            const legMins = calculateDurationByMode(adjustedDist, 0, mode);
            legs.push({
                distanceKm: parseFloat((adjustedDist / 1000).toFixed(2)),
                durationMinutes: legMins,
                durationFormatted: formatDuration(legMins),
                distanceFormatted: formatDistance(adjustedDist),
            });
        }

        const totalMins = calculateDurationByMode(totalDistanceMeters, 0, mode);

        return {
            totalDistanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(2)),
            totalDistanceFormatted: formatDistance(totalDistanceMeters),
            totalDurationMinutes: totalMins,
            totalDurationFormatted: formatDuration(totalMins),
            legs,
            coordinates: straightCoords,
            isEstimated: true,
            mode,
        };
    }

    /**
     * Query route between two points
     */
    static async getRoute(
        start: { lat: number; lng: number },
        end: { lat: number; lng: number },
        mode: RouteMode = "driving"
    ): Promise<RouteResult | null> {
        const cacheKey = `${start.lat.toFixed(5)},${start.lng.toFixed(5)}-${end.lat.toFixed(5)},${end.lng.toFixed(5)}-${mode}`;
        if (routeCache.has(cacheKey)) {
            return routeCache.get(cacheKey)!;
        }

        if (mode === "direct") {
            const dist = calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng);
            const durationMins = calculateDurationByMode(dist, 0, "direct");
            const result: RouteResult = {
                distanceMeters: dist,
                distanceKm: parseFloat((dist / 1000).toFixed(2)),
                distanceFormatted: formatDistance(dist),
                durationSeconds: durationMins * 60,
                durationMinutes: durationMins,
                durationFormatted: formatDuration(durationMins),
                coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
                isEstimated: true,
            };
            routeCache.set(cacheKey, result);
            return result;
        }

        // 1. Try Stadia Maps Valhalla routing engine if API Key configured
        if (STADIA_API_KEY) {
            try {
                const costing = this.getValhallaCosting(mode);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                const response = await fetch(`https://api.stadiamaps.com/route/v1?api_key=${STADIA_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        locations: [
                            { lat: start.lat, lon: start.lng },
                            { lat: end.lat, lon: end.lng },
                        ],
                        costing,
                        directions_options: { units: "kilometers" },
                    }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data.trip && data.trip.summary) {
                        const distanceKm = data.trip.summary.length || 0;
                        const distanceMeters = Math.round(distanceKm * 1000);
                        const durationSeconds = Math.round(data.trip.summary.time || 0);
                        const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
                        const coordinates: [number, number][] = (data.trip.legs || []).flatMap((leg: any) =>
                            leg.shape ? decodeValhallaPolyline(leg.shape) : []
                        );

                        const result: RouteResult = {
                            distanceMeters,
                            distanceKm: parseFloat(distanceKm.toFixed(2)),
                            distanceFormatted: formatDistance(distanceMeters),
                            durationSeconds,
                            durationMinutes,
                            durationFormatted: formatDuration(durationMinutes),
                            coordinates: coordinates.length > 0 ? coordinates : [[start.lat, start.lng], [end.lat, end.lng]],
                            isEstimated: false,
                        };
                        routeCache.set(cacheKey, result);
                        return result;
                    }
                }
            } catch (err) {
                console.warn("Stadia Valhalla route query failed, falling back to OSRM:", err);
            }
        }

        // 2. Fallback to OSRM public server
        try {
            const profile = this.getOsrmProfile(mode);
            const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
            const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=false`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                return this.getFallbackRoute(start, end, mode, cacheKey);
            }

            const data = await response.json();
            if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
                return this.getFallbackRoute(start, end, mode, cacheKey);
            }

            const route = data.routes[0];
            const distanceMeters = route.distance || 0;
            const osrmDurationSeconds = route.duration || 0;

            const haversineDist = calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng);
            let effectiveDistance = distanceMeters;
            const rawCoords: [number, number][] = route.geometry?.coordinates || [];
            let leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

            // 若為步行模式且兩點直線距離很近 (< 600m)，但因 OSRM 汽車路網禁止迴轉/單行道導致繞路超過 2.5 倍：
            // 自動修正為行人合理穿越距離，並避免地圖上畫出車輛大迴轉的荒謬軌跡
            if (mode === "walking" && haversineDist < 600 && distanceMeters > haversineDist * 2.5) {
                effectiveDistance = haversineDist * 1.25;
                leafletCoords = [[start.lat, start.lng], [end.lat, end.lng]];
            }

            const durationMinutes = calculateDurationByMode(effectiveDistance, osrmDurationSeconds, mode);

            const result: RouteResult = {
                distanceMeters: effectiveDistance,
                distanceKm: parseFloat((effectiveDistance / 1000).toFixed(2)),
                distanceFormatted: formatDistance(effectiveDistance),
                durationSeconds: durationMinutes * 60,
                durationMinutes,
                durationFormatted: formatDuration(durationMinutes),
                coordinates: leafletCoords,
                isEstimated: false,
            };

            routeCache.set(cacheKey, result);
            return result;
        } catch {
            return this.getFallbackRoute(start, end, mode, cacheKey);
        }
    }

    private static getFallbackRoute(
        start: { lat: number; lng: number },
        end: { lat: number; lng: number },
        mode: RouteMode,
        cacheKey: string
    ): RouteResult {
        const dist = calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng) * 1.25;
        const durationMins = calculateDurationByMode(dist, 0, mode);
        const result: RouteResult = {
            distanceMeters: dist,
            distanceKm: parseFloat((dist / 1000).toFixed(2)),
            distanceFormatted: formatDistance(dist),
            durationSeconds: durationMins * 60,
            durationMinutes: durationMins,
            durationFormatted: formatDuration(durationMins),
            coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
            isEstimated: true,
        };
        routeCache.set(cacheKey, result);
        return result;
    }

    /**
     * Query OSRM routing API for a multi-stop itinerary route
     * @param stops Array of coordinates [{ lat, lng }]
     * @param mode 'driving' | 'walking' | 'cycling' | 'motorcycle' | 'direct'
     */
    static async getMultiStopRoute(
        stops: { lat: number; lng: number }[],
        mode: RouteMode = "driving"
    ): Promise<MultiStopRouteResult | null> {
        if (!stops || stops.length < 2) return null;

        const cacheKey = `${stops.map((s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join(";")}-${mode}`;
        if (multiStopCache.has(cacheKey)) {
            return multiStopCache.get(cacheKey)!;
        }

        // Direct mode uses geodesic straight lines immediately
        if (mode === "direct") {
            const directResult = this.generateFallbackMultiStop(stops, "direct");
            multiStopCache.set(cacheKey, directResult);
            return directResult;
        }

        // 1. Try Stadia Maps Valhalla routing engine if API Key configured
        if (STADIA_API_KEY) {
            try {
                const costing = this.getValhallaCosting(mode);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 7000);
                const response = await fetch(`https://api.stadiamaps.com/route/v1?api_key=${STADIA_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        locations: stops.map((s) => ({ lat: s.lat, lon: s.lng })),
                        costing,
                        directions_options: { units: "kilometers" },
                    }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data.trip && data.trip.summary) {
                        const totalDistanceKm = data.trip.summary.length || 0;
                        const totalDistanceMeters = Math.round(totalDistanceKm * 1000);
                        const totalSeconds = Math.round(data.trip.summary.time || 0);
                        const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));

                        const legs = (data.trip.legs || []).map((leg: any) => {
                            const legKm = leg.summary?.length || 0;
                            const legMeters = Math.round(legKm * 1000);
                            const legSecs = Math.round(leg.summary?.time || 0);
                            const legMins = Math.max(1, Math.round(legSecs / 60));
                            return {
                                distanceKm: parseFloat(legKm.toFixed(2)),
                                durationMinutes: legMins,
                                durationFormatted: formatDuration(legMins),
                                distanceFormatted: formatDistance(legMeters),
                            };
                        });

                        const coordinates: [number, number][] = (data.trip.legs || []).flatMap((leg: any) =>
                            leg.shape ? decodeValhallaPolyline(leg.shape) : []
                        );

                        const result: MultiStopRouteResult = {
                            totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
                            totalDistanceFormatted: formatDistance(totalDistanceMeters),
                            totalDurationMinutes: totalMinutes,
                            totalDurationFormatted: formatDuration(totalMinutes),
                            legs,
                            coordinates: coordinates.length > 0 ? coordinates : stops.map((s) => [s.lat, s.lng]),
                            isEstimated: false,
                            mode,
                        };
                        multiStopCache.set(cacheKey, result);
                        return result;
                    }
                }
            } catch (err) {
                console.warn("Stadia Valhalla multi-stop routing query failed, falling back to OSRM:", err);
            }
        }

        // 2. Fallback to OSRM multi-stop road network
        try {
            // Use OSRM road network for specific profile (foot / bicycle / driving)
            const profile = this.getOsrmProfile(mode);
            const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
            const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=false`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const fallback = this.generateFallbackMultiStop(stops, mode);
                multiStopCache.set(cacheKey, fallback);
                return fallback;
            }

            const data = await response.json();
            if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
                const fallback = this.generateFallbackMultiStop(stops, mode);
                multiStopCache.set(cacheKey, fallback);
                return fallback;
            }

            const route = data.routes[0];
            const totalDistanceMeters = route.distance || 0;
            const totalOsrmSeconds = route.duration || 0;

            const rawCoords: [number, number][] = route.geometry?.coordinates || [];
            const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

            let adjustedTotalMeters = 0;
            const legs = (route.legs || []).map((leg: any, idx: number) => {
                let legMeters = leg.distance || 0;
                if (mode === "walking" && idx < stops.length - 1) {
                    const straight = calculateHaversineDistance(
                        stops[idx].lat,
                        stops[idx].lng,
                        stops[idx + 1].lat,
                        stops[idx + 1].lng
                    );
                    if (straight < 600 && legMeters > straight * 2.5) {
                        legMeters = straight * 1.25;
                    }
                }
                adjustedTotalMeters += legMeters;
                const legOsrmSeconds = leg.duration || 0;
                const legMinutes = calculateDurationByMode(legMeters, legOsrmSeconds, mode);

                return {
                    distanceKm: parseFloat((legMeters / 1000).toFixed(2)),
                    durationMinutes: legMinutes,
                    durationFormatted: formatDuration(legMinutes),
                    distanceFormatted: formatDistance(legMeters),
                };
            });

            const finalDistanceMeters = mode === "walking" && adjustedTotalMeters > 0 ? adjustedTotalMeters : totalDistanceMeters;
            const totalDurationMinutes = calculateDurationByMode(finalDistanceMeters, totalOsrmSeconds, mode);

            const result: MultiStopRouteResult = {
                totalDistanceKm: parseFloat((finalDistanceMeters / 1000).toFixed(2)),
                totalDistanceFormatted: formatDistance(finalDistanceMeters),
                totalDurationMinutes,
                totalDurationFormatted: formatDuration(totalDurationMinutes),
                legs,
                coordinates: leafletCoords,
                isEstimated: false,
                mode,
            };

            multiStopCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.warn("OSRM routing failed or timed out, using fallback calculation:", error);
            const fallback = this.generateFallbackMultiStop(stops, mode);
            multiStopCache.set(cacheKey, fallback);
            return fallback;
        }
    }

    /**
     * Solve TSP on a single continuous segment of stops (using Stadia Valhalla, OSRM Trip, or 2-Opt)
     */
    private static async solveSingleSubsegment(
        stops: { lat: number; lng: number }[],
        options: { mode: RouteMode; fixStart: boolean; fixEnd: boolean; roundtrip?: boolean }
    ): Promise<number[]> {
        const n = stops.length;
        if (n <= 2) return stops.map((_, i) => i);

        const { mode, fixStart, fixEnd, roundtrip } = options;

        // 1. Try Stadia Maps Valhalla optimized_route API
        if (STADIA_API_KEY && mode !== "direct") {
            try {
                const costing = this.getValhallaCosting(mode);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6500);

                const res = await fetch(`https://api.stadiamaps.com/optimized_route/v1?api_key=${STADIA_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        locations: stops.map((s) => ({ lat: s.lat, lon: s.lng })),
                        costing,
                        directions_options: { units: "kilometers" },
                    }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data.trip && Array.isArray(data.trip.locations)) {
                        const order: number[] = data.trip.locations.map((loc: any) => loc.original_index);
                        const isValid = order.length === n && new Set(order).size === n;
                        if (isValid) {
                            if ((!fixStart || order[0] === 0) && (!fixEnd || order[order.length - 1] === n - 1)) {
                                return order;
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn("Stadia Valhalla optimized_route failed, falling back to OSRM Trip:", e);
            }
        }

        // 2. Try OSRM Trip API
        try {
            const sourceParam = fixStart ? "source=first" : "source=any";
            const destParam = fixEnd ? "destination=last" : "destination=any";
            const roundParam = roundtrip ? "roundtrip=true" : "roundtrip=false";
            const profile = this.getOsrmProfile(mode);
            const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
            const url = `https://router.project-osrm.org/trip/v1/${profile}/${coords}?${sourceParam}&${destParam}&${roundParam}&overview=full&geometries=geojson&steps=false`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6500);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.code === "Ok" && data.waypoints && data.waypoints.length === n) {
                    const optimizedOrder: number[] = new Array(n);
                    data.waypoints.forEach((wp: any, origIdx: number) => {
                        if (typeof wp.waypoint_index === "number") {
                            optimizedOrder[wp.waypoint_index] = origIdx;
                        }
                    });
                    const isValidOrder = optimizedOrder.every((idx) => typeof idx === "number" && idx >= 0);
                    if (isValidOrder) {
                        return optimizedOrder;
                    }
                }
            }
        } catch (error) {
            console.warn("OSRM Trip Service API call failed, falling back to 2-Opt TSP:", error);
        }

        // 3. Fallback: Pure TypeScript 2-Opt TSP Algorithm
        return solve2OptTSP(stops, fixStart, fixEnd);
    }

    /**
     * Optimize Day Itinerary Route with Segmented Anchor Support
     * Supports pinned/fixed stops (e.g. hotel check-in/drop luggage, fixed reservations)
     * Returns optimized activity ordering, before-after distance/duration comparison, and coordinates.
     */
    static async optimizeDayItinerary(
        stops: { lat: number; lng: number }[],
        options: TripOptimizeOptions = {}
    ): Promise<TripOptimizationResult | null> {
        if (!stops || stops.length < 2) return null;

        const mode = options.mode || "driving";
        const fixStart = options.fixStart !== false; // default true
        const fixEnd = !!options.fixEnd;             // default false
        const roundtrip = !!options.roundtrip;       // default false
        const fixedIndices = options.fixedIndices || [];

        // 1. Calculate original route baseline
        const origResult = await this.getMultiStopRoute(stops, mode);
        const originalDistanceKm = origResult?.totalDistanceKm || 0;
        const originalDurationMinutes = origResult?.totalDurationMinutes || 0;

        const n = stops.length;

        // Build list of fixed anchor indices
        const anchorSet = new Set<number>();
        if (fixStart) anchorSet.add(0);
        if (fixEnd) anchorSet.add(n - 1);
        fixedIndices.forEach((idx) => {
            if (idx >= 0 && idx < n) anchorSet.add(idx);
        });

        let finalOptimizedOrder: number[] = [];

        // If no intermediate anchors (only start/end or none), solve globally in 1 segment
        const intermediateAnchors = Array.from(anchorSet).filter((idx) => idx !== 0 && idx !== n - 1);

        if (intermediateAnchors.length === 0) {
            finalOptimizedOrder = await this.solveSingleSubsegment(stops, {
                mode,
                fixStart,
                fixEnd,
                roundtrip,
            });
        } else {
            // Segmented optimization: Sort all anchors in ascending order
            const sortedAnchors = Array.from(anchorSet).sort((a, b) => a - b);

            const segments: { startIdx: number; endIdx: number; fixStart: boolean; fixEnd: boolean }[] = [];

            // Case: If 0 is not an anchor, there's a segment before first anchor
            if (sortedAnchors[0] > 0) {
                segments.push({
                    startIdx: 0,
                    endIdx: sortedAnchors[0],
                    fixStart: false,
                    fixEnd: true,
                });
            }

            // Between each pair of anchors
            for (let i = 0; i < sortedAnchors.length - 1; i++) {
                segments.push({
                    startIdx: sortedAnchors[i],
                    endIdx: sortedAnchors[i + 1],
                    fixStart: true,
                    fixEnd: true,
                });
            }

            // Case: After last anchor to n - 1
            const lastAnchor = sortedAnchors[sortedAnchors.length - 1];
            if (lastAnchor < n - 1) {
                segments.push({
                    startIdx: lastAnchor,
                    endIdx: n - 1,
                    fixStart: true,
                    fixEnd: fixEnd,
                });
            }

            // Solve each segment and stitch
            for (let sIdx = 0; sIdx < segments.length; sIdx++) {
                const seg = segments[sIdx];
                const subStops = stops.slice(seg.startIdx, seg.endIdx + 1);

                if (subStops.length <= 2) {
                    const subOrder = subStops.map((_, i) => seg.startIdx + i);
                    if (sIdx === 0) {
                        finalOptimizedOrder.push(...subOrder);
                    } else {
                        finalOptimizedOrder.push(...subOrder.slice(1));
                    }
                } else {
                    const subOrder = await this.solveSingleSubsegment(subStops, {
                        mode,
                        fixStart: seg.fixStart,
                        fixEnd: seg.fixEnd,
                    });
                    const mappedOrder = subOrder.map((localIdx) => seg.startIdx + localIdx);
                    if (sIdx === 0) {
                        finalOptimizedOrder.push(...mappedOrder);
                    } else {
                        finalOptimizedOrder.push(...mappedOrder.slice(1));
                    }
                }
            }
        }

        // Safety check: ensure finalOptimizedOrder is a valid permutation of [0 .. n-1]
        if (
            finalOptimizedOrder.length !== n ||
            new Set(finalOptimizedOrder).size !== n ||
            !finalOptimizedOrder.every((idx) => typeof idx === "number" && idx >= 0 && idx < n)
        ) {
            finalOptimizedOrder = solve2OptTSP(stops, fixStart, fixEnd);
        }

        // Calculate final route geometry and metrics using the optimized order
        const reorderedStops = finalOptimizedOrder.map((idx) => stops[idx]);
        const optimizedRoute = await this.getMultiStopRoute(reorderedStops, mode);

        const optimizedDistanceKm = optimizedRoute?.totalDistanceKm || 0;
        const optimizedDurationMinutes = optimizedRoute?.totalDurationMinutes || 0;

        const savedDistanceKm = Math.max(0, parseFloat((originalDistanceKm - optimizedDistanceKm).toFixed(2)));
        const savedDurationMinutes = Math.max(0, originalDurationMinutes - optimizedDurationMinutes);

        return {
            optimizedOrder: finalOptimizedOrder,
            originalDistanceKm,
            originalDistanceFormatted: origResult?.totalDistanceFormatted || `${originalDistanceKm} 公里`,
            originalDurationMinutes,
            originalDurationFormatted: origResult?.totalDurationFormatted || formatDuration(originalDurationMinutes),
            optimizedDistanceKm,
            optimizedDistanceFormatted: optimizedRoute?.totalDistanceFormatted || `${optimizedDistanceKm} 公里`,
            optimizedDurationMinutes,
            optimizedDurationFormatted: optimizedRoute?.totalDurationFormatted || formatDuration(optimizedDurationMinutes),
            savedDistanceKm,
            savedDistanceFormatted: formatDistance(savedDistanceKm * 1000),
            savedDurationMinutes,
            savedDurationFormatted: formatDuration(savedDurationMinutes),
            coordinates: optimizedRoute?.coordinates || [],
            isEstimated: optimizedRoute?.isEstimated,
            mode,
        };
    }
}
