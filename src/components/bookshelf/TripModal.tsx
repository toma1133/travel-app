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

const CURRENCIES = [
    { code: "TWD", label: "TWD$" },
    { code: "JPY", label: "JPY¥" },
    { code: "USD", label: "USD$" },
    { code: "EUR", label: "EUR€" },
    { code: "KRW", label: "KRW₩" },
    { code: "HKD", label: "HKD$" },
    { code: "THB", label: "THB฿" },
    { code: "GBP", label: "GBP£" },
    { code: "AUD", label: "AUD$" },
    { code: "CNY", label: "CNY¥" },
    { code: "NZD", label: "NZD$" },
    { code: "ISK", label: "ISKkr" },
    { code: "CHF", label: "CHFfr" },
    { code: "SGD", label: "SGD$" },
];

const TripModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormChange,
    onSettingChange,
    onFormSubmit,
}: TripModalProps) => {
    const [isLoadingRate, setIsLoadingRate] = useState(false);

    const handleCurrencyChange = async (type: "home" | "local", value: string) => {
        onSettingChange(type === "home" ? "homeCurrency" : "localCurrency", value);
        
        const home = type === "home" ? value : formData.settings_config?.homeCurrency;
        const local = type === "local" ? value : formData.settings_config?.localCurrency;
        
        // Only fetch if they are standard 3-letter codes
        if (home && local && home.length === 3 && local.length === 3) {
            if (home === local) {
                onSettingChange("exchangeRate", 1);
                return;
            }
            setIsLoadingRate(true);
            try {
                const res = await fetch(`https://open.er-api.com/v6/latest/${local}`);
                if (!res.ok) throw new Error("Network response was not ok");
                const data = await res.json();
                const rate = data.rates[home];
                if (rate) {
                    onSettingChange("exchangeRate", Number(rate.toFixed(4)));
                }
            } catch (err) {
                console.error("Fetch exchange rate failed:", err);
            } finally {
                setIsLoadingRate(false);
            }
        }
    };

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
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label
                        htmlFor="setting_config.homeCurrency"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        本國幣 (Home)
                    </label>
                    <select
                        name="setting_config.homeCurrency"
                        value={formData.settings_config?.homeCurrency || ""}
                        onChange={(e) => handleCurrencyChange("home", e.target.value)}
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors dark:bg-card"
                    >
                        <option value="" disabled>請選擇</option>
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                        {/* Include current value if it's not in the list (legacy compatibility) */}
                        {formData.settings_config?.homeCurrency && !CURRENCIES.find(c => c.code === formData.settings_config?.homeCurrency) && (
                            <option value={formData.settings_config.homeCurrency}>{formData.settings_config.homeCurrency}</option>
                        )}
                    </select>
                </div>
                <div>
                    <label
                        htmlFor="setting_config.localCurrency"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        當地幣 (Local)
                    </label>
                    <select
                        name="setting_config.localCurrency"
                        value={formData.settings_config?.localCurrency || ""}
                        onChange={(e) => handleCurrencyChange("local", e.target.value)}
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors dark:bg-card"
                    >
                        <option value="" disabled>請選擇</option>
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                        {formData.settings_config?.localCurrency && !CURRENCIES.find(c => c.code === formData.settings_config?.localCurrency) && (
                            <option value={formData.settings_config.localCurrency}>{formData.settings_config.localCurrency}</option>
                        )}
                    </select>
                </div>
            </div>
            <div>
                <label
                    htmlFor="setting_config.exchangeRate"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    匯率 (1 {formData.settings_config?.localCurrency || "Local"} = ?{" "}
                    {formData.settings_config?.homeCurrency || "Home"})
                    {isLoadingRate && <span className="ml-2 text-primary animate-pulse">更新中...</span>}
                </label>
                <input
                    type="number"
                    step="1"
                    name="setting_config.exchangeRate"
                    value={formData.settings_config?.exchangeRate}
                    onChange={(e) =>
                        onSettingChange("exchangeRate", e.target.value)
                    }
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    placeholder="0.2"
                />
            </div>
        </FormModal>
    );
};

export default TripModal;
