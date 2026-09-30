import React, { RefObject } from "react";
import { Store, MapPin } from "lucide-react";
import type { PlaceVM } from "../../../models/types/PlaceTypes";

export interface ShoppingStoreSelectProps {
    store: string;
    placeId: string | null;
    places: PlaceVM[];
    filteredPlaces: PlaceVM[];
    isPlaceDropdownOpen: boolean;
    placeComboboxRef: RefObject<HTMLDivElement | null>;
    onStoreChange: (val: string) => void;
    onToggleDropdown: () => void;
    onCloseDropdown: () => void;
    onSelectPlace: (place: PlaceVM) => void;
}

export const ShoppingStoreSelect: React.FC<ShoppingStoreSelectProps> = ({
    store,
    placeId,
    places,
    filteredPlaces,
    isPlaceDropdownOpen,
    placeComboboxRef,
    onStoreChange,
    onToggleDropdown,
    onCloseDropdown,
    onSelectPlace,
}) => {
    return (
        <div className="space-y-1.5 relative" ref={placeComboboxRef}>
            <label className="font-bold text-neutral-900 dark:text-neutral-100 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1">
                    <Store size={12} className="text-primary" />
                    <span>預計購買店家 / 地點</span>
                </span>
                {placeId && (
                    <span className="text-[10px] text-primary flex items-center gap-0.5">
                        <MapPin size={11} /> 已關聯地標
                    </span>
                )}
            </label>

            <div className="relative">
                <input
                    type="text"
                    placeholder="輸入店家名稱，或從行程地標選擇..."
                    value={store}
                    onChange={(e) => onStoreChange(e.target.value)}
                    onFocus={onToggleDropdown}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-neutral-50/90 dark:bg-neutral-900/80 border border-black/15 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs focus:bg-white dark:focus:bg-neutral-900 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 font-medium shadow-2xs transition-all"
                />

                <button
                    type="button"
                    onClick={onToggleDropdown}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg border border-black/10 dark:border-white/15 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                    <MapPin size={11} className="text-primary" />
                    <span>選地標</span>
                </button>
            </div>

            {/* 行程地標候選下拉清單 */}
            {isPlaceDropdownOpen && places.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white/95 dark:bg-neutral-900/95 border border-black/10 dark:border-white/15 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-1 backdrop-blur-xl">
                    <div className="px-2 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                        <span>行程地標 ({filteredPlaces.length})</span>
                        <button
                            type="button"
                            onClick={onCloseDropdown}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                        >
                            關閉
                        </button>
                    </div>
                    {filteredPlaces.map((p) => (
                        <div
                            key={p.id}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSelectPlace(p);
                            }}
                            onClick={() => onSelectPlace(p)}
                            className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <MapPin size={13} className="text-primary shrink-0" />
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                    {p.name}
                                </span>
                            </div>
                            {p.tags && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500 shrink-0">
                                    {p.tags.split(",")[0]}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
