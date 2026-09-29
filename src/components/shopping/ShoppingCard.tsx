import React, { useState } from "react";
import {
    Check,
    Store,
    Sparkles,
    Calculator,
    Edit3,
    Trash2,
    Tag,
    ArrowUpRight,
    Plus,
    Minus,
    User,
    Wallet,
    Volume2,
} from "lucide-react";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";
import {
    getCategoryEmoji,
    getRecipientColorStyle,
} from "../../models/types/ShoppingTypes";
import { detectAutoLanguage } from "./ClerkShowModal";
import { getCurrencySymbol } from "../../utils/CurrencyUtil";
import { GlassCard } from "../ui";

export type ShoppingCardProps = {
    item: ShoppingItemVM;
    tripData?: TripVM | null;
    creatorLabel?: string | null;
    resolveRecipient?: (rec: string) => string;
    onToggleComplete: (item: ShoppingItemVM, isCompleted: boolean) => void;
    onUpdateBoughtQty?: (item: ShoppingItemVM, newQty: number) => void;
    onShowToClerk: (item: ShoppingItemVM) => void;
    onOpenPriceCompare: (item: ShoppingItemVM) => void;
    onEdit: (item: ShoppingItemVM) => void;
    onDelete: (item: ShoppingItemVM) => void;
    onExportToBudget?: (item: ShoppingItemVM) => void;
    onViewPlace?: (placeId: string) => void;
};

const ShoppingCard: React.FC<ShoppingCardProps> = ({
    item,
    tripData,
    creatorLabel,
    resolveRecipient,
    onToggleComplete,
    onUpdateBoughtQty,
    onShowToClerk,
    onOpenPriceCompare,
    onEdit,
    onDelete,
    onExportToBudget,
    onViewPlace,
}) => {
    const [imgFailed, setImgFailed] = useState(false);

    // Quantity calculations
    const targetQty = item.target_quantity || 1;
    const records = item.records || [];
    const boughtQty = records.reduce((s, r) => s + (r.quantity || 0), 0);
    const totalAmount = records.reduce(
        (s, r) => s + (r.price || 0) * (r.quantity || 0),
        0
    );
    const averagePrice = boughtQty > 0 ? Math.round(totalAmount / boughtQty) : 0;
    const lowestPrice =
        records.length > 0 ? Math.min(...records.map((r) => r.price)) : null;

    // Currency and conversion calculations
    const itemCurrency =
        item.currency || tripData?.settings_config?.localCurrency || "JPY";
    const localSymbol = getCurrencySymbol(itemCurrency);
    const homeCurrency = tripData?.settings_config?.homeCurrency || "TWD";
    const homeSymbol = getCurrencySymbol(homeCurrency);
    const exchangeRate = tripData?.settings_config?.exchangeRate || 0;

    // Display bought quantity and completion status
    const displayBought =
        boughtQty > 0 ? boughtQty : item.is_completed ? targetQty : 0;
    const isFullyBought =
        Boolean(item.is_completed) || (targetQty > 0 && displayBought >= targetQty);
    const progressPercent = Math.min(
        100,
        Math.round((displayBought / targetQty) * 100)
    );

    const handleSpeakName = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const langKey = detectAutoLanguage(item, tripData);
            const speechLang =
                langKey === "ja"
                    ? "ja-JP"
                    : langKey === "ko"
                    ? "ko-KR"
                    : langKey === "th"
                    ? "th-TH"
                    : langKey === "vi"
                    ? "vi-VN"
                    : langKey === "fr"
                    ? "fr-FR"
                    : "en-US";
            const utterance = new SpeechSynthesisUtterance(
                item.local_name || item.name
            );
            utterance.lang = speechLang;
            utterance.rate = 0.88;
            window.speechSynthesis.speak(utterance);
        }
    };

    const rawRecipients = item.recipients?.length ? item.recipients : ["自己"];
    const recipients = rawRecipients.map((r) =>
        resolveRecipient ? resolveRecipient(r) : r
    );
    const allocations = item.recipient_allocations || {};

    return (
        <GlassCard
            variant={isFullyBought ? "subtle" : "elevated"}
            rounded="3xl"
            padding="none"
            className={`group transition-all duration-300 flex flex-col justify-between ${
                isFullyBought
                    ? "opacity-80 border-emerald-500/30 dark:border-emerald-500/20"
                    : "hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5"
            }`}
        >
            {/* Top row: Image & Main Info */}
            <div className="p-4 sm:p-5 flex gap-4 min-w-0">
                {/* Product Image with Fallback & Depth */}
                <div
                    onClick={() => onShowToClerk(item)}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 flex items-center justify-center cursor-pointer group/img transition-all duration-300 shadow-inner"
                    title="點擊向店員全螢幕展示大圖與外文品名"
                >
                    {item.image_url && !imgFailed ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className={`w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110 ${
                                isFullyBought ? "grayscale-20" : ""
                            }`}
                            onError={() => setImgFailed(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-blue-500/10 p-2 text-center">
                            <span className="text-3xl sm:text-4xl drop-shadow-xs mb-0.5 transition-transform group-hover/img:scale-110">
                                {getCategoryEmoji(item.category)}
                            </span>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold line-clamp-1">
                                {item.name.slice(0, 5)}
                            </span>
                        </div>
                    )}

                    {/* Quick clerk mode overlay badge */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold backdrop-blur-xs">
                        問店員
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        {/* Store & Completed Checkbox */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                                {item.store && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (item.place_id && onViewPlace) {
                                                onViewPlace(item.place_id);
                                            }
                                        }}
                                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border truncate transition-colors ${
                                            item.place_id
                                                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer"
                                                : "bg-white/40 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 border-white/20 dark:border-white/10"
                                        }`}
                                    >
                                        <Store size={11} className="shrink-0" />
                                        <span className="truncate">{item.store}</span>
                                        {item.place_id && <ArrowUpRight size={10} />}
                                    </button>
                                )}

                                {creatorLabel && (
                                    <span
                                        className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/40 dark:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400 border border-white/20 dark:border-white/10 shrink-0"
                                        title={creatorLabel}
                                    >
                                        <User size={10} className="shrink-0 text-neutral-500" />
                                        <span className="max-w-[85px] truncate">{creatorLabel}</span>
                                    </span>
                                )}
                            </div>

                            {/* Completed Checkbox */}
                            <button
                                type="button"
                                onClick={() => onToggleComplete(item, !isFullyBought)}
                                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                                    isFullyBought
                                        ? "bg-emerald-500 text-white shadow-emerald-500/30 shadow-md ring-2 ring-emerald-500/20"
                                        : "border border-white/40 dark:border-white/20 hover:border-primary bg-white/60 dark:bg-neutral-900/60"
                                }`}
                                title={isFullyBought ? "點擊取消勾選 (退回未購)" : "點擊標記為全部已購"}
                            >
                                {isFullyBought && (
                                    <Check size={15} className="stroke-[3] animate-in zoom-in-75 duration-200" />
                                )}
                            </button>
                        </div>

                        {/* Local Native Name with Pronunciation */}
                        {item.local_name && (
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                    className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 truncate cursor-pointer hover:underline"
                                    onClick={() => onShowToClerk(item)}
                                    title="點擊向店員展示"
                                >
                                    {item.local_name}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSpeakName}
                                    className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                                    title="播放當地發音"
                                >
                                    <Volume2 size={12} />
                                </button>
                            </div>
                        )}

                        {/* Main Product Name */}
                        <h4
                            className={`text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 ${
                                isFullyBought ? "line-through text-neutral-400 dark:text-neutral-500" : ""
                            }`}
                        >
                            {item.name}
                        </h4>

                        {/* Target Specs */}
                        {item.target_specs && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                                <Tag size={11} className="shrink-0 text-amber-500" />
                                <span className="truncate font-medium">{item.target_specs}</span>
                            </div>
                        )}
                    </div>

                    {/* Quantities & Price Progress Bar */}
                    <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                                    已購：{displayBought} / {targetQty} 件
                                </span>
                                {isFullyBought && (
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded-full font-sans">
                                        ✓ 已購足
                                    </span>
                                )}
                            </div>
                            {lowestPrice !== null && (
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                        {localSymbol}{lowestPrice.toLocaleString()}
                                        {records.length > 1 && (
                                            <span className="text-[10px] text-neutral-400 font-normal ml-1">
                                                (均 {localSymbol}{averagePrice})
                                            </span>
                                        )}
                                    </span>
                                    {exchangeRate > 0 &&
                                        itemCurrency.toUpperCase() !==
                                            homeCurrency.toUpperCase() && (
                                            <span className="text-[10px] font-mono text-neutral-400">
                                                ≈ {homeSymbol}
                                                {Math.round(
                                                    lowestPrice * exchangeRate
                                                ).toLocaleString()}
                                            </span>
                                        )}
                                </div>
                            )}
                        </div>

                        {/* Progress meter */}
                        <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                    isFullyBought ? "bg-emerald-500" : "bg-primary"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Recipient Color Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                            {recipients.map((rec) => {
                                const style = getRecipientColorStyle(rec);
                                const q = allocations[rec] || allocations["自己"];
                                return (
                                    <span
                                        key={rec}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} shrink-0 flex items-center gap-1`}
                                    >
                                        <span>{rec}</span>
                                        {q && q > 1 && (
                                            <span className="font-mono text-[9px] opacity-85">
                                                ×{q}
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-3.5 sm:px-4 py-2.5 bg-white/30 dark:bg-black/20 border-t border-white/20 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                {/* Row 1 on mobile: Store Clerk & Price Compare */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        type="button"
                        onClick={() => onShowToClerk(item)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                        title="全螢幕展示大圖與原文品名給店員看"
                    >
                        <Sparkles size={13} className="shrink-0" />
                        <span>問店員</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenPriceCompare(item)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-white/50 dark:bg-neutral-800/50 border border-white/30 dark:border-white/10 hover:bg-white text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                        title="門市報價與比價明細"
                    >
                        <Calculator size={13} className="shrink-0" />
                        <span>比價 ({records.length})</span>
                    </button>
                </div>

                {/* Row 2 on mobile: Stepper & Management Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-white/20 dark:border-white/10 sm:border-t-0 pt-2 sm:pt-0">
                    {/* Flexible In-Store Bought Stepper */}
                    {onUpdateBoughtQty && (
                        <div className="flex items-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-0.5 text-emerald-700 dark:text-emerald-300">
                            <button
                                type="button"
                                disabled={displayBought <= 0}
                                onClick={() => onUpdateBoughtQty(item, Math.max(0, displayBought - 1))}
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-emerald-500/20 disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors"
                                title={displayBought > 0 ? "點錯退回：已購件數 -1" : "尚未購買"}
                            >
                                <Minus size={12} />
                            </button>
                            <span
                                className="px-2 text-xs font-bold font-mono min-w-[34px] text-center"
                                title={`已購 ${displayBought} 件 / 目標 ${targetQty} 件`}
                            >
                                {displayBought}件
                            </span>
                            <button
                                type="button"
                                onClick={() => onUpdateBoughtQty(item, displayBought + 1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-emerald-500/20 cursor-pointer transition-colors"
                                title="累計 +1 件已購"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    )}

                    {/* Right Action: Edit & Delete & Export to Budget */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        {onExportToBudget && (
                            <button
                                type="button"
                                onClick={() => onExportToBudget(item)}
                                className="p-1.5 sm:p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                title="轉入記帳本"
                            >
                                <Wallet size={15} />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 transition-colors cursor-pointer"
                            title="編輯商品"
                        >
                            <Edit3 size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="刪除"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default ShoppingCard;
