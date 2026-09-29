import React from "react";
import { Plus, Minus, Calculator, Percent } from "lucide-react";
import { getCurrencySymbol } from "../../../utils/CurrencyUtil";

export interface ShoppingPriceSectionProps {
    currency: string;
    targetQuantity: number;
    initialPriceInput: string;
    isTaxFree: boolean;
    tripLocalCurrency: string;
    homeCurrency: string;
    exchangeRate: number;
    onQuantityChange: (qty: number) => void;
    onPriceChange: (val: string) => void;
    onTaxFreeToggle: (taxFree: boolean) => void;
    onCurrencyToggle: (targetCurrency: string) => void;
}

export const ShoppingPriceSection: React.FC<ShoppingPriceSectionProps> = ({
    currency,
    targetQuantity,
    initialPriceInput,
    isTaxFree,
    tripLocalCurrency,
    homeCurrency,
    exchangeRate,
    onQuantityChange,
    onPriceChange,
    onTaxFreeToggle,
    onCurrencyToggle,
}) => {
    const rawPrice = parseFloat(initialPriceInput) || 0;
    const effectiveUnitPrice = isTaxFree
        ? currency === "JPY"
            ? Math.round(rawPrice / 1.1) // 日本標準消費稅10%計算未稅價
            : rawPrice
        : rawPrice;

    const totalOriginal = effectiveUnitPrice * targetQuantity;

    // 換算為本國幣金額
    const convertedHomeTotal =
        currency === tripLocalCurrency && exchangeRate > 0
            ? Math.round(totalOriginal * exchangeRate)
            : currency === homeCurrency
            ? totalOriginal
            : exchangeRate > 0
            ? Math.round(totalOriginal * exchangeRate)
            : totalOriginal;

    // 換算為當地幣金額
    const convertedLocalTotal =
        currency === homeCurrency && exchangeRate > 0
            ? Math.round(totalOriginal / exchangeRate)
            : totalOriginal;

    return (
        <div className="space-y-3 p-4 rounded-2xl bg-white/40 dark:bg-black/30 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 數量步進器 */}
                <div className="space-y-1.5">
                    <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                        預計採購總數量
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onQuantityChange(Math.max(1, targetQuantity - 1))}
                            className="w-9 h-9 rounded-xl border border-white/30 dark:border-white/15 bg-white/60 dark:bg-neutral-800/60 flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-white/80 dark:hover:bg-neutral-700/80 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                            <Minus size={14} />
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={targetQuantity}
                            onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v) && v >= 1) onQuantityChange(v);
                            }}
                            className="w-16 h-9 text-center font-mono font-bold text-sm bg-white/70 dark:bg-neutral-900/60 border border-white/30 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <button
                            type="button"
                            onClick={() => onQuantityChange(targetQuantity + 1)}
                            className="w-9 h-9 rounded-xl border border-white/30 dark:border-white/15 bg-white/60 dark:bg-neutral-800/60 flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-white/80 dark:hover:bg-neutral-700/80 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                            <Plus size={14} />
                        </button>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">件</span>
                    </div>
                </div>

                {/* 單價與幣別切換 */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                            預估 / 購入單價
                        </label>

                        {/* 幣別切換膠囊 */}
                        <div className="inline-flex items-center rounded-xl border border-white/30 dark:border-white/15 bg-black/5 dark:bg-white/5 p-0.5">
                            <button
                                type="button"
                                onClick={() => onCurrencyToggle(tripLocalCurrency)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    currency === tripLocalCurrency
                                        ? "bg-primary text-primary-foreground shadow-2xs"
                                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                }`}
                            >
                                {tripLocalCurrency}
                            </button>
                            <button
                                type="button"
                                onClick={() => onCurrencyToggle(homeCurrency)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    currency === homeCurrency
                                        ? "bg-primary text-primary-foreground shadow-2xs"
                                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                }`}
                            >
                                {homeCurrency}
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-500 pointer-events-none">
                            {getCurrencySymbol(currency)}
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder={
                                currency === tripLocalCurrency
                                    ? `例: ${tripLocalCurrency === "JPY" ? "1400" : tripLocalCurrency === "KRW" ? "15000" : "50"}`
                                    : "例: 350"
                            }
                            value={initialPriceInput}
                            onChange={(e) => onPriceChange(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white/70 dark:bg-neutral-900/60 border border-white/30 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>
            </div>

            {/* 免稅勾選開關與即時雙幣別計算預覽 */}
            <div className="pt-2 border-t border-white/20 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* 免稅切換 */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={isTaxFree}
                        onChange={(e) => onTaxFreeToggle(e.target.checked)}
                        className="rounded border-white/30 text-primary focus:ring-primary/50 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            免稅價試算
                        </span>
                        {isTaxFree && currency === "JPY" && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono font-semibold">
                                -10% 免稅扣除
                            </span>
                        )}
                    </div>
                </label>

                {/* 雙幣別即時預覽 */}
                {rawPrice > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-white/20 dark:border-white/10">
                        <Calculator size={13} className="text-primary shrink-0" />
                        <span>總計:</span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            {getCurrencySymbol(currency)}{" "}
                            {totalOriginal.toLocaleString()}
                        </span>
                        {exchangeRate > 0 && tripLocalCurrency !== homeCurrency && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                                ≈ {getCurrencySymbol(currency === tripLocalCurrency ? homeCurrency : tripLocalCurrency)}{" "}
                                {(currency === tripLocalCurrency
                                    ? convertedHomeTotal
                                    : convertedLocalTotal
                                ).toLocaleString()}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
