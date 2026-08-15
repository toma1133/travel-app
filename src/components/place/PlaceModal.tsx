import {
    ChangeEventHandler,
    FormEventHandler,
    MouseEventHandler,
    useState,
    useEffect,
    ChangeEvent,
} from "react";
import {
    Clock,
    Copy,
    ImageIcon,
    MapIcon,
    MapPin,
    Tag,
    X,
    Search,
    Loader2,
    Phone,
    CalendarX,
    Globe,
    Plus,
    Trash2,
    Check,
    Utensils,
    Train,
    Sparkles,
    Lightbulb,
    FileText,
    Compass,
    Navigation,
    Languages,
    Volume2,
} from "lucide-react";
import { OSMService, OSMPlace, WikiData } from "../../services/api/OSMService";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import FormModal from "../common/FormModal";
import { TripThemeConf } from "../../models/types/TripTypes";
import {
    RecommendedItemsSection,
    BudgetAndDetailsSection,
} from "./PlaceModalExtraFields";

type PlaceModalProps = {
    formData: PlaceVM;
    mode: string;
    placeCategory: PlaceCategory[];
    theme: TripThemeConf | null;
    localCurrency?: string;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const TimeSelect = ({
    value,
    onChange,
    name,
}: {
    value: string;
    onChange: (e: any) => void;
    name: string;
}) => {
    const [hh, mm] = (value || "").split(":");
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
        <div className="flex items-center gap-1.5">
            <select
                className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary cursor-pointer font-mono"
                value={hh || "00"}
                onChange={handleHH}
            >
                {Array.from({ length: 24 }).map((_, i) => {
                    const val = i.toString().padStart(2, "0");
                    return (
                        <option key={val} value={val}>
                            {val}
                        </option>
                    );
                })}
            </select>
            <span className="font-bold text-muted-foreground">:</span>
            <select
                className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary cursor-pointer font-mono"
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
                    <option key={val} value={val}>
                        {val}
                    </option>
                ))}
            </select>
        </div>
    );
};

const CheckInOutField = ({
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
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Clock size={12} className="text-primary" /> {label}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
                <TimeSelect value={timeValue} onChange={onChange} name={name} />
                <div className="flex items-center gap-1">
                    {presets.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() =>
                                onChange({ target: { name, value: p } })
                            }
                            className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                                timeValue === p
                                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
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

const BusinessHoursField = ({
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
        <div className="space-y-3.5">
            {/* 標題與模式分頁按鈕 (全寬大按鈕，寬敞不擁擠) */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center">
                        <Clock size={13} className="mr-1.5 text-primary" /> 營業時間設定模式
                    </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/60">
                    <button
                        type="button"
                        onClick={() => setMode("24_hours")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            mode === "24_hours"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        <Sparkles size={13} />
                        <span>24 小時營業</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("uniform")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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
                    常用：
                </span>
                <button
                    type="button"
                    onClick={() => applyPreset("24小時營業")}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                        mode === "24_hours"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted/40 border-border hover:border-emerald-500/50 text-foreground/80"
                    }`}
                >
                    🌟 24小時營業
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("09:00 - 17:00")}
                    className="px-2 py-0.5 rounded-lg border border-border bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    ☀️ 景點 09:00 - 17:00
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("08:00 - 18:00")}
                    className="px-2 py-0.5 rounded-lg border border-border bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    ☕ 咖啡 08:00 - 18:00
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("11:00 - 14:30, 17:00 - 21:00")}
                    className="px-2 py-0.5 rounded-lg border border-border bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    🍜 餐廳 11:00-14:30, 17:00-21:00
                </button>
                <button
                    type="button"
                    onClick={() => applyPreset("18:00 - 02:00")}
                    className="px-2 py-0.5 rounded-lg border border-border bg-muted/40 hover:border-primary/50 text-[11px] font-medium shrink-0 transition-colors cursor-pointer text-foreground/80"
                >
                    🌙 居酒屋/夜市 18:00 - 02:00
                </button>
            </div>

            {/* 模式 1: 🌟 24 小時營業 */}
            {mode === "24_hours" ? (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-xs space-y-2.5">
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            24 Hours
                        </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                        此地點將在行程安排、景點卡片與地圖中即時標註為「<strong className="text-emerald-600 dark:text-emerald-400">● 營業中 (24H)</strong>」。
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground/70">適用場所：</span>
                        <span className="bg-background/80 px-2 py-0.5 rounded-md border border-border/50">🏪 24H 便利商店 (7-11/全家)</span>
                        <span className="bg-background/80 px-2 py-0.5 rounded-md border border-border/50">🐧 唐吉訶德 Donki</span>
                        <span className="bg-background/80 px-2 py-0.5 rounded-md border border-border/50">🌃 戶外夜景 / 神社公園</span>
                        <span className="bg-background/80 px-2 py-0.5 rounded-md border border-border/50">🍜 24H 牛丼/拉麵</span>
                        <span className="bg-background/80 px-2 py-0.5 rounded-md border border-border/50">🧺 投幣洗衣店</span>
                    </div>
                </div>
            ) : mode === "custom" ? (
                <textarea
                    name="info.open"
                    value={rawOpen}
                    onChange={onFormInputChange}
                    className="w-full bg-background border border-border rounded-xl p-3 outline-none text-sm focus:border-primary min-h-[100px] resize-y placeholder:text-muted-foreground/60"
                    placeholder="例如：每月第二個星期二公休、採預約制、或特殊活動期間開放..."
                />
            ) : mode === "per_day" ? (
                <div className="flex flex-col gap-3">
                    {/* 批次快速設定 */}
                    <div className="flex items-center justify-between gap-2 flex-wrap bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs">
                        <span className="text-muted-foreground font-semibold">快速批量排程：</span>
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
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold transition-colors cursor-pointer"
                            >
                                🌟 全設為 24H
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const weekend24H: Record<number, string[]> = {};
                                    [1, 2, 3, 4, 5].forEach((d) => {
                                        weekend24H[d] = ["09:00 - 17:00"];
                                    });
                                    [6, 7].forEach((d) => {
                                        weekend24H[d] = ["24小時營業"];
                                    });
                                    onFormInputChange({
                                        target: {
                                            name: "info.open",
                                            value: JSON.stringify({
                                                type: "per_day",
                                                schedule: weekend24H,
                                            }),
                                        },
                                    });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-colors cursor-pointer"
                            >
                                平日 09-17 / 週末 24H
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
                                className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-bold transition-colors cursor-pointer"
                            >
                                🔄 全設 09-17
                            </button>
                        </div>
                    </div>

                    {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                        const dayNames = [
                            "週一",
                            "週二",
                            "週三",
                            "週四",
                            "週五",
                            "週六",
                            "週日",
                        ];
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
                                className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/20 p-2.5 sm:p-3 rounded-2xl border border-border/50 hover:border-border transition-colors"
                            >
                                {/* 星期標籤 + 寬版三態切換鈕 (營業 / 24H / 公休) */}
                                <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
                                    <span className="text-xs sm:text-sm font-extrabold text-foreground px-2.5 py-1 bg-muted/70 rounded-xl shrink-0 text-center min-w-[50px] border border-border/40">
                                        {dayName}
                                    </span>
                                    <div className="grid grid-cols-3 gap-1 bg-muted/80 p-1 rounded-xl border border-border/60 text-xs w-48 sm:w-52 shadow-2xs">
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
                                            className={`py-1 px-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
                                                !isClosed && !is24H
                                                    ? "bg-primary text-primary-foreground shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
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
                                            className={`py-1 px-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
                                                is24H
                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                    : "text-muted-foreground hover:text-emerald-600 hover:bg-background/50"
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
                                            className={`py-1 px-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
                                                isClosed
                                                    ? "bg-rose-600 text-white shadow-xs"
                                                    : "text-muted-foreground hover:text-rose-600 hover:bg-background/50"
                                            }`}
                                        >
                                            公休
                                        </button>
                                    </div>
                                </div>

                                {/* 右側時間區段 / 24H 狀態標籤 / 公休狀態標籤 */}
                                <div className="flex-1 min-w-0">
                                    {is24H ? (
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 w-fit">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            24 小時全天營業 (全天開放)
                                        </div>
                                    ) : isClosed ? (
                                        <div className="text-xs text-rose-500 font-semibold px-2.5 py-1.5 bg-rose-500/10 rounded-xl border border-rose-500/20 w-fit">
                                            當日公休不營業
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {periods.map((period, pIdx) => {
                                                const [start, end] = period
                                                    .split("-")
                                                    .map((s) => s.trim());
                                                return (
                                                    <div
                                                        key={pIdx}
                                                        className="flex items-center gap-2 flex-wrap"
                                                    >
                                                        <TimeSelect
                                                            name={`p_start_${dayNum}_${pIdx}`}
                                                            value={start || "09:00"}
                                                            onChange={(e) => {
                                                                const newSchedule = {
                                                                    ...perDaySchedule,
                                                                };
                                                                newSchedule[dayNum][pIdx] =
                                                                    `${e.target.value} - ${end || "17:00"}`;
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
                                                        <span className="font-bold text-muted-foreground text-xs">
                                                            至
                                                        </span>
                                                        <TimeSelect
                                                            name={`p_end_${dayNum}_${pIdx}`}
                                                            value={end || "17:00"}
                                                            onChange={(e) => {
                                                                const newSchedule = {
                                                                    ...perDaySchedule,
                                                                };
                                                                newSchedule[dayNum][pIdx] =
                                                                    `${start || "09:00"} - ${e.target.value}`;
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
                                                                    const newSchedule = {
                                                                        ...perDaySchedule,
                                                                    };
                                                                    newSchedule[dayNum] =
                                                                        periods.filter(
                                                                            (_, i) => i !== pIdx
                                                                        );
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
                                                                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                                                title="移除時段"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {periods.length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSchedule = {
                                                            ...perDaySchedule,
                                                        };
                                                        newSchedule[dayNum] = [
                                                            ...periods,
                                                            "17:00 - 21:00",
                                                        ];
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
                                                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-bold mt-1 cursor-pointer"
                                                >
                                                    <Plus size={13} /> 新增時段
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
                <div className="space-y-2">
                    {uniformPeriods.map((period, index) => {
                        const [start, end] = period
                            .split("-")
                            .map((s) => s.trim());
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-1.5 flex-wrap"
                            >
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
                                <span className="font-bold text-muted-foreground text-xs">
                                    至
                                </span>
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
                                            const newPeriods =
                                                uniformPeriods.filter(
                                                    (_, i) => i !== index
                                                );
                                            onFormInputChange({
                                                target: {
                                                    name: "info.open",
                                                    value: newPeriods.join(", "),
                                                },
                                            });
                                        }}
                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors ml-1 cursor-pointer"
                                        title="移除時段"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {uniformPeriods.length < 5 && (
                        <button
                            type="button"
                            onClick={() => {
                                const newPeriods = [
                                    ...uniformPeriods,
                                    "17:00 - 21:00",
                                ];
                                onFormInputChange({
                                    target: {
                                        name: "info.open",
                                        value: newPeriods.join(", "),
                                    },
                                });
                            }}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors w-fit font-bold mt-1 cursor-pointer"
                        >
                            <Plus size={13} /> 新增時段
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const PlaceModal = ({
    formData,
    mode,
    placeCategory,
    theme,
    localCurrency = "JPY",
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: PlaceModalProps) => {
    const [copiedId, setCopiedId] = useState(false);
    const [activeTab, setActiveTab] = useState<"basic" | "hours" | "items" | "details">("basic");

    // Auto-fill state
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<OSMPlace[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<{
        osm: OSMPlace;
        wiki: WikiData | null;
    } | null>(null);
    const [importFields, setImportFields] = useState({
        eng_name: true,
        image_url: true,
        open: true,
        loc: true,
        map_url: true,
        description: true,
    });

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                setIsSearching(true);
                const results = await OSMService.searchPlaces(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
                setShowSuggestions(true);
            } else {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectResult = async (place: OSMPlace) => {
        setShowSuggestions(false);
        setSearchTerm("");

        let wikiData: WikiData | null = null;
        if (place.extratags?.wikipedia) {
            wikiData = await OSMService.getWikiData(place.extratags.wikipedia);
        }
        setSelectedPlace({ osm: place, wiki: wikiData });
    };

    const handleApplyImport = () => {
        if (!selectedPlace) return;

        const createEvent = (name: string, value: string) =>
            ({
                target: { name, value },
                currentTarget: { name, value },
            }) as unknown as ChangeEvent<HTMLInputElement>;

        const { osm, wiki } = selectedPlace;

        if (osm.name) {
            onFormInputChange(createEvent("name", osm.name));
        }

        if (importFields.eng_name && wiki?.title) {
            onFormInputChange(createEvent("eng_name", wiki.title));
        } else if (importFields.eng_name && osm.extratags?.["name:en"]) {
            onFormInputChange(
                createEvent("eng_name", osm.extratags["name:en"])
            );
        }

        if (importFields.image_url && wiki?.thumbnailUrl) {
            onFormInputChange(createEvent("image_url", wiki.thumbnailUrl));
        }

        if (importFields.open && osm.extratags?.opening_hours) {
            onFormInputChange(
                createEvent("info.open", osm.extratags.opening_hours)
            );
        }

        if (importFields.loc && osm.display_name) {
            onFormInputChange(createEvent("info.loc", osm.display_name));
        }

        if (importFields.map_url && osm.lat && osm.lon) {
            const appleMapUrl = `https://maps.apple.com/?q=${encodeURIComponent(
                osm.name || ""
            )}&ll=${osm.lat},${osm.lon}`;
            onFormInputChange(createEvent("map_url", appleMapUrl));
        }

        if (importFields.description && wiki?.extract) {
            onFormInputChange(createEvent("description", wiki.extract));
        }

        setSelectedPlace(null);
    };

    const handleCopy = () => {
        if (formData.id) {
            navigator.clipboard.writeText(formData.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const recommendedCount = formData.info?.recommended_items?.length || 0;
    const hasCoordinates = !!(formData.lat && formData.lng);

    return (
        <FormModal
            formId="place-form"
            modalTitle={mode === "create" ? "新增地點" : "編輯地點"}
            modalSaveTitle="儲存地點"
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
            maxWidthClass="sm:max-w-2xl"
        >
            {/* Auto Search Import Area */}
            <div className="relative mb-2">
                <div className="relative">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={15}
                    />
                    <input
                        type="text"
                        placeholder="搜尋真實景點/店家自動帶入 (OpenStreetMap & Wiki)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-muted/40 border border-border/80 rounded-2xl pl-10 pr-10 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary transition-all shadow-2xs"
                    />
                    {isSearching && (
                        <Loader2
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
                            size={15}
                        />
                    )}
                </div>

                {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto no-scrollbar p-1.5">
                        {searchResults.map((place) => (
                            <button
                                key={place.place_id}
                                type="button"
                                onClick={() => handleSelectResult(place)}
                                className="w-full text-left p-2.5 hover:bg-muted rounded-xl transition-colors flex items-start gap-2.5"
                            >
                                <MapPin
                                    size={15}
                                    className="text-primary mt-0.5 flex-shrink-0"
                                />
                                <div className="truncate">
                                    <div className="font-bold text-xs text-foreground truncate">
                                        {place.name || place.display_name.split(",")[0]}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate">
                                        {place.display_name}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {selectedPlace && (
                    <div className="mt-2.5 bg-card border border-primary/30 p-3.5 rounded-2xl shadow-xs text-xs space-y-2">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-primary flex items-center gap-1">
                                <Sparkles size={13} /> 找到地點資料：{selectedPlace.osm.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedPlace(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                            {selectedPlace.wiki?.title && <div><strong>英文名:</strong> {selectedPlace.wiki.title}</div>}
                            {selectedPlace.osm.extratags?.opening_hours && <div><strong>營業時間:</strong> {selectedPlace.osm.extratags.opening_hours}</div>}
                        </div>
                        <button
                            type="button"
                            onClick={handleApplyImport}
                            className="w-full bg-primary text-primary-foreground py-1.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors"
                        >
                            一鍵帶入選取資料
                        </button>
                    </div>
                )}
            </div>

            {/* Top Navigation Tabs (RWD: 2x2 on mobile, 4-col on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-muted/40 rounded-2xl border border-border/60">
                <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "basic"
                            ? "bg-card text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                >
                    <Compass size={14} className={activeTab === "basic" ? "text-primary" : ""} />
                    <span>基本與地圖</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("hours")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "hours"
                            ? "bg-card text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                >
                    <Clock size={14} className={activeTab === "hours" ? "text-amber-500" : ""} />
                    <span>營業與時間</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("items")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                        activeTab === "items"
                            ? "bg-card text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                >
                    <Utensils size={14} className={activeTab === "items" ? "text-rose-500" : ""} />
                    <span>推薦品項</span>
                    {recommendedCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono ml-0.5">
                            {recommendedCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "details"
                            ? "bg-card text-foreground shadow-xs border border-border/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                >
                    <Sparkles size={14} className={activeTab === "details" ? "text-indigo-500" : ""} />
                    <span>預算與細節</span>
                </button>
            </div>

            {/* TAB 1: 基本與地圖 (Basic & Map) */}
            {activeTab === "basic" && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    {/* 分類選擇 */}
                    <CategoryCustomSelect
                        value={formData.type || "sight"}
                        onChange={(newTypeId) => {
                            const event = {
                                target: { name: "type", value: newTypeId },
                                currentTarget: { name: "type", value: newTypeId },
                            } as unknown as ChangeEvent<HTMLInputElement>;
                            onFormInputChange(event);
                        }}
                    />

                    {/* 主要名稱、英文名稱/羅馬拼音、當地原名 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-card border border-border/80 p-4 rounded-2xl shadow-2xs">
                        <div className="sm:col-span-2 space-y-1">
                            <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <Sparkles size={13} className="text-primary" />
                                <span>中文 / 主要名稱 *</span>
                            </label>
                            <div className="flex items-center gap-2 bg-muted/20 border border-border/60 px-3 py-1.5 rounded-xl focus-within:border-primary transition-colors">
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={onFormInputChange}
                                    placeholder="例：清水寺 / 敘敘苑燒肉 / 藍瓶咖啡"
                                    className="w-full bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/60"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <Volume2 size={13} className="text-indigo-500" />
                                <span>英文名稱 / 羅馬拼音</span>
                            </label>
                            <div className="flex items-center gap-2 bg-muted/20 border border-border/60 px-3 py-1.5 rounded-xl focus-within:border-primary transition-colors">
                                <input
                                    name="eng_name"
                                    value={formData.eng_name || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例：Kiyomizu-dera / Jojoen (選填)"
                                    className="w-full bg-transparent text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/60"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <Languages size={13} className="text-purple-500" />
                                <span>當地原名 (日/韓/原文)</span>
                            </label>
                            <div className="flex items-center gap-2 bg-muted/20 border border-border/60 px-3 py-1.5 rounded-xl focus-within:border-primary transition-colors">
                                <input
                                    name="info.native_name"
                                    value={formData?.info?.native_name || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例：きよみずでら / 叙々苑 (選填)"
                                    className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 🗺️ 地圖與定位專區 (Full Width Card) */}
                    <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <Navigation size={13} className="text-primary" />
                                <span>地圖連結與定位 (支援寬版輸入)</span>
                            </label>
                            {hasCoordinates ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <Check size={11} /> 座標已自動鎖定
                                </span>
                            ) : (
                                <span className="text-[11px] text-muted-foreground">
                                    貼上地圖連結自動鎖定座標
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <MapIcon
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                name="map_url"
                                value={formData.map_url || ""}
                                onChange={onFormInputChange}
                                placeholder="貼上 Apple Maps / Google Maps 分享網址..."
                                className="w-full bg-muted/30 border border-border/70 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                                    <MapPin size={12} className="text-rose-500" />
                                    <span>地址 / 所在地</span>
                                </label>
                                <input
                                    name="info.loc"
                                    value={formData?.info?.loc || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例如：京都市東山區清水..."
                                    className="w-full bg-transparent border-b border-border py-1.5 text-xs text-foreground outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                                    <Phone size={12} className="text-indigo-500" />
                                    <span>聯絡電話 (Navi / 訂位)</span>
                                </label>
                                <input
                                    name="info.phone"
                                    value={formData?.info?.phone || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例如: +81 75-551-1171"
                                    className="w-full bg-transparent border-b border-border py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 🏷️ 自訂標籤 (移至第一頁方便快速建立) */}
                    <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-2xs space-y-2">
                        <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            <Tag size={13} className="text-primary" />
                            <span>自訂標籤 (輸入後按 Enter 新增)</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/20 border border-border/60 rounded-xl">
                            {(formData.tags
                                ? formData.tags.split(",").filter((t) => t.trim() !== "")
                                : []
                            ).map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                                >
                                    #{tag.trim()}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentTags = formData.tags
                                                ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
                                                : [];
                                            const newTags = currentTags.filter((_, i) => i !== index).join(",");
                                            const event = {
                                                target: { name: "tags", value: newTags },
                                                currentTarget: { name: "tags", value: newTags },
                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                            onFormInputChange(event);
                                        }}
                                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                placeholder="新增標籤 (例: 必去, 伴手禮)..."
                                className="flex-1 min-w-[120px] bg-transparent text-xs text-foreground outline-none py-1"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === ",") {
                                        e.preventDefault();
                                        const val = e.currentTarget.value.trim().replace(/^#/, "");
                                        if (val) {
                                            const currentTags = formData.tags
                                                ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
                                                : [];
                                            if (!currentTags.includes(val)) {
                                                const newTags = [...currentTags, val].join(",");
                                                const event = {
                                                    target: { name: "tags", value: newTags },
                                                    currentTarget: { name: "tags", value: newTags },
                                                } as unknown as ChangeEvent<HTMLInputElement>;
                                                onFormInputChange(event);
                                            }
                                            e.currentTarget.value = "";
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* 💡 Tips 備忘筆記 (移至第一頁) */}
                    <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-2xs space-y-1.5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            <Lightbulb size={13} className="text-amber-500" />
                            <span>Tips / 景點備忘貼士</span>
                        </label>
                        <input
                            name="tips"
                            value={formData.tips || ""}
                            onChange={onFormInputChange}
                            placeholder="例如：建議早上 8:30 前抵達人潮較少 / 門票只收現金..."
                            className="w-full bg-transparent border-b border-border py-1.5 text-xs text-foreground outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* 🖼️ 封面圖片與即時預覽 */}
                    <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-2xs space-y-2">
                        <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            <ImageIcon size={13} className="text-teal-500" />
                            <span>封面圖片網址</span>
                        </label>
                        <div className="flex items-center gap-3">
                            {formData.image_url ? (
                                <img
                                    src={formData.image_url}
                                    alt="Preview"
                                    className="w-12 h-12 rounded-xl object-cover border border-border/80 shadow-2xs shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-muted border border-border/80 flex items-center justify-center text-muted-foreground shrink-0">
                                    <ImageIcon size={18} />
                                </div>
                            )}
                            <input
                                name="image_url"
                                value={formData.image_url || ""}
                                onChange={onFormInputChange}
                                placeholder="https://..."
                                className="flex-1 bg-transparent border-b border-border py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* 📝 簡介說明 */}
                    <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-2xs space-y-1.5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            <FileText size={13} className="text-muted-foreground" />
                            <span>簡介說明</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description || ""}
                            onChange={onFormInputChange}
                            rows={2}
                            placeholder="關於此地點的特色或歷史介紹..."
                            className="w-full bg-transparent border-b border-border py-1.5 text-xs text-foreground outline-none focus:border-primary transition-colors resize-none no-scrollbar"
                        />
                    </div>

                    {mode !== "create" && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1">
                            <span>ID: {formData.id}</span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                                <Copy size={11} /> {copiedId ? "已複製" : "複製 ID"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: 營業與時間 (Hours & Schedule) */}
            {activeTab === "hours" && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    {/* 住宿 Check-in / Out 或 營業時間 */}
                    {formData.type === "hotel" || formData.type === "stay" ? (
                        <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                <Clock size={13} className="text-primary" />
                                <span>住宿時間設定 (Check-in & Check-out)</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    ) : (
                        <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-4">
                            <BusinessHoursField
                                formData={formData}
                                onFormInputChange={onFormInputChange}
                            />

                            {/* 公休日點選膠囊 (Mon - Sun) */}
                            {!(formData?.info?.open || "").includes('"type":"per_day"') && (
                                <div className="pt-2 border-t border-border/40">
                                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-2">
                                        <CalendarX size={13} className="text-rose-500" />
                                        <span>公休時間快捷設定</span>
                                    </label>
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
                                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                                                        isSelected
                                                            ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                                                            : "bg-muted/50 text-muted-foreground border-border hover:border-rose-300"
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
                    )}

                    {/* ⏱️ 建議停留時間 */}
                    <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-2">
                        <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            <Clock size={13} className="text-primary" />
                            <span>建議停留時間</span>
                        </label>
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
                                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                                        formData.info?.stay_duration === dur
                                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
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
                            placeholder="或自訂停留時間 (例:1 小時 30 分鐘)"
                            className="w-full bg-transparent border-b border-border py-1.5 text-xs text-foreground outline-none focus:border-primary"
                        />
                    </div>

                    {/* 🚇 交通指引 / 最近出口 */}
                    <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-2">
                        <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            <Train size={13} className="text-indigo-500" />
                            <span>交通指引 / 最近車站出口</span>
                        </label>
                        <input
                            type="text"
                            name="info.transit_access"
                            value={formData.info?.transit_access || ""}
                            onChange={onFormInputChange}
                            placeholder="例：JR 新宿站東口步行 3 分鐘 / 清水道站下車"
                            className="w-full bg-transparent border-b border-border py-1.5 text-xs text-foreground outline-none focus:border-primary"
                        />
                    </div>
                </div>
            )}

            {/* TAB 3: 推薦品項 (Recommended Menu & Items) */}
            {activeTab === "items" && (
                <div className="pt-1 animate-in fade-in duration-200">
                    <RecommendedItemsSection
                        formData={formData}
                        localCurrency={localCurrency}
                        onFormInputChange={onFormInputChange}
                    />
                </div>
            )}

            {/* TAB 4: 預算與細節 (Budget & Details) */}
            {activeTab === "details" && (
                <div className="pt-1 animate-in fade-in duration-200">
                    <BudgetAndDetailsSection
                        formData={formData}
                        localCurrency={localCurrency}
                        onFormInputChange={onFormInputChange}
                    />
                </div>
            )}
        </FormModal>
    );
};

export default PlaceModal;
