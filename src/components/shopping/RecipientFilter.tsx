import React from "react";
import { Users, Gift } from "lucide-react";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import { getRecipientColorStyle } from "../../models/types/ShoppingTypes";

type RecipientFilterProps = {
    items: ShoppingItemVM[];
    selectedRecipient: string;
    resolveRecipient?: (rec: string, item: ShoppingItemVM) => string;
    onSelectRecipient: (recipient: string) => void;
    onOpenSummary: () => void;
};

const RecipientFilter = ({
    items,
    selectedRecipient,
    resolveRecipient,
    onSelectRecipient,
    onOpenSummary,
}: RecipientFilterProps) => {
    // Extract unique recipients with counts
    const recipientCounts = new Map<string, number>();
    items.forEach((item) => {
        const rawRecs = item.recipients?.length ? item.recipients : ["自己"];
        const recipients = rawRecs.map((r) =>
            resolveRecipient ? resolveRecipient(r, item) : r
        );
        recipients.forEach((r) => {
            recipientCounts.set(r, (recipientCounts.get(r) || 0) + 1);
        });
    });

    const uniqueRecipients = Array.from(recipientCounts.entries());

    if (uniqueRecipients.length === 0) return null;

    return (
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 pr-1">
                    <Users size={12} />
                    <span>對象：</span>
                </span>

                <button
                    type="button"
                    onClick={() => onSelectRecipient("all")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedRecipient === "all"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-card text-muted-foreground hover:text-foreground border border-border/70"
                    }`}
                >
                    全部 ({items.length})
                </button>

                {uniqueRecipients.map(([recipient, count]) => {
                    const isSelected = selectedRecipient === recipient;
                    const colorStyle = getRecipientColorStyle(recipient);

                    return (
                        <button
                            key={recipient}
                            type="button"
                            onClick={() => onSelectRecipient(recipient)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                                isSelected
                                    ? "bg-foreground text-background border-foreground shadow-xs"
                                    : `${colorStyle.bg} hover:opacity-80`
                            }`}
                        >
                            <span>{recipient}</span>
                            <span className="text-[10px] opacity-75">({count})</span>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={onOpenSummary}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                title="查看每位親友的採購彙總清單"
            >
                <Gift size={13} />
                <span>分送彙總</span>
            </button>
        </div>
    );
};

export default RecipientFilter;
