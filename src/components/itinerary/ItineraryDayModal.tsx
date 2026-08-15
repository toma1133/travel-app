import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Calendar, Hash, Compass, Sparkles } from "lucide-react";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type ItineraryDayModalProps = {
    formData: ItineraryVM;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const ItineraryDayModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: ItineraryDayModalProps) => {
    // 取得當前日期的星期幾標籤
    const getWeekdayLabel = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "";
            const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
            return days[date.getDay()];
        } catch {
            return "";
        }
    };

    const weekdayLabel = getWeekdayLabel(formData.date);

    return (
        <FormModal
            formId="itinerary-day-form"
            modalTitle={
                mode === "create"
                    ? "新增日程天數"
                    : `編輯日程 DAY ${formData.day_number}`
            }
            modalSaveTitle={mode === "create" ? "新增日程" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
            maxWidthClass="sm:max-w-md"
        >
            <div className="space-y-4">
                {/* 📌 Inset Grouped Section */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        日程基本資訊
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 第幾天 (Day Number) */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                                    <Hash size={13} />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground">
                                    旅遊第幾天 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                                    DAY
                                </span>
                                <input
                                    required
                                    type="number"
                                    name="day_number"
                                    min="1"
                                    value={formData.day_number}
                                    onChange={onFormInputChange}
                                    placeholder="1"
                                    className="w-16 bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground text-center outline-none"
                                />
                            </div>
                        </div>

                        {/* 日期 (Date) */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs">
                                    <Calendar size={13} />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground block">
                                        行程日期 <span className="text-rose-500">*</span>
                                    </span>
                                    {weekdayLabel && (
                                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold font-mono">
                                            {weekdayLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <input
                                required
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={onFormInputChange}
                                className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>

                        {/* 當日主題 (Title) */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <Compass size={13} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-bold text-muted-foreground block mb-0.5">
                                    當日主題 / 主要區域
                                </span>
                                <input
                                    name="title"
                                    value={formData.title || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例如：清水寺、二三年坂與祗園漫步 ⛩️"
                                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormModal>
    );
};

export default ItineraryDayModal;
