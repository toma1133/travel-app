import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Plane, Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import type { FlightRow } from "../../models/types/FlightTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type FlightModalProps = {
    formData: FlightRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const FlightModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: FlightModalProps) => {
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
            </div>
        </FormModal>
    );
};

export default FlightModal;
