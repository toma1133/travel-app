import React from "react";
import { Compass, Clock, Utensils, Tag, ChevronDown } from "lucide-react";
import type { PlaceModalTab } from "./usePlaceFormState";

export interface PlaceModalTabsProps {
    activeTab: PlaceModalTab;
    onTabChange: (tab: PlaceModalTab) => void;
    recommendedCount: number;
}

export const PlaceModalTabs: React.FC<PlaceModalTabsProps> = ({
    activeTab,
    onTabChange,
    recommendedCount,
}) => {
    return (
        <div className="p-2.5 border-b border-border/60 bg-muted/30 shrink-0">
            {/* 手機版：美觀下拉式選單 */}
            <div className="sm:hidden relative">
                <select
                    value={activeTab}
                    onChange={(e) => onTabChange(e.target.value as PlaceModalTab)}
                    className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground appearance-none shadow-xs outline-none focus:ring-2 focus:ring-blue-500/40 pr-9 cursor-pointer"
                >
                    <option value="basic">🧭 基本與地圖 (Basic & Map)</option>
                    <option value="hours">⏰ 營業與時間 (Hours & Schedule)</option>
                    <option value="items">
                        🍽️ 推薦品項 (Recommended Items){recommendedCount > 0 ? ` (${recommendedCount})` : ""}
                    </option>
                    <option value="details">💰 預算與細節 (Budget & Details)</option>
                </select>
                <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
            </div>

            {/* 平板與桌面版：iOS Segmented Control 分段切換列 */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/60 overflow-x-auto no-scrollbar">
                <button
                    type="button"
                    onClick={() => onTabChange("basic")}
                    className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                        activeTab === "basic"
                            ? "bg-card text-foreground shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Compass size={13} className={activeTab === "basic" ? "text-blue-500" : ""} />
                    <span>基本與地圖</span>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange("hours")}
                    className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                        activeTab === "hours"
                            ? "bg-card text-foreground shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Clock size={13} className={activeTab === "hours" ? "text-amber-500" : ""} />
                    <span>營業與時間</span>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange("items")}
                    className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                        activeTab === "items"
                            ? "bg-card text-foreground shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Utensils size={13} className={activeTab === "items" ? "text-rose-500" : ""} />
                    <span>推薦品項</span>
                    {recommendedCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono">
                            {recommendedCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange("details")}
                    className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                        activeTab === "details"
                            ? "bg-card text-foreground shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Tag size={13} className={activeTab === "details" ? "text-purple-500" : ""} />
                    <span>預算與細節</span>
                </button>
            </div>
        </div>
    );
};
