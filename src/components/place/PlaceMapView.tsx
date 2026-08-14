import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import {
    Car,
    Footprints,
    Bike,
    Loader2,
    MapPin,
    Clock,
    Phone,
    Copy,
    Check,
    Navigation,
    Star,
    CalendarX,
    DollarSign,
    ExternalLink,
    Tag,
    Bed,
    Plane,
    Layers,
} from "lucide-react";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import PlaceMapController from "./PlaceMapController";
import { useTheme } from "../../contexts/ThemeContext";
import {
    RoutingService,
    RouteMode,
    MultiStopRouteResult,
} from "../../services/api/RoutingService";
import {
    DEFAULT_CATEGORY_COLORS,
    getCategoryLabel,
    getCategoryIcon,
} from "../../constants/Categories";
import {
    getSmartNavigationUrl,
    getSmartNavigationLabel,
} from "../../utils/MapNavigationUtil";

type PlaceMapViewProps = {
    places: PlaceVM[] | null;
    showRouteLine?: boolean;
    highlightedPlaceId?: string | null;
};

// Map Style Options
type MapStyleKey = "auto" | "voyager" | "positron" | "dark" | "satellite";

const MAP_STYLES: {
    key: MapStyleKey;
    label: string;
    lightUrl: string;
    darkUrl: string;
    attribution: string;
    subdomains?: string;
    maxZoom?: number;
}[] = [
    {
        key: "auto",
        label: "自動主題",
        lightUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        darkUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
    },
    {
        key: "voyager",
        label: "旅遊精緻",
        lightUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        darkUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
    },
    {
        key: "positron",
        label: "極簡純白",
        lightUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        darkUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
    },
    {
        key: "dark",
        label: "黑曜夜間",
        lightUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        darkUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
    },
    {
        key: "satellite",
        label: "衛星空拍",
        lightUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        darkUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
            '&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
    },
];

// Rich Interactive Landmark Popup Component
const PlaceMarkerPopupContent = ({
    place,
    index,
}: {
    place: PlaceVM;
    index: number;
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const CategoryIcon = getCategoryIcon(place.type);
    const categoryColor =
        DEFAULT_CATEGORY_COLORS[place.type || ""] || "#4f46e5";
    const categoryLabel = getCategoryLabel(place.type);

    const smartNav = useMemo(() => {
        return {
            url: getSmartNavigationUrl({
                name: place.name,
                loc: place.info?.loc,
                lat: place.lat,
                lng: place.lng,
            }),
            ...getSmartNavigationLabel(),
        };
    }, [place]);

    const handleCopyAddress = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const textToCopy = place.info?.loc || place.name;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    return (
        <div className="w-[280px] sm:w-[310px] overflow-hidden text-card-foreground">
            {/* Header Image or Gradient Banner */}
            {place.image_url ? (
                <div className="relative w-full h-32 overflow-hidden bg-muted">
                    <img
                        src={place.image_url}
                        alt={place.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                        <span className="w-5 h-5 rounded-full bg-white/90 text-zinc-900 font-extrabold text-[11px] flex items-center justify-center shadow-md">
                            {index + 1}
                        </span>
                        <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1 backdrop-blur-md"
                            style={{ backgroundColor: `${categoryColor}cc` }}
                        >
                            <CategoryIcon size={10} />
                            {categoryLabel}
                        </span>
                    </div>

                    {/* Rating Badge (if available) */}
                    {place.info?.rating && (
                        <div className="absolute top-2 right-8 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-amber-300 font-bold border border-white/15">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span>{place.info.rating}</span>
                            {place.info.rating_count && (
                                <span className="text-white/60 text-[9px]">
                                    ({place.info.rating_count})
                                </span>
                            )}
                        </div>
                    )}

                    {/* Title Overlay in Image */}
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                        <h3 className="font-bold text-sm leading-tight drop-shadow-md truncate">
                            {place.name}
                        </h3>
                        {place.info?.native_name && (
                            <p className="text-[11px] text-white/80 truncate">
                                {place.info.native_name}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-3 border-b border-border bg-muted/40">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                                {index + 1}
                            </span>
                            <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 flex items-center gap-1"
                                style={{ backgroundColor: categoryColor }}
                            >
                                <CategoryIcon size={10} />
                                {categoryLabel}
                            </span>
                            {place.info?.rating && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold ml-auto">
                                    <Star size={11} className="fill-amber-500 text-amber-500" />
                                    <span>{place.info.rating}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-1.5">
                        <h3 className="font-bold text-sm text-foreground leading-snug">
                            {place.name}
                        </h3>
                        {place.info?.native_name && (
                            <p className="text-[11px] text-muted-foreground">
                                {place.info.native_name}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Body Content */}
            <div className="p-3 space-y-2 text-xs">
                {/* Description / Note */}
                {place.description && (
                    <div className="bg-muted/60 p-2 rounded-lg text-muted-foreground text-[11px] leading-relaxed whitespace-pre-wrap border border-border/50">
                        {place.description}
                    </div>
                )}

                {/* Practical Information List */}
                <div className="space-y-1.5 text-muted-foreground">
                    {/* Business Hours */}
                    {place.info?.open && (
                        <div className="flex items-start gap-1.5">
                            <Clock size={13} className="text-primary mt-0.5 shrink-0" />
                            <span className="text-foreground/90 leading-tight">
                                <span className="font-medium text-muted-foreground">營業時間：</span>
                                {place.info.open}
                            </span>
                        </div>
                    )}

                    {/* Closed Days */}
                    {place.info?.closed_days && (
                        <div className="flex items-start gap-1.5">
                            <CalendarX size={13} className="text-destructive mt-0.5 shrink-0" />
                            <span className="text-foreground/90 leading-tight">
                                <span className="font-medium text-muted-foreground">公休日：</span>
                                {place.info.closed_days}
                            </span>
                        </div>
                    )}

                    {/* Hotel Check-in / Check-out */}
                    {(place.info?.check_in || place.info?.check_out) && (
                        <div className="flex items-start gap-1.5">
                            <Bed size={13} className="text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-foreground/90 leading-tight">
                                {place.info.check_in && `入住 ${place.info.check_in}`}
                                {place.info.check_in && place.info.check_out && " • "}
                                {place.info.check_out && `退房 ${place.info.check_out}`}
                            </span>
                        </div>
                    )}

                    {/* Price / Budget */}
                    {place.info?.price && (
                        <div className="flex items-start gap-1.5">
                            <DollarSign size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-foreground/90 leading-tight">
                                <span className="font-medium text-muted-foreground">門票/預算：</span>
                                {place.info.price}
                            </span>
                        </div>
                    )}

                    {/* Phone Number */}
                    {place.info?.phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone size={13} className="text-indigo-500 shrink-0" />
                            <a
                                href={`tel:${place.info.phone}`}
                                className="text-primary hover:underline font-mono"
                            >
                                {place.info.phone}
                            </a>
                        </div>
                    )}

                    {/* Location Address */}
                    {place.info?.loc && (
                        <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                <MapPin size={13} className="text-rose-500 mt-0.5 shrink-0" />
                                <span className="text-foreground/80 leading-tight line-clamp-2">
                                    {place.info.loc}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyAddress}
                                title="複製地址"
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors shrink-0"
                            >
                                {isCopied ? (
                                    <Check size={12} className="text-emerald-600" />
                                ) : (
                                    <Copy size={12} />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Tags */}
                    {place.tags && (
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                            <Tag size={11} className="text-muted-foreground shrink-0" />
                            {place.tags
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)
                                .map((tag, tagIdx) => (
                                    <span
                                        key={tagIdx}
                                        className="px-1.5 py-0.2 text-[10px] bg-secondary text-secondary-foreground rounded font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-border/50">
                <a
                    href={smartNav.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-xs"
                >
                    <Navigation size={12} />
                    <span>{smartNav.label}</span>
                    <ExternalLink size={10} className="opacity-70" />
                </a>

                {place.info?.loc && (
                    <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="flex items-center justify-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium py-1.5 px-2.5 rounded-lg transition-all border border-border/60"
                        title="複製完整地址"
                    >
                        {isCopied ? (
                            <>
                                <Check size={12} className="text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">已複製</span>
                            </>
                        ) : (
                            <>
                                <Copy size={12} />
                                <span>複製</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
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
    const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyleKey>("auto");
    const [showStyleMenu, setShowStyleMenu] = useState(false);

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
        return { lat: 25.033, lng: 121.565 };
    }, [validPlaces]);

    // Fetch road route geometry or fallback estimate whenever validPlaces or routeMode changes
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

    const straightLinePositions = useMemo(() => {
        return validPlaces.map((p) => [p.lat, p.lng] as [number, number]);
    }, [validPlaces]);

    const [defaultZoom] = useState(13);

    const getPlaceColor = (type: string | null) => {
        return DEFAULT_CATEGORY_COLORS[type || ""] || "#4f46e5";
    };

    const createNumberedIcon = (type: string | null, index: number, isHighlighted: boolean) => {
        const color = isHighlighted ? "#f43f5e" : getPlaceColor(type);
        const scale = isHighlighted ? "transform: scale(1.35); z-index: 99;" : "";
        const pulseRing = isHighlighted
            ? `<div style="position: absolute; inset: -6px; border-radius: 50%; background: rgba(244,63,94,0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : "";

        const svgTemplate = `
            <div style="position: relative; width: 38px; height: 38px; transition: transform 0.2s ease; ${scale}">
                ${pulseRing}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="38" height="38" style="filter: drop-shadow(0px 3px 8px rgba(0,0,0,0.35));">
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
                    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
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
            popupAnchor: [0, -36],
        });
    };

    // Determine active Map Style configuration
    const activeStyleConfig = useMemo(() => {
        const found = MAP_STYLES.find((s) => s.key === selectedMapStyle);
        return found || MAP_STYLES[0];
    }, [selectedMapStyle]);

    const activeTileUrl = isDark
        ? activeStyleConfig.darkUrl
        : activeStyleConfig.lightUrl;

    // Distinct Polyline styling based on mode
    const getRouteStyle = () => {
        switch (routeMode) {
            case "walking":
                return {
                    glowColor: "#34d399",
                    lineColor: "#059669",
                    dashArray: "3, 8",
                    weight: 5,
                };
            case "cycling":
                return {
                    glowColor: "#fbbf24",
                    lineColor: "#d97706",
                    dashArray: "8, 6",
                    weight: 4,
                };
            case "motorcycle":
                return {
                    glowColor: "#c084fc",
                    lineColor: "#7c3aed",
                    dashArray: "12, 6",
                    weight: 4,
                };
            case "direct":
                return {
                    glowColor: "#f472b6",
                    lineColor: "#db2777",
                    dashArray: "6, 6",
                    weight: 3,
                };
            case "driving":
            default:
                return {
                    glowColor: isDark ? "#60a5fa" : "#3b82f6",
                    lineColor: isDark ? "#38bdf8" : "#2563eb",
                    dashArray: undefined,
                    weight: 4,
                };
        }
    };

    const routeStyle = getRouteStyle();

    return (
        <div className="w-full h-full relative">
            <MapContainer
                key={`${isDark ? "map-dark" : "map-light"}-${selectedMapStyle}`}
                className="w-full h-full flex-1 rounded-xl overflow-hidden shadow-md relative z-0"
                center={defaultCenter}
                zoom={defaultZoom}
            >
                <TileLayer
                    url={activeTileUrl}
                    attribution={activeStyleConfig.attribution}
                    subdomains={activeStyleConfig.subdomains || "abc"}
                    maxZoom={activeStyleConfig.maxZoom || 19}
                />

                {/* Real Road Polyline Route or Fallback Line */}
                {showRouteLine && validPlaces.length > 1 && (
                    <>
                        {/* Outer Glow */}
                        <Polyline
                            positions={
                                routeData?.coordinates && routeData.coordinates.length > 0
                                    ? routeData.coordinates
                                    : straightLinePositions
                            }
                            pathOptions={{
                                color: routeStyle.glowColor,
                                weight: routeStyle.weight + 4,
                                opacity: isDark ? 0.45 : 0.35,
                                lineCap: "round",
                                lineJoin: "round",
                            }}
                        />
                        {/* Core Polyline */}
                        <Polyline
                            positions={
                                routeData?.coordinates && routeData.coordinates.length > 0
                                    ? routeData.coordinates
                                    : straightLinePositions
                            }
                            pathOptions={{
                                color: routeStyle.lineColor,
                                weight: routeStyle.weight,
                                opacity: 0.95,
                                dashArray: routeStyle.dashArray,
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
                        icon={createNumberedIcon(
                            place.type,
                            idx,
                            !!highlightedPlaceId && place.id === highlightedPlaceId
                        )}
                    >
                        <Popup className="custom-place-popup">
                            <PlaceMarkerPopupContent place={place} index={idx} />
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

            {/* Top-Right Control Bar: Multi-Mode Selector & Map Style Switcher */}
            <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 pointer-events-auto">
                {/* 1. Multi-transit Routing Mode Buttons */}
                {showRouteLine && validPlaces.length >= 2 && (
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-md border border-border/80 text-xs">
                            {/* 開車 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("driving")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                    routeMode === "driving"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="開車路線"
                            >
                                <Car size={13} />
                                <span className="text-[11px]">開車</span>
                            </button>

                            {/* 機車 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("motorcycle")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                    routeMode === "motorcycle"
                                        ? "bg-purple-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="機車 / 摩托車"
                            >
                                <span className="text-[12px] leading-none">🛵</span>
                                <span className="text-[11px]">機車</span>
                            </button>

                            {/* 騎車 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("cycling")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                    routeMode === "cycling"
                                        ? "bg-amber-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="自行車路線"
                            >
                                <Bike size={13} />
                                <span className="text-[11px]">自行車</span>
                            </button>

                            {/* 步行 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("walking")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                    routeMode === "walking"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="步行路線"
                            >
                                <Footprints size={13} />
                                <span className="text-[11px]">步行</span>
                            </button>

                            {/* 直線/航線 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("direct")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all font-medium ${
                                    routeMode === "direct"
                                        ? "bg-pink-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="直線距離 / 飛航路線"
                            >
                                <Plane size={13} />
                                <span className="text-[11px]">直線</span>
                            </button>
                        </div>

                        {/* Distance & Time Summary Capsule */}
                        <div className="bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-border/80 text-xs flex items-center gap-2">
                            {isRouteLoading ? (
                                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                    <Loader2 size={12} className="animate-spin text-primary" />
                                    <span>計算路線中...</span>
                                </div>
                            ) : routeData ? (
                                <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-foreground">
                                    <span className="text-primary font-bold">
                                        {routeData.totalDistanceFormatted}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span>{routeData.totalDurationFormatted}</span>
                                    {routeData.isEstimated && (
                                        <span className="text-[10px] text-amber-500 font-normal">
                                            (預估)
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[11px] text-muted-foreground">點對點直接連線</span>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Map Style Switcher (Voyager / Positron / Dark / Satellite) */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowStyleMenu((prev) => !prev)}
                        className="flex items-center gap-1.5 bg-background/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-border/80 text-xs text-foreground hover:bg-muted font-medium transition-all"
                        title="切換地圖風格"
                    >
                        <Layers size={13} className="text-primary" />
                        <span className="text-[11px]">{activeStyleConfig.label}</span>
                    </button>

                    {showStyleMenu && (
                        <div className="absolute top-full right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-1.5 flex flex-col gap-1 w-36 z-20 animate-in fade-in zoom-in-95 duration-150">
                            {MAP_STYLES.map((style) => (
                                <button
                                    key={style.key}
                                    type="button"
                                    onClick={() => {
                                        setSelectedMapStyle(style.key);
                                        setShowStyleMenu(false);
                                    }}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                        selectedMapStyle === style.key
                                            ? "bg-primary text-primary-foreground font-semibold"
                                            : "hover:bg-muted text-foreground"
                                    }`}
                                >
                                    <span>{style.label}</span>
                                    {selectedMapStyle === style.key && (
                                        <Check size={12} className="shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceMapView;
