import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useState } from "react";
import { Calendar, Image as ImageIcon, Sparkles, MapPin, Tag, RefreshCw } from "lucide-react";
import type { TripThemeConf, TripVM } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";
import ExchangeRateSetting from "../common/ExchangeRateSetting";

type TripModalProps = {
    formData: TripVM;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormChange: ChangeEventHandler<HTMLInputElement>;
    onSettingChange: (name: string, value: string | number) => void;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const TripModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormChange,
    onSettingChange,
    onFormSubmit,
}: TripModalProps) => {
    return (
        <FormModal
            formId="trip-form"
            modalTitle={mode === "create" ? "創建新旅程" : `編輯旅程`}
            modalSaveTitle={mode === "create" ? "創建旅程" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
            maxWidthClass="sm:max-w-lg"
        >
            <div className="space-y-4">
                {/* 📌 Group 1: 旅程基本資訊 (Inset Grouped Section) */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        旅程名稱與描述
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 標題 */}
                        <div className="p-3 bg-card/80 flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
                                標題 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={onFormChange}
                                placeholder="例如：東京浪漫賞櫻之旅 🌸"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 副標題 */}
                        <div className="p-3 bg-card/80 flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
                                副標題
                            </span>
                            <input
                                name="subtitle"
                                value={formData.subtitle || ""}
                                onChange={onFormChange}
                                placeholder="例如：美食、購物、漫步涉谷"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* 📅 Group 2: 出發與結束日期 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        旅行出發日期
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 開始日期 */}
                        <div className="p-3 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    開始日期 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                type="date"
                                required
                                name="start_date"
                                value={formData.start_date || ""}
                                onChange={onFormChange}
                                className="bg-transparent text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>

                        {/* 結束日期 */}
                        <div className="p-3 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-rose-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    結束日期 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                type="date"
                                required
                                name="end_date"
                                value={formData.end_date || ""}
                                onChange={onFormChange}
                                className="bg-transparent text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>

                {/* 🖼️ Group 3: 封面圖片 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        封面視覺
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        <div className="p-3 bg-card/80 flex items-center gap-3">
                            <ImageIcon size={14} className="text-purple-500 shrink-0" />
                            <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
                                圖片 URL
                            </span>
                            <input
                                type="text"
                                name="cover_image"
                                value={formData.cover_image || ""}
                                onChange={onFormChange}
                                placeholder="https://images.unsplash.com/..."
                                className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none"
                            />
                        </div>
                    </div>

                    {/* 圖片即時預覽 */}
                    {formData.cover_image && (
                        <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-border/80 shadow-2xs mt-2 bg-muted">
                            <img
                                src={formData.cover_image}
                                alt="Cover preview"
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        </div>
                    )}
                </div>

                {/* 💱 Group 4: 幣別與匯率設定 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        幣別與預算匯率
                    </span>
                    <ExchangeRateSetting
                        homeCurrency={formData.settings_config?.homeCurrency}
                        localCurrency={formData.settings_config?.localCurrency}
                        exchangeRate={formData.settings_config?.exchangeRate}
                        onSettingChange={(name, value) => {
                            onSettingChange(name, value);
                        }}
                    />
                </div>
            </div>
        </FormModal>
    );
};

export default TripModal;
