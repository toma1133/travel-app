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
};

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
            // Standard human walking speed: 4.5 km/h
            const mins = (distanceKm / 4.5) * 60;
            return Math.max(1, Math.round(mins));
        }
        case "cycling": {
            // Standard city cycling speed: 15 km/h
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

        try {
            // OSRM public server provides reliable road network routing on driving profile
            const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

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
            const durationMinutes = calculateDurationByMode(distanceMeters, osrmDurationSeconds, mode);

            const rawCoords: [number, number][] = route.geometry?.coordinates || [];
            const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

            const result: RouteResult = {
                distanceMeters,
                distanceKm: parseFloat((distanceMeters / 1000).toFixed(2)),
                distanceFormatted: formatDistance(distanceMeters),
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

        try {
            // Use OSRM driving road network, then convert duration based on specific mode speed
            const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

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
            const totalDurationMinutes = calculateDurationByMode(totalDistanceMeters, totalOsrmSeconds, mode);

            const rawCoords: [number, number][] = route.geometry?.coordinates || [];
            const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

            const legs = (route.legs || []).map((leg: any) => {
                const legMeters = leg.distance || 0;
                const legOsrmSeconds = leg.duration || 0;
                const legMinutes = calculateDurationByMode(legMeters, legOsrmSeconds, mode);

                return {
                    distanceKm: parseFloat((legMeters / 1000).toFixed(2)),
                    durationMinutes: legMinutes,
                    durationFormatted: formatDuration(legMinutes),
                    distanceFormatted: formatDistance(legMeters),
                };
            });

            const result: MultiStopRouteResult = {
                totalDistanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(2)),
                totalDistanceFormatted: formatDistance(totalDistanceMeters),
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
     * Optimize Day Itinerary Route using OSRM Trip Service API (/trip/v1/) with 2-Opt fallback
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

        // 1. Calculate original route baseline
        const origResult = await this.getMultiStopRoute(stops, mode);
        const originalDistanceKm = origResult?.totalDistanceKm || 0;
        const originalDurationMinutes = origResult?.totalDurationMinutes || 0;

        // 2. Query OSRM Trip Service API
        try {
            const sourceParam = fixStart ? "source=first" : "source=any";
            const destParam = fixEnd ? "destination=last" : "destination=any";
            const roundParam = roundtrip ? "roundtrip=true" : "roundtrip=false";

            // OSRM Trip endpoint supports driving graph
            const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
            const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?${sourceParam}&${destParam}&${roundParam}&overview=full&geometries=geojson&steps=false`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.code === "Ok" && data.waypoints && data.trips && data.trips.length > 0) {
                    const optimizedOrder: number[] = new Array(stops.length);
                    data.waypoints.forEach((wp: any, origIdx: number) => {
                        if (typeof wp.waypoint_index === "number") {
                            optimizedOrder[wp.waypoint_index] = origIdx;
                        }
                    });

                    // Ensure all indices are populated
                    const isValidOrder = optimizedOrder.every((idx) => typeof idx === "number" && idx >= 0);
                    if (isValidOrder) {
                        const trip = data.trips[0];
                        const optimizedDistanceMeters = trip.distance || 0;
                        const optimizedDistanceKm = parseFloat((optimizedDistanceMeters / 1000).toFixed(2));
                        const osrmTripSeconds = trip.duration || 0;

                        // Calculate realistic duration based on selected transportation mode (walking 4.5km/h, cycling 15km/h, etc.)
                        const optimizedDurationMinutes = calculateDurationByMode(optimizedDistanceMeters, osrmTripSeconds, mode);

                        const rawCoords: [number, number][] = trip.geometry?.coordinates || [];
                        const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

                        const savedDistanceKm = Math.max(0, parseFloat((originalDistanceKm - optimizedDistanceKm).toFixed(2)));
                        const savedDurationMinutes = Math.max(0, originalDurationMinutes - optimizedDurationMinutes);

                        return {
                            optimizedOrder,
                            originalDistanceKm,
                            originalDistanceFormatted: origResult?.totalDistanceFormatted || `${originalDistanceKm} 公里`,
                            originalDurationMinutes,
                            originalDurationFormatted: origResult?.totalDurationFormatted || formatDuration(originalDurationMinutes),
                            optimizedDistanceKm,
                            optimizedDistanceFormatted: formatDistance(optimizedDistanceMeters),
                            optimizedDurationMinutes,
                            optimizedDurationFormatted: formatDuration(optimizedDurationMinutes),
                            savedDistanceKm,
                            savedDistanceFormatted: formatDistance(savedDistanceKm * 1000),
                            savedDurationMinutes,
                            savedDurationFormatted: formatDuration(savedDurationMinutes),
                            coordinates: leafletCoords,
                            isEstimated: false,
                            mode,
                        };
                    }
                }
            }
        } catch (error) {
            console.warn("OSRM Trip Service API call failed, falling back to 2-Opt local TSP algorithm:", error);
        }

        // 3. Fallback: 2-Opt TSP Algorithm
        const fallbackOrder = solve2OptTSP(stops, fixStart, fixEnd);
        const reorderedStops = fallbackOrder.map((idx) => stops[idx]);
        const fallbackRoute = this.generateFallbackMultiStop(reorderedStops, mode);

        const optimizedDistanceKm = fallbackRoute.totalDistanceKm;
        const optimizedDurationMinutes = fallbackRoute.totalDurationMinutes;

        const savedDistanceKm = Math.max(0, parseFloat((originalDistanceKm - optimizedDistanceKm).toFixed(2)));
        const savedDurationMinutes = Math.max(0, originalDurationMinutes - optimizedDurationMinutes);

        return {
            optimizedOrder: fallbackOrder,
            originalDistanceKm,
            originalDistanceFormatted: origResult?.totalDistanceFormatted || `${originalDistanceKm} 公里`,
            originalDurationMinutes,
            originalDurationFormatted: origResult?.totalDurationFormatted || formatDuration(originalDurationMinutes),
            optimizedDistanceKm,
            optimizedDistanceFormatted: fallbackRoute.totalDistanceFormatted,
            optimizedDurationMinutes,
            optimizedDurationFormatted: fallbackRoute.totalDurationFormatted,
            savedDistanceKm,
            savedDistanceFormatted: formatDistance(savedDistanceKm * 1000),
            savedDurationMinutes,
            savedDurationFormatted: formatDuration(savedDurationMinutes),
            coordinates: fallbackRoute.coordinates,
            isEstimated: true,
            mode,
        };
    }
}
