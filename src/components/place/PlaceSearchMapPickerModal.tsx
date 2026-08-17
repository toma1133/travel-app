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

// Controller to smoothly pan/zoom map to selected coordinate, custom pin, or fit bounds
function MapViewController({
    selectedPlace,
    customPin,
    allPlaces,
}: {
    selectedPlace: UnifiedSearchResult | null;
    customPin: { lat: number; lng: number } | null;
    allPlaces: UnifiedSearchResult[];
}) {
    const map = useMap();

    useEffect(() => {
        if (selectedPlace) {
            map.flyTo([selectedPlace.lat, selectedPlace.lng], 16, {
                duration: 1.0,
            });
        } else if (customPin && allPlaces.length === 0) {
            map.flyTo([customPin.lat, customPin.lng], 16, {
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
    }, [selectedPlace, customPin, allPlaces, map]);

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
    onSelectPlace: (data: ImportedPlacePayload) => void;
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
                setCustomPin(null);
            } else if (initialCoords?.lat && initialCoords?.lng) {
                // 找不到相符地點時，若原本有傳入 GPS 座標，自動恢復並保留自訂圖釘
                setCustomPin({ lat: initialCoords.lat, lng: initialCoords.lng });
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
                setQuery("");
                setResults([]);
                setSelectedPlace(null);
                setCustomPin({ lat: initialCoords.lat, lng: initialCoords.lng });
            }
        }
    }, [isOpen]);

    // Marker Generator with exact pixel anchoring (zero offset / drift)
    const createMarkerIcon = (
        index: number,
        isSelected: boolean,
        isCustom: boolean = false
    ) => {
        if (isCustom) {
            const svg = `
                <div style="width: 38px; height: 46px; position: relative; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
                    <svg viewBox="0 0 38 46" width="38" height="46" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 0C8.506 0 0 8.506 0 19c0 13.5 19 27 19 27s19-13.5 19-27C38 8.506 29.494 0 19 0z" fill="#f43f5e"/>
                        <circle cx="19" cy="18" r="13" fill="#ffffff" fill-opacity="0.2"/>
                        <circle cx="19" cy="18" r="10" fill="#ffffff"/>
                        <circle cx="19" cy="18" r="4.5" fill="#f43f5e"/>
                    </svg>
                </div>
            `;
            return L.divIcon({
                className: "custom-map-picker-pin !bg-transparent !border-0",
                html: svg,
                iconSize: [38, 46],
                iconAnchor: [19, 46],
                popupAnchor: [0, -44],
            });
        }

        const color = isSelected ? "#2563eb" : "#27272a";
        const svg = `
            <div style="width: 34px; height: 42px; position: relative; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3)); transition: transform 0.2s ease;">
                <svg viewBox="0 0 34 42" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 0C7.611 0 0 7.611 0 17c0 12 17 25 17 25s17-13 17-25C34 7.611 26.389 0 17 0z" fill="${color}"/>
                    <circle cx="17" cy="16" r="10" fill="#ffffff"/>
                </svg>
                <div style="position: absolute; top: 5px; left: 0; width: 34px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: ${color}; font-family: ui-sans-serif, system-ui, sans-serif;">
                    ${index + 1}
                </div>
            </div>
        `;
        return L.divIcon({
            className: "custom-map-picker-pin !bg-transparent !border-0",
            html: svg,
            iconSize: [34, 42],
            iconAnchor: [17, 42],
            popupAnchor: [0, -40],
        });
    };

    // Confirm and import
    const handleConfirmImport = () => {
        if (!selectedPlace && !customPin) return;

        const finalLat = customPin ? customPin.lat : selectedPlace ? selectedPlace.lat : 0;
        const finalLng = customPin ? customPin.lng : selectedPlace ? selectedPlace.lng : 0;
        const base = selectedPlace;
        const placeName = base?.name || (query?.trim() ? query.trim() : "");

        const payload: ImportedPlacePayload = {
            name: placeName,
            eng_name: base?.eng_name,
            native_name: base?.native_name,
            loc: base?.address,
            phone: base?.phone,
            lat: finalLat,
            lng: finalLng,
            map_url:
                !customPin && base?.placeUrl
                    ? base.placeUrl
                    : finalLat && finalLng
                    ? `https://www.google.com/maps/search/?api=1&query=${finalLat},${finalLng}`
                    : undefined,
            image_url: base?.wikiData?.thumbnailUrl,
            description: base?.wikiData?.extract,
        };

        onSelectPlace(payload);
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
                                customPin={customPin}
                                allPlaces={results}
                            />

                            <MapClickListener
                                onMapClick={(lat, lng) => {
                                    setCustomPin({ lat, lng });
                                    if (results.length === 0) {
                                        setSelectedPlace(null);
                                    }
                                }}
                            />

                            {/* 候選圖釘清單 */}
                            {results.map((item, idx) => (
                                <Marker
                                    key={item.id}
                                    position={[item.lat, item.lng]}
                                    icon={createMarkerIcon(
                                        idx,
                                        selectedPlace?.id === item.id && !customPin
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

                            {/* 使用者點擊自訂釘選圖釘 (支援拖曳微調) */}
                            {customPin && (
                                <Marker
                                    position={[customPin.lat, customPin.lng]}
                                    icon={createMarkerIcon(0, true, true)}
                                    draggable={true}
                                    eventHandlers={{
                                        dragend: (e) => {
                                            const marker = e.target;
                                            const position = marker.getLatLng();
                                            setCustomPin({ lat: position.lat, lng: position.lng });
                                        },
                                    }}
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
                                            <p className="text-[10px] text-muted-foreground/70">
                                                可按住圖釘拖曳微調位置
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </MapContainer>

                        {/* 地圖操作浮水印指示 (置於右上角，不遮擋左上角 Leaflet 縮放控制鈕) */}
                        <div className="absolute top-3 right-3 z-20 pointer-events-none">
                            <div className="px-3 py-1.5 rounded-full bg-background/85 backdrop-blur-md border border-border/80 shadow-md text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Move size={12} className="text-blue-500" />
                                <span>點擊地圖任意處或拖曳圖釘可微調 GPS</span>
                            </div>
                        </div>

                        {/* 底部確認選定資訊卡 (Selected Place Details & Apply) */}
                        {(selectedPlace || customPin) && (
                            <div className="absolute bottom-3 left-3 right-3 z-20 p-3 sm:p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl flex flex-col gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-sm sm:text-base text-foreground truncate">
                                                {selectedPlace
                                                    ? customPin
                                                        ? `${selectedPlace.name} (自訂微調位置)`
                                                        : selectedPlace.name
                                                    : query?.trim()
                                                    ? `${query.trim()} (自訂位置)`
                                                    : "自訂地標位置"}
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
                                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                                        >
                                            <Sparkles size={14} />
                                            <span>確認套用此地點</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
