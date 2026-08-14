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
 * Calculate fallback travel duration in minutes based on distance and mode
 */
export function estimateDurationMinutes(meters: number, mode: RouteMode): number {
    // Average realistic speeds (km/h)
    let speedKmH = 40;
    switch (mode) {
        case "walking":
            speedKmH = 4.5;
            break;
        case "cycling":
            speedKmH = 15;
            break;
        case "motorcycle":
            speedKmH = 35;
            break;
        case "driving":
            speedKmH = 40;
            break;
        case "direct":
            speedKmH = 500;
            break;
    }
    const hours = (meters / 1000) / speedKmH;
    return Math.max(1, Math.round(hours * 60));
}

/**
 * Format duration in minutes into friendly localized text
 * e.g., 45 -> "約 45 分鐘", 85 -> "約 1 小時 25 分鐘"
 */
export function formatDuration(minutes: number): string {
    if (minutes <= 0) return "少於 1 分鐘";
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

            const legMins = estimateDurationMinutes(adjustedDist, mode);
            legs.push({
                distanceKm: parseFloat((adjustedDist / 1000).toFixed(2)),
                durationMinutes: legMins,
                durationFormatted: formatDuration(legMins),
                distanceFormatted: formatDistance(adjustedDist),
            });
        }

        const totalMins = estimateDurationMinutes(totalDistanceMeters, mode);

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
            // OSRM profiles: driving, walking (or foot), cycling (or bike)
            // motorcycle maps to driving with speed adjustment if needed
            const osrmProfile = mode === "motorcycle" ? "driving" : mode;
            const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
            const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson&steps=false`;

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
            let totalDurationMinutes = Math.max(1, Math.round((route.duration || 0) / 60));

            // Adjust duration for motorcycle (slightly faster in urban traffic than car)
            if (mode === "motorcycle") {
                totalDurationMinutes = Math.max(1, Math.round(totalDurationMinutes * 0.85));
            }

            const rawCoords: [number, number][] = route.geometry?.coordinates || [];
            const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

            const legs = (route.legs || []).map((leg: any) => {
                const legMeters = leg.distance || 0;
                let legMinutes = Math.max(1, Math.round((leg.duration || 0) / 60));
                if (mode === "motorcycle") {
                    legMinutes = Math.max(1, Math.round(legMinutes * 0.85));
                }
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
}

