import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

// 確保在開發環境與瀏覽器中，全域均有正確的 MapLibre 建構子實例
if (typeof window !== "undefined") {
    const gl = (maplibregl as any).default || maplibregl;
    (window as any).maplibregl = gl;
}

interface MapVectorLayerProps {
    styleUrl: string;
}

/**
 * Renders a MapLibre GL Vector Tile Layer inside React Leaflet MapContainer.
 * Keeps all Leaflet markers, popups, and polylines intact on top of high-DPI vector basemaps.
 */
export const MapVectorLayer: React.FC<MapVectorLayerProps> = ({ styleUrl }) => {
    const map = useMap();
    const layerRef = useRef<L.MaplibreGL | null>(null);

    useEffect(() => {
        if (!map || !styleUrl) return;

        try {
            const glLayer = L.maplibreGL({
                style: styleUrl,
            });

            layerRef.current = glLayer;
            glLayer.addTo(map);
        } catch (err) {
            console.error("Failed to initialize MapVectorLayer (MapLibre GL):", err);
        }

        return () => {
            if (layerRef.current && map.hasLayer(layerRef.current)) {
                try {
                    map.removeLayer(layerRef.current);
                } catch (err) {
                    console.warn("Error cleaning up MapVectorLayer:", err);
                }
            }
            layerRef.current = null;
        };
    }, [map, styleUrl]);

    return null;
};
