import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { PlaceVM } from "../../models/types/PlaceTypes";

type PlaceMapControllerProps = {
    places: PlaceVM[] | null;
    defaultCenter: { lat: number; lng: number };
    defaultZoom: number;
    isDark?: boolean;
};

const PlaceMapController = ({
    places,
    defaultCenter,
    defaultZoom,
    isDark,
}: PlaceMapControllerProps) => {
    const map = useMap();

    const handleFitBounds = () => {
        if (places && places.length > 0) {
            const validCoords = places
                .filter(
                    (p): p is typeof p & { lat: number; lng: number } =>
                        typeof p.lat === "number" && typeof p.lng === "number"
                )
                .map((p) => [p.lat, p.lng] as [number, number]);

            if (validCoords.length > 0) {
                const bounds = L.latLngBounds(validCoords);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    };

    const handleReset = () => {
        handleFitBounds();
    };

    useEffect(() => {
        handleFitBounds();
    }, [map, places]);

    useEffect(() => {
        if (isDark !== undefined) {
            const pane = map.getPane("tilePane");
            if (pane) {
                if (isDark) {
                    pane.style.filter =
                        "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)";
                    pane.style.transition = "filter 0.3s ease";
                } else {
                    pane.style.filter = "none";
                }
            }
        }
    }, [map, isDark]);

    return (
        <div
            className="leaflet-bottom leaflet-left"
            style={{ pointerEvents: "auto", margin: "12px" }}
        >
            <div className="flex flex-col gap-2">
                {/* <button
                    type="button"
                    onClick={handleFitBounds}
                    className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded shadow-md border border-gray-300 text-sm font-bold"
                >
                    🔍 自動範圍
                </button> */}
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded shadow-md border border-gray-300 text-sm font-bold"
                >
                    🏠 重置
                </button>
            </div>
        </div>
    );
};

export default PlaceMapController;
