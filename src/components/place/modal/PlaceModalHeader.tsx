import React, { ChangeEvent, ChangeEventHandler } from "react";
import { Languages, Volume2 } from "lucide-react";
import { CategoryCustomSelect } from "../../common/CategoryCustomSelect";
import type { PlaceVM } from "../../../models/types/PlaceTypes";

export interface PlaceModalHeaderProps {
    formData: PlaceVM;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    speaking: boolean;
    detectedNativeLang: {
        name: string;
        flag: string;
        langCode: string;
    };
    onSpeakNative: () => void;
}

export const PlaceModalHeader: React.FC<PlaceModalHeaderProps> = ({
    formData,
    onFormInputChange,
    speaking,
    detectedNativeLang,
    onSpeakNative,
}) => {
    return (
        <div className="space-y-4">
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
                        if (newTypeId === "hotel" || newTypeId === "stay") {
                            if (!formData?.info?.check_in) {
                                onFormInputChange({
                                    target: { name: "info.check_in", value: "15:00" },
                                    currentTarget: { name: "info.check_in", value: "15:00" },
                                } as any);
                            }
                            if (!formData?.info?.check_out) {
                                onFormInputChange({
                                    target: { name: "info.check_out", value: "11:00" },
                                    currentTarget: { name: "info.check_out", value: "11:00" },
                                } as any);
                            }
                        }
                    }}
                />
            </div>

            {/* 基本識別卡片 (Apple HIG Inset Grouped) */}
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
                                    onClick={onSpeakNative}
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
        </div>
    );
};
