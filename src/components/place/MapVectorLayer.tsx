import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

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

        const glLayer = L.maplibreGL({
            style: styleUrl,
        });

        layerRef.current = glLayer;
        glLayer.addTo(map);

        return () => {
            if (layerRef.current && map.hasLayer(layerRef.current)) {
                map.removeLayer(layerRef.current);
            }
            layerRef.current = null;
        };
    }, [map, styleUrl]);

    return null;
};
