import TimeZoneSelect from "../common/TimeZoneSelect";
import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useState } from "react";
import { Plane, Calendar, Clock, Users, User, Plus, X, Check } from "lucide-react";
import type { FlightRow } from "../../models/types/FlightTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type FlightModalProps = {
    formData: FlightRow;
    mode: string;
    errorMessage?: string;
    onTimeSettingsChange: (patch: Partial<FlightRow>) => void;
    theme: TripThemeConf | null;
    companionNames?: string[];
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onPassengersChange?: (passengers: string[] | null) => void;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const FlightModal = ({
    formData,
    errorMessage,
    onTimeSettingsChange,
    mode,
    theme,
    companionNames = [],
    onCloseBtnClick,
    onFormInputChange,
    onPassengersChange,
    onFormSubmit,
}: FlightModalProps) => {
    const [customPassenger, setCustomPassenger] = useState("");
    const isSpecific = Boolean(formData.passengers && formData.passengers.length > 0);
    const selectedPassengers = formData.passengers || [];

    const handleTogglePassenger = (name: string) => {
        if (!onPassengersChange) return;
        const exists = selectedPassengers.includes(name);
        const updated = exists
            ? selectedPassengers.filter((p) => p !== name)
            : [...selectedPassengers, name];
        onPassengersChange(updated.length > 0 ? updated : null);
    };

    const handleAddCustomPassenger = () => {
        const trimmed = customPassenger.trim();
        if (!trimmed || !onPassengersChange) return;
        if (!selectedPassengers.includes(trimmed)) {
            onPassengersChange([...selectedPassengers, trimmed]);
        }
        setCustomPassenger("");
    };

    const handleSetAll = () => {
        if (onPassengersChange) {
            onPassengersChange(null);
        }
    };

    const handleSetSpecific = () => {
        if (onPassengersChange && (!formData.passengers || formData.passengers.length === 0)) {
            onPassengersChange(companionNames.length > 0 ? [companionNames[0]] : []);
        }
    };
    return (
        <FormModal
            formId="flight-form"
            modalTitle={mode === "create" ? "新增航班" : "編輯航班"}
            modalSaveTitle={mode === "create" ? "新增航班" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
            maxWidthClass="sm:max-w-lg"
        >
            <div className="space-y-4">
                {errorMessage && <p role="alert" className="text-sm text-rose-500">{errorMessage}</p>}
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!formData.is_utc} onChange={e => onTimeSettingsChange({ is_utc: e.target.checked })} />
                    使用 UTC 儲存起降日期與時間
                </label>
                <p className="text-xs text-muted-foreground">未啟用時維持舊資料時間。啟用後請填寫起飛與抵達日期，可各自選擇機場時區。</p>
                {/* ✈️ Group 1: 航班與航線資訊 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        航班與航線
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 航班代號 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <Plane size={13} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                航班代號 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="code"
                                value={formData.code || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：JX800 / BR198"
                                className="flex-1 bg-transparent text-xs font-mono font-bold text-foreground placeholder:text-muted-foreground/40 outline-none uppercase"
                            />
                        </div>

                        {/* 出發地 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                                🛫
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                出發機場 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="departure_loc"
                                value={formData.departure_loc || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：TPE 桃園機場"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 目的地 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                                🛬
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                目的機場 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="arrival_loc"
                                value={formData.arrival_loc || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：KIX 關西機場 / NRT 成田"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* ⏰ Group 2: 日期與起降時間 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        起降時刻
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 出發日期 */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    飛行日期 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                required
                                type="date"
                                name="flight_date"
                                value={formData.flight_date || ""}
                                onChange={onFormInputChange}
                                className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>

                        <div className="p-3.5 bg-card/80">
                            <TimeZoneSelect value={formData.departure_time_zone} disabled={!formData.is_utc} label="起飛時區"
                                onChange={departure_time_zone => onTimeSettingsChange({ departure_time_zone })} />
                        </div>
                        {/* 起飛時間 */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-emerald-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    起飛時間 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                required
                                type="time"
                                name="departure_time"
                                value={formData.departure_time || ""}
                                onChange={onFormInputChange}
                                className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>

                        <div className="p-3.5 bg-card/80 flex flex-wrap items-center justify-between gap-3">
                            <label className="text-xs font-bold text-muted-foreground" htmlFor="arrival-date">抵達日期</label>
                            <input id="arrival-date" type="date" name="arrival_date" required={!!formData.is_utc}
                                value={formData.arrival_date || ""} onChange={onFormInputChange}
                                className="rounded-xl border border-border bg-muted/40 px-2.5 py-1 text-xs dark:[color-scheme:dark]" />
                        </div>
                        <div className="p-3.5 bg-card/80">
                            <TimeZoneSelect value={formData.arrival_time_zone} disabled={!formData.is_utc} label="抵達時區"
                                onChange={arrival_time_zone => onTimeSettingsChange({ arrival_time_zone })} />
                        </div>
                        {/* 抵達時間 */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-purple-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    抵達時間 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                required
                                type="time"
                                name="arrival_time"
                                value={formData.arrival_time || ""}
                                onChange={onFormInputChange}
                                className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>

                {/* 👥 Group 3: 搭乘旅客 / 旅伴 */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={12} className="text-primary" />
                            <span>搭乘旅客</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {isSpecific
                                ? `已指定 ${selectedPassengers.length} 位旅客`
                                : "全體成員共同搭乘"}
                        </span>
                    </div>

                    <div className="bg-muted/30 border border-border/70 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                        {/* 模式切換：全體 vs 指定 */}
                        <div className="flex items-center p-1 rounded-xl bg-card/90 border border-border/60 text-xs">
                            <button
                                type="button"
                                onClick={handleSetAll}
                                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    !isSpecific
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Users size={13} />
                                <span>全體旅伴搭乘</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSetSpecific}
                                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isSpecific
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <User size={13} />
                                <span>指定特定旅伴</span>
                            </button>
                        </div>

                        {/* 指定搭乘旅客細節 */}
                        {isSpecific && (
                            <div className="space-y-2.5 pt-1 animate-in fade-in-50 duration-200">
                                {/* 行程現有旅伴快速點選 */}
                                {companionNames.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-medium text-muted-foreground">
                                            點擊旅伴加入搭乘名單：
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {companionNames.map((name) => {
                                                const selected = selectedPassengers.includes(name);
                                                return (
                                                    <button
                                                        key={name}
                                                        type="button"
                                                        onClick={() => handleTogglePassenger(name)}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                                                            selected
                                                                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                                                : "bg-card/70 border-border/70 text-foreground hover:bg-card"
                                                        }`}
                                                    >
                                                        {selected && <Check size={11} className="stroke-[3]" />}
                                                        <span>{name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 自訂旅客姓名輸入 */}
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        value={customPassenger}
                                        onChange={(e) => setCustomPassenger(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddCustomPassenger();
                                            }
                                        }}
                                        placeholder="輸入旅客姓名（若不在旅伴名單中）"
                                        className="flex-1 bg-card/80 border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomPassenger}
                                        className="px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Plus size={12} />
                                        <span>加入</span>
                                    </button>
                                </div>

                                {/* 目前選取的旅客 Chips */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    {selectedPassengers.map((name) => (
                                        <span
                                            key={name}
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30"
                                        >
                                            <span>{name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePassenger(name)}
                                                className="hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                <X size={11} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FormModal>
    );
};

export default FlightModal;
