import { useState, useEffect } from "react";
import { CheckSquare, Square, Plus, Trash2, RotateCcw, Luggage, ChevronUp, ChevronDown } from "lucide-react";
import {
    ChecklistItem,
    CHECKLIST_CATEGORIES,
    DEFAULT_CHECKLIST_ITEMS,
} from "../../models/types/ChecklistTypes";
import DeleteModal from "../common/DeleteModal";

type ChecklistSectionProps = {
    tripId: string;
    isEditing?: boolean;
    isPrinting?: boolean;
};

const ChecklistSection = ({ tripId, isEditing, isPrinting }: ChecklistSectionProps) => {
    const storageKey = `travel_checklist_${tripId}`;

    const [items, setItems] = useState<ChecklistItem[]>(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
        return DEFAULT_CHECKLIST_ITEMS.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
        }));
    });

    const [newItemTitle, setNewItemTitle] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ChecklistItem["category"]>("documents");
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }, [items, storageKey]);

    const toggleItem = (id: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
            )
        );
    };

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            category: selectedCategory,
            title: newItemTitle.trim(),
            isCompleted: false,
        };
        setItems((prev) => [...prev, newItem]);
        setNewItemTitle("");
    };

    const deleteItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleConfirmReset = () => {
        setItems(
            DEFAULT_CHECKLIST_ITEMS.map((item) => ({
                ...item,
                id: crypto.randomUUID(),
            }))
        );
        setIsResetModalOpen(false);
    };

    const completedCount = items.filter((i) => i.isCompleted).length;
    const progressPercent =
        items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return (
        <div
            className={
                isPrinting
                    ? "bg-transparent mb-8 font-[Noto_Sans_TC]"
                    : "bg-white/95 dark:bg-neutral-900/90 liquid-glass-elevated rounded-3xl p-5 md:p-6 border border-slate-200/90 dark:border-white/10 shadow-lg relative transition-all font-[Noto_Sans_TC]"
            }
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between select-none ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : `${isOpen ? "mb-4" : "mb-0"} cursor-pointer group`
                }`}
                onClick={() => !isPrinting && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2.5">
                    {isPrinting ? (
                        <span className="text-3xl font-black text-gray-400 leading-none mr-2">
                            04
                        </span>
                    ) : (
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <Luggage size={17} />
                        </div>
                    )}
                    <div>
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting
                                    ? "text-xl text-black"
                                    : "text-sm text-foreground flex items-center gap-2"
                            }`}
                        >
                            <span>行李打包清單</span>
                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                CHECKLIST
                            </span>
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPrinting && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsResetModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 cursor-pointer shadow-xs"
                            title="重置為預設"
                        >
                            <RotateCcw size={13} />
                            <span className="hidden sm:inline">重置預設</span>
                        </button>
                    )}
                    {!isPrinting && (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-transform duration-200"
                        >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {(isOpen || isPrinting) && (
                <div className="space-y-4 pt-1">
                    {/* Progress bar */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200/90 dark:border-neutral-700/80 shadow-xs backdrop-blur-md">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">完成進度</span>
                            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {completedCount} / {items.length} ({progressPercent}%)
                            </span>
                        </div>
                        <div className="w-full bg-slate-200/80 dark:bg-neutral-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300/60 dark:border-neutral-700">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full shadow-xs"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Add Form */}
                    {!isPrinting && (
                        <form onSubmit={addItem} className="flex gap-2 flex-wrap sm:flex-nowrap pt-1">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as any)}
                                className="bg-white dark:bg-neutral-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none shrink-0 border border-slate-300 dark:border-neutral-700 font-semibold shadow-xs focus:border-blue-500 cursor-pointer"
                            >
                                {CHECKLIST_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="新增打包項目 (如: 護照、隱形眼鏡、充電線)..."
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                className="flex-1 bg-white dark:bg-neutral-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none border border-slate-300 dark:border-neutral-700 placeholder:text-slate-400 dark:placeholder:text-neutral-500 shadow-xs focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm cursor-pointer"
                            >
                                <Plus size={14} /> 新增
                            </button>
                        </form>
                    )}

                    {/* Category Groups */}
                    <div className="space-y-4 pt-1">
                        {CHECKLIST_CATEGORIES.map((cat) => {
                            const catItems = items.filter((i) => i.category === cat.id);
                            if (catItems.length === 0) return null;

                            return (
                                <div key={cat.id} className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-neutral-200 uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-neutral-800 pb-1.5">
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono font-medium">
                                            ({catItems.filter((i) => i.isCompleted).length}/{catItems.length})
                                        </span>
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {catItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleItem(item.id)}
                                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                                    item.isCompleted
                                                        ? "bg-emerald-500/[0.08] dark:bg-emerald-500/10 border-emerald-500/25 text-slate-500 dark:text-neutral-400"
                                                        : "bg-white dark:bg-neutral-800 border border-slate-200/90 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 hover:border-blue-400 hover:shadow-xs shadow-xs"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    {item.isCompleted ? (
                                                        <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                    ) : (
                                                        <Square size={16} className="text-slate-400 dark:text-neutral-500 shrink-0" />
                                                    )}
                                                    <span className={`text-xs truncate ${item.isCompleted ? "line-through text-slate-400 dark:text-neutral-500" : "font-semibold text-slate-900 dark:text-neutral-100"}`}>
                                                        {item.title}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteItem(item.id);
                                                    }}
                                                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isResetModalOpen && (
                <DeleteModal
                    title="重置為預設清單"
                    description="確定要將行李打包清單重置為系統預設項目嗎？自訂新增的項目將會被移除。"
                    confirmText="確認重置"
                    onCloseClick={() => setIsResetModalOpen(false)}
                    onConfirmClick={handleConfirmReset}
                />
            )}
        </div>
    );
};

export default ChecklistSection;
