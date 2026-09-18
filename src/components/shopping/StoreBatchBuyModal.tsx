import React, { useState, useEffect, useMemo } from "react";
import {
    X,
    ShoppingCart,
    Check,
    Plus,
    Minus,
    Building2,
    Sparkles,
    RotateCcw,
    CheckCheck,
    Volume2,
    Tag,
    ChevronDown,
    DollarSign,
    Gift,
    Store,
} from "lucide-react";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";
import {
    getCategoryEmoji,
    getRecipientColorStyle,
} from "../../models/types/ShoppingTypes";
import { detectAutoLanguage } from "./ClerkShowModal";

export type BatchItemUpdate = {
    id: string;
    bought_quantity: number;
    unit_price: number;
    is_completed: boolean;
};

type StoreBatchBuyModalProps = {
    isOpen: boolean;
    storeName: string;
    allItems: ShoppingItemVM[];
    storeThresholds: Record<string, number>;
    tripData?: TripVM | null;
    resolveRecipient?: (rec: string, item: ShoppingItemVM) => string;
    onClose: () => void;
    onSaveBatch: (updates: BatchItemUpdate[]) => Promise<void> | void;
};

const StoreBatchBuyModal: React.FC<StoreBatchBuyModalProps> = ({
    isOpen,
    storeName: initialStoreName,
    allItems,
    storeThresholds,
    tripData,
    resolveRecipient,
    onClose,
    onSaveBatch,
}) => {
    // Collect all available store names
    const storeOptions = useMemo(() => {
        const set = new Set<string>();
        allItems.forEach((i) => {
            set.add(i.store || "未指定店家");
        });
        return Array.from(set);
    }, [allItems]);

    // Currently selected store inside the modal
    const [currentStore, setCurrentStore] = useState<string>(
        initialStoreName && initialStoreName !== "all"
            ? initialStoreName
            : storeOptions[0] || "未指定店家"
    );

    // Sync if initialStoreName changes when modal opens
    useEffect(() => {
        if (isOpen && initialStoreName && initialStoreName !== "all") {
            setCurrentStore(initialStoreName);
        } else if (isOpen && (!currentStore || !storeOptions.includes(currentStore))) {
            setCurrentStore(storeOptions[0] || "未指定店家");
        }
    }, [isOpen, initialStoreName, storeOptions]);

    // Items for the current store
    const storeItems = useMemo(() => {
        return allItems.filter((i) => (i.store || "未指定店家") === currentStore);
    }, [allItems, currentStore]);

    // Local state for editing quantities and prices in bulk: itemId -> { bought_quantity, unit_price }
    const [itemStates, setItemStates] = useState<
        Record<string, { bought_quantity: number; unit_price: number }>
    >({});

    const [isSaving, setIsSaving] = useState(false);

    // Initialize/reset item states when store items change
    useEffect(() => {
        const next: Record<string, { bought_quantity: number; unit_price: number }> = {};
        storeItems.forEach((item) => {
            const records = item.records || [];
            const currentBought = records.reduce((s, r) => s + (r.quantity || 0), 0);
            const currentPrice = records[0]?.price || 0;
            next[item.id] = {
                bought_quantity: currentBought,
                unit_price: currentPrice,
            };
        });
        setItemStates(next);
    }, [storeItems]);

    // Threshold & Currency for current store
    const threshold = storeThresholds[currentStore] || 5000;
    const currency =
        storeItems[0]?.currency || tripData?.settings_config?.localCurrency || "JPY";
    const currencySymbol = currency === "JPY" ? "¥" : currency === "KRW" ? "₩" : "$";

    // Calculate live subtotal for this store
    const totalAmount = useMemo(() => {
        return storeItems.reduce((acc, item) => {
            const st = itemStates[item.id];
            if (!st) return acc;
            return acc + Math.max(0, st.bought_quantity) * Math.max(0, st.unit_price);
        }, 0);
    }, [storeItems, itemStates]);

    const isQualified = totalAmount >= threshold;
    const amountDiff = Math.max(0, threshold - totalAmount);
    const progressPercent = Math.min(100, Math.round((totalAmount / threshold) * 100));

    // Handle Quantity Stepper
    const handleSetQuantity = (itemId: string, qty: number) => {
        const safe = Math.max(0, qty);
        setItemStates((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                bought_quantity: safe,
            },
        }));
    };

    // Handle Price Change
    const handleSetPrice = (itemId: string, price: number) => {
        const safe = Math.max(0, price);
        setItemStates((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                unit_price: safe,
            },
        }));
    };

    // Quick Action: Mark all items as fully bought (quantity = target_quantity)
    const handleMarkAllTarget = () => {
        setItemStates((prev) => {
            const next = { ...prev };
            storeItems.forEach((item) => {
                const target = item.target_quantity || 1;
                next[item.id] = {
                    ...next[item.id],
                    bought_quantity: target,
                };
            });
            return next;
        });
    };

    // Quick Action: Reset all items to 0
    const handleResetAllZero = () => {
        setItemStates((prev) => {
            const next = { ...prev };
            storeItems.forEach((item) => {
                next[item.id] = {
                    ...next[item.id],
                    bought_quantity: 0,
                };
            });
            return next;
        });
    };

    // Single Item "買齊" shortcut
    const handleItemQuickComplete = (item: ShoppingItemVM) => {
        const target = item.target_quantity || 1;
        handleSetQuantity(item.id, target);
    };

    // Text to speech for pronunciation
    const handleSpeak = (text: string, item: ShoppingItemVM) => {
        if (!("speechSynthesis" in window) || !text) return;
        window.speechSynthesis.cancel();
        const langKey = detectAutoLanguage(item, tripData);
        const speechLang =
            langKey === "ja"
                ? "ja-JP"
                : langKey === "ko"
                ? "ko-KR"
                : langKey === "th"
                ? "th-TH"
                : "en-US";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLang;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    // Save batch changes
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates: BatchItemUpdate[] = storeItems.map((item) => {
                const st = itemStates[item.id] || {
                    bought_quantity: 0,
                    unit_price: 0,
                };
                const target = item.target_quantity || 1;
                const isCompleted = target > 0 ? st.bought_quantity >= target : false;
                return {
                    id: item.id,
                    bought_quantity: st.bought_quantity,
                    unit_price: st.unit_price,
                    is_completed: isCompleted,
                };
            });

            await onSaveBatch(updates);
            onClose();
        } catch (err) {
            console.error("Failed to batch save", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div
                className="bg-card border border-border w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <ShoppingCart size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                                    同一店家快速記數
                                </h3>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                                    {storeItems.length} 項商品
                                </span>
                            </div>

                            {/* Store Switcher Dropdown */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Building2 size={12} className="text-muted-foreground shrink-0" />
                                {storeOptions.length > 1 ? (
                                    <div className="relative inline-block">
                                        <select
                                            value={currentStore}
                                            onChange={(e) => setCurrentStore(e.target.value)}
                                            className="text-xs font-bold text-foreground bg-background/80 border border-border/70 rounded-lg px-2 py-0.5 pr-6 cursor-pointer appearance-none outline-none hover:border-primary transition-colors"
                                        >
                                            {storeOptions.map((st) => (
                                                <option key={st} value={st}>
                                                    {st} ({allItems.filter((i) => (i.store || "未指定店家") === st).length}件)
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={12}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-muted-foreground truncate">
                                        {currentStore}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Sticky Tax-Free Progress & Fast Actions Ribbon */}
                <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-background border-b border-border/70 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Live Amount & Qualification */}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground">
                                    店內採買小計:
                                </span>
                                <span className="text-base sm:text-lg font-black font-mono text-foreground">
                                    {currencySymbol}{totalAmount.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                    / 目標 {currencySymbol}{threshold.toLocaleString()}
                                </span>

                                <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                        isQualified
                                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                    }`}
                                >
                                    {isQualified
                                        ? "🎉 已達免稅門檻"
                                        : `差 ${currencySymbol}${amountDiff.toLocaleString()} 免稅`}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-1.5 w-full sm:w-80 bg-muted/60 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 rounded-full ${
                                        isQualified
                                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                            : "bg-gradient-to-r from-amber-500 to-rose-400"
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Batch Quick Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                                type="button"
                                onClick={handleMarkAllTarget}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer"
                                title="將此店家所有商品購買數量設為目標數量"
                            >
                                <CheckCheck size={14} />
                                <span>一鍵全買齊</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleResetAllZero}
                                className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium rounded-xl border border-border/70 flex items-center gap-1 transition-all cursor-pointer"
                                title="將此店家所有商品購買數量歸零"
                            >
                                <RotateCcw size={13} />
                                <span>清空數量</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                    {storeItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Store className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">此店家尚無待買商品</p>
                        </div>
                    ) : (
                        storeItems.map((item) => {
                            const target = item.target_quantity || 1;
                            const st = itemStates[item.id] || {
                                bought_quantity: 0,
                                unit_price: 0,
                            };
                            const isItemFull = target > 0 && st.bought_quantity >= target;
                            const subtotal = st.bought_quantity * st.unit_price;

                            return (
                                <div
                                    key={item.id}
                                    className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                                        isItemFull
                                            ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10"
                                            : "bg-background/90 border-border/80 hover:border-border"
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        {/* Left Info */}
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            {/* Thumbnail / Emoji */}
                                            <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center shrink-0 overflow-hidden text-2xl">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{getCategoryEmoji(item.category)}</span>
                                                )}
                                            </div>

                                            {/* Name & Local Name */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {item.category && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                            {item.category}
                                                        </span>
                                                    )}
                                                    {(item.recipients?.length ? item.recipients : ["自己"]).map((rawR) => {
                                                        const r = resolveRecipient ? resolveRecipient(rawR, item) : rawR;
                                                        const color = getRecipientColorStyle(r);
                                                        return (
                                                            <span
                                                                key={r}
                                                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${color.bg}`}
                                                            >
                                                                {r}
                                                            </span>
                                                        );
                                                    })}
                                                    {item.target_specs && (
                                                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                                            <Tag size={10} />
                                                            {item.target_specs}
                                                        </span>
                                                    )}
                                                </div>

                                                <h4
                                                    className={`text-sm font-bold text-foreground truncate mt-0.5 ${
                                                        isItemFull ? "line-through text-muted-foreground" : ""
                                                    }`}
                                                >
                                                    {item.name}
                                                </h4>

                                                {item.local_name && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="text-xs font-semibold text-rose-500 truncate">
                                                            {item.local_name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSpeak(item.local_name!, item)}
                                                            className="text-muted-foreground hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                                                            title="發音"
                                                        >
                                                            <Volume2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Controls: Unit Price + Stepper + Quick Full */}
                                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                                            {/* Unit Price input */}
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    單價 ({currencySymbol})
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={st.unit_price || ""}
                                                    placeholder="0"
                                                    onChange={(e) =>
                                                        handleSetPrice(
                                                            item.id,
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                    className="w-20 px-2 py-1 text-xs font-mono font-bold bg-muted/40 border border-input rounded-lg text-right outline-none focus:border-primary"
                                                />
                                            </div>

                                            {/* Quantity Stepper */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-muted-foreground">
                                                    已買 / 目標 {target}
                                                </span>
                                                <div className="flex items-center border border-border/80 rounded-xl overflow-hidden bg-background">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSetQuantity(
                                                                item.id,
                                                                st.bought_quantity - 1
                                                            )
                                                        }
                                                        disabled={st.bought_quantity <= 0}
                                                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                                                    >
                                                        <Minus size={13} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={st.bought_quantity}
                                                        onChange={(e) =>
                                                            handleSetQuantity(
                                                                item.id,
                                                                parseInt(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-10 text-center text-xs font-mono font-bold bg-transparent outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSetQuantity(
                                                                item.id,
                                                                st.bought_quantity + 1
                                                            )
                                                        }
                                                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                                    >
                                                        <Plus size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quick "買齊" button */}
                                            <button
                                                type="button"
                                                onClick={() => handleItemQuickComplete(item)}
                                                className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer self-end ${
                                                    isItemFull
                                                        ? "bg-emerald-500 text-white border-emerald-500"
                                                        : "bg-muted hover:bg-muted/80 text-muted-foreground border-border/70"
                                                }`}
                                                title={`直接設為目標數量 ${target} 件`}
                                            >
                                                {isItemFull ? "✓ 齊" : "買齊"}
                                            </button>

                                            {/* Subtotal */}
                                            <div className="w-16 text-right hidden sm:block">
                                                <span className="text-[10px] text-muted-foreground block">
                                                    小計
                                                </span>
                                                <span className="text-xs font-mono font-bold text-foreground">
                                                    {currencySymbol}{subtotal.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-muted-foreground">
                        <span>目前小計: </span>
                        <span className="font-mono font-bold text-foreground text-sm">
                            {currencySymbol}{totalAmount.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                        >
                            取消
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || storeItems.length === 0}
                            className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {isSaving ? (
                                <span>儲存中...</span>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>儲存變更 ({storeItems.length}項)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreBatchBuyModal;
