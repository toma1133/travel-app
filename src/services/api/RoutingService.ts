export type RouteMode = "driving" | "walking" | "cycling";

export type RouteResult = {
    distanceMeters: number;
    distanceKm: number;
    distanceFormatted: string;
    durationSeconds: number;
    durationMinutes: number;
    durationFormatted: string;
    coordinates: [number, number][]; // [lat, lng] array formatted for Leaflet
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
};

// In-memory cache for route requests to prevent redundant API calls
const routeCache = new Map<string, RouteResult>();
const multiStopCache = new Map<string, MultiStopRouteResult>();

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
            case "car":
            case "taxi":
            case "bus":
            default:
                return "driving";
        }
    }

    /**
     * Query OSRM routing API between two coordinates
     * @param origin { lat, lng }
     * @param destination { lat, lng }
     * @param mode 'driving' | 'walking' | 'cycling'
     */
    static async getRoute(
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number },
        mode: RouteMode = "driving"
    ): Promise<RouteResult | null> {
        if (
            typeof origin?.lat !== "number" ||
            typeof origin?.lng !== "number" ||
            typeof destination?.lat !== "number" ||
            typeof destination?.lng !== "number"
        ) {
            return null;
        }

        const cacheKey = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}-${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}-${mode}`;
        if (routeCache.has(cacheKey)) {
            return routeCache.get(cacheKey)!;
        }

        try {
            // OSRM expects coordinates in lng,lat order: {lng1},{lat1};{lng2},{lat2}
            const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
            const url = `https://router.project-osrm.org/route/v1/${mode}/${coords}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            if (!response.ok) {
                console.warn("OSRM Routing API returned status:", response.status);
                return null;
            }

            const data = await response.json();
            if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
                return null;
            }

            const route = data.routes[0];
            const distanceMeters = route.distance || 0;
            const durationSeconds = route.duration || 0;
            const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));
            const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

            // GeoJSON coordinates are [lng, lat], convert to Leaflet's [lat, lng]
            const rawCoords: [number, number][] = route.geometry?.coordinates || [];
            const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

            const result: RouteResult = {
                distanceMeters,
                distanceKm,
                distanceFormatted: formatDistance(distanceMeters),
                durationSeconds,
                durationMinutes,
                durationFormatted: formatDuration(durationMinutes),
                coordinates: leafletCoords,
            };

            routeCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error("Failed to fetch route from OSRM:", error);
            return null;
        }
    }

    /**
     * Query OSRM routing API for a multi-stop itinerary route
     * @param stops Array of coordinates [{ lat, lng }]
     * @param mode 'driving' | 'walking' | 'cycling'
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

        try {
            // OSRM format: lng1,lat1;lng2,lat2;lng3,lat3
            const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
            const url = `https://router.project-osrm.org/route/v1/${mode}/${coords}?overview=full&geometries=geojson&steps=false`;

            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();
            if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
                return null;
            }

            const route = data.routes[0];
            const totalDistanceMeters = route.distance || 0;
            const totalDistanceKm = parseFloat((totalDistanceMeters / 1000).toFixed(2));
            const totalDurationMinutes = Math.max(1, Math.round((route.duration || 0) / 60));

            const rawCoords: [number, number][] = route.geometry?.coordinates || [];
            const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

            const legs = (route.legs || []).map((leg: any) => {
                const legMeters = leg.distance || 0;
                const legMinutes = Math.max(1, Math.round((leg.duration || 0) / 60));
                return {
                    distanceKm: parseFloat((legMeters / 1000).toFixed(2)),
                    durationMinutes: legMinutes,
                    durationFormatted: formatDuration(legMinutes),
                    distanceFormatted: formatDistance(legMeters),
                };
            });

            const result: MultiStopRouteResult = {
                totalDistanceKm,
                totalDistanceFormatted: formatDistance(totalDistanceMeters),
                totalDurationMinutes,
                totalDurationFormatted: formatDuration(totalDurationMinutes),
                legs,
                coordinates: leafletCoords,
            };

            multiStopCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error("Failed to fetch multi-stop route from OSRM:", error);
            return null;
        }
    }
}
