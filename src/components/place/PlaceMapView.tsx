import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import PlaceMapController from "./PlaceMapController";
import { useTheme } from "../../contexts/ThemeContext";

type PlaceMapViewProps = {
    places: PlaceVM[] | null;
    showRouteLine?: boolean;
};

const PlaceMapView = ({ places, showRouteLine = true }: PlaceMapViewProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

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

    const routePositions = useMemo(() => {
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

    const createNumberedIcon = (type: string | null, index: number) => {
        const color = getPlaceColor(type);
        const svgTemplate = `
            <div style="position: relative; width: 38px; height: 38px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="38" height="38" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
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
        <MapContainer
            className="w-full h-full flex-1 rounded-xl overflow-hidden shadow-md relative z-0"
            center={defaultCenter}
            zoom={defaultZoom}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Polyline Route Line */}
            {showRouteLine && routePositions.length > 1 && (
                <Polyline
                    positions={routePositions}
                    pathOptions={{
                        color: "#4f46e5",
                        weight: 4,
                        opacity: 0.8,
                        dashArray: "8, 8",
                    }}
                />
            )}

            {validPlaces.map((place, idx) => (
                <Marker
                    key={place.id || idx}
                    position={{ lat: place.lat, lng: place.lng }}
                    icon={createNumberedIcon(place.type, idx)}
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
    );
};

export default PlaceMapView;
