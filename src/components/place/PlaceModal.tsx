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
    Star,
    Tag,
    X,
    Search,
    Loader2,
    Phone,
    CalendarX,
    Globe,
    DollarSign,
    Plus,
    Trash2,
    Check,
} from "lucide-react";
import { OSMService, OSMPlace, WikiData } from "../../services/api/OSMService";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import { CURRENCIES } from "../../constants/Currencies";
import FormModal from "../common/FormModal";
import { TripThemeConf } from "../../models/types/TripTypes";

type PlaceModalProps = {
    formData: PlaceVM;
    mode: string;
    placeCategory: PlaceCategory[];
    theme: TripThemeConf | null;
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
                ].map((m) => (
                    <option key={m} value={m}>
                        {m}
                    </option>
                ))}
            </select>
        </div>
    );
};

const CheckInOutField = ({ label, name, value, onChange }: { label: string, name: string, value: string, onChange: (e: any) => void }) => {
    const is24h = value === "24小時";
    const isRange = !is24h && value.includes("-");
    const type = is24h ? "24h" : isRange ? "range" : "specific";
    const [start, end] = isRange ? value.split(/\s*-\s*/) : [is24h ? "15:00" : (value || "15:00"), ""];

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground/80">
                    {label}
                </label>
                <select
                    className="bg-transparent text-[11px] text-primary font-bold outline-none cursor-pointer"
                    value={type}
                    onChange={(e) => {
                        const t = e.target.value;
                        if (t === "24h") onChange({ target: { name, value: "24小時" } });
                        else if (t === "range") onChange({ target: { name, value: `${start || "15:00"} - 20:00` } });
                        else onChange({ target: { name, value: start || "15:00" } });
                    }}
                >
                    <option value="specific" className="bg-background text-foreground">特定時間</option>
                    <option value="range" className="bg-background text-foreground">時間範圍</option>
                    <option value="24h" className="bg-background text-foreground">24小時開放</option>
                </select>
            </div>
            {type === "24h" ? (
                <div className="py-2.5 px-3 bg-card border border-border rounded-lg text-sm text-center font-bold text-muted-foreground">
                    全天 24 小時開放
                </div>
            ) : type === "range" ? (
                <div className="flex items-center gap-1.5">
                    <TimeSelect
                        name={`${name}_start`}
                        value={start || "15:00"}
                        onChange={(e) => onChange({ target: { name, value: `${e.target.value} - ${end || "20:00"}` } })}
                    />
                    <span className="text-muted-foreground text-xs font-bold">至</span>
                    <TimeSelect
                        name={`${name}_end`}
                        value={end || "20:00"}
                        onChange={(e) => onChange({ target: { name, value: `${start || "15:00"} - ${e.target.value}` } })}
                    />
                </div>
            ) : (
                <TimeSelect
                    name={name}
                    value={start || "15:00"}
                    onChange={(e) => onChange({ target: { name, value: e.target.value } })}
                />
            )}
        </div>
    );
};

const BusinessHoursField = ({ formData, onFormInputChange }: { formData: PlaceVM, onFormInputChange: (e: any) => void }) => {
    const rawOpen = formData?.info?.open || "";
    
    // Determine mode
    let mode: "uniform" | "per_day" | "custom" = "uniform";
    let perDaySchedule: Record<number, string[]> = {};
    if (rawOpen.startsWith("{") && rawOpen.includes('"type":"per_day"')) {
        try {
            const parsed = JSON.parse(rawOpen);
            if (parsed.type === "per_day") {
                mode = "per_day";
                perDaySchedule = parsed.schedule || {};
            }
        } catch (e) { }
    } else if (rawOpen && !rawOpen.startsWith("{") && !/^[\d:\s,\-]*$/.test(rawOpen)) {
        mode = "custom";
    }

    [1,2,3,4,5,6,7].forEach(d => {
        if (!perDaySchedule[d]) perDaySchedule[d] = [];
    });

    const setMode = (newMode: "uniform" | "per_day" | "custom") => {
        if (newMode === "uniform") {
            onFormInputChange({ target: { name: "info.open", value: "09:00 - 17:00" } });
        } else if (newMode === "per_day") {
            const initJSON = JSON.stringify({
                type: "per_day",
                schedule: { 1: ["09:00 - 17:00"], 2: ["09:00 - 17:00"], 3: ["09:00 - 17:00"], 4: ["09:00 - 17:00"], 5: ["09:00 - 17:00"], 6: ["09:00 - 17:00"], 7: ["09:00 - 17:00"] }
            });
            onFormInputChange({ target: { name: "info.open", value: initJSON } });
        } else {
            onFormInputChange({ target: { name: "info.open", value: "在此輸入詳細營業時間..." } });
        }
    };

    const uniformPeriods = (mode === "uniform" ? rawOpen : "09:00 - 17:00").split(",").map(p => p.trim()).filter(p => p !== "");
    if (uniformPeriods.length === 0) uniformPeriods.push("09:00 - 17:00");

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center">
                    <Clock size={13} className="mr-1.5 text-primary" /> 營業時間
                </label>
                <select
                    className="bg-transparent text-xs text-primary font-bold outline-none cursor-pointer"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                >
                    <option value="uniform" className="bg-background text-foreground">統一時間</option>
                    <option value="per_day" className="bg-background text-foreground">依星期設定</option>
                    <option value="custom" className="bg-background text-foreground">自訂文字</option>
                </select>
            </div>
            
            {mode === "custom" ? (
                <textarea
                    name="info.open"
                    value={rawOpen}
                    onChange={onFormInputChange}
                    className="w-full bg-background border border-border rounded-xl p-3 outline-none text-sm focus:border-primary min-h-[100px] resize-y"
                    placeholder="例如：每月第二個星期二公休..."
                />
            ) : mode === "per_day" ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                        const dayNames = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
                        const dayName = dayNames[dayNum - 1];
                        const periods = perDaySchedule[dayNum] || [];
                        const isClosed = periods.length === 0;

                        return (
                            <div key={dayNum} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2 w-20 shrink-0 sm:pt-1.5">
                                    <span className="text-sm font-bold text-foreground/80">{dayName}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newSchedule = { ...perDaySchedule };
                                            newSchedule[dayNum] = isClosed ? ["09:00 - 17:00"] : [];
                                            onFormInputChange({ target: { name: "info.open", value: JSON.stringify({ type: "per_day", schedule: newSchedule }) } });
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${isClosed ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}`}
                                    >
                                        {isClosed ? "公休" : "營業"}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1">
                                    {!isClosed && periods.map((period, idx) => {
                                        const [start, end] = period.split(" - ");
                                        return (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <TimeSelect
                                                    name=""
                                                    value={start || "09:00"}
                                                    onChange={(e) => {
                                                        const newSchedule = { ...perDaySchedule };
                                                        newSchedule[dayNum][idx] = `${e.target.value} - ${end || "17:00"}`;
                                                        onFormInputChange({ target: { name: "info.open", value: JSON.stringify({ type: "per_day", schedule: newSchedule }) } });
                                                    }}
                                                />
                                                <span className="text-muted-foreground text-xs font-bold">至</span>
                                                <TimeSelect
                                                    name=""
                                                    value={end || "17:00"}
                                                    onChange={(e) => {
                                                        const newSchedule = { ...perDaySchedule };
                                                        newSchedule[dayNum][idx] = `${start || "09:00"} - ${e.target.value}`;
                                                        onFormInputChange({ target: { name: "info.open", value: JSON.stringify({ type: "per_day", schedule: newSchedule }) } });
                                                    }}
                                                />
                                                {periods.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSchedule = { ...perDaySchedule };
                                                            newSchedule[dayNum] = periods.filter((_, i) => i !== idx);
                                                            onFormInputChange({ target: { name: "info.open", value: JSON.stringify({ type: "per_day", schedule: newSchedule }) } });
                                                        }}
                                                        className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors ml-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {!isClosed && periods.length < 3 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newSchedule = { ...perDaySchedule };
                                                newSchedule[dayNum] = [...periods, "17:00 - 21:00"];
                                                onFormInputChange({ target: { name: "info.open", value: JSON.stringify({ type: "per_day", schedule: newSchedule }) } });
                                            }}
                                            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-bold w-fit mt-0.5"
                                        >
                                            <Plus size={11} /> 新增時段
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {uniformPeriods.map((period, index) => {
                        const [start, end] = period.split(" - ");
                        return (
                            <div key={index} className="flex items-center gap-2">
                                <TimeSelect
                                    name={`open_start_${index}`}
                                    value={start || "09:00"}
                                    onChange={(e) => {
                                        const newPeriods = [...uniformPeriods];
                                        newPeriods[index] = `${e.target.value} - ${end || "17:00"}`;
                                        onFormInputChange({ target: { name: "info.open", value: newPeriods.join(", ") } });
                                    }}
                                />
                                <span className="font-bold text-muted-foreground">至</span>
                                <TimeSelect
                                    name={`open_end_${index}`}
                                    value={end || "17:00"}
                                    onChange={(e) => {
                                        const newPeriods = [...uniformPeriods];
                                        newPeriods[index] = `${start || "09:00"} - ${e.target.value}`;
                                        onFormInputChange({ target: { name: "info.open", value: newPeriods.join(", ") } });
                                    }}
                                />
                                {uniformPeriods.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newPeriods = uniformPeriods.filter((_, i) => i !== index);
                                            onFormInputChange({ target: { name: "info.open", value: newPeriods.join(", ") } });
                                        }}
                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors ml-1"
                                        title="移除時段"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {uniformPeriods.length < 5 && (
                        <button
                            type="button"
                            onClick={() => {
                                const newPeriods = [...uniformPeriods, "17:00 - 21:00"];
                                onFormInputChange({ target: { name: "info.open", value: newPeriods.join(", ") } });
                            }}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors w-fit font-bold mt-1"
                        >
                            <Plus size={14} /> 新增時段
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
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: PlaceModalProps) => {
    const [copiedId, setCopiedId] = useState(false);

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

        // Always check "name" in case english name isn't there
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
                createEvent("eng_name", osm.extratags["name:en"]),
            );
        }

        if (importFields.image_url && wiki?.thumbnailUrl) {
            onFormInputChange(createEvent("image_url", wiki.thumbnailUrl));
        }

        if (importFields.open && osm.extratags?.opening_hours) {
            onFormInputChange(
                createEvent("info.open", osm.extratags.opening_hours),
            );
        }

        if (importFields.loc && osm.display_name) {
            onFormInputChange(createEvent("info.loc", osm.display_name));
        }

        if (importFields.map_url && osm.lat && osm.lon) {
            const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(osm.name || "")}&ll=${osm.lat},${osm.lon}`;
            onFormInputChange(createEvent("map_url", mapUrl));
        }

        if (importFields.description && wiki?.extract) {
            onFormInputChange(createEvent("description", wiki.extract));
        }

        setSelectedPlace(null);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formData.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 1500);
        } catch (err) {
            console.error("複製失敗", err);
        }
    };

    return (
        <FormModal
            formId={"place-form"}
            modalTitle={
                mode === "create" ? "新增地點" : `編輯地點 ${formData.name}`
            }
            modalSaveTitle={mode === "create" ? "創建地點" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {mode === "create" && (
                <div className="mb-6 border-b border-border pb-6 relative">
                    <label className="block font-bold uppercase mb-2 flex items-center text-muted-foreground text-xs">
                        <Search size={12} className="mr-1" /> 快速搜尋與自動帶入
                        (OpenStreetMap)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") e.preventDefault();
                            }}
                            placeholder="輸入地點名稱搜尋..."
                            className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-3 pr-10 outline-none focus:border-primary text-base"
                        />
                        <div className="absolute right-3 top-2.5 text-muted-foreground">
                            {isSearching ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Search size={16} />
                            )}
                        </div>
                    </div>

                    {showSuggestions && searchResults.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-card shadow-lg rounded-md border border-border max-h-60 overflow-y-auto">
                            <ul>
                                {searchResults.map((place) => (
                                    <li
                                        key={place.place_id}
                                        onClick={() =>
                                            handleSelectResult(place)
                                        }
                                        className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-0 flex flex-col items-start transition-colors"
                                    >
                                        <span className="text-sm font-medium text-foreground">
                                            {place.name ||
                                                place.display_name.split(
                                                    ",",
                                                )[0]}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-0.5 w-full truncate block">
                                            {place.display_name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedPlace && (
                        <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-sm text-foreground">
                                    找到資料，請勾選要帶入的欄位：
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlace(null)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-2 text-sm text-foreground">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.eng_name}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                eng_name: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>英文名稱:</strong>{" "}
                                        {selectedPlace.wiki?.title ||
                                            selectedPlace.osm.extratags?.[
                                                "name:en"
                                            ] ||
                                            "(無)"}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.image_url}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                image_url: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>圖片:</strong>{" "}
                                        {selectedPlace.wiki?.thumbnailUrl ? (
                                            <img
                                                src={
                                                    selectedPlace.wiki
                                                        .thumbnailUrl
                                                }
                                                className="h-8 inline-block ml-2 rounded"
                                                alt="預覽"
                                            />
                                        ) : (
                                            "(無)"
                                        )}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.open}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                open: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>營業時間:</strong>{" "}
                                        {selectedPlace.osm.extratags
                                            ?.opening_hours || "(無)"}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.loc}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                loc: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span className="truncate flex-1 block">
                                        <strong>地址:</strong>{" "}
                                        {selectedPlace.osm.display_name}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.map_url}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                map_url: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>地圖網址:</strong> Apple Maps
                                        連結
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.description}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                description: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span className="line-clamp-2 flex-1 block">
                                        <strong>簡介:</strong>{" "}
                                        {selectedPlace.wiki?.extract || "(無)"}
                                    </span>
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={handleApplyImport}
                                className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                套用已勾選資料
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* Type Selection */}
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
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mode !== "create" && (
                    <div className="sm:col-span-2">
                        <label
                            htmlFor="id"
                            className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                        >
                            ID
                        </label>
                        <div className="flex items-center gap-2 w-full">
                            <input
                                name="id"
                                value={formData.id}
                                className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-muted-foreground disabled:opacity-50"
                                disabled
                                placeholder="id"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                                title="複製"
                            >
                                <Copy
                                    size={20}
                                    className={
                                        copiedId
                                            ? "text-green-500"
                                            : "text-muted-foreground"
                                    }
                                />
                            </button>
                        </div>
                    </div>
                )}
                <div>
                    <label
                        htmlFor="name"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        中文 / 主要名稱 *
                    </label>
                    <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={onFormInputChange}
                        placeholder="例如：清水寺"
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="eng_name"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        英文名稱
                    </label>
                    <input
                        name="eng_name"
                        value={formData.eng_name || ""}
                        onChange={onFormInputChange}
                        placeholder="e.g. Kiyomizu-dera"
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label
                        htmlFor="info.native_name"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <Globe size={12} className="mr-1" /> 當地原名 (日文 /
                        義大利文等)
                    </label>
                    <input
                        name="info.native_name"
                        value={formData?.info?.native_name || ""}
                        onChange={onFormInputChange}
                        placeholder="例如：清水寺 (きよみずでら) / Basilica di San Pietro"
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="image_url"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <ImageIcon size={12} className="mr-1" /> 圖片網址
                    </label>
                    <input
                        name="image_url"
                        value={formData.image_url || ""}
                        onChange={onFormInputChange}
                        placeholder="https://..."
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="map_url"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <MapIcon size={12} className="mr-1" /> 地圖網址
                    </label>
                    <input
                        name="map_url"
                        value={formData.map_url || ""}
                        onChange={onFormInputChange}
                        placeholder="https://..."
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label
                        htmlFor="description"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        介紹
                    </label>
                    <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={onFormInputChange}
                        rows={2}
                        placeholder="關於這個地點的簡短介紹..."
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors resize-none no-scrollbar"
                    />
                </div>

                {/* 根據類別切換：住宿專屬入住/退房 或 一般營業/公休 */}
                {formData.type === "hotel" || formData.type === "stay" ? (
                    <div className="sm:col-span-2 space-y-3 bg-muted/20 p-3.5 rounded-xl border border-border/60">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase flex items-center">
                                <Clock
                                    size={13}
                                    className="mr-1.5 text-primary"
                                />{" "}
                                住宿時間設定 (Check-in & Check-out)
                            </span>
                        </div>
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
                    <div className="sm:col-span-2 space-y-4 bg-muted/20 p-3.5 rounded-xl border border-border/60">
                        {/* 營業時間快捷模板 & 多段輸入 */}
                        <BusinessHoursField formData={formData} onFormInputChange={onFormInputChange} />

                        {/* 公休時間點選膠囊 (Weekday Pills) */}
                        {!(formData?.info?.open || "").includes('"type":"per_day"') && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center">
                                        <CalendarX
                                            size={13}
                                            className="mr-1.5 text-rose-500"
                                        />{" "}
                                        公休時間點選
                                    </label>
                                </div>

                                {/* 星期膠囊按鈕 (Mon - Sun) */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                    {[
                                        { day: "一", val: "週一" },
                                        { day: "二", val: "週二" },
                                        { day: "三", val: "週三" },
                                        { day: "四", val: "週四" },
                                        { day: "五", val: "週五" },
                                        { day: "六", val: "週六" },
                                        { day: "日", val: "週日" },
                                    ].map((item) => {
                                        const currentClosed =
                                            formData?.info?.closed_days || "";
                                        const isSelected = currentClosed.includes(
                                            item.val,
                                        );

                                        const toggleDay = () => {
                                            let updated = "";
                                            const daysList = [
                                                "週一",
                                                "週二",
                                                "週三",
                                                "週四",
                                                "週五",
                                                "週六",
                                                "週日",
                                            ];
                                            let activeDays = daysList.filter((d) =>
                                                currentClosed.includes(d),
                                            );

                                            if (isSelected) {
                                                activeDays = activeDays.filter(
                                                    (d) => d !== item.val,
                                                );
                                            } else {
                                                activeDays.push(item.val);
                                                activeDays.sort(
                                                    (a, b) =>
                                                        daysList.indexOf(a) -
                                                        daysList.indexOf(b),
                                                );
                                            }

                                            if (activeDays.length === 0) {
                                                updated = "";
                                            } else {
                                                updated = `${activeDays.join(", ")} 公休`;
                                            }

                                            const event = {
                                                target: {
                                                    name: "info.closed_days",
                                                    value: updated,
                                                },
                                            } as React.ChangeEvent<HTMLInputElement>;
                                            onFormInputChange(event);
                                        };

                                        return (
                                            <button
                                                key={item.val}
                                                type="button"
                                                onClick={toggleDay}
                                                className={`w-7 h-7 rounded-full text-xs font-bold transition-all border ${
                                                    isSelected
                                                        ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                                                        : "bg-card text-muted-foreground border-border hover:border-rose-300"
                                                }`}
                                                title={`切換${item.val}公休`}
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

                <div>
                    <label
                        htmlFor="info.loc"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <MapPin size={12} className="mr-1" /> 地址 / 位置
                    </label>
                    <input
                        name="info.loc"
                        value={formData?.info?.loc || ""}
                        onChange={onFormInputChange}
                        placeholder="例如：京都市東山區..."
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="info.phone"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <Phone size={12} className="mr-1" /> 電話 (自駕Navi /
                        訂位)
                    </label>
                    <input
                        name="info.phone"
                        value={formData?.info?.phone || ""}
                        onChange={onFormInputChange}
                        placeholder="例如: +81 75-551-1171"
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="info.price"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <DollarSign size={12} className="mr-1" /> 人均預算 /
                        消費價位
                    </label>
                    <div className="flex items-center gap-2 border-b border-border focus-within:border-primary transition-colors">
                        {(() => {
                            const knownCurrencies = CURRENCIES.map(c => c.code);
                            const parts = (formData?.info?.price || "").match(/^([A-Z]{3})?\s*(.*)$/);
                            let currency = "JPY"; // 預設
                            let amount = formData?.info?.price || "";
                            
                            if (parts && parts[1] && knownCurrencies.includes(parts[1])) {
                                currency = parts[1];
                                amount = parts[2];
                            }
                            
                            // 清除舊有的符號
                            amount = amount.replace(/^[¥$€₩NT£฿krfr]+\s*/i, "").trim();
                            
                            return (
                                <>
                                    <select
                                        className="bg-transparent dark:bg-background text-muted-foreground outline-none font-mono py-2 cursor-pointer"
                                        value={currency}
                                        onChange={(e) => {
                                            const newCurr = e.target.value;
                                            const event = { target: { name: "info.price", value: `${newCurr} ${amount}` } } as any;
                                            onFormInputChange(event);
                                        }}
                                    >
                                        {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-background text-foreground">{c.code}</option>)}
                                    </select>
                                    <input
                                        name="info.price"
                                        value={amount}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, "");
                                            const formatted = raw.replace(/\d+/g, (match) => parseInt(match, 10).toLocaleString('en-US'));
                                            const event = { target: { name: "info.price", value: `${currency} ${formatted}` } } as any;
                                            onFormInputChange(event);
                                        }}
                                        placeholder="例如: 2,000 - 3,000 / 人"
                                        className="flex-1 bg-transparent py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground min-w-0"
                                    />
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* 評價分數與評論數量 */}
                <div className="sm:col-span-2 grid grid-cols-3 gap-4">
                    <div>
                        <label
                            htmlFor="info.rating"
                            className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                        >
                            <Star size={12} className="mr-1 text-amber-500" />{" "}
                            評價分數
                        </label>
                        <input
                            name="info.rating"
                            value={formData?.info?.rating || ""}
                            onChange={onFormInputChange}
                            placeholder="如: 4.5 或 3.58"
                            className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="info.rating_count"
                            className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                        >
                            評價人數
                        </label>
                        <input
                            name="info.rating_count"
                            value={((formData?.info?.rating_count || "").toString()).replace(/\d+/g, (match) => parseInt(match, 10).toLocaleString('en-US'))}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                const formatted = raw.replace(/\d+/g, (match) => parseInt(match, 10).toLocaleString('en-US'));
                                const event = { target: { name: "info.rating_count", value: formatted } } as any;
                                onFormInputChange(event);
                            }}
                            placeholder="如: 1,200"
                            className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="info.rating_source"
                            className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                        >
                            評分來源
                        </label>
                        <select
                            name="info.rating_source"
                            value={formData?.info?.rating_source || ""}
                            onChange={onFormInputChange}
                            className="w-full bg-transparent dark:bg-background border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors cursor-pointer"
                        >
                            <option value="" className="bg-background text-foreground">請選擇</option>
                            {(formData.type === "hotel" || formData.type === "stay"
                                ? ["Google", "Agoda", "Booking.com", "TripAdvisor", "Expedia", "Hotels.com", "Airbnb"]
                                : formData.type === "food" || formData.type === "restaurant" || formData.type === "cafe"
                                ? ["Google", "Tabelog", "TripAdvisor", "Yelp", "米其林指南"]
                                : ["Google", "TripAdvisor", "Yelp"]
                            ).map((preset) => (
                                <option key={preset} value={preset} className="bg-background text-foreground">{preset}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <label
                        htmlFor="tags"
                        className="block font-bold uppercase mb-1.5 flex items-center text-muted-foreground text-xs"
                    >
                        <Tag size={12} className="mr-1" /> 標籤 (按 Enter 新增)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-transparent border-b border-border focus-within:border-primary transition-colors">
                        {(formData.tags
                            ? formData.tags
                                  .split(",")
                                  .filter((t) => t.trim() !== "")
                            : []
                        ).map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 animate-in fade-in zoom-in-95"
                            >
                                #{tag.trim()}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentTags = formData.tags
                                            ? formData.tags
                                                  .split(",")
                                                  .map((t) => t.trim())
                                                  .filter((t) => t !== "")
                                            : [];
                                        const newTags = currentTags
                                            .filter((_, i) => i !== index)
                                            .join(",");
                                        const event = {
                                            target: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                            currentTarget: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                        } as unknown as ChangeEvent<HTMLInputElement>;
                                        onFormInputChange(event);
                                    }}
                                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                    title="移除標籤"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            placeholder={
                                (formData.tags
                                    ? formData.tags
                                          .split(",")
                                          .filter((t) => t.trim() !== "").length
                                    : 0) === 0
                                    ? "例如：世界遺產, 必去 (按 Enter 新增)"
                                    : "新增標籤..."
                            }
                            className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground outline-none py-1"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    const val = e.currentTarget.value
                                        .trim()
                                        .replace(/^#/, "");
                                    if (val) {
                                        const currentTags = formData.tags
                                            ? formData.tags
                                                  .split(",")
                                                  .map((t) => t.trim())
                                                  .filter((t) => t !== "")
                                            : [];
                                        if (!currentTags.includes(val)) {
                                            const newTags = [
                                                ...currentTags,
                                                val,
                                            ].join(",");
                                            const event = {
                                                target: {
                                                    name: "tags",
                                                    value: newTags,
                                                },
                                                currentTarget: {
                                                    name: "tags",
                                                    value: newTags,
                                                },
                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                            onFormInputChange(event);
                                        }
                                        e.currentTarget.value = "";
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const val = e.currentTarget.value
                                    .trim()
                                    .replace(/^#/, "");
                                if (val) {
                                    const currentTags = formData.tags
                                        ? formData.tags
                                              .split(",")
                                              .map((t) => t.trim())
                                              .filter((t) => t !== "")
                                        : [];
                                    if (!currentTags.includes(val)) {
                                        const newTags = [
                                            ...currentTags,
                                            val,
                                        ].join(",");
                                        const event = {
                                            target: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                            currentTarget: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                        } as unknown as ChangeEvent<HTMLInputElement>;
                                        onFormInputChange(event);
                                    }
                                    e.currentTarget.value = "";
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <label
                        htmlFor="tips"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        Tips / 備註
                    </label>
                    <input
                        name="tips"
                        value={formData.tips || ""}
                        onChange={onFormInputChange}
                        placeholder="例如：建議早上去..."
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
            </div>
        </FormModal>
    );
};

export default PlaceModal;
