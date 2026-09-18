import React from "react";
import { X, Users, CheckCircle2, CircleDashed, Gift } from "lucide-react";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";
import { getRecipientColorStyle } from "../../models/types/ShoppingTypes";
import { getCurrencySymbol } from "../../utils/CurrencyUtil";

type RecipientSummaryModalProps = {
    items: ShoppingItemVM[];
    resolveRecipient?: (rec: string, item: ShoppingItemVM) => string;
    tripData?: TripVM | null;
    onClose: () => void;
};

const RecipientSummaryModal = ({
    items,
    resolveRecipient,
    tripData,
    onClose,
}: RecipientSummaryModalProps) => {
    const localCurrency = tripData?.settings_config?.localCurrency || "JPY";
    const homeCurrency = tripData?.settings_config?.homeCurrency || "TWD";
    const exchangeRate = tripData?.settings_config?.exchangeRate ?? 0.215;
    const localSymbol = getCurrencySymbol(localCurrency);
    const homeSymbol = getCurrencySymbol(homeCurrency);
    // Group items by recipient
    const recipientMap = new Map<
        string,
        { items: ShoppingItemVM[]; totalAmount: number; completedCount: number }
    >();

    items.forEach((item) => {
        const rawRecs = item.recipients?.length ? item.recipients : ["自己"];
        const recipients = rawRecs.map((r) =>
            resolveRecipient ? resolveRecipient(r, item) : r
        );
        // Calculate unit cost for this item
        let itemUnitCost = 0;
        if (item.records && item.records.length > 0) {
            const sum = item.records.reduce(
                (s, r) => s + (r.price || 0) * (r.quantity || 0),
                0
            );
            const qty = item.records.reduce((s, r) => s + (r.quantity || 0), 0);
            itemUnitCost = qty > 0 ? sum / qty : 0;
        }

        recipients.forEach((rec) => {
            const existing = recipientMap.get(rec) || {
                items: [],
                totalAmount: 0,
                completedCount: 0,
            };
            existing.items.push(item);
            existing.totalAmount += Math.round(itemUnitCost);
            if (item.is_completed) existing.completedCount += 1;
            recipientMap.set(rec, existing);
        });
    });

    const recipientEntries = Array.from(recipientMap.entries());

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-sans"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground border border-border/80 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <Gift size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                                送禮與代購對象清單
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                共 {recipientEntries.length} 位親友同事，拆箱發禮物不漏勾
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Recipient Groups */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                    {recipientEntries.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            目前尚未標記任何送禮或代購對象
                        </div>
                    ) : (
                        recipientEntries.map(([recipient, data]) => {
                            const colorStyle = getRecipientColorStyle(recipient);
                            const isAllDone =
                                data.completedCount === data.items.length &&
                                data.items.length > 0;

                            return (
                                <div
                                    key={recipient}
                                    className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs"
                                >
                                    {/* Group header */}
                                    <div className="p-3.5 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorStyle.bg}`}
                                            >
                                                {recipient}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground font-mono">
                                                {data.completedCount} / {data.items.length} 件已購
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs font-black font-mono text-foreground">
                                                約 {localSymbol} {data.totalAmount.toLocaleString()}
                                            </div>
                                            {exchangeRate > 0 && localCurrency !== homeCurrency && (
                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                    (約 {homeSymbol} {Math.round(data.totalAmount * exchangeRate).toLocaleString()})
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="divide-y divide-border/40">
                                        {data.items.map((it) => (
                                            <div
                                                key={it.id}
                                                className="p-2.5 px-3.5 flex items-center justify-between text-xs hover:bg-muted/15 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    {it.is_completed ? (
                                                        <CheckCircle2
                                                            size={14}
                                                            className="text-emerald-500 shrink-0"
                                                        />
                                                    ) : (
                                                        <CircleDashed
                                                            size={14}
                                                            className="text-muted-foreground shrink-0"
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <div
                                                            className={`font-medium truncate ${
                                                                it.is_completed
                                                                    ? "line-through text-muted-foreground"
                                                                    : "text-foreground"
                                                        }`}
                                                        >
                                                            {it.name}
                                                        </div>
                                                        {it.target_specs && (
                                                            <div className="text-[10px] text-muted-foreground truncate">
                                                                {it.target_specs}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono shrink-0">
                                                    {it.store || "未指定店家"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/70 bg-muted/10 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-5 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipientSummaryModal;
