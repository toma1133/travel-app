import React, { useState, useMemo, useEffect } from "react";
import {
    Calculator,
    X,
    ArrowRightLeft,
    Plus,
    Percent,
    Sparkles,
    ChevronDown,
    ChevronUp,
    RefreshCw,
} from "lucide-react";
import {
    getCurrencySymbol,
    getCurrencyName,
    POPULAR_TRAVEL_CURRENCIES,
} from "../../utils/CurrencyUtil";
import type { TripVM } from "../../models/types/TripTypes";

export interface FloatingCurrencyConverterProps {
    tripData?: TripVM | null;
    onAddToList?: (amount: number, currency: string) => void;
}

const FloatingCurrencyConverter: React.FC<FloatingCurrencyConverterProps> = ({
    tripData,
    onAddToList,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Trip currencies and exchange rate
    const tripLocalCurrency = tripData?.settings_config?.localCurrency || "JPY";
    const tripHomeCurrency = tripData?.settings_config?.homeCurrency || "TWD";
    const baseRate = tripData?.settings_config?.exchangeRate || 0.215;

    const [foreignCurrency, setForeignCurrency] = useState(tripLocalCurrency);
    const [homeCurrency, setHomeCurrency] = useState(tripHomeCurrency);
    const [exchangeRate, setExchangeRate] = useState<number>(baseRate);

    // Sync if tripData updates
    useEffect(() => {
        if (tripData?.settings_config?.localCurrency) {
            setForeignCurrency(tripData.settings_config.localCurrency);
        }
        if (tripData?.settings_config?.homeCurrency) {
            setHomeCurrency(tripData.settings_config.homeCurrency);
        }
        if (tripData?.settings_config?.exchangeRate) {
            setExchangeRate(tripData.settings_config.exchangeRate);
        }
    }, [tripData]);

    // Input state
    const [inputAmount, setInputAmount] = useState<string>("3500");
    const [taxMode, setTaxMode] = useState<"none" | "10" | "8">("none");
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [customRateInput, setCustomRateInput] = useState<string>(baseRate.toString());

    // Clean numeric value
    const rawNumber = useMemo(() => {
        const parsed = parseFloat(inputAmount.replace(/,/g, ""));
        return isNaN(parsed) ? 0 : parsed;
    }, [inputAmount]);

    // Apply tax if selected (e.g. Japan 10% general tax or 8% reduced food tax)
    const taxedAmount = useMemo(() => {
        if (taxMode === "10") {
            return Math.round(rawNumber * 1.1);
        }
        if (taxMode === "8") {
            return Math.round(rawNumber * 1.08);
        }
        return rawNumber;
    }, [rawNumber, taxMode]);

    // Converted home amount (1 foreign = exchangeRate home)
    const convertedHomeAmount = useMemo(() => {
        if (!exchangeRate || exchangeRate <= 0) return taxedAmount;
        return Math.round(taxedAmount * exchangeRate);
    }, [taxedAmount, exchangeRate]);

    const foreignSymbol = getCurrencySymbol(foreignCurrency);
    const homeSymbol = getCurrencySymbol(homeCurrency);

    // Numeric keypad helpers
    const handleQuickAdd = (delta: number) => {
        const next = Math.max(0, rawNumber + delta);
        setInputAmount(next.toString());
    };

    const handleClear = () => {
        setInputAmount("0");
    };

    const handleAddToList = () => {
        if (onAddToList) {
            onAddToList(taxedAmount, foreignCurrency);
        }
    };

    // Swap currencies
    const handleSwapCurrencies = () => {
        const temp = foreignCurrency;
        setForeignCurrency(homeCurrency);
        setHomeCurrency(temp);
        if (exchangeRate > 0) {
            const inverted = Number((1 / exchangeRate).toFixed(4));
            setExchangeRate(inverted);
            setCustomRateInput(inverted.toString());
        }
    };

    return (
        <div className="fixed bottom-20 right-4 sm:right-6 z-40 flex flex-col items-end">
            {/* Pop-up Mini Glass Calculator Panel */}
            {isOpen && (
                <div className="mb-3 w-[310px] sm:w-[340px] bg-card/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-3xl p-4 space-y-3.5 animate-in slide-in-from-bottom-5 fade-in duration-200 text-card-foreground">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm shadow-2xs font-bold">
                                💱
                            </div>
                            <div>
                                <h3 className="font-bold text-xs text-foreground flex items-center gap-1">
                                    即時匯率換算
                                </h3>
                                <p className="text-[10px] text-muted-foreground">
                                    1 {foreignCurrency} ≈ {exchangeRate} {homeCurrency}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setIsEditingRate(!isEditingRate)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] font-bold cursor-pointer"
                                title="微調匯率"
                            >
                                調整匯率
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                title="收合計算機"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Rate Editor (Collapsible) */}
                    {isEditingRate && (
                        <div className="p-2.5 rounded-2xl bg-muted/50 border border-border/60 space-y-2 animate-in fade-in">
                            <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                                <span>自訂換算匯率 (1 {foreignCurrency} = ? {homeCurrency})</span>
                                <button
                                    type="button"
                                    onClick={handleSwapCurrencies}
                                    className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
                                >
                                    <ArrowRightLeft size={11} />
                                    <span>反向對調</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={customRateInput}
                                    onChange={(e) => setCustomRateInput(e.target.value)}
                                    className="flex-1 px-3 py-1 text-xs font-mono bg-card border border-border rounded-xl outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const r = parseFloat(customRateInput);
                                        if (!isNaN(r) && r > 0) {
                                            setExchangeRate(r);
                                            setIsEditingRate(false);
                                        }
                                    }}
                                    className="px-3 py-1 bg-primary text-primary-foreground font-bold text-xs rounded-xl cursor-pointer"
                                >
                                    套用
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input Display Area */}
                    <div className="space-y-2">
                        {/* Foreign Currency Input */}
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                                <span>外幣原價 ({foreignCurrency})</span>
                                {taxMode !== "none" && (
                                    <span className="text-amber-500 font-bold text-[10px]">
                                        含稅 {taxMode}% ({foreignSymbol}
                                        {taxedAmount.toLocaleString()})
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg font-bold text-muted-foreground font-mono">
                                    {foreignSymbol}
                                </span>
                                <input
                                    type="number"
                                    value={inputAmount}
                                    onChange={(e) => setInputAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full text-2xl font-black font-mono bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                                />
                            </div>
                        </div>

                        {/* Japan / Overseas Tax Mode Toggles */}
                        <div className="flex items-center gap-1.5 justify-between">
                            <div className="text-[10px] font-bold text-muted-foreground">稅金試算:</div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTaxMode("none")}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                        taxMode === "none"
                                            ? "bg-foreground text-background shadow-2xs"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    原價/免稅
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTaxMode("10")}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                        taxMode === "10"
                                            ? "bg-amber-500 text-white shadow-2xs"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    +10% (一般)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTaxMode("8")}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                        taxMode === "8"
                                            ? "bg-emerald-500 text-white shadow-2xs"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    +8% (食品)
                                </button>
                            </div>
                        </div>

                        {/* Converted Home Currency Readout (Big & Vibrant) */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-0.5">
                            <div className="text-[10px] font-bold text-primary flex items-center justify-between">
                                <span>折合本幣約 ({getCurrencyName(homeCurrency)})</span>
                                <span className="font-mono text-[10px] opacity-80">
                                    匯率 {exchangeRate}
                                </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black font-mono text-foreground flex items-baseline gap-1">
                                <span className="text-sm font-bold text-primary">{homeSymbol}</span>
                                <span className="tracking-tight text-primary">
                                    {convertedHomeAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Numeric Addition Stepper Pills */}
                    <div className="flex items-center gap-1 justify-between pt-1">
                        <button
                            type="button"
                            onClick={() => handleQuickAdd(100)}
                            className="flex-1 py-1 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-[11px] font-bold font-mono transition-colors cursor-pointer"
                        >
                            +100
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickAdd(500)}
                            className="flex-1 py-1 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-[11px] font-bold font-mono transition-colors cursor-pointer"
                        >
                            +500
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickAdd(1000)}
                            className="flex-1 py-1 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-[11px] font-bold font-mono transition-colors cursor-pointer"
                        >
                            +1000
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickAdd(5000)}
                            className="flex-1 py-1 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-[11px] font-bold font-mono transition-colors cursor-pointer"
                        >
                            +5000
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-2 py-1 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-[11px] font-bold transition-colors cursor-pointer"
                            title="清空金額"
                        >
                            C
                        </button>
                    </div>

                    {/* Action Button: ＋加入購物清單 */}
                    <button
                        type="button"
                        onClick={handleAddToList}
                        className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <Plus size={15} />
                        <span>加入購物清單 ({foreignSymbol}{taxedAmount.toLocaleString()})</span>
                    </button>
                </div>
            )}

            {/* Floating Launcher Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3.5 rounded-full shadow-2xl backdrop-blur-md border transition-all cursor-pointer flex items-center gap-2 group active:scale-95 ${
                    isOpen
                        ? "bg-primary text-primary-foreground border-primary scale-105"
                        : "bg-card/90 dark:bg-neutral-900/90 hover:bg-card text-foreground border-border/80 hover:border-primary/50 shadow-primary/10"
                }`}
                title={isOpen ? "關閉計算機" : "展開即時匯率換算器"}
            >
                <div className="relative">
                    <Calculator
                        size={20}
                        className={`transition-transform duration-300 ${
                            isOpen ? "rotate-90 text-primary-foreground" : "text-primary group-hover:scale-110"
                        }`}
                    />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                </div>
                <span className="text-xs font-bold pr-0.5 hidden sm:inline">
                    {isOpen ? "收合換算" : "匯率換算"}
                </span>
            </button>
        </div>
    );
};

export default FloatingCurrencyConverter;
