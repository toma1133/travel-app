import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    X,
    Plus,
    Trash2,
    Copy,
    Check,
    TrendingDown,
    Calculator,
    Store,
    MapPin,
    ArrowRight,
    Coins,
} from "lucide-react";
import type {
    ShoppingItemVM,
    ShoppingRecord,
} from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import { getCurrencySymbol } from "../../utils/CurrencyUtil";
import usePlaces from "../../hooks/place/UsePlaces";
import { hapticFeedback } from "../../utils/HapticUtil";

type PriceCompareModalProps = {
    item: ShoppingItemVM;
    tripData?: TripVM | null;
    places?: PlaceVM[];
    onSaveRecords: (records: ShoppingRecord[]) => void;
    onClose: () => void;
};

const PriceCompareModal = ({
    item,
    tripData,
    places: propPlaces,
    onSaveRecords,
    onClose,
}: PriceCompareModalProps) => {
    // If places not passed from props, query with tripId
    const { data: fallbackPlaces = [] } = usePlaces(
        !propPlaces ? tripData?.id : undefined
    );
    const availablePlaces = propPlaces || fallbackPlaces;

    const [records, setRecords] = useState<ShoppingRecord[]>(
        () => item.records || []
    );

    // Currency configuration
    const homeCurrency = tripData?.settings_config?.homeCurrency || "TWD";
    const tripLocalCurrency = tripData?.settings_config?.localCurrency || "JPY";
    const baseCurrency = item.currency || tripLocalCurrency;
    const exchangeRate = tripData?.settings_config?.exchangeRate || 0;

    const baseSymbol = getCurrencySymbol(baseCurrency);
    const homeSymbol = getCurrencySymbol(homeCurrency);

    // Form inputs state
    const [newStore, setNewStore] = useState(item.store || "");
    const [newPrice, setNewPrice] = useState("");
    const [newQuantity, setNewQuantity] = useState("1");
    const [newCurrency, setNewCurrency] = useState(baseCurrency);
    const [copied, setCopied] = useState(false);

    // Store combobox dropdown state
    const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Currency options for switching
    const currencyOptions = useMemo(() => {
        const set = new Set([baseCurrency, homeCurrency, tripLocalCurrency]);
        return Array.from(set).filter(Boolean);
    }, [baseCurrency, homeCurrency, tripLocalCurrency]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsPlaceDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter places based on search term
    const filteredPlaces = useMemo(() => {
        if (!newStore.trim()) return availablePlaces.slice(0, 8);
        const lower = newStore.toLowerCase();
        return availablePlaces.filter(
            (p) =>
                p.name.toLowerCase().includes(lower) ||
                p.eng_name?.toLowerCase().includes(lower)
        );
    }, [availablePlaces, newStore]);

    // Currency converter: convert any (amount, fromCur) to target (toCur)
    const convertPrice = (
        amount: number,
        fromCurrency?: string | null,
        toCurrency: string = baseCurrency
    ) => {
        const fromCur = fromCurrency || baseCurrency;
        if (!amount || fromCur === toCurrency) return amount;
        if (!exchangeRate || exchangeRate <= 0) return amount;

        // 1 local = exchangeRate * home
        // local -> home: amount * exchangeRate
        // home -> local: amount / exchangeRate
        if (fromCur === tripLocalCurrency && toCurrency === homeCurrency) {
            return Math.round(amount * exchangeRate);
        }
        if (fromCur === homeCurrency && toCurrency === tripLocalCurrency) {
            return Math.round(amount / exchangeRate);
        }
        return amount;
    };

    // Calculate total quantity and weighted sum in baseCurrency
    const totalQuantity = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalBaseAmount = records.reduce((sum, r) => {
        const priceInBase = convertPrice(r.price, r.currency || baseCurrency, baseCurrency);
        return sum + priceInBase * (r.quantity || 0);
    }, 0);

    const averagePrice =
        totalQuantity > 0 ? Math.round(totalBaseAmount / totalQuantity) : 0;

    // Find lowest price record (converted to baseCurrency for fair comparison)
    const lowestPriceRecord = useMemo(() => {
        if (records.length === 0) return null;
        return [...records].sort((a, b) => {
            const priceA = convertPrice(a.price, a.currency || baseCurrency, baseCurrency);
            const priceB = convertPrice(b.price, b.currency || baseCurrency, baseCurrency);
            return priceA - priceB;
        })[0];
    }, [records, baseCurrency, exchangeRate]);

    const handleAddRecord = (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(newPrice);
        const qtyNum = parseInt(newQuantity, 10);
        if (isNaN(priceNum) || priceNum <= 0) return;
        if (isNaN(qtyNum) || qtyNum <= 0) return;

        const newRecord: ShoppingRecord = {
            id: crypto.randomUUID(),
            store: newStore.trim() || "未知店家",
            price: priceNum,
            quantity: qtyNum,
            currency: newCurrency,
            date: new Date().toISOString().split("T")[0],
        };

        const updated = [...records, newRecord];
        setRecords(updated);
        onSaveRecords(updated);
        setNewPrice("");
        setNewQuantity("1");
    };

    const handleDeleteRecord = (idx: number) => {
        const updated = records.filter((_, i) => i !== idx);
        setRecords(updated);
        onSaveRecords(updated);
    };

    // One-click copy summary for LINE / split billing
    const handleCopySummary = () => {
        const recipientsList = item.recipients?.length ? item.recipients : ["自己"];
        const perPersonQty =
            totalQuantity > 0
                ? (totalQuantity / recipientsList.length).toFixed(1)
                : 0;
        const perPersonBaseAmount =
            recipientsList.length > 0
                ? Math.round(totalBaseAmount / recipientsList.length)
                : 0;

        const lines = [
            `【${item.name} 採購比價與分攤明細】`,
            item.local_name ? `🌐 外文品名：${item.local_name}` : "",
            item.target_specs ? `🔖 規格/色號：${item.target_specs}` : "",
            `────────────────────`,
            `🛒 分批採購紀錄：`,
            ...records.map((r, i) => {
                const cur = r.currency || baseCurrency;
                const curSym = getCurrencySymbol(cur);
                const inBase = convertPrice(r.price, cur, baseCurrency);
                const hasDiff = cur !== baseCurrency;

                return `  ${i + 1}. [${r.store}] 單價 ${curSym}${r.price.toLocaleString()} ${cur} × ${r.quantity} 件 = ${curSym}${(r.price * r.quantity).toLocaleString()}${
                    hasDiff ? ` (折合約 ${baseSymbol}${inBase.toLocaleString()} ${baseCurrency})` : ""
                }`;
            }),
            `────────────────────`,
            `📊 採購統計：`,
            `  • 總採購數量：${totalQuantity} 件`,
            `  • 總採購金額：${baseSymbol}${totalBaseAmount.toLocaleString()} ${baseCurrency}${
                exchangeRate > 0 && baseCurrency !== homeCurrency
                    ? ` (≈ ${homeSymbol}${convertPrice(totalBaseAmount, baseCurrency, homeCurrency).toLocaleString()} ${homeCurrency})`
                    : ""
            }`,
            `  • 加權均價：${baseSymbol}${averagePrice.toLocaleString()} ${baseCurrency} / 件`,
            lowestPriceRecord
                ? `  • 門市最殺低價：${lowestPriceRecord.store} (${getCurrencySymbol(lowestPriceRecord.currency || baseCurrency)}${lowestPriceRecord.price.toLocaleString()})`
                : "",
            `────────────────────`,
            `👥 受贈/代購對象分攤明細：`,
            ...recipientsList.map((rec) => {
                const homeAmt = convertPrice(perPersonBaseAmount, baseCurrency, homeCurrency);
                return `  • ${rec}：約 ${perPersonQty} 件，應付金額 ${baseSymbol}${perPersonBaseAmount.toLocaleString()}${
                    exchangeRate > 0 && baseCurrency !== homeCurrency
                        ? ` (折合約 ${homeSymbol}${homeAmt.toLocaleString()})`
                        : ""
                }`;
            }),
            `────────────────────`,
            exchangeRate > 0
                ? `* 匯率參考約 ${exchangeRate} (${tripLocalCurrency} ⇋ ${homeCurrency})，實際請款以刷卡扣款當日帳單或約定為準。`
                : "",
        ].filter(Boolean);

        const text = lines.join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    // Live converted preview for newly entered price
    const liveConvertedPrice = useMemo(() => {
        const num = parseFloat(newPrice);
        if (isNaN(num) || num <= 0) return null;
        if (newCurrency === baseCurrency) {
            // If base is not home, show home converted
            if (baseCurrency !== homeCurrency && exchangeRate > 0) {
                return `≈ ${homeSymbol} ${convertPrice(num, baseCurrency, homeCurrency).toLocaleString()} ${homeCurrency}`;
            }
            return null;
        }
        // If entered in different currency, show converted base
        return `≈ ${baseSymbol} ${convertPrice(num, newCurrency, baseCurrency).toLocaleString()} ${baseCurrency}`;
    }, [newPrice, newCurrency, baseCurrency, homeCurrency, exchangeRate]);

    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartYRef = React.useRef(0);
    const touchCurrentYRef = React.useRef(0);

    const handleDismiss = () => {
        hapticFeedback.light();
        onClose();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartYRef.current = touch.clientY;
        touchCurrentYRef.current = touch.clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        touchCurrentYRef.current = touch.clientY;
        const deltaY = touchCurrentYRef.current - touchStartYRef.current;

        if (deltaY > 0) {
            setTranslateY(Math.pow(deltaY, 0.92));
        } else {
            setTranslateY(0);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const deltaY = touchCurrentYRef.current - touchStartYRef.current;
        if (deltaY > 80) {
            handleDismiss();
        } else {
            setTranslateY(0);
        }
    };

    const backdropOpacity = Math.max(0.2, 1 - translateY / 320);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            style={{ opacity: backdropOpacity }}
            onClick={handleDismiss}
        >
            <div
                style={{
                    transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="liquid-glass-elevated border border-white/40 dark:border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-full sm:max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 */}
                <div
                    className="w-full pt-3 pb-1 sm:hidden flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-10 h-1.5 rounded-full bg-muted-foreground/35 hover:bg-muted-foreground/50 transition-colors" />
                </div>

                {/* Header */}
                <div
                    className="px-5 py-3.5 sm:py-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-white/40 dark:bg-white/[0.03] touch-none select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                            <Calculator size={17} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                                <span>跨店比價與加權均價</span>
                                <span className="text-[10px] font-mono font-normal text-muted-foreground uppercase">
                                    {baseCurrency}
                                </span>
                            </h3>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                                {item.name}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
                    {/* Summary Card */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl liquid-glass-subtle border border-white/40 dark:border-white/10 shadow-xs">
                        <div>
                            <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                                <Coins size={12} className="text-primary" />
                                <span>加權平均單價</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
                                {baseSymbol}{averagePrice.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
                                <div>共採購 {totalQuantity} 件 (總計 {baseSymbol}{totalBaseAmount.toLocaleString()})</div>
                                {exchangeRate > 0 && baseCurrency !== homeCurrency && (
                                    <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                        ≈ {homeSymbol}{convertPrice(totalBaseAmount, baseCurrency, homeCurrency).toLocaleString()} {homeCurrency}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                                <TrendingDown size={12} className="text-emerald-500" />
                                <span>門市最殺低價</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {lowestPriceRecord
                                    ? `${getCurrencySymbol(lowestPriceRecord.currency || baseCurrency)}${lowestPriceRecord.price.toLocaleString()}`
                                    : "尚未紀錄"}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                {lowestPriceRecord ? (
                                    <span>
                                        @ {lowestPriceRecord.store}
                                        {lowestPriceRecord.currency && lowestPriceRecord.currency !== baseCurrency && (
                                            <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-mono">
                                                (≈ {baseSymbol}{convertPrice(lowestPriceRecord.price, lowestPriceRecord.currency, baseCurrency).toLocaleString()})
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    "輸入紀錄自動比價"
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Records List */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between px-1">
                            <span>門市採購 / 報價紀錄 ({records.length})</span>
                            <span className="text-[10px] font-normal font-mono">
                                基準幣別：{baseCurrency}
                            </span>
                        </div>

                        {records.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-border/70 bg-muted/20">
                                尚無跨店比價資料，請於下方新增各門市查看到的價格與數量
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {records.map((rec, idx) => {
                                    const recCur = rec.currency || baseCurrency;
                                    const recSymbol = getCurrencySymbol(recCur);
                                    const priceInBase = convertPrice(rec.price, recCur, baseCurrency);
                                    const isLowest =
                                        lowestPriceRecord &&
                                        convertPrice(lowestPriceRecord.price, lowestPriceRecord.currency || baseCurrency, baseCurrency) === priceInBase;

                                    return (
                                        <div
                                            key={rec.id || idx}
                                            className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-all ${
                                                isLowest
                                                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-xs"
                                                    : "liquid-glass-subtle border-white/30 dark:border-white/10"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                                                    <Store size={14} className="text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold flex items-center gap-1.5 truncate text-foreground">
                                                        <span className="truncate">{rec.store}</span>
                                                        {isLowest && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white shrink-0 shadow-2xs">
                                                                最划算
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-mono">
                                                        <span>{recCur}</span>
                                                        {rec.date && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{rec.date}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right font-mono">
                                                    <div className="font-bold text-foreground text-sm">
                                                        {recSymbol}{rec.price.toLocaleString()}
                                                        <span className="text-xs font-normal text-muted-foreground ml-1">
                                                            × {rec.quantity}
                                                        </span>
                                                    </div>
                                                    {recCur !== baseCurrency && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            ≈ {baseSymbol}{priceInBase.toLocaleString()} {baseCurrency}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRecord(idx)}
                                                    className="p-1.5 rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="刪除紀錄"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add Record Form */}
                    <form
                        onSubmit={handleAddRecord}
                        className="p-4 rounded-2xl liquid-glass-subtle border border-white/40 dark:border-white/10 space-y-3 shadow-xs"
                    >
                        <div className="text-xs font-bold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1">
                                <Plus size={13} className="text-primary" />
                                <span>新增門市報價 / 採購紀錄</span>
                            </span>
                            {/* Currency toggle tabs */}
                            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border/50">
                                {currencyOptions.map((cur) => (
                                    <button
                                        key={cur}
                                        type="button"
                                        onClick={() => setNewCurrency(cur)}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                                            newCurrency === cur
                                                ? "bg-primary text-primary-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {cur}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Store Input with Dropdown Combobox */}
                        <div className="space-y-1 relative" ref={dropdownRef}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="輸入店家名稱，或從右側挑選行程地點..."
                                    value={newStore}
                                    onChange={(e) => {
                                        setNewStore(e.target.value);
                                        setIsPlaceDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsPlaceDropdownOpen(true)}
                                    className="w-full pl-3 pr-20 py-2 bg-background/80 border border-border rounded-xl text-foreground outline-none text-xs focus:ring-2 focus:ring-primary/40 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsPlaceDropdownOpen(!isPlaceDropdownOpen)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-semibold bg-muted hover:bg-accent text-foreground rounded-lg border border-border flex items-center gap-1 cursor-pointer transition-all"
                                >
                                    <MapPin size={11} className="text-primary" />
                                    <span>選地點</span>
                                </button>
                            </div>

                            {/* Dropdown Candidate Places */}
                            {isPlaceDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-popover/95 border border-border rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-1 mb-1">
                                        <span>行程景點與店家 ({filteredPlaces.length})</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsPlaceDropdownOpen(false)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {item.store && (
                                        <div
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setNewStore(item.store!);
                                                setIsPlaceDropdownOpen(false);
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl hover:bg-accent cursor-pointer flex items-center gap-2 text-xs font-semibold text-primary"
                                        >
                                            <Store size={12} className="shrink-0" />
                                            <span>預設店家：{item.store}</span>
                                        </div>
                                    )}

                                    {filteredPlaces.map((p) => (
                                        <div
                                            key={p.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setNewStore(p.name);
                                                setIsPlaceDropdownOpen(false);
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl hover:bg-accent cursor-pointer flex items-center justify-between text-xs transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <MapPin size={12} className="text-primary/70 shrink-0" />
                                                <span className="font-medium text-foreground truncate">
                                                    {p.name}
                                                </span>
                                            </div>
                                            {p.tags && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 font-mono">
                                                    {p.tags.split(",")[0]}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price and Quantity Inputs */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    placeholder={`單價 (${newCurrency} ${getCurrencySymbol(newCurrency)})`}
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-background/80 border border-border rounded-xl text-foreground outline-none font-mono focus:ring-2 focus:ring-primary/40"
                                    required
                                />
                            </div>

                            <div className="w-20">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="數量"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(e.target.value)}
                                    className="w-full px-2 py-2 text-xs bg-background/80 border border-border rounded-xl text-foreground outline-none font-mono text-center focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                            >
                                <Plus size={13} />
                                <span>加入</span>
                            </button>
                        </div>

                        {/* Live Conversion Notice */}
                        {liveConvertedPrice && (
                            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium px-1 flex items-center gap-1">
                                <ArrowRight size={11} />
                                <span>{liveConvertedPrice}</span>
                                {exchangeRate > 0 && (
                                    <span className="text-muted-foreground/70 text-[10px]">
                                        (匯率 {exchangeRate})
                                    </span>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer with One-Click Copy Billing Summary */}
                <div className="p-4 border-t border-border/70 bg-white/40 dark:bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleCopySummary}
                        disabled={records.length === 0}
                        className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            copied
                                ? "bg-emerald-500 text-white shadow-emerald-500/25 shadow-md"
                                : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? "已複製明細到剪貼簿！" : "複製請款明細 (貼至 LINE)"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-2xl border border-border text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceCompareModal;
