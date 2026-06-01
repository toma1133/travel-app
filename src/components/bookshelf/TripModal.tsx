import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useState } from "react";
import type { TripThemeConf, TripVM } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type TripModalProps = {
    formData: TripVM;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormChange: ChangeEventHandler<HTMLInputElement>;
    onSettingChange: (name: string, value: string | number) => void;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

import ExchangeRateSetting from "../common/ExchangeRateSetting";

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
            formId={"trip-form"}
            modalTitle={
                mode === "create" ? "創建新旅程" : `編輯旅程 ${formData.title}`
            }
            modalSaveTitle={mode === "create" ? "創建旅程" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Title */}
            <div>
                <label
                    htmlFor="title"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    標題 *
                </label>
                <input
                    required
                    name="title"
                    value={formData.title}
                    onChange={onFormChange}
                    placeholder="例如：東京櫻花之旅"
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                />
            </div>
            {/* Subtitle */}
            <div>
                <label
                    htmlFor="subtitle"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    副標題
                </label>
                <input
                    name="subtitle"
                    value={formData.subtitle || ""}
                    onChange={onFormChange}
                    placeholder="例如：美食、購物、文化探索"
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                />
            </div>
            {/* Start/End Date */}
            <div>
                <label
                    htmlFor="start_date"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    開始日期 *
                </label>
                <input
                    type="date"
                    required
                    name="start_date"
                    value={formData.start_date || ""}
                    onChange={onFormChange}
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors dark:[color-scheme:dark]"
                    placeholder="2025/12/12"
                />
            </div>
            <div>
                <label
                    htmlFor="end_date"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    結束日期 *
                </label>
                <input
                    type="date"
                    required
                    name="end_date"
                    value={formData.end_date || ""}
                    onChange={onFormChange}
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors dark:[color-scheme:dark]"
                    placeholder="2025/12/16"
                />
            </div>
            {/* Cover Image URL */}
            <div>
                <label
                    htmlFor="cover_image"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    封面圖片 URL
                </label>
                <input
                    type="text"
                    name="cover_image"
                    value={formData.cover_image || ""}
                    onChange={onFormChange}
                    placeholder="輸入圖片連結..."
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">
                    您可以提供一個圖片 URL 作為旅程封面。
                </p>
            </div>
            <ExchangeRateSetting
                homeCurrency={formData.settings_config?.homeCurrency}
                localCurrency={formData.settings_config?.localCurrency}
                exchangeRate={formData.settings_config?.exchangeRate}
                onSettingChange={(name, value) => {
                    onSettingChange(name, value);
                }}
            />
        </FormModal>
    );
};

export default TripModal;
