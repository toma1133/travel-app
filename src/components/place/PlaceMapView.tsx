import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { Car, Footprints, Bike, Loader2 } from "lucide-react";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import PlaceMapController from "./PlaceMapController";
import { useTheme } from "../../contexts/ThemeContext";
import { RoutingService, RouteMode, MultiStopRouteResult } from "../../services/api/RoutingService";

type PlaceMapViewProps = {
    places: PlaceVM[] | null;
    showRouteLine?: boolean;
    highlightedPlaceId?: string | null;
};

const PlaceMapView = ({
    places,
    showRouteLine = true,
    highlightedPlaceId,
}: PlaceMapViewProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [routeMode, setRouteMode] = useState<RouteMode>("driving");
    const [routeData, setRouteData] = useState<MultiStopRouteResult | null>(null);
    const [isRouteLoading, setIsRouteLoading] = useState(false);

    const validPlaces = useMemo(() => {
        if (!places) return [];
        return places.filter(
            (p): p is PlaceVM & { lat: number; lng: number } =>
                typeof p.lat === "number" && typeof p.lng === "number"
        );
    }, [places]);

    const defaultCenter = useMemo(() => {
        if (validPlaces.length > 0) {
            const avgLat =
                validPlaces.reduce((sum, p) => sum + p.lat, 0) / validPlaces.length;
            const avgLng =
                validPlaces.reduce((sum, p) => sum + p.lng, 0) / validPlaces.length;
            return { lat: avgLat, lng: avgLng };
        }
        // Fallback default center (Taipei, Taiwan)
        return { lat: 25.033, lng: 121.565 };
    }, [validPlaces]);

    // Fetch real road route geometry whenever validPlaces or routeMode changes
    useEffect(() => {
        if (!showRouteLine || validPlaces.length < 2) {
            setRouteData(null);
            setIsRouteLoading(false);
            return;
        }

        let isMounted = true;
        setIsRouteLoading(true);

        const fetchRoute = async () => {
            const stops = validPlaces.map((p) => ({ lat: p.lat, lng: p.lng }));
            const res = await RoutingService.getMultiStopRoute(stops, routeMode);

            if (isMounted) {
                setRouteData(res);
                setIsRouteLoading(false);
            }
        };

        fetchRoute();

        return () => {
            isMounted = false;
        };
    }, [validPlaces, routeMode, showRouteLine]);

    // Fallback straight-line coordinates if routing is loading or fails
    const straightLinePositions = useMemo(() => {
        return validPlaces.map((p) => [p.lat, p.lng] as [number, number]);
    }, [validPlaces]);

    const [defaultZoom] = useState(13);

    const getPlaceColor = (type: string | null) => {
        switch (type) {
            case "food":
                return "#d97706"; // Amber
            case "hotel":
                return "#2563eb"; // Blue
            case "sight":
            case "attraction":
                return "#059669"; // Emerald
            case "shopping":
                return "#db2777"; // Rose
            case "transport":
                return "#dc2626"; // Red
            case "cafe":
                return "#b45309"; // Coffee
            case "activity":
                return "#7c3aed"; // Violet
            default:
                return "#4f46e5"; // Indigo
        }
    };

    const createNumberedIcon = (type: string | null, index: number, isHighlighted: boolean) => {
        const color = isHighlighted ? "#f43f5e" : getPlaceColor(type);
        const scale = isHighlighted ? "transform: scale(1.35); z-index: 99;" : "";
        const pulseRing = isHighlighted ? `<div style="position: absolute; inset: -6px; border-radius: 50%; background: rgba(244,63,94,0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : "";

        const svgTemplate = `
            <div style="position: relative; width: 38px; height: 38px; transition: transform 0.2s ease; ${scale}">
                ${pulseRing}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="38" height="38" style="filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.4));">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div style="
                    position: absolute; 
                    top: 5px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    width: 18px; 
                    height: 18px; 
                    background: white; 
                    color: ${color}; 
                    border-radius: 50%; 
                    font-size: 11px; 
                    font-weight: 900; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    font-family: ui-sans-serif, system-ui, sans-serif;
                ">
                    ${index + 1}
                </div>
            </div>`;

        return L.divIcon({
            className: "custom-numbered-marker",
            html: svgTemplate,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -34],
        });
    };

    return (
        <div className="w-full h-full relative">
            <MapContainer
                className="w-full h-full flex-1 rounded-xl overflow-hidden shadow-md relative z-0"
                center={defaultCenter}
                zoom={defaultZoom}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Real Road Polyline Route or Fallback Line */}
                {showRouteLine && validPlaces.length > 1 && (
                    <>
                        {/* Outer subtle glow for aesthetic route styling */}
                        <Polyline
                            positions={routeData?.coordinates && routeData.coordinates.length > 0 ? routeData.coordinates : straightLinePositions}
                            pathOptions={{
                                color: "#3b82f6",
                                weight: 7,
                                opacity: 0.35,
                                lineCap: "round",
                                lineJoin: "round",
                            }}
                        />
                        {/* Core solid / styled road line */}
                        <Polyline
                            positions={routeData?.coordinates && routeData.coordinates.length > 0 ? routeData.coordinates : straightLinePositions}
                            pathOptions={{
                                color: "#2563eb",
                                weight: 4,
                                opacity: 0.9,
                                dashArray: routeData ? undefined : "6, 6",
                                lineCap: "round",
                                lineJoin: "round",
                            }}
                        />
                    </>
                )}

                {validPlaces.map((place, idx) => (
                    <Marker
                        key={`${place.id || "place"}-${idx}`}
                        position={{ lat: place.lat, lng: place.lng }}
                        icon={createNumberedIcon(place.type, idx, !!highlightedPlaceId && place.id === highlightedPlaceId)}
                    >
                        <Popup>
                            <div className="p-1 min-w-[150px]">
                                <div className="flex items-center gap-1.5 border-b pb-1 mb-2">
                                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                                        {place.name}
                                    </h3>
                                </div>
                                {place.description && (
                                    <p className="text-xs mb-2 text-gray-600 whitespace-pre-wrap">
                                        {place.description}
                                    </p>
                                )}
                                <div className="space-y-1 text-xs text-gray-500">
                                    {place.info?.open && (
                                        <p>
                                            <strong>🕒 營業時間:</strong>{" "}
                                            {place.info.open}
                                        </p>
                                    )}
                                    {place.info?.loc && (
                                        <p>
                                            <strong>📍 地址:</strong>{" "}
                                            {place.info.loc}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                <PlaceMapController
                    places={places}
                    defaultCenter={defaultCenter}
                    defaultZoom={defaultZoom}
                    isDark={isDark}
                />
            </MapContainer>

            {/* Floating Route Info & Mode Control Badge (Top-Right) */}
            {showRouteLine && validPlaces.length >= 2 && (
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 pointer-events-auto">
                    {/* Routing Mode Buttons */}
                    <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-md border border-border/80 text-xs">
                        <button
                            type="button"
                            onClick={() => setRouteMode("driving")}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                routeMode === "driving"
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            title="開車路線"
                        >
                            <Car size={13} />
                            <span className="text-[11px]">開車</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRouteMode("walking")}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                routeMode === "walking"
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            title="步行路線"
                        >
                            <Footprints size={13} />
                            <span className="text-[11px]">步行</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRouteMode("cycling")}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                routeMode === "cycling"
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            title="自行車路線"
                        >
                            <Bike size={13} />
                            <span className="text-[11px]">騎車</span>
                        </button>
                    </div>

                    {/* Distance & Time Summary Capsule */}
                    <div className="bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-border/80 text-xs flex items-center gap-2">
                        {isRouteLoading ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <Loader2 size={12} className="animate-spin text-primary" />
                                <span>計算路線中...</span>
                            </div>
                        ) : routeData ? (
                            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-foreground">
                                <span className="text-primary font-bold">{routeData.totalDistanceFormatted}</span>
                                <span className="text-muted-foreground">•</span>
                                <span>{routeData.totalDurationFormatted}</span>
                            </div>
                        ) : (
                            <span className="text-[11px] text-muted-foreground">點對點直接連線</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaceMapView;
