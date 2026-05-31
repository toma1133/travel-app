import { useState } from "react";
import { CURRENCIES } from "../../constants/Currencies";

type ExchangeRateSettingProps = {
    homeCurrency: string | undefined;
    localCurrency: string | undefined;
    exchangeRate: number | undefined;
    onSettingChange: (name: string, value: string | number) => void;
};

const ExchangeRateSetting = ({
    homeCurrency,
    localCurrency,
    exchangeRate,
    onSettingChange,
}: ExchangeRateSettingProps) => {
    const [isLoadingRate, setIsLoadingRate] = useState(false);

    const handleCurrencyChange = async (type: "home" | "local", value: string) => {
        onSettingChange(type === "home" ? "homeCurrency" : "localCurrency", value);

        const home = type === "home" ? value : homeCurrency;
        const local = type === "local" ? value : localCurrency;

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
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label
                        htmlFor="homeCurrency"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        本國幣 (Home)
                    </label>
                    <select
                        name="homeCurrency"
                        value={homeCurrency || ""}
                        onChange={(e) => handleCurrencyChange("home", e.target.value)}
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors dark:bg-card"
                    >
                        <option value="" disabled>請選擇</option>
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                        {homeCurrency && !CURRENCIES.find(c => c.code === homeCurrency) && (
                            <option value={homeCurrency}>{homeCurrency}</option>
                        )}
                    </select>
                </div>
                <div>
                    <label
                        htmlFor="localCurrency"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        當地幣 (Local)
                    </label>
                    <select
                        name="localCurrency"
                        value={localCurrency || ""}
                        onChange={(e) => handleCurrencyChange("local", e.target.value)}
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors dark:bg-card"
                    >
                        <option value="" disabled>請選擇</option>
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                        {localCurrency && !CURRENCIES.find(c => c.code === localCurrency) && (
                            <option value={localCurrency}>{localCurrency}</option>
                        )}
                    </select>
                </div>
            </div>
            <div>
                <label
                    htmlFor="exchangeRate"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    匯率 (1 {localCurrency || "Local"} = ?{" "}
                    {homeCurrency || "Home"})
                    {isLoadingRate && <span className="ml-2 text-primary animate-pulse">更新中...</span>}
                </label>
                <input
                    type="number"
                    step="1"
                    name="exchangeRate"
                    value={exchangeRate || ""}
                    onChange={(e) =>
                        onSettingChange("exchangeRate", parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    placeholder="0.2"
                />
            </div>
        </div>
    );
};

export default ExchangeRateSetting;
