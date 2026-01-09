import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
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
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    標題 *
                </label>
                <input
                    required
                    name="title"
                    value={formData.title}
                    onChange={onFormChange}
                    placeholder="例如：東京櫻花之旅"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base text-black"
                />
            </div>
            {/* Subtitle */}
            <div>
                <label
                    htmlFor="subtitle"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    副標題
                </label>
                <input
                    name="subtitle"
                    value={formData.subtitle || ""}
                    onChange={onFormChange}
                    placeholder="例如：美食、購物、文化探索"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base text-black"
                />
            </div>
            {/* Start/End Date */}
            <div>
                <label
                    htmlFor="start_date"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    開始日期 *
                </label>
                <input
                    type="date"
                    required
                    name="start_date"
                    value={formData.start_date || ""}
                    onChange={onFormChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base text-black"
                    placeholder="2025/12/12"
                />
            </div>
            <div>
                <label
                    htmlFor="end_date"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    結束日期 *
                </label>
                <input
                    type="date"
                    required
                    name="end_date"
                    value={formData.end_date || ""}
                    onChange={onFormChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base text-black"
                    placeholder="2025/12/16"
                />
            </div>
            {/* Cover Image URL */}
            <div>
                <label
                    htmlFor="cover_image"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    封面圖片 URL
                </label>
                <input
                    type="text"
                    name="cover_image"
                    value={formData.cover_image || ""}
                    onChange={onFormChange}
                    placeholder="輸入圖片連結..."
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base text-black"
                />
                <p className="text-xs text-gray-400 mt-1">
                    您可以提供一個圖片 URL 作為旅程封面。
                </p>
            </div>
            <div>
                <label
                    htmlFor="setting_config.homeCurrency"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    本國幣 (Home)
                </label>
                <input
                    name="setting_config.homeCurrency"
                    value={formData.settings_config?.homeCurrency || ""}
                    onChange={(e) =>
                        onSettingChange("homeCurrency", e.target.value)
                    }
                    placeholder="NT$"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base text-black"
                />
            </div>
            <div>
                <label
                    htmlFor="setting_config.localCurrency"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    當地幣 (Local)
                </label>
                <input
                    name="setting_config.localCurrency"
                    value={formData.settings_config?.localCurrency || ""}
                    onChange={(e) =>
                        onSettingChange("localCurrency", e.target.value)
                    }
                    placeholder="JPY¥"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base text-black"
                />
            </div>
            <div>
                <label
                    htmlFor="setting_config.exchangeRate"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    匯率 (1 {formData.settings_config?.localCurrency} = ?{" "}
                    {formData.settings_config?.homeCurrency})
                </label>
                <input
                    type="number"
                    step="1"
                    name="setting_config.exchangeRate"
                    value={formData.settings_config?.exchangeRate}
                    onChange={(e) =>
                        onSettingChange("exchangeRate", e.target.value)
                    }
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base text-black"
                    placeholder="0.2"
                />
            </div>
        </FormModal>
    );
};

export default TripModal;
