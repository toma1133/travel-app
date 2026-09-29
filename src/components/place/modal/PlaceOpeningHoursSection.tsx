import React, { ChangeEvent, ChangeEventHandler } from "react";
import {
    Clock,
    Sparkles,
    CalendarX,
    FileText,
    ChevronDown,
    Plus,
    Trash2,
} from "lucide-react";
import type { PlaceVM } from "../../../models/types/PlaceTypes";

// --- iOS 風格時間選單 ---
export const TimeSelect = ({
    value,
    onChange,
    name,
}: {
    value: string;
    onChange: (e: any) => void;
    name: string;
}) => {
    const [hh, mm] = (value || "09:00").split(":");
    const handleHH = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({
            target: { name, value: `${e.target.value}:${mm || "00"}` },
        });
    };
    const handleMM = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({
            target: { name, value: `${hh || "00"}:${e.target.value}` },
        });
    };
    return (
        <div className="inline-flex items-center gap-1 bg-muted/40 border border-border/70 rounded-xl px-2 py-1">
            <select
                className="bg-transparent text-xs font-mono font-bold text-foreground outline-none cursor-pointer"
                value={hh || "09"}
                onChange={handleHH}
            >
                {Array.from({ length: 24 }).map((_, i) => {
                    const val = i.toString().padStart(2, "0");
                    return (
                        <option key={val} value={val} className="bg-background text-foreground">
                            {val}
                        </option>
                    );
                })}
            </select>
            <span className="font-bold text-muted-foreground text-xs">:</span>
            <select
                className="bg-transparent text-xs font-mono font-bold text-foreground outline-none cursor-pointer"
                value={mm || "00"}
                onChange={handleMM}
            >
                {[
                    "00",
                    "05",
                    "10",
                    "15",
                    "20",
                    "25",
                    "30",
                    "35",
                    "40",
                    "45",
                    "50",
                    "55",
                ].map((val) => (
                    <option key={val} value={val} className="bg-background text-foreground">
                        {val}
                    </option>
                ))}
            </select>
        </div>
    );
};

// --- 住宿入住/退房時間設定 ---
export const CheckInOutField = ({
    label,
    name,
    value,
    onChange,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: any) => void;
}) => {
    const defaultTime = name.includes("check_in") ? "15:00" : "11:00";
    const timeValue = value || defaultTime;
    const presets = name.includes("check_in")
        ? ["14:00", "15:00", "16:00"]
        : ["10:00", "11:00", "12:00"];

    return (
        <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Clock size={12} className="text-primary" /> {label}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
                <TimeSelect value={timeValue} onChange={onChange} name={name} />
                <div className="flex items-center gap-1">
                    {presets.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onChange({ target: { name, value: p } })}
                            className={`px-2 py-0.5 text-xs rounded-lg border transition-all cursor-pointer ${
                                timeValue === p
                                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                    : "bg-muted/30 text-muted-foreground border-border/60 hover:border-primary/50"
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- 營業時間設定組件 (iOS Inset Grouped) ---
export const BusinessHoursSection = ({
    formData,
    onFormInputChange,
}: {
    formData: PlaceVM;
    onFormInputChange: (e: any) => void;
}) => {
    const rawOpen = formData?.info?.open || "09:00 - 17:00";
    let mode: "24_hours" | "uniform" | "per_day" | "custom" = "uniform";
    let perDaySchedule: Record<number, string[]> = {};

    if (rawOpen.startsWith("{") && rawOpen.includes('"type":"per_day"')) {
        try {
            const parsed = JSON.parse(rawOpen);
            if (parsed.type === "per_day") {
                mode = "per_day";
                perDaySchedule = parsed.schedule || {};
            }
        } catch (e) {}
    } else if (
        rawOpen.includes("24小時") ||
        rawOpen.includes("24 hours") ||
        rawOpen.includes("24hr") ||
        rawOpen === "00:00 - 24:00" ||
        rawOpen === "00:00 - 00:00" ||
        rawOpen === "全天開放" ||
        rawOpen === "全年無休"
    ) {
        mode = "24_hours";
    } else if (
        rawOpen &&
        !rawOpen.startsWith("{") &&
        !/^[\d:\s,\-]*$/.test(rawOpen)
    ) {
        mode = "custom";
    }

    [1, 2, 3, 4, 5, 6, 7].forEach((d) => {
        if (!perDaySchedule[d]) perDaySchedule[d] = [];
    });

    const setMode = (newMode: "24_hours" | "uniform" | "per_day" | "custom") => {
        if (newMode === "24_hours") {
            onFormInputChange({
                target: { name: "info.open", value: "24小時營業" },
            });
        } else if (newMode === "uniform") {
            onFormInputChange({
                target: { name: "info.open", value: "09:00 - 17:00" },
            });
        } else if (newMode === "per_day") {
            const initJSON = JSON.stringify({
                type: "per_day",
                schedule: {
                    1: ["09:00 - 17:00"],
                    2: ["09:00 - 17:00"],
                    3: ["09:00 - 17:00"],
                    4: ["09:00 - 17:00"],
                    5: ["09:00 - 17:00"],
                    6: ["09:00 - 17:00"],
                    7: ["09:00 - 17:00"],
                },
            });
            onFormInputChange({
                target: { name: "info.open", value: initJSON },
            });
        } else {
            onFormInputChange({
                target: {
                    name: "info.open",
                    value: "在此輸入詳細營業時間...",
                },
            });
        }
    };

    const applyPreset = (presetValue: string) => {
        onFormInputChange({
            target: { name: "info.open", value: presetValue },
        });
    };

    const uniformPeriods = (
        mode === "uniform" ? rawOpen : "09:00 - 17:00"
    )
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p !== "");
    if (uniformPeriods.length === 0) uniformPeriods.push("09:00 - 17:00");

    return (
        <div className="space-y-4">
            {/* 模式切換器 */}
            <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    營業模式設定 (SCHEDULE MODE)
                </span>

                {/* 手機版：美觀下拉式選單 */}
                <div className="sm:hidden relative">
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as any)}
                        className="w-full bg-card border border-border/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground appearance-none shadow-xs outline-none focus:ring-2 focus:ring-blue-500/40 pr-9 cursor-pointer"
                    >
                        <option value="24_hours">✨ 24H 營業 (24 Hours Open)</option>
                        <option value="uniform">⏰ 每日統一 (Daily Uniform Hours)</option>
                        <option value="per_day">📅 依星期設定 (Set by Day of Week)</option>
                        <option value="custom">📝 自訂文字 (Custom Text)</option>
                    </select>
                    <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                </div>

                {/* 平板與桌面版：4 欄式切換按鈕 */}
                <div className="hidden sm:grid grid-cols-4 gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/60">
                    <button
                        type="button"
                        onClick={() => setMode("24_hours")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            mode === "24_hours"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        <Sparkles size={13} />
                        <span>24H 營業</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("uniform")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            mode === "uniform"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        <Clock size={13} />
                        <span>每日統一</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("per_day")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            mode === "per_day"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        <CalendarX size={13} />
                        <span>依星期設定</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("custom")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            mode === "custom"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        <FileText size={13} />
                        <span>自訂文字</span>
                    </button>
                </div>
            </div>

            {/* 常用預設快捷按鈕 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                <span className="text-[11px] text-muted-foreground shrink-0 font-medium mr-0.5">
                    快捷：
                </span>
                <button
                    type="button"
                    onClick={() => applyPreset("24小時營業")}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                        mode === "24_hours"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted/40 border-border/60 hover:border-emerald-500/50 text-foreground/80"
                    }`}
                >
                    🌟 24小時
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("09:00 - 17:00")}
                    className="px-2 py-0.5 rounded-lg border border-border/60 bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    ☀️ 景點 09-17
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("08:00 - 18:00")}
                    className="px-2 py-0.5 rounded-lg border border-border/60 bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    ☕ 咖啡 08-18
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("11:00 - 14:30, 17:00 - 21:00")}
                    className="px-2 py-0.5 rounded-lg border border-border/60 bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    🍜 餐廳 11-14:30, 17-21
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("18:00 - 02:00")}
                    className="px-2 py-0.5 rounded-lg border border-border/60 bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    🌙 居酒屋 18-02
                </button>
            </div>

            {/* 時間排程卡片 (Inset Grouped) */}
            <div className="rounded-2xl bg-card border border-border/80 divide-y divide-border/50 text-xs overflow-hidden shadow-2xs">
                {mode === "24_hours" ? (
                    <div className="p-4 bg-emerald-500/10 text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                                    24 小時全天營業（全年無休 / 全天開放）
                                </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                                24 Hours
                            </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                            此地點將在行程安排、地標預覽與地圖中即時標註為「<strong className="text-emerald-600 dark:text-emerald-400">● 營業中 (24H)</strong>」。
                        </p>
                    </div>
                ) : mode === "custom" ? (
                    <div className="p-3 sm:p-3.5">
                        <textarea
                            name="info.open"
                            value={rawOpen}
                            onChange={onFormInputChange}
                            className="w-full bg-muted/20 border border-border/60 rounded-xl p-3 outline-none text-xs focus:border-primary min-h-[90px] resize-y placeholder:text-muted-foreground/50"
                            placeholder="例如：每月第二個星期二公休、採預約制、或特殊活動期間開放..."
                        />
                    </div>
                ) : mode === "per_day" ? (
                    <div className="divide-y divide-border/50">
                        {/* 快速排程輔助列 */}
                        <div className="p-2.5 sm:p-3 bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-muted-foreground">批次排程：</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const all24H: Record<number, string[]> = {};
                                        [1, 2, 3, 4, 5, 6, 7].forEach((d) => {
                                            all24H[d] = ["24小時營業"];
                                        });
                                        onFormInputChange({
                                            target: {
                                                name: "info.open",
                                                value: JSON.stringify({
                                                    type: "per_day",
                                                    schedule: all24H,
                                                }),
                                            },
                                        });
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold transition-colors cursor-pointer text-[11px]"
                                >
                                    🌟 全設 24H
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allUniform: Record<number, string[]> = {};
                                        [1, 2, 3, 4, 5, 6, 7].forEach((d) => {
                                            allUniform[d] = ["09:00 - 17:00"];
                                        });
                                        onFormInputChange({
                                            target: {
                                                name: "info.open",
                                                value: JSON.stringify({
                                                    type: "per_day",
                                                    schedule: allUniform,
                                                }),
                                            },
                                        });
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-bold transition-colors cursor-pointer text-[11px]"
                                >
                                    🔄 全設 09-17
                                </button>
                            </div>
                        </div>

                        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                            const dayNames = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
                            const dayName = dayNames[dayNum - 1];
                            const periods = perDaySchedule[dayNum] || [];
                            const is24H = periods.some(
                                (p) =>
                                    p.includes("24小時") ||
                                    p.includes("24 Hours") ||
                                    p.includes("24hr") ||
                                    p === "00:00 - 24:00"
                            );
                            const isClosed = !is24H && periods.length === 0;

                            return (
                                <div
                                    key={dayNum}
                                    className="p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card hover:bg-muted/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-bold text-foreground px-2 py-1 bg-muted/60 rounded-xl min-w-[45px] text-center border border-border/50">
                                            {dayName}
                                        </span>
                                        <div className="grid grid-cols-3 gap-0.5 bg-muted/60 p-0.5 rounded-xl border border-border/60 text-[11px] w-36">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSchedule = { ...perDaySchedule };
                                                    newSchedule[dayNum] = ["09:00 - 17:00"];
                                                    onFormInputChange({
                                                        target: {
                                                            name: "info.open",
                                                            value: JSON.stringify({
                                                                type: "per_day",
                                                                schedule: newSchedule,
                                                            }),
                                                        },
                                                    });
                                                }}
                                                className={`py-0.5 text-center rounded-lg font-bold transition-all cursor-pointer ${
                                                    !isClosed && !is24H
                                                        ? "bg-primary text-primary-foreground shadow-xs"
                                                        : "text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                營業
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSchedule = { ...perDaySchedule };
                                                    newSchedule[dayNum] = ["24小時營業"];
                                                    onFormInputChange({
                                                        target: {
                                                            name: "info.open",
                                                            value: JSON.stringify({
                                                                type: "per_day",
                                                                schedule: newSchedule,
                                                            }),
                                                        },
                                                    });
                                                }}
                                                className={`py-0.5 text-center rounded-lg font-bold transition-all cursor-pointer ${
                                                    is24H
                                                        ? "bg-emerald-600 text-white shadow-xs"
                                                        : "text-muted-foreground hover:text-emerald-600"
                                                }`}
                                            >
                                                24H
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSchedule = { ...perDaySchedule };
                                                    newSchedule[dayNum] = [];
                                                    onFormInputChange({
                                                        target: {
                                                            name: "info.open",
                                                            value: JSON.stringify({
                                                                type: "per_day",
                                                                schedule: newSchedule,
                                                            }),
                                                        },
                                                    });
                                                }}
                                                className={`py-0.5 text-center rounded-lg font-bold transition-all cursor-pointer ${
                                                    isClosed
                                                        ? "bg-rose-600 text-white shadow-xs"
                                                        : "text-muted-foreground hover:text-rose-600"
                                                }`}
                                            >
                                                公休
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 flex justify-start sm:justify-end">
                                        {is24H ? (
                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                ● 24 小時營業
                                            </span>
                                        ) : isClosed ? (
                                            <span className="text-[11px] text-rose-500 font-semibold px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
                                                公休不營業
                                            </span>
                                        ) : (
                                            <div className="space-y-1">
                                                {periods.map((period, pIdx) => {
                                                    const [start, end] = period.split("-").map((s) => s.trim());
                                                    return (
                                                        <div key={pIdx} className="flex items-center gap-1.5 flex-wrap">
                                                            <TimeSelect
                                                                name={`p_start_${dayNum}_${pIdx}`}
                                                                value={start || "09:00"}
                                                                onChange={(e) => {
                                                                    const newSchedule = { ...perDaySchedule };
                                                                    newSchedule[dayNum][pIdx] = `${e.target.value} - ${end || "17:00"}`;
                                                                    onFormInputChange({
                                                                        target: {
                                                                            name: "info.open",
                                                                            value: JSON.stringify({
                                                                                type: "per_day",
                                                                                schedule: newSchedule,
                                                                            }),
                                                                        },
                                                                    });
                                                                }}
                                                            />
                                                            <span className="font-bold text-muted-foreground text-xs">至</span>
                                                            <TimeSelect
                                                                name={`p_end_${dayNum}_${pIdx}`}
                                                                value={end || "17:00"}
                                                                onChange={(e) => {
                                                                    const newSchedule = { ...perDaySchedule };
                                                                    newSchedule[dayNum][pIdx] = `${start || "09:00"} - ${e.target.value}`;
                                                                    onFormInputChange({
                                                                        target: {
                                                                            name: "info.open",
                                                                            value: JSON.stringify({
                                                                                type: "per_day",
                                                                                schedule: newSchedule,
                                                                            }),
                                                                        },
                                                                    });
                                                                }}
                                                            />
                                                            {periods.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSchedule = { ...perDaySchedule };
                                                                        newSchedule[dayNum] = periods.filter((_, i) => i !== pIdx);
                                                                        onFormInputChange({
                                                                            target: {
                                                                                name: "info.open",
                                                                                value: JSON.stringify({
                                                                                    type: "per_day",
                                                                                    schedule: newSchedule,
                                                                                }),
                                                                            },
                                                                        });
                                                                    }}
                                                                    className="p-1 text-muted-foreground hover:text-red-500 rounded-md transition-colors cursor-pointer"
                                                                    title="移除時段"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {periods.length < 3 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSchedule = { ...perDaySchedule };
                                                            newSchedule[dayNum] = [...periods, "17:00 - 21:00"];
                                                            onFormInputChange({
                                                                target: {
                                                                    name: "info.open",
                                                                    value: JSON.stringify({
                                                                        type: "per_day",
                                                                        schedule: newSchedule,
                                                                    }),
                                                                },
                                                            });
                                                        }}
                                                        className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-bold cursor-pointer"
                                                    >
                                                        <Plus size={12} /> 新增時段
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-3 sm:p-3.5 space-y-2">
                        {uniformPeriods.map((period, index) => {
                            const [start, end] = period.split("-").map((s) => s.trim());
                            return (
                                <div key={index} className="flex items-center gap-2 flex-wrap">
                                    <TimeSelect
                                        name={`open_start_${index}`}
                                        value={start || "09:00"}
                                        onChange={(e) => {
                                            const newPeriods = [...uniformPeriods];
                                            newPeriods[index] = `${e.target.value} - ${end || "17:00"}`;
                                            onFormInputChange({
                                                target: {
                                                    name: "info.open",
                                                    value: newPeriods.join(", "),
                                                },
                                            });
                                        }}
                                    />
                                    <span className="font-bold text-muted-foreground text-xs">至</span>
                                    <TimeSelect
                                        name={`open_end_${index}`}
                                        value={end || "17:00"}
                                        onChange={(e) => {
                                            const newPeriods = [...uniformPeriods];
                                            newPeriods[index] = `${start || "09:00"} - ${e.target.value}`;
                                            onFormInputChange({
                                                target: {
                                                    name: "info.open",
                                                    value: newPeriods.join(", "),
                                                },
                                            });
                                        }}
                                    />
                                    {uniformPeriods.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newPeriods = uniformPeriods.filter((_, i) => i !== index);
                                                onFormInputChange({
                                                    target: {
                                                        name: "info.open",
                                                        value: newPeriods.join(", "),
                                                    },
                                                });
                                            }}
                                            className="p-1 text-muted-foreground hover:text-red-500 rounded-md transition-colors cursor-pointer"
                                            title="移除時段"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {uniformPeriods.length < 4 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const newPeriods = [...uniformPeriods, "17:00 - 21:00"];
                                    onFormInputChange({
                                        target: {
                                            name: "info.open",
                                            value: newPeriods.join(", "),
                                        },
                                    });
                                }}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-bold pt-1 cursor-pointer"
                            >
                                <Plus size={13} /> 新增時段
                            </button>
                        )}
                    </div>
                )}

                {/* 公休日點選膠囊 (Mon - Sun) */}
                {!(formData?.info?.open || "").includes('"type":"per_day"') && (
                    <div className="p-3 sm:p-3.5 space-y-2 bg-muted/5">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                            <CalendarX size={13} className="text-rose-500" />
                            <span>公休時間快捷設定</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { day: "一", val: "週一" },
                                { day: "二", val: "週二" },
                                { day: "三", val: "週三" },
                                { day: "四", val: "週四" },
                                { day: "五", val: "週五" },
                                { day: "六", val: "週六" },
                                { day: "日", val: "週日" },
                            ].map((item) => {
                                const currentClosed = formData?.info?.closed_days || "";
                                const isSelected = currentClosed.includes(item.val);

                                const toggleDay = () => {
                                    const daysList = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
                                    let activeDays = daysList.filter((d) => currentClosed.includes(d));

                                    if (isSelected) {
                                        activeDays = activeDays.filter((d) => d !== item.val);
                                    } else {
                                        activeDays.push(item.val);
                                        activeDays.sort((a, b) => daysList.indexOf(a) - daysList.indexOf(b));
                                    }

                                    const updated = activeDays.length === 0 ? "" : `${activeDays.join(", ")} 公休`;
                                    const event = {
                                        target: { name: "info.closed_days", value: updated },
                                        currentTarget: { name: "info.closed_days", value: updated },
                                    } as unknown as ChangeEvent<HTMLInputElement>;
                                    onFormInputChange(event);
                                };

                                return (
                                    <button
                                        key={item.val}
                                        type="button"
                                        onClick={toggleDay}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                                            isSelected
                                                ? "bg-rose-500 text-white border-rose-500 shadow-xs scale-105"
                                                : "bg-muted/30 text-muted-foreground border-border hover:border-rose-300"
                                        }`}
                                    >
                                        {item.day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ⏱️ 建議停留時間 */}
            <div className="rounded-2xl bg-card border border-border/80 divide-y divide-border/50 text-xs overflow-hidden shadow-2xs">
                <div className="p-3 sm:p-3.5 space-y-2.5">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Clock size={13} className="text-primary" />
                        <span>建議停留時間 (STAY DURATION)</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {["30 分鐘", "1 小時", "1.5 小時", "2 小時", "半天", "一整天"].map((dur) => (
                            <button
                                key={dur}
                                type="button"
                                onClick={() =>
                                    onFormInputChange({
                                        target: { name: "info.stay_duration", value: dur },
                                        currentTarget: { name: "info.stay_duration", value: dur },
                                    } as unknown as ChangeEvent<HTMLInputElement>)
                                }
                                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                                    formData.info?.stay_duration === dur
                                        ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                                        : "bg-muted/40 border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50"
                                }`}
                            >
                                {dur}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        name="info.stay_duration"
                        value={formData.info?.stay_duration || ""}
                        onChange={onFormInputChange}
                        placeholder="或自訂停留時間 (例: 1 小時 30 分鐘)"
                        className="w-full bg-muted/20 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary mt-1 placeholder:text-muted-foreground/45"
                    />
                </div>
            </div>
        </div>
    );
};

export interface PlaceOpeningHoursSectionProps {
    formData: PlaceVM;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
}

export const PlaceOpeningHoursSection: React.FC<PlaceOpeningHoursSectionProps> = ({
    formData,
    onFormInputChange,
}) => {
    const isHotel = formData.type === "hotel" || formData.type === "stay";

    if (isHotel) {
        return (
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        住宿時間設定 (CHECK-IN / OUT)
                    </span>
                    <div className="rounded-2xl bg-card border border-border/80 divide-y divide-border/50 text-xs overflow-hidden shadow-2xs">
                        <div className="p-3 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CheckInOutField
                                label="入住時間 (Check-in)"
                                name="info.check_in"
                                value={formData?.info?.check_in || "15:00"}
                                onChange={onFormInputChange}
                            />
                            <CheckInOutField
                                label="退房時間 (Check-out)"
                                name="info.check_out"
                                value={formData?.info?.check_out || "11:00"}
                                onChange={onFormInputChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BusinessHoursSection
            formData={formData}
            onFormInputChange={onFormInputChange}
        />
    );
};
