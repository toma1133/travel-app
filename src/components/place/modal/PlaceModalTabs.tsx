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
        <div className="p-2.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-slate-50 dark:bg-neutral-900 shrink-0">
            {/* 手機版：美觀下拉式選單 */}
            <div className="sm:hidden relative">
                <select
                    value={activeTab}
                    onChange={(e) => onTabChange(e.target.value as PlaceModalTab)}
                    className="w-full bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 dark:text-white appearance-none shadow-xs outline-none focus:ring-2 focus:ring-blue-500/40 pr-9 cursor-pointer"
                >
                    <option value="basic" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">🧭 基本與地圖 (Basic & Map)</option>
                    <option value="hours" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">⏰ 營業與時間 (Hours & Schedule)</option>
                    <option value="items" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                        🍽️ 推薦品項 (Recommended Items){recommendedCount > 0 ? ` (${recommendedCount})` : ""}
                    </option>
                    <option value="details" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">💰 預算與細節 (Budget & Details)</option>
                </select>
                <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
            </div>

            {/* 平板與桌面版：iOS Segmented Control 分段切換列 */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-neutral-950/70 rounded-xl border border-slate-300/70 dark:border-neutral-800 overflow-x-auto no-scrollbar">
                <button
                    type="button"
                    onClick={() => onTabChange("basic")}
                    className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                        activeTab === "basic"
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-slate-300/80 dark:border-neutral-700"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
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
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-slate-300/80 dark:border-neutral-700"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
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
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-slate-300/80 dark:border-neutral-700"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
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
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs border border-slate-300/80 dark:border-neutral-700"
                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                >
                    <Tag size={13} className={activeTab === "details" ? "text-purple-500" : ""} />
                    <span>預算與細節</span>
                </button>
            </div>
        </div>
    );
};
