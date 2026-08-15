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
    Train,
    Ticket,
    Utensils,
    Volume2,
    Globe,
    Sparkles,
} from "lucide-react";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import PlaceMapController from "./PlaceMapController";
import { useTheme } from "../../contexts/ThemeContext";
import { detectLanguage, playPronunciation } from "../../utils/SpeechLanguageUtil";
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
import {
    formatOpeningHours,
    getBusinessStatus,
} from "../../utils/OpeningHoursUtil";

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

// Rich Interactive Landmark Popup Component (iOS Style Map Card)
const PlaceMarkerPopupContent = ({ place, index }: { place: PlaceVM; index: number }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    const categoryColor =
        DEFAULT_CATEGORY_COLORS[place.type || ""] || "#3b82f6";
    const CategoryIcon = getCategoryIcon(place.type);
    const categoryLabel = getCategoryLabel(place.type);

    const detectedLang = detectLanguage(place.info?.native_name, {
        address: place.info?.loc,
        currency: place.info?.price,
    });

    const handleSpeak = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!place.info?.native_name) return;
        playPronunciation(place.info.native_name, {
            context: {
                address: place.info?.loc,
                mapUrl: place.map_url,
                currency: place.info?.price,
            },
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: () => setSpeaking(false),
        });
    };

    const smartNav = useMemo(() => {
        return {
            url: getSmartNavigationUrl({
                name: place.name,
                loc: place.info?.loc,
                lat: place.lat,
                lng: place.lng,
                customUrl: place.map_url,
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

    const businessStatus = getBusinessStatus(place.info?.open, place.info?.closed_days);

    return (
        <div className="w-[280px] sm:w-[310px] max-w-[calc(100vw-36px)] overflow-hidden text-card-foreground font-sans box-border">
            {/* Header Image with Floating Badges */}
            {place.image_url ? (
                <div className="relative w-full h-34 overflow-hidden bg-muted">
                    <img
                        src={place.image_url}
                        alt={place.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Top Left Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                        <span className="w-5 h-5 rounded-full bg-white text-zinc-900 font-extrabold text-[11px] flex items-center justify-center shadow-md">
                            {index + 1}
                        </span>
                        <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1 backdrop-blur-md"
                            style={{ backgroundColor: `${categoryColor}ee` }}
                        >
                            <CategoryIcon size={10} />
                            {categoryLabel}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="p-3 border-b border-border bg-muted/40 flex items-center gap-1.5">
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
                </div>
            )}

            {/* Body Content */}
            <div className="p-3.5 space-y-2.5 text-xs">
                {/* 1. 地點名稱與英文副標題 (iOS POC 樣式) */}
                <div className="space-y-0.5">
                    <h3 className="font-black text-sm sm:text-base text-foreground leading-snug tracking-tight">
                        {place.name}
                    </h3>
                    {place.eng_name && (
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {place.eng_name}
                        </p>
                    )}
                </div>

                {/* 2. 原文發音按鈕 */}
                {place.info?.native_name && (
                    <button
                        type="button"
                        onClick={handleSpeak}
                        className="w-full flex items-center justify-between gap-1.5 p-1.5 px-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 transition-all text-left cursor-pointer"
                        title={`以 ${detectedLang.name} 發音`}
                    >
                        <div className="flex items-center gap-1.5 truncate">
                            <Volume2 size={13} className={speaking ? "text-amber-500 animate-pulse" : ""} />
                            <span className="font-bold text-foreground text-[11px] truncate">
                                {place.info.native_name}
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {detectedLang.flag} {detectedLang.name}
                        </span>
                    </button>
                )}

                {/* 3. 營業狀態與評分列 (不與關閉按鈕重疊) */}
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    {place.info?.open && (
                        <span className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] ${businessStatus.badgeColor}`}>
                            {businessStatus.badgeText}
                        </span>
                    )}

                    {place.info?.rating && (
                        <span className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span>{place.info.rating}</span>
                            {place.info.rating_count && (
                                <span className="text-muted-foreground text-[9px]">
                                    ({place.info.rating_count})
                                </span>
                            )}
                        </span>
                    )}

                    {place.info?.stay_duration && (
                        <span className="text-[10px] text-muted-foreground">
                            ⏱️ {place.info.stay_duration}
                        </span>
                    )}
                </div>

                {/* 4. iOS 4 大快捷動作行 (導航 / 致電 / 預約 / 官網) */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 text-center">
                    {/* 導航 */}
                    <a
                        href={smartNav.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all cursor-pointer shadow-2xs"
                        title={`在 ${smartNav.appName} 中開啟`}
                    >
                        <Navigation size={13} />
                        <span className="text-[9px] font-bold">導航</span>
                    </a>

                    {/* 致電 */}
                    {place.info?.phone ? (
                        <a
                            href={`tel:${place.info.phone}`}
                            className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer shadow-2xs"
                            title="撥打電話"
                        >
                            <Phone size={13} />
                            <span className="text-[9px] font-bold">致電</span>
                        </a>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg opacity-30 text-muted-foreground">
                            <Phone size={13} />
                            <span className="text-[9px]">致電</span>
                        </div>
                    )}

                    {/* 預約 */}
                    {place.info?.booking_url ? (
                        <a
                            href={place.info.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all cursor-pointer shadow-2xs"
                            title="預約/購票"
                        >
                            <Ticket size={13} />
                            <span className="text-[9px] font-bold">預約</span>
                        </a>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg opacity-30 text-muted-foreground">
                            <Ticket size={13} />
                            <span className="text-[9px]">預約</span>
                        </div>
                    )}

                    {/* 官網 */}
                    {place.info?.website_url ? (
                        <a
                            href={place.info.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-all cursor-pointer shadow-2xs"
                            title="官方網站"
                        >
                            <Globe size={13} />
                            <span className="text-[9px] font-bold">官網</span>
                        </a>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg opacity-30 text-muted-foreground">
                            <Globe size={13} />
                            <span className="text-[9px]">官網</span>
                        </div>
                    )}
                </div>

                {/* 5. Tips 便箋 */}
                {place.tips && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl text-[11px] text-foreground flex items-start gap-1.5">
                        <Sparkles size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="line-clamp-2">
                            <strong className="text-amber-600 dark:text-amber-400 font-bold mr-1">Tips:</strong>
                            {place.tips}
                        </div>
                    </div>
                )}

                {/* 6. 推薦商品 / 必點菜單 */}
                {place.info?.recommended_items && place.info.recommended_items.length > 0 && (
                    <div className="bg-muted/30 p-2 rounded-xl border border-border/50 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                            <Utensils size={11} className="text-amber-500" />
                            <span>{place.type === "shopping" ? "🛍️ 推薦商品" : "🍽️ 必點推薦"}</span>
                        </div>
                        <div className="space-y-1">
                            {place.info.recommended_items.slice(0, 2).map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px] gap-1">
                                    <div className="truncate min-w-0">
                                        <span className="text-foreground font-medium">{item.name}</span>
                                        {item.native_name && (
                                            <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                                                ({item.native_name})
                                            </span>
                                        )}
                                    </div>
                                    {item.price && (
                                        <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                                            {item.price}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 7. 地址與複製按鈕 */}
                {place.info?.loc && (
                    <div className="flex items-start justify-between gap-1.5 pt-0.5">
                        <div className="flex items-start gap-1.5 flex-1 min-w-0">
                            <MapPin size={12} className="text-rose-500 mt-0.5 shrink-0" />
                            <span className="text-foreground/80 leading-tight text-[11px] line-clamp-2">
                                {place.info.loc}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyAddress}
                            title="複製地址"
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors shrink-0 cursor-pointer"
                        >
                            {isCopied ? (
                                <Check size={12} className="text-emerald-600" />
                            ) : (
                                <Copy size={12} />
                            )}
                        </button>
                    </div>
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
        <div className="w-full h-full relative max-w-full overflow-hidden">
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
            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1.5 pointer-events-auto max-w-[calc(100%-20px)]">
                {/* 1. Multi-transit Routing Mode Buttons */}
                {showRouteLine && validPlaces.length >= 2 && (
                    <div className="flex flex-col items-end gap-1.5 max-w-full">
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-background/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-border/80 text-xs max-w-full overflow-x-auto no-scrollbar">
                            {/* 開車 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("driving")}
                                className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-all font-medium shrink-0 ${
                                    routeMode === "driving"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="開車路線"
                            >
                                <Car size={12} />
                                <span className="text-[10px] sm:text-[11px]">開車</span>
                            </button>

                            {/* 機車 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("motorcycle")}
                                className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-all font-medium shrink-0 ${
                                    routeMode === "motorcycle"
                                        ? "bg-purple-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="機車 / 摩托車"
                            >
                                <span className="text-[11px] leading-none">🛵</span>
                                <span className="text-[10px] sm:text-[11px]">機車</span>
                            </button>

                            {/* 騎車 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("cycling")}
                                className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-all font-medium shrink-0 ${
                                    routeMode === "cycling"
                                        ? "bg-amber-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="自行車路線"
                            >
                                <Bike size={12} />
                                <span className="text-[10px] sm:text-[11px]">單車</span>
                            </button>

                            {/* 步行 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("walking")}
                                className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-all font-medium shrink-0 ${
                                    routeMode === "walking"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="步行路線"
                            >
                                <Footprints size={12} />
                                <span className="text-[10px] sm:text-[11px]">步行</span>
                            </button>

                            {/* 直線/航線 */}
                            <button
                                type="button"
                                onClick={() => setRouteMode("direct")}
                                className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-all font-medium shrink-0 ${
                                    routeMode === "direct"
                                        ? "bg-pink-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                title="直線距離 / 飛航路線"
                            >
                                <Plane size={12} />
                                <span className="text-[10px] sm:text-[11px]">直線</span>
                            </button>
                        </div>

                        {/* Distance & Time Summary Capsule */}
                        <div className="bg-background/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md border border-border/80 text-xs flex items-center gap-2 max-w-full">
                            {isRouteLoading ? (
                                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] sm:text-[11px]">
                                    <Loader2 size={11} className="animate-spin text-primary" />
                                    <span>計算中...</span>
                                </div>
                            ) : routeData ? (
                                <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-semibold text-foreground truncate">
                                    <span className="text-primary font-bold">
                                        {routeData.totalDistanceFormatted}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span>{routeData.totalDurationFormatted}</span>
                                    {routeData.isEstimated && (
                                        <span className="text-[9px] text-amber-500 font-normal">
                                            (預估)
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground">點對點連線</span>
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
