import {
    ChangeEventHandler,
    FormEventHandler,
    MouseEventHandler,
    useState,
    useEffect,
    ChangeEvent,
    useRef,
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
    DollarSign,
    Star,
    Ticket,
    CreditCard,
    Wifi,
    ExternalLink,
} from "lucide-react";
import { OSMService, OSMPlace, WikiData } from "../../services/api/OSMService";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import { TripThemeConf } from "../../models/types/TripTypes";
import { detectLanguage, playPronunciation } from "../../utils/SpeechLanguageUtil";
import { CURRENCIES } from "../../constants/Currencies";
import { formatThousands, handleThousandsInputChange } from "../../utils/numberFormat";
import {
    COMMON_PAYMENT_METHODS,
    COMMON_AMENITIES,
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

// --- iOS 風格時間選單 ---
const TimeSelect = ({
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
const BusinessHoursSection = ({
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/60">
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

// --- 主要 PlaceModal 元件 (Apple HIG Inset Grouped) ---
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
    const [speaking, setSpeaking] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // 語言自動偵測
    const detectedNativeLang = detectLanguage(formData?.info?.native_name, {
        address: formData?.info?.loc,
        currency: formData?.info?.price,
    });

    const handleSpeakNative = () => {
        if (!formData?.info?.native_name) return;
        playPronunciation(formData.info.native_name, {
            context: {
                address: formData?.info?.loc,
                mapUrl: formData.map_url,
                currency: formData?.info?.price,
            },
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: () => setSpeaking(false),
        });
    };

    // OpenStreetMap & Wiki 自動搜尋
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
            onFormInputChange(createEvent("eng_name", osm.extratags["name:en"]));
        }

        if (importFields.image_url && wiki?.thumbnailUrl) {
            onFormInputChange(createEvent("image_url", wiki.thumbnailUrl));
        }

        if (importFields.open && osm.extratags?.opening_hours) {
            onFormInputChange(createEvent("info.open", osm.extratags.opening_hours));
        }

        if (importFields.loc && osm.display_name) {
            onFormInputChange(createEvent("info.loc", osm.display_name));
        }

        if (importFields.map_url && osm.lat && osm.lon) {
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                osm.name || ""
            )}&query_place_id=${osm.place_id}&center=${osm.lat},${osm.lon}`;
            onFormInputChange(createEvent("map_url", mapUrl));
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

    // 標籤解析與新增/刪除
    const currentTags = Array.isArray(formData.tags)
        ? formData.tags
        : typeof formData.tags === "string"
        ? (formData.tags as string)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
        : [];
    const [tagInput, setTagInput] = useState("");

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        const newTag = tagInput.trim().replace(/^#/, "");
        if (!currentTags.includes(newTag)) {
            const updated = [...currentTags, newTag];
            onFormInputChange({
                target: { name: "tags", value: updated.join(",") },
            } as any);
        }
        setTagInput("");
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const updated = currentTags.filter((t) => t !== tagToRemove);
        onFormInputChange({
            target: { name: "tags", value: updated.join(",") },
        } as any);
    };

    const recommendedCount = formData.info?.recommended_items?.length || 0;
    const hasCoordinates = !!(formData.lat && formData.lng);

    return (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-background text-foreground rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
                {/* 頂部把手 (手機端) */}
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto my-2 sm:hidden shrink-0" />

                {/* iOS 經典導航標題列 */}
                <div className="px-4 py-3 border-b border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0">
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="text-xs font-semibold text-blue-500 hover:text-blue-600 active:opacity-70 transition-opacity cursor-pointer"
                    >
                        取消
                    </button>

                    <div className="text-center">
                        <h2 className="font-bold text-sm sm:text-base text-foreground flex items-center justify-center gap-1.5">
                            {mode === "create" ? "✨ 新增地點" : "📍 編輯地點"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => formRef.current?.requestSubmit()}
                        className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                        完成
                    </button>
                </div>

                {/* 智慧搜尋帶入列 (OpenStreetMap / Wikipedia) */}
                <div className="p-3 border-b border-border/50 bg-muted/20 shrink-0">
                    <div className="relative">
                        <Search
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder="🔍 搜尋真實景點/店家自動帶入 (OpenStreetMap & Wiki)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 transition-all shadow-2xs"
                        />
                        {isSearching && (
                            <Loader2
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
                                size={14}
                            />
                        )}
                    </div>

                    {showSuggestions && searchResults.length > 0 && (
                        <div className="mt-2 bg-card border border-border rounded-2xl shadow-xl max-h-56 overflow-y-auto no-scrollbar p-1.5 z-20">
                            {searchResults.map((place) => (
                                <button
                                    key={place.place_id}
                                    type="button"
                                    onClick={() => handleSelectResult(place)}
                                    className="w-full text-left p-2.5 hover:bg-muted/70 rounded-xl transition-colors flex items-start gap-2.5 cursor-pointer"
                                >
                                    <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                                    <div className="truncate flex-1">
                                        <div className="font-bold text-xs text-foreground truncate">
                                            {place.name || place.display_name.split(",")[0]}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate">
                                            {place.display_name}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedPlace && (
                        <div className="mt-2 bg-card border border-blue-500/30 p-3 rounded-2xl shadow-xs text-xs space-y-2">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-blue-500 flex items-center gap-1">
                                    <Sparkles size={13} /> 找到地點資料：{selectedPlace.osm.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlace(null)}
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                                {selectedPlace.wiki?.title && <div><strong>英文:</strong> {selectedPlace.wiki.title}</div>}
                                {selectedPlace.osm.extratags?.opening_hours && <div><strong>營業:</strong> {selectedPlace.osm.extratags.opening_hours}</div>}
                            </div>
                            <button
                                type="button"
                                onClick={handleApplyImport}
                                className="w-full bg-blue-500 text-white py-1.5 rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
                            >
                                一鍵帶入選取資料
                            </button>
                        </div>
                    )}
                </div>

                {/* iOS Segmented Control 分段切換列 */}
                <div className="p-2.5 border-b border-border/60 bg-muted/30 shrink-0">
                    <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/60 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setActiveTab("basic")}
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
                            onClick={() => setActiveTab("hours")}
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
                            onClick={() => setActiveTab("items")}
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
                            onClick={() => setActiveTab("details")}
                            className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                                activeTab === "details"
                                    ? "bg-card text-foreground shadow-xs border border-border/70"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Sparkles size={13} className={activeTab === "details" ? "text-indigo-500" : ""} />
                            <span>預算與細節</span>
                        </button>
                    </div>
                </div>

                {/* 表單主體 (滾動區域) */}
                <form
                    ref={formRef}
                    id="place-form"
                    onSubmit={onFormSubmit}
                    className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
                >
                    {/* TAB 1: 基本與地圖 (Apple HIG Inset Grouped) */}
                    {activeTab === "basic" && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            {/* 分類選擇 */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                                    地點分類 (CATEGORY)
                                </span>
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
                            </div>

                            {/* Section 1: 核心名稱 (iOS Inset Grouped Table) */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                                    基本識別 (BASIC INFO)
                                </span>
                                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                                    {/* 中文 / 主要名稱 */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                            <span>主要名稱</span>
                                            <span className="text-rose-500 font-bold">*</span>
                                        </span>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={onFormInputChange}
                                            placeholder="例：清水寺 / HARBS 新宿店"
                                            className="min-w-0 flex-1 text-left font-bold text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                        />
                                    </div>

                                    {/* 英文名稱 / 羅馬拼音 */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                            英文/拼音
                                        </span>
                                        <input
                                            type="text"
                                            name="eng_name"
                                            value={formData.eng_name || ""}
                                            onChange={onFormInputChange}
                                            placeholder="例：Kiyomizu-dera / HARBS"
                                            className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                        />
                                    </div>

                                    {/* 當地原文 + 智慧多語系發音 */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                            <Languages size={13} className="text-purple-500" />
                                            <span>當地原文</span>
                                        </span>
                                        <div className="min-w-0 flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                name="info.native_name"
                                                value={formData.info?.native_name || ""}
                                                onChange={onFormInputChange}
                                                placeholder="例: きよみずでら / วัดพระแก้ว"
                                                className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                            {formData.info?.native_name && (
                                                <button
                                                    type="button"
                                                    onClick={handleSpeakNative}
                                                    disabled={speaking}
                                                    className={`p-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                                                        speaking
                                                            ? "bg-blue-500 text-white border-blue-500 animate-pulse"
                                                            : "bg-muted/40 text-blue-500 border-border/70 hover:bg-blue-500/10"
                                                    }`}
                                                    title={`點擊發音 (${detectedNativeLang.flag} ${detectedNativeLang.name})`}
                                                >
                                                    <Volume2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: 地圖導航與交通 (iOS Inset Grouped Table) */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                                    地圖與交通 (MAP & LOCATION)
                                </span>
                                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                                    {/* 地圖連結 */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                            <MapIcon size={13} className="text-blue-500" />
                                            <span>地圖網址</span>
                                        </span>
                                        <input
                                            type="text"
                                            name="map_url"
                                            value={formData.map_url || ""}
                                            onChange={onFormInputChange}
                                            placeholder="Apple / Google Maps 連結"
                                            className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                        />
                                    </div>

                                    {/* 詳細地址 */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                            <MapPin size={13} className="text-rose-500" />
                                            <span>詳細地址</span>
                                        </span>
                                        <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                            <input
                                                type="text"
                                                name="info.loc"
                                                value={formData.info?.loc || ""}
                                                onChange={onFormInputChange}
                                                placeholder="例: 京都市東山區清水1丁目294"
                                                className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                            {hasCoordinates && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0 font-mono">
                                                    📍 GPS
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 聯絡電話 */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                            <Phone size={13} className="text-emerald-500" />
                                            <span>聯絡電話</span>
                                        </span>
                                        <input
                                            type="text"
                                            name="info.phone"
                                            value={formData.info?.phone || ""}
                                            onChange={onFormInputChange}
                                            placeholder="例: +81 75-551-1171"
                                            className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                        />
                                    </div>

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

                            {/* Section 3: 封面照片、備忘與標籤 (iOS Inset Grouped Table) */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                                    封面照片與筆記 (PHOTO & NOTES)
                                </span>
                                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                                    {/* 封面照片網址 + 即時預覽 */}
                                    <div className="p-3 sm:p-3.5 space-y-2 bg-card">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                                <ImageIcon size={13} className="text-blue-500" />
                                                <span>封面照片</span>
                                            </span>
                                            <input
                                                type="text"
                                                name="image_url"
                                                value={formData.image_url || ""}
                                                onChange={onFormInputChange}
                                                placeholder="https://... 照片網址"
                                                className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                        {formData.image_url && (
                                            <div className="relative h-28 rounded-xl overflow-hidden border border-border/60 group">
                                                <img
                                                    src={formData.image_url}
                                                    alt={formData.name || "預覽"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = "none";
                                                    }}
                                                />
                                                <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white font-bold">
                                                    即時預覽
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 旅遊備忘 / Tips 便箋 */}
                                    <div className="p-3 sm:p-3.5 space-y-1.5 bg-card">
                                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                            <Lightbulb size={13} className="text-amber-500" />
                                            <span>旅遊備忘 / 注意事項 (Tips)</span>
                                        </span>
                                        <textarea
                                            name="tips"
                                            value={formData.tips || ""}
                                            onChange={onFormInputChange}
                                            placeholder="例：建議早上 08:30 前抵達避開人潮，門票僅收現金 600 JPY，可自備水壺裝音羽之水。"
                                            className="w-full bg-muted/20 border border-border/60 rounded-xl p-2.5 text-xs text-foreground outline-none focus:border-blue-500 min-h-[60px] resize-y placeholder:text-muted-foreground/40 leading-relaxed"
                                        />
                                    </div>

                                    {/* 景點簡介說明 */}
                                    <div className="p-3 sm:p-3.5 space-y-1.5 bg-card">
                                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                            <FileText size={13} className="text-indigo-500" />
                                            <span>景點詳細簡介 (Description)</span>
                                        </span>
                                        <textarea
                                            name="description"
                                            value={formData.description || ""}
                                            onChange={onFormInputChange}
                                            placeholder="可記錄歷史背景、特色看點或網友推薦精華..."
                                            className="w-full bg-muted/20 border border-border/60 rounded-xl p-2.5 text-xs text-foreground outline-none focus:border-blue-500 min-h-[60px] resize-y placeholder:text-muted-foreground/40 leading-relaxed"
                                        />
                                    </div>

                                    {/* 自訂標籤管理 */}
                                    <div className="p-3 sm:p-3.5 space-y-2 bg-card">
                                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                            <Tag size={13} className="text-emerald-500" />
                                            <span>自訂標籤 (Tags)</span>
                                        </span>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {currentTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20 text-xs shadow-2xs"
                                                >
                                                    <span>#{tag}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="hover:text-rose-500 transition-colors cursor-pointer"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                            <div className="inline-flex items-center gap-1 bg-muted/30 border border-border/60 rounded-xl px-2.5 py-1 text-xs">
                                                <input
                                                    type="text"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddTag();
                                                        }
                                                    }}
                                                    placeholder="輸入標籤按 Enter"
                                                    className="bg-transparent outline-none text-xs w-28 text-foreground placeholder:text-muted-foreground/40"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddTag}
                                                    className="text-blue-500 hover:text-blue-600 cursor-pointer font-bold"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 地點 ID 複製 (編輯模式) */}
                                    {mode === "edit" && formData.id && (
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-muted/5">
                                            <span className="text-muted-foreground text-[11px] font-medium font-mono">
                                                ID: {formData.id}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-semibold cursor-pointer"
                                            >
                                                {copiedId ? (
                                                    <>
                                                        <Check size={12} className="text-emerald-500" />
                                                        <span>已複製</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={12} />
                                                        <span>複製 ID</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: 營業與時間 (Apple HIG Inset Grouped) */}
                    {activeTab === "hours" && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            {formData.type === "hotel" || formData.type === "stay" ? (
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
                            ) : (
                                <BusinessHoursSection
                                    formData={formData}
                                    onFormInputChange={onFormInputChange}
                                />
                            )}
                        </div>
                    )}

                    {/* TAB 3: 推薦品項 (Apple HIG Inset Grouped) */}
                    {activeTab === "items" && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            <RecommendedItemsSection
                                formData={formData}
                                localCurrency={localCurrency}
                                onFormInputChange={onFormInputChange}
                            />
                        </div>
                    )}

                    {/* TAB 4: 預算與細節 (Apple HIG Inset Grouped) */}
                    {activeTab === "details" && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            <BudgetAndDetailsSection
                                formData={formData}
                                localCurrency={localCurrency}
                                onFormInputChange={onFormInputChange}
                            />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PlaceModal;
