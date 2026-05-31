import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import PlaceMapController from "./PlaceMapController";
import { useTheme } from "../../contexts/ThemeContext";

type PlaceMapViewProps = {
    places: PlaceVM[] | null;
};

const PlaceMapView = ({ places }: PlaceMapViewProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const defaultCenter = useMemo(() => {
        if (places && places.length > 0) {
            const validPlaces = places.filter(
                (p) => typeof p.lat === "number" && typeof p.lng === "number"
            );
            if (validPlaces.length > 0) {
                const avgLat =
                    validPlaces.reduce((sum, p) => sum + p.lat!, 0) /
                    validPlaces.length;
                const avgLng =
                    validPlaces.reduce((sum, p) => sum + p.lng!, 0) /
                    validPlaces.length;
                return { lat: avgLat, lng: avgLng };
            }
        }   
        // Fallback default center (Taipei, Taiwan)
        return { lat: 25.033, lng: 121.565 };
    }, [places]);

    const [defaultZoom] = useState(13);

    const getPlaceColor = (type: string | null) => {
        switch (type) {
            case "food":
                return "#ffa500"; // Orange
            case "hotel":
                return "#ff5733"; // Red
            case "attraction":
                return "#33ff57"; // Green
            case "shopping":
                return "#ff33d4"; // Pink
            // Add more types and colors as needed
            default:
                return "#3388ff"; // Default blue
        }
    };

    const createColoredIcon = (type: string | null) => {
        const color = getPlaceColor(type);
        const svgTemplate = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36" height="36">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>`;

        return L.divIcon({
            className: "custom-color-marker",
            html: svgTemplate,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -32],
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
            {places &&
                places.map(
                    (place) =>
                        place.lat &&
                        place.lng && (
                            <Marker
                                key={place.id}
                                position={{ lat: place.lat!, lng: place.lng! }}
                                icon={createColoredIcon(place.type)}
                            >
                                <Popup>
                                    <div className="p-1 min-w-[150px]">
                                        <h3 className="text-xs font-bold border-b pb-1 mb-2 text-indigo-400">
                                            {place.name}
                                        </h3>
                                        <p className="text-xs mb-2 text-gray-600 whitespace-pre-wrap">
                                            {place.description}
                                        </p>
                                        <div className="space-y-1 text-xs text-gray-500">
                                            <p>
                                                <strong>🕒 營業時間:</strong>
                                                {place.info?.open}
                                            </p>
                                            <p>
                                                <strong>📍 地址:</strong>
                                                {place.info?.loc}
                                            </p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                )}
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
