import { useState, useEffect } from "react";
import { CheckSquare, Square, Plus, Trash2, RotateCcw, Check, X } from "lucide-react";
import {
    ChecklistItem,
    CHECKLIST_CATEGORIES,
    DEFAULT_CHECKLIST_ITEMS,
} from "../../models/types/ChecklistTypes";

type ChecklistModalProps = {
    tripId: string;
    onClose: () => void;
};

const ChecklistModal = ({ tripId, onClose }: ChecklistModalProps) => {
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

    const resetToDefault = () => {
        if (window.confirm("確定要重置行李清單回預設狀態嗎？")) {
            setItems(
                DEFAULT_CHECKLIST_ITEMS.map((item) => ({
                    ...item,
                    id: crypto.randomUUID(),
                }))
            );
        }
    };

    const completedCount = items.filter((i) => i.isCompleted).length;
    const progressPercent =
        items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
                className="bg-card text-card-foreground border border-border/80 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* 📱 iOS 原生導航列 */}
                <div className="px-4 py-3 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={resetToDefault}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer px-2 py-1"
                        title="重置清單"
                    >
                        <RotateCcw size={13} />
                        <span className="hidden sm:inline">重置</span>
                    </button>

                    <div className="text-center min-w-0">
                        <h2 className="font-black text-sm text-foreground tracking-tight">
                            🧳 行前行李打包清單
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-mono">
                            已完成 {completedCount} / {items.length} 項 ({progressPercent}%)
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                        完成
                    </button>
                </div>

                {/* 進度條 */}
                <div className="w-full bg-muted/60 h-1.5 shrink-0">
                    <div
                        className="bg-emerald-500 h-1.5 transition-all duration-300 rounded-r-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* 新增項目表單 (iOS Input Row) */}
                <form
                    onSubmit={addItem}
                    className="p-3 border-b border-border/60 bg-muted/20 flex gap-2 flex-wrap sm:flex-nowrap shrink-0"
                >
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as any)}
                        className="bg-card border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none shrink-0 cursor-pointer font-medium"
                    >
                        {CHECKLIST_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id} className="bg-background text-foreground">
                                {cat.icon} {cat.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="新增自訂打包項目 (例: 隱形眼鏡 / 腳架)"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="flex-1 bg-card border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
                    />
                    <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                        <Plus size={13} />
                        <span>新增</span>
                    </button>
                </form>

                {/* 分類群組清單 (Inset Grouped List) */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 no-scrollbar">
                    {CHECKLIST_CATEGORIES.map((cat) => {
                        const catItems = items.filter((i) => i.category === cat.id);
                        if (catItems.length === 0) return null;

                        return (
                            <div key={cat.id} className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span className="text-[10px] font-normal text-muted-foreground/70">
                                        ({catItems.filter((i) => i.isCompleted).length}/{catItems.length})
                                    </span>
                                </span>

                                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                                    {catItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className={`flex items-center justify-between p-3 transition-colors cursor-pointer select-none ${
                                                item.isCompleted
                                                    ? "bg-muted/10 text-muted-foreground"
                                                    : "bg-card text-foreground hover:bg-muted/20"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                        item.isCompleted
                                                            ? "bg-emerald-500 text-white"
                                                            : "border-2 border-border/80 bg-background"
                                                    }`}
                                                >
                                                    {item.isCompleted && <Check size={13} className="stroke-[3]" />}
                                                </div>
                                                <span
                                                    className={`text-xs font-medium truncate ${
                                                        item.isCompleted ? "line-through opacity-60" : ""
                                                    }`}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteItem(item.id);
                                                }}
                                                className="text-muted-foreground/40 hover:text-rose-500 p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                                                title="刪除"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ChecklistModal;
