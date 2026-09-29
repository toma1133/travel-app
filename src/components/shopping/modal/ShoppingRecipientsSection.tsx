import React from "react";
import { Users, User, Check, Plus, Trash2, X } from "lucide-react";
import { COMMON_RECIPIENTS } from "./useShoppingItemForm";

export interface ShoppingRecipientsSectionProps {
    recipients: string[];
    recipientAllocations: Record<string, number>;
    customTagList: string[];
    newRecipientInput: string;
    tripMemberOptions: { name: string; isMe: boolean }[];
    onNewRecipientInputChange: (val: string) => void;
    onAddRecipientSafely: (val: string) => void;
    onToggleRecipient: (tag: string) => void;
    onDeleteCustomTag: (tag: string) => void;
    onRemoveRecipient: (tag: string) => void;
    onUpdateRecipientQty: (tag: string, delta: number) => void;
}

export const ShoppingRecipientsSection: React.FC<ShoppingRecipientsSectionProps> = ({
    recipients,
    recipientAllocations,
    customTagList,
    newRecipientInput,
    tripMemberOptions,
    onNewRecipientInputChange,
    onAddRecipientSafely,
    onToggleRecipient,
    onDeleteCustomTag,
    onRemoveRecipient,
    onUpdateRecipientQty,
}) => {
    return (
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/40 dark:bg-black/25 border border-white/20 dark:border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                    <Users size={13} className="text-primary" />
                    <span>送禮 / 代購對象與分配數量</span>
                </label>
                <span className="text-[10px] text-neutral-500">
                    點選勾選，可指派每人購買件數
                </span>
            </div>

            {/* 成員與常見親友標籤 */}
            <div className="space-y-2">
                {/* 旅伴成員 */}
                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <Users size={11} className="text-primary" />
                        <span>旅伴成員</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {tripMemberOptions.map((m) => {
                            const isChecked = recipients.includes(m.name);
                            return (
                                <button
                                    key={m.name}
                                    type="button"
                                    onClick={() => onToggleRecipient(m.name)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1 ${
                                        isChecked
                                            ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                            : "bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-white/30 dark:border-white/10 hover:bg-white/90"
                                    }`}
                                >
                                    {isChecked ? (
                                        <Check size={12} />
                                    ) : (
                                        <User size={11} className="opacity-70" />
                                    )}
                                    <span>
                                        {m.name}
                                        {m.isMe ? " (我)" : ""}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 親友 / 自訂 */}
                <div className="space-y-1 pt-1 border-t border-white/20 dark:border-white/10">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                        親友 / 其他
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {COMMON_RECIPIENTS.map((rec) => {
                            const isChecked = recipients.includes(rec);
                            return (
                                <button
                                    key={rec}
                                    type="button"
                                    onClick={() => onToggleRecipient(rec)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1 ${
                                        isChecked
                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-2xs"
                                            : "bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-white/30 dark:border-white/10 hover:bg-white/90"
                                    }`}
                                >
                                    {isChecked && <Check size={12} />}
                                    <span>{rec}</span>
                                </button>
                            );
                        })}

                        {/* 自訂對象標籤 */}
                        {customTagList.map((customRec) => {
                            const isChecked = recipients.includes(customRec);
                            return (
                                <div
                                    key={customRec}
                                    className={`inline-flex items-center rounded-full text-xs font-semibold transition-all border shadow-2xs pl-3 pr-1 py-0.5 gap-1 ${
                                        isChecked
                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                                            : "bg-white/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-white/30 dark:border-white/10 hover:bg-white/90"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onToggleRecipient(customRec)}
                                        className="flex items-center gap-1 cursor-pointer py-0.5"
                                    >
                                        {isChecked && <Check size={12} />}
                                        <span>{customRec}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCustomTag(customRec);
                                        }}
                                        className={`w-4 h-4 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                                            isChecked
                                                ? "text-white/70 hover:text-white dark:text-black/70 hover:bg-white/20"
                                                : "text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10"
                                        }`}
                                        title={`刪除自訂對象「${customRec}」`}
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 自訂受贈人快速輸入 */}
            <div className="flex gap-2 pt-1">
                <input
                    type="text"
                    placeholder="新增自訂受贈人 (輸入後按 Enter 即可)..."
                    value={newRecipientInput}
                    onChange={(e) => onNewRecipientInputChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onAddRecipientSafely(newRecipientInput);
                            onNewRecipientInputChange("");
                        }
                    }}
                    onBlur={() => {
                        if (newRecipientInput.trim()) {
                            onAddRecipientSafely(newRecipientInput);
                            onNewRecipientInputChange("");
                        }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white/70 dark:bg-neutral-900/60 border border-white/30 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs focus:ring-2 focus:ring-primary/40"
                />
                <button
                    type="button"
                    onClick={() => {
                        onAddRecipientSafely(newRecipientInput);
                        onNewRecipientInputChange("");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-transparent text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1 cursor-pointer transition-opacity"
                >
                    <Plus size={13} />
                    <span>加入</span>
                </button>
            </div>

            {/* 各對象配額步進器 */}
            {recipients.length > 0 && (
                <div className="space-y-1.5 pt-1.5">
                    <div className="text-[11px] font-semibold text-neutral-500">
                        各對象分配件數：
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {recipients.map((rec) => {
                            const qty = recipientAllocations[rec] || 1;
                            return (
                                <div
                                    key={rec}
                                    className="p-2 rounded-xl bg-white/60 dark:bg-neutral-900/40 border border-white/25 dark:border-white/10 flex items-center justify-between gap-1 shadow-2xs"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <button
                                            type="button"
                                            onClick={() => onRemoveRecipient(rec)}
                                            className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                                            title="移除此受贈人"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <span className="font-semibold text-xs truncate text-neutral-800 dark:text-neutral-200">
                                            {rec}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateRecipientQty(rec, -1)}
                                            className="w-5 h-5 rounded border border-white/30 dark:border-white/15 bg-white/50 dark:bg-neutral-800/50 flex items-center justify-center hover:bg-white text-xs font-bold cursor-pointer"
                                        >
                                            -
                                        </button>
                                        <span className="font-mono text-xs font-bold w-5 text-center text-neutral-900 dark:text-neutral-100">
                                            {qty}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateRecipientQty(rec, 1)}
                                            className="w-5 h-5 rounded border border-white/30 dark:border-white/15 bg-white/50 dark:bg-neutral-800/50 flex items-center justify-center hover:bg-white text-xs font-bold cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
