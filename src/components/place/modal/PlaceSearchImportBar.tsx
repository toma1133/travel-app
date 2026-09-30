import React from "react";
import { Search, Loader2, X, MapPin, Sparkles } from "lucide-react";
import { OSMPlace, WikiData } from "../../../services/api/OSMService";

export interface PlaceSearchImportBarProps {
    searchTerm: string;
    onSearchTermChange: (val: string) => void;
    isSearching: boolean;
    searchResults: OSMPlace[];
    showSuggestions: boolean;
    selectedPlace: { osm: OSMPlace; wiki: WikiData | null } | null;
    importFields: {
        name: boolean;
        eng_name: boolean;
        image_url: boolean;
        open: boolean;
        loc: boolean;
        map_url: boolean;
        description: boolean;
    };
    preserveExistingTop: boolean;
    onSelectResult: (place: OSMPlace) => void;
    onClearSearch: () => void;
    onCloseSelectedPlace: () => void;
    onToggleImportField: (field: string, checked: boolean) => void;
    onTogglePreserveExisting: (checked: boolean) => void;
    onApplyImport: () => void;
    onOpenMapPicker: () => void;
}

export const PlaceSearchImportBar: React.FC<PlaceSearchImportBarProps> = ({
    searchTerm,
    onSearchTermChange,
    isSearching,
    searchResults,
    showSuggestions,
    selectedPlace,
    importFields,
    preserveExistingTop,
    onSelectResult,
    onClearSearch,
    onCloseSelectedPlace,
    onToggleImportField,
    onTogglePreserveExisting,
    onApplyImport,
    onOpenMapPicker,
}) => {
    return (
        <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-neutral-900 shrink-0">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
                        size={14}
                    />
                    <input
                        type="text"
                        placeholder="🔍 搜尋真實景點/店家自動帶入 (Kakao / OSM)..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none focus:border-blue-500 transition-all shadow-2xs"
                    />
                    {isSearching ? (
                        <Loader2
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
                            size={14}
                        />
                    ) : searchTerm ? (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full hover:bg-muted"
                        >
                            <X size={13} />
                        </button>
                    ) : null}
                </div>

                <button
                    type="button"
                    onClick={onOpenMapPicker}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    title="開啟互動地圖搜尋與視覺化確認"
                >
                    <MapPin size={13} />
                    <span className="hidden sm:inline">地圖選點預覽</span>
                    <span className="sm:hidden">地圖</span>
                </button>
            </div>

            {showSuggestions && searchResults.length > 0 && (
                <div className="mt-2 bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-750 rounded-2xl shadow-xl max-h-56 overflow-y-auto no-scrollbar p-1.5 z-20">
                    {searchResults.map((place) => (
                        <button
                            key={place.place_id}
                            type="button"
                            onClick={() => onSelectResult(place)}
                            className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-neutral-800/70 rounded-xl transition-colors flex items-start gap-2.5 cursor-pointer"
                        >
                            <MapPin size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div className="truncate flex-1">
                                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {place.name || place.display_name.split(",")[0]}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                                    {place.display_name}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selectedPlace && (
                <div className="mt-2 bg-white dark:bg-neutral-900 border border-blue-500/30 p-3 rounded-2xl shadow-xs text-xs space-y-2.5">
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Sparkles size={13} /> 找到地點資料：{selectedPlace.osm.name}
                        </span>
                        <button
                            type="button"
                            onClick={onCloseSelectedPlace}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                        {selectedPlace.wiki?.title && (
                            <div>
                                <strong>英文:</strong> {selectedPlace.wiki.title}
                            </div>
                        )}
                        {selectedPlace.osm.extratags?.opening_hours && (
                            <div>
                                <strong>營業:</strong> {selectedPlace.osm.extratags.opening_hours}
                            </div>
                        )}
                    </div>

                    {/* 欄位勾選與保護開關 */}
                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="inline-flex items-center gap-1 text-foreground cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={importFields.name}
                                    onChange={(e) =>
                                        onToggleImportField("name", e.target.checked)
                                    }
                                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <span>名稱</span>
                            </label>
                            <label className="inline-flex items-center gap-1 text-foreground cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={importFields.loc}
                                    onChange={(e) =>
                                        onToggleImportField("loc", e.target.checked)
                                    }
                                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <span>地址</span>
                            </label>
                            <label className="inline-flex items-center gap-1 text-foreground cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={importFields.map_url}
                                    onChange={(e) =>
                                        onToggleImportField("map_url", e.target.checked)
                                    }
                                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <span>地圖網址</span>
                            </label>
                        </div>

                        <label className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={preserveExistingTop}
                                onChange={(e) =>
                                    onTogglePreserveExisting(e.target.checked)
                                }
                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <span>🔒 保護已填寫內容</span>
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={onApplyImport}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                    >
                        <Sparkles size={13} />
                        <span>確認帶入選取資料</span>
                    </button>
                </div>
            )}
        </div>
    );
};
