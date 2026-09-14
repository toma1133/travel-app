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
        if (!map) return;

        const validCoords: [number, number][] = [];
        if (places && places.length > 0) {
            for (const p of places) {
                const lat = Number(p?.lat);
                const lng = Number(p?.lng);
                if (
                    typeof lat === "number" &&
                    typeof lng === "number" &&
                    !isNaN(lat) &&
                    !isNaN(lng) &&
                    isFinite(lat) &&
                    isFinite(lng)
                ) {
                    validCoords.push([lat, lng]);
                }
            }
        }

        try {
            if (validCoords.length === 1) {
                // 當只有一個地標時，直接 setView 到該地標並使用合理的縮放等級，避免 fitBounds 因範圍為 0 計算出 zoom=Infinity 導致 (NaN, NaN) 錯誤
                map.setView(validCoords[0], Math.max(defaultZoom, 15), {
                    animate: true,
                });
            } else if (validCoords.length > 1) {
                // 檢查是否所有座標完全相同，避免相同經緯度時 fitBounds 出現零跨距異常
                const first = validCoords[0];
                const allSame = validCoords.every(
                    (c) =>
                        Math.abs(c[0] - first[0]) < 1e-7 &&
                        Math.abs(c[1] - first[1]) < 1e-7
                );

                if (allSame) {
                    map.setView(first, Math.max(defaultZoom, 15), {
                        animate: true,
                    });
                } else {
                    const bounds = L.latLngBounds(validCoords);
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, {
                            padding: [50, 50],
                            maxZoom: 16,
                            animate: true,
                        });
                    }
                }
            } else if (
                defaultCenter &&
                typeof defaultCenter.lat === "number" &&
                typeof defaultCenter.lng === "number" &&
                !isNaN(defaultCenter.lat) &&
                !isNaN(defaultCenter.lng) &&
                isFinite(defaultCenter.lat) &&
                isFinite(defaultCenter.lng)
            ) {
                map.setView([defaultCenter.lat, defaultCenter.lng], defaultZoom, {
                    animate: true,
                });
            }
        } catch (err) {
            console.warn("PlaceMapController error updating map view:", err);
        }
    };

    const handleReset = () => {
        handleFitBounds();
    };

    useEffect(() => {
        handleFitBounds();
    }, [map, places]);

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
