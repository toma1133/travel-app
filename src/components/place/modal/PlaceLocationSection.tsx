import React, { ChangeEventHandler } from "react";
import {
    MapIcon,
    MapPin,
    Train,
    Search,
    Loader2,
    Check,
    Lightbulb,
} from "lucide-react";
import type { PlaceVM } from "../../../models/types/PlaceTypes";

export interface PlaceLocationSectionProps {
    formData: PlaceVM;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    parsedMapInfo: any;
    isGeocoding: boolean;
    geocodeMsg: { type: "success" | "error"; text: string } | null;
    onAutoGeocode: () => void;
    onOpenMapPicker: () => void;
}

export const PlaceLocationSection: React.FC<PlaceLocationSectionProps> = ({
    formData,
    onFormInputChange,
    parsedMapInfo,
    isGeocoding,
    geocodeMsg,
    onAutoGeocode,
    onOpenMapPicker,
}) => {
    const hasCoordinates = !!(formData.lat && formData.lng);

    const mapSource =
        parsedMapInfo?.source ||
        (formData.map_url?.includes("naver.com") || formData.map_url?.includes("naver.me")
            ? "Naver Map"
            : formData.map_url?.includes("kakao.com") || formData.map_url?.includes("kko.to")
            ? "Kakao Map"
            : formData.map_url?.includes("maps.apple.com")
            ? "Apple Maps"
            : formData.map_url?.includes("google")
            ? "Google Maps"
            : null);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    地圖與交通 (MAP & LOCATION)
                </span>
                <button
                    type="button"
                    onClick={onOpenMapPicker}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                    <MapPin size={11} />
                    <span>🗺️ 開啟地圖選點預覽</span>
                </button>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                {/* 地圖連結 */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 w-24 sm:w-28 shrink-0">
                        <MapIcon size={13} className="text-blue-500" />
                        <span className="text-muted-foreground font-medium">地圖網址</span>
                    </div>
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                        <input
                            type="text"
                            name="map_url"
                            value={formData.map_url || ""}
                            onChange={onFormInputChange}
                            placeholder="Naver / Google / Apple Maps 連結或經緯度"
                            className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40 text-xs"
                        />
                        {mapSource && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold shrink-0">
                                {mapSource === "Naver Map" && "🇰🇷 Naver"}
                                {mapSource === "Kakao Map" && "🇰🇷 Kakao"}
                                {mapSource === "Apple Maps" && "🍎 Apple"}
                                {mapSource === "Google Maps" && "🌐 Google"}
                                {mapSource === "Direct Coordinate" && "📍 座標"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Naver / Kakao 網址未帶座標時的專屬智慧提示與一鍵定位按鈕 */}
                {formData.map_url &&
                    (formData.map_url.includes("naver") || formData.map_url.includes("kakao")) &&
                    !hasCoordinates && (
                        <div className="p-2.5 bg-blue-500/10 border-b border-border/60 flex items-center justify-between gap-2 text-xs text-blue-700 dark:text-blue-300">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="shrink-0">💡</span>
                                <span className="truncate text-[11px]">
                                    此地圖網址未包含經緯度，點擊右側即可自動定位
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={onAutoGeocode}
                                disabled={isGeocoding}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                {isGeocoding ? (
                                    <Loader2 size={11} className="animate-spin" />
                                ) : (
                                    <Search size={11} />
                                )}
                                <span>{isGeocoding ? "定位中..." : "自動定位 GPS"}</span>
                            </button>
                        </div>
                    )}

                {/* 詳細地址 */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 w-24 sm:w-28 shrink-0">
                        <MapPin size={13} className="text-rose-500" />
                        <span className="text-muted-foreground font-medium">詳細地址</span>
                    </div>
                    <div className="min-w-0 flex-1 flex items-center gap-1.5">
                        <input
                            type="text"
                            name="info.loc"
                            value={formData.info?.loc || ""}
                            onChange={onFormInputChange}
                            placeholder="例: 서울특별시 중구 명동길 29"
                            className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                        />
                        {hasCoordinates && (
                            <span
                                className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono shrink-0 flex items-center gap-1"
                                title={`GPS 座標: ${formData.lat}, ${formData.lng}`}
                            >
                                <span>📍 GPS</span>
                                <span className="opacity-80">
                                    ({(() => {
                                        const latNum =
                                            typeof formData.lat === "number"
                                                ? formData.lat
                                                : parseFloat(String(formData.lat));
                                        const lngNum =
                                            typeof formData.lng === "number"
                                                ? formData.lng
                                                : parseFloat(String(formData.lng));
                                        return `${!isNaN(latNum) ? latNum.toFixed(3) : ""}, ${
                                            !isNaN(lngNum) ? lngNum.toFixed(3) : ""
                                        }`;
                                    })()})
                                </span>
                            </span>
                        )}
                    </div>
                </div>

                {/* 提示訊息 (自動定位回饋) */}
                {geocodeMsg && (
                    <div
                        className={`px-3.5 py-1.5 text-[11px] flex items-center gap-1.5 ${
                            geocodeMsg.type === "success"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                    >
                        {geocodeMsg.type === "success" ? (
                            <Check size={12} />
                        ) : (
                            <Lightbulb size={12} />
                        )}
                        <span>{geocodeMsg.text}</span>
                    </div>
                )}

                {/* 交通指引 / 最近出口 */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                        <Train size={13} className="text-indigo-500" />
                        <span>交通指引</span>
                    </span>
                    <input
                        type="text"
                        name="info.transit_access"
                        value={formData.info?.transit_access || ""}
                        onChange={onFormInputChange}
                        placeholder="例: JR 新宿站東口步行 3 分鐘"
                        className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                    />
                </div>
            </div>
        </div>
    );
};
