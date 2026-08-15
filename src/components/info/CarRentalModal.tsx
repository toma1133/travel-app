import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Car, ShieldCheck, MapPin, Calendar, Clock } from "lucide-react";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type CarRentalModalProps = {
    formData: CarRentalRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const CarRentalModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: CarRentalModalProps) => {
    return (
        <FormModal
            formId="car-rental-form"
            modalTitle={mode === "create" ? "新增租車" : "編輯租車"}
            modalSaveTitle={mode === "create" ? "新增租車" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
            maxWidthClass="sm:max-w-lg"
        >
            <div className="space-y-4">
                {/* 🚗 Group 1: 租車公司與方案 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        車輛與租賃方案
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 租車公司 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <Car size={13} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                租車公司 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="company"
                                value={formData.company || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：Toyota Rent a Car / Times / ORIX"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 車型 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                                🚙
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                車型等級 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="model"
                                value={formData.model || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：Toyota Yaris / 7人座 Sienta"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 保險方案 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <ShieldCheck size={13} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                保險方案 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="insurance_plan"
                                value={formData.insurance_plan || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：安心全險 (NOC免除 + 免責補償)"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* 📍 Group 2: 取車與還車行程 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        取車與還車地點時間
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 取車地點 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <MapPin size={13} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                取車地點 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="pickup_loc"
                                value={formData.pickup_loc || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：那霸機場營業所"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 取車時間 */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-emerald-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    取車時間 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                required
                                type="datetime-local"
                                name="pickup_datetime"
                                value={formData.pickup_datetime || ""}
                                onChange={onFormInputChange}
                                className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>

                        {/* 還車地點 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <MapPin size={13} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                還車地點 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="dropoff_loc"
                                value={formData.dropoff_loc || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：國際通營業所 / 機場還車"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 還車時間 */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-rose-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    還車時間 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                required
                                type="datetime-local"
                                name="dropoff_datetime"
                                value={formData.dropoff_datetime || ""}
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

export default CarRentalModal;
