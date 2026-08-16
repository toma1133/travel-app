import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
    Search,
    MapPin,
    X,
    Loader2,
    Phone,
    Check,
    Navigation,
    Sparkles,
    Globe,
    Layers,
    Move,
    CheckCircle2,
    ExternalLink,
    Store,
    Utensils,
    Coffee,
    Bed,
    Building2,
} from "lucide-react";
import { OSMService, OSMPlace, WikiData } from "../../services/api/OSMService";
import { KakaoLocalService, KakaoPlace, KakaoAddressDoc } from "../../services/api/KakaoLocalService";
import { useTheme } from "../../contexts/ThemeContext";

export interface ImportedPlacePayload {
    name: string;
    eng_name?: string;
    native_name?: string;
    loc?: string;
    phone?: string;
    lat: number;
    lng: number;
    map_url?: string;
    image_url?: string;
    description?: string;
    open?: string;
}

export interface UnifiedSearchResult {
    id: string;
    name: string;
    eng_name?: string;
    native_name?: string;
    address: string;
    roadAddress?: string;
    jibeonAddress?: string;
    phone?: string;
    lat: number;
    lng: number;
    category?: string;
    source: "kakao" | "osm";
    placeUrl?: string;
    wikiData?: WikiData | null;
}

// Controller to smoothly pan/zoom map to selected coordinate or fit bounds
function MapViewController({
    selectedPlace,
    allPlaces,
}: {
    selectedPlace: UnifiedSearchResult | null;
    allPlaces: UnifiedSearchResult[];
}) {
    const map = useMap();

    useEffect(() => {
        if (selectedPlace) {
            map.flyTo([selectedPlace.lat, selectedPlace.lng], 16, {
                duration: 1.0,
            });
        } else if (allPlaces.length > 0) {
            const bounds = L.latLngBounds(
                allPlaces.map((p) => [p.lat, p.lng] as [number, number])
            );
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            }
        }
    }, [selectedPlace, allPlaces, map]);

    return null;
}

// Map Click Listener to fine-tune / drop custom pin
function MapClickListener({
    onMapClick,
}: {
    onMapClick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface PlaceSearchMapPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
    initialCoords?: { lat?: number | null; lng?: number | null } | null;
    onSelectPlace: (
        data: ImportedPlacePayload,
        options: { preserveExisting: boolean }
    ) => void;
}

export const PlaceSearchMapPickerModal: React.FC<PlaceSearchMapPickerModalProps> = ({
    isOpen,
    onClose,
    initialQuery = "",
    initialCoords,
    onSelectPlace,
}) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [query, setQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<UnifiedSearchResult[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<UnifiedSearchResult | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Fine-tune custom marker
    const [customPin, setCustomPin] = useState<{ lat: number; lng: number } | null>(null);

    // Selected field options to import
    const [importOptions, setImportOptions] = useState({
        name: true,
        loc: true,
        latLng: true,
        phone: true,
        mapUrl: true,
        image: true,
    });
    const [preserveExisting, setPreserveExisting] = useState(true);

    const isKakaoActive = KakaoLocalService.isConfigured();

    // Perform Unified Search (Kakao + OSM)
    const handleSearch = async (searchKeyword: string) => {
        const term = searchKeyword.trim();
        if (!term) return;

        setIsSearching(true);
        setHasSearched(true);
        setCustomPin(null);
        setSelectedPlace(null);

        const unifiedResults: UnifiedSearchResult[] = [];

        try {
            // 1. Kakao Local API (Prioritized for Korea)
            if (isKakaoActive) {
                try {
                    const [kakaoPlaces, kakaoAddresses] = await Promise.all([
                        KakaoLocalService.searchKeyword(term),
                        KakaoLocalService.searchAddress(term),
                    ]);

                    kakaoPlaces.forEach((kp) => {
                        const lat = parseFloat(kp.y);
                        const lng = parseFloat(kp.x);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            unifiedResults.push({
                                id: `kakao-${kp.id}`,
                                name: kp.place_name,
                                native_name: kp.place_name,
                                address: kp.road_address_name || kp.address_name,
                                roadAddress: kp.road_address_name,
                                jibeonAddress: kp.address_name,
                                phone: kp.phone,
                                lat,
                                lng,
                                category: kp.category_name || kp.category_group_name,
                                source: "kakao",
                                placeUrl: kp.place_url,
                            });
                        }
                    });

                    kakaoAddresses.forEach((ka, idx) => {
                        const lat = parseFloat(ka.y);
                        const lng = parseFloat(ka.x);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            unifiedResults.push({
                                id: `kakao-addr-${idx}`,
                                name: ka.road_address?.building_name || ka.address_name,
                                address: ka.road_address?.address_name || ka.address_name,
                                roadAddress: ka.road_address?.address_name,
                                jibeonAddress: ka.address?.address_name,
                                lat,
                                lng,
                                category: "地址門牌",
                                source: "kakao",
                            });
                        }
                    });
                } catch (e) {
                    console.error("Kakao Map Search Error:", e);
                }
            }

            // 2. OpenStreetMap Nominatim Search (Global / Fallback)
            if (unifiedResults.length === 0) {
                try {
                    const osmPlaces = await OSMService.searchPlaces(term);
                    for (const op of osmPlaces) {
                        const lat = parseFloat(op.lat);
                        const lng = parseFloat(op.lon);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            let wikiData: WikiData | null = null;
                            if (op.extratags?.wikipedia) {
                                try {
                                    wikiData = await OSMService.getWikiData(op.extratags.wikipedia);
                                } catch (e) {
                                    // ignore wiki error
                                }
                            }

                            unifiedResults.push({
                                id: `osm-${op.place_id}`,
                                name: op.name || op.display_name.split(",")[0],
                                eng_name: wikiData?.title || op.extratags?.["name:en"],
                                address: op.display_name,
                                lat,
                                lng,
                                category: op.type || op.class,
                                source: "osm",
                                wikiData,
                            });
                        }
                    }
                } catch (e) {
                    console.error("OSM Search Error:", e);
                }
            }

            setResults(unifiedResults);
            if (unifiedResults.length > 0) {
                setSelectedPlace(unifiedResults[0]);
            }
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-search on open if query is provided
    useEffect(() => {
        if (isOpen) {
            if (initialQuery?.trim()) {
                setQuery(initialQuery);
                handleSearch(initialQuery);
            } else if (initialCoords?.lat && initialCoords?.lng) {
                setCustomPin({ lat: initialCoords.lat, lng: initialCoords.lng });
            }
        }
    }, [isOpen]);

    // Marker Generator with iOS clean aesthetic
    const createMarkerIcon = (
        index: number,
        isSelected: boolean,
        isCustom: boolean = false
    ) => {
        if (isCustom) {
            return L.divIcon({
                className: "custom-map-picker-pin",
                html: `
                    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
                        <div class="w-9 h-9 rounded-full bg-rose-500 text-white shadow-xl flex items-center justify-center border-2 border-white ring-4 ring-rose-500/30 animate-bounce">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });
        }

        const bgColor = isSelected ? "bg-blue-600 ring-4 ring-blue-500/30 scale-110" : "bg-zinc-800 hover:bg-zinc-700";
        return L.divIcon({
            className: "custom-map-picker-pin",
            html: `
                <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full transition-all duration-200">
                    <div class="w-8 h-8 rounded-full ${bgColor} text-white shadow-lg flex items-center justify-center border-2 border-white text-xs font-black">
                        ${index + 1}
                    </div>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });
    };

    // Confirm and import
    const handleConfirmImport = () => {
        if (!selectedPlace && !customPin) return;

        const base = selectedPlace;
        const finalLat = customPin ? customPin.lat : base ? base.lat : 0;
        const finalLng = customPin ? customPin.lng : base ? base.lng : 0;

        const payload: ImportedPlacePayload = {
            name: importOptions.name && base?.name ? base.name : "",
            eng_name: base?.eng_name,
            native_name: base?.native_name,
            loc: importOptions.loc && base?.address ? base.address : undefined,
            phone: importOptions.phone && base?.phone ? base.phone : undefined,
            lat: importOptions.latLng ? finalLat : 0,
            lng: importOptions.latLng ? finalLng : 0,
            map_url:
                importOptions.mapUrl && base?.placeUrl
                    ? base.placeUrl
                    : importOptions.mapUrl && importOptions.latLng
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          base?.name || "Location"
                      )}&center=${finalLat},${finalLng}`
                    : undefined,
            image_url:
                importOptions.image && base?.wikiData?.thumbnailUrl
                    ? base.wikiData.thumbnailUrl
                    : undefined,
            description:
                importOptions.image && base?.wikiData?.extract
                    ? base.wikiData.extract
                    : undefined,
        };

        onSelectPlace(payload, { preserveExisting });
        onClose();
    };

    // Default center coords (Default: Seoul / Busan or Taiwan)
    const mapCenter = useMemo<[number, number]>(() => {
        if (selectedPlace) return [selectedPlace.lat, selectedPlace.lng];
        if (customPin) return [customPin.lat, customPin.lng];
        if (results.length > 0) return [results[0].lat, results[0].lng];
        if (initialCoords?.lat && initialCoords?.lng)
            return [initialCoords.lat, initialCoords.lng];
        return [35.0993, 129.0296]; // Default to Busan Nampodong
    }, [selectedPlace, customPin, results, initialCoords]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-background text-foreground rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* 頂部搜尋標頭 */}
                <div className="p-3.5 sm:p-4 border-b border-border/80 bg-card/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch(query);
                            }}
                            className="flex-1 min-w-0 relative flex items-center"
                        >
                            <Search
                                size={16}
                                className="absolute left-3.5 text-muted-foreground pointer-events-none"
                            />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="搜尋地標、店名 (例: 에그드랍 남포동) 或詳細地址..."
                                className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-muted/60 border border-border/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-muted-foreground/60"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isSearching || !query.trim()}
                                className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                            >
                                {isSearching ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <Search size={13} />
                                )}
                                <span>搜尋</span>
                            </button>
                        </form>
                    </div>

                    {/* 服務來源徽章與關閉按鈕 */}
                    <div className="flex items-center gap-2 shrink-0">
                        {isKakaoActive ? (
                            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                                <span>🇰🇷 Kakao Local</span>
                            </span>
                        ) : (
                            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                <Globe size={12} />
                                <span>OpenStreetMap</span>
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 主要分割區塊 (左側候選清單 + 右側互動地圖) */}
                <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
                    {/* 左側 / 下方：候選地點列表 */}
                    <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border/80 bg-card flex flex-col shrink-0 h-48 md:h-full overflow-hidden">
                        <div className="p-3 border-b border-border/60 bg-muted/30 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            <span>搜尋結果 ({results.length})</span>
                            <span className="text-[11px] text-muted-foreground/70">
                                點選即可在地圖預覽
                            </span>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/40 p-2 space-y-1.5">
                            {isSearching ? (
                                <div className="p-8 text-center space-y-2 text-muted-foreground">
                                    <Loader2 size={24} className="animate-spin mx-auto text-blue-500" />
                                    <p className="text-xs">正在連線圖資庫搜尋地標...</p>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="p-8 text-center space-y-2 text-muted-foreground">
                                    <MapPin size={28} className="mx-auto text-muted-foreground/40" />
                                    <p className="text-xs font-medium">
                                        {hasSearched ? "找不到相符地點，請嘗試不同關鍵字或地址" : "請在上方輸入店名或地址開始搜尋"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/60">
                                        提示：也可以直接在右側地圖上點擊來釘選位置
                                    </p>
                                </div>
                            ) : (
                                results.map((item, idx) => {
                                    const isSelected = selectedPlace?.id === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedPlace(item);
                                                setCustomPin(null);
                                            }}
                                            className={`p-3 rounded-2xl cursor-pointer transition-all border text-left flex items-start gap-2.5 ${
                                                isSelected
                                                    ? "bg-blue-500/10 border-blue-500/40 shadow-xs text-foreground"
                                                    : "bg-card hover:bg-muted/50 border-transparent text-foreground/80"
                                            }`}
                                        >
                                            <span
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                                    isSelected
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {idx + 1}
                                            </span>

                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <h4 className="font-bold text-xs truncate text-foreground">
                                                        {item.name}
                                                    </h4>
                                                    {item.category && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground shrink-0 font-medium truncate max-w-[90px]">
                                                            {item.category.split(">").pop()?.trim()}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {item.address}
                                                </p>

                                                {item.phone && (
                                                    <p className="text-[10px] text-muted-foreground/70 font-mono flex items-center gap-1">
                                                        <Phone size={10} />
                                                        <span>{item.phone}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 右側 / 上方：互動地圖視覺化預覽 */}
                    <div className="flex-1 min-h-0 relative flex flex-col bg-muted/20">
                        <MapContainer
                            center={mapCenter}
                            zoom={15}
                            className="w-full h-full z-10"
                            style={{ background: isDark ? "#18181b" : "#f4f4f5" }}
                        >
                            <TileLayer
                                url={
                                    isDark
                                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                }
                                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            />

                            <MapViewController
                                selectedPlace={selectedPlace}
                                allPlaces={results}
                            />

                            <MapClickListener
                                onMapClick={(lat, lng) => {
                                    setCustomPin({ lat, lng });
                                    setSelectedPlace(null);
                                }}
                            />

                            {/* 候選圖釘清單 */}
                            {results.map((item, idx) => (
                                <Marker
                                    key={item.id}
                                    position={[item.lat, item.lng]}
                                    icon={createMarkerIcon(
                                        idx,
                                        selectedPlace?.id === item.id
                                    )}
                                    eventHandlers={{
                                        click: () => {
                                            setSelectedPlace(item);
                                            setCustomPin(null);
                                        },
                                    }}
                                >
                                    <Popup
                                        minWidth={260}
                                        maxWidth={320}
                                        className="custom-leaflet-popup"
                                    >
                                        <div className="p-3 space-y-2 text-xs w-[260px] sm:w-[280px]">
                                            {/* 標題與編號 */}
                                            <div className="flex items-start gap-2">
                                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-xs sm:text-sm text-foreground leading-snug break-words">
                                                        {item.name}
                                                    </h4>
                                                    {item.category && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {item.category.split(">").pop()?.trim()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 地址 (橫向寬度正常換行) */}
                                            <div className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5 pt-1.5 border-t border-border/60">
                                                <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                                                <span className="flex-1 whitespace-normal break-words text-foreground/80">
                                                    {item.address}
                                                </span>
                                            </div>

                                            {/* 電話 */}
                                            {item.phone && (
                                                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                                                    <Phone size={10} className="text-emerald-500 shrink-0" />
                                                    <span>{item.phone}</span>
                                                </div>
                                            )}

                                            {/* 快捷選取按鈕 */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPlace(item);
                                                    setCustomPin(null);
                                                }}
                                                className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                            >
                                                <Check size={12} />
                                                <span>選取此地點</span>
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* 使用者點擊自訂釘選圖釘 */}
                            {customPin && (
                                <Marker
                                    position={[customPin.lat, customPin.lng]}
                                    icon={createMarkerIcon(0, true, true)}
                                >
                                    <Popup
                                        minWidth={220}
                                        maxWidth={280}
                                        className="custom-leaflet-popup"
                                        autoPan
                                    >
                                        <div className="p-3 space-y-1.5 text-xs w-[220px]">
                                            <div className="flex items-center gap-1.5 font-bold text-rose-600">
                                                <MapPin size={14} />
                                                <span>自訂微調圖釘位置</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-mono">
                                                GPS: {customPin.lat.toFixed(5)}, {customPin.lng.toFixed(5)}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </MapContainer>

                        {/* 地圖操作浮水印指示 */}
                        <div className="absolute top-3 left-3 z-20 pointer-events-none">
                            <div className="px-3 py-1.5 rounded-full bg-background/85 backdrop-blur-md border border-border/80 shadow-md text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Move size={12} className="text-blue-500" />
                                <span>點擊地圖任意處可微調 GPS 圖釘</span>
                            </div>
                        </div>

                        {/* 底部確認選定資訊卡 (Selected Place Details & Apply) */}
                        {(selectedPlace || customPin) && (
                            <div className="absolute bottom-3 left-3 right-3 z-20 p-3 sm:p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl flex flex-col gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-sm sm:text-base text-foreground truncate">
                                                {selectedPlace ? selectedPlace.name : "自訂地標位置"}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                                                📍 GPS (
                                                {(customPin ? customPin.lat : selectedPlace!.lat).toFixed(4)},{" "}
                                                {(customPin ? customPin.lng : selectedPlace!.lng).toFixed(4)})
                                            </span>
                                        </div>

                                        {selectedPlace?.address && (
                                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                <MapPin size={12} className="text-rose-500 shrink-0" />
                                                <span>{selectedPlace.address}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                                        <button
                                            type="button"
                                            onClick={handleConfirmImport}
                                            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                                        >
                                            <Sparkles size={13} />
                                            <span>確認套用此地點</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 欄位自選勾選開關與既有欄位保護 */}
                                <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-muted-foreground font-semibold">
                                            套用欄位:
                                        </span>
                                        <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={importOptions.name}
                                                onChange={(e) =>
                                                    setImportOptions((prev) => ({
                                                        ...prev,
                                                        name: e.target.checked,
                                                    }))
                                                }
                                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                            />
                                            <span>名稱</span>
                                        </label>
                                        <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={importOptions.latLng}
                                                onChange={(e) =>
                                                    setImportOptions((prev) => ({
                                                        ...prev,
                                                        latLng: e.target.checked,
                                                    }))
                                                }
                                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                            />
                                            <span>GPS 座標</span>
                                        </label>
                                        <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={importOptions.loc}
                                                onChange={(e) =>
                                                    setImportOptions((prev) => ({
                                                        ...prev,
                                                        loc: e.target.checked,
                                                    }))
                                                }
                                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                            />
                                            <span>地址</span>
                                        </label>
                                        {selectedPlace?.phone && (
                                            <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={importOptions.phone}
                                                    onChange={(e) =>
                                                        setImportOptions((prev) => ({
                                                            ...prev,
                                                            phone: e.target.checked,
                                                        }))
                                                    }
                                                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                                />
                                                <span>電話</span>
                                            </label>
                                        )}
                                        <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={importOptions.mapUrl}
                                                onChange={(e) =>
                                                    setImportOptions((prev) => ({
                                                        ...prev,
                                                        mapUrl: e.target.checked,
                                                    }))
                                                }
                                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                            />
                                            <span>地圖網址</span>
                                        </label>
                                    </div>

                                    {/* 既有中文名與網址防覆蓋保護開關 */}
                                    <label className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold cursor-pointer select-none border border-blue-500/20">
                                        <input
                                            type="checkbox"
                                            checked={preserveExisting}
                                            onChange={(e) =>
                                                setPreserveExisting(e.target.checked)
                                            }
                                            className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                        />
                                        <span>🔒 保護已填寫的中文名與網址</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
