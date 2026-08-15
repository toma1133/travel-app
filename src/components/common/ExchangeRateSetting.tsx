import { useState } from "react";
import { Coins, ArrowRightLeft, RefreshCw } from "lucide-react";
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
        <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
            {/* 本國幣 (Home Currency) */}
            <div className="p-3 bg-card/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Coins size={14} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-muted-foreground">
                        本國幣別 (Home)
                    </span>
                </div>
                <select
                    name="homeCurrency"
                    value={homeCurrency || ""}
                    onChange={(e) => handleCurrencyChange("home", e.target.value)}
                    className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs text-foreground font-mono font-bold outline-none cursor-pointer"
                >
                    <option value="" disabled>
                        請選擇
                    </option>
                    {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-background text-foreground">
                            {c.label}
                        </option>
                    ))}
                    {homeCurrency && !CURRENCIES.find((c) => c.code === homeCurrency) && (
                        <option value={homeCurrency} className="bg-background text-foreground">
                            {homeCurrency}
                        </option>
                    )}
                </select>
            </div>

            {/* 當地幣別 (Local Currency) */}
            <div className="p-3 bg-card/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <ArrowRightLeft size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-muted-foreground">
                        當地幣別 (Local)
                    </span>
                </div>
                <select
                    name="localCurrency"
                    value={localCurrency || ""}
                    onChange={(e) => handleCurrencyChange("local", e.target.value)}
                    className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs text-foreground font-mono font-bold outline-none cursor-pointer"
                >
                    <option value="" disabled>
                        請選擇
                    </option>
                    {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-background text-foreground">
                            {c.label}
                        </option>
                    ))}
                    {localCurrency && !CURRENCIES.find((c) => c.code === localCurrency) && (
                        <option value={localCurrency} className="bg-background text-foreground">
                            {localCurrency}
                        </option>
                    )}
                </select>
            </div>

            {/* 匯率數值 (Exchange Rate Input) */}
            <div className="p-3 bg-card/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                        匯率 (1 {localCurrency || "Local"} = ? {homeCurrency || "Home"})
                    </span>
                    {isLoadingRate && (
                        <RefreshCw size={12} className="text-blue-500 animate-spin" />
                    )}
                </div>
                <input
                    type="number"
                    step="0.0001"
                    name="exchangeRate"
                    value={exchangeRate || ""}
                    onChange={(e) =>
                        onSettingChange("exchangeRate", parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-right bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none"
                    placeholder="0.215"
                />
            </div>
        </div>
    );
};

export default ExchangeRateSetting;
