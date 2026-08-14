import { useState, useEffect } from "react";
import { CheckSquare, Square, Plus, Trash2, RotateCcw } from "lucide-react";
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-[Noto_Sans_TC]">
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🧳</span>
                        <div>
                            <h2 className="font-bold text-lg text-foreground">行前行李打包清單</h2>
                            <p className="text-xs text-muted-foreground">
                                離線快取儲存 • 已完成 {completedCount} / {items.length} 項 ({progressPercent}%)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={resetToDefault}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                            title="重置清單"
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors text-lg"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-accent/40 h-2">
                    <div
                        className="bg-emerald-500 h-2 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Add Form */}
                <form onSubmit={addItem} className="p-3 border-b border-border bg-accent/20 flex gap-2 flex-wrap sm:flex-nowrap">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as any)}
                        className="bg-background border border-input rounded-lg px-2 py-1.5 text-xs text-foreground outline-none shrink-0"
                    >
                        {CHECKLIST_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="新增自訂打包項目 (例如: 隱形眼鏡 / 腳架)"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="flex-1 bg-background border border-input rounded-lg px-3 py-1.5 text-xs text-foreground outline-none"
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shrink-0 hover:opacity-90"
                    >
                        <Plus size={14} /> 新增
                    </button>
                </form>

                {/* Items List grouped by Category */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {CHECKLIST_CATEGORIES.map((cat) => {
                        const catItems = items.filter((i) => i.category === cat.id);
                        if (catItems.length === 0) return null;

                        return (
                            <div key={cat.id} className="space-y-1.5">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 border-b border-border/40 pb-1">
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                        ({catItems.filter((i) => i.isCompleted).length}/{catItems.length})
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {catItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                                item.isCompleted
                                                    ? "bg-accent/20 border-border/40 text-muted-foreground line-through"
                                                    : "bg-card border-border/80 text-foreground hover:border-primary/50 shadow-2xs"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                {item.isCompleted ? (
                                                    <CheckSquare size={16} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <Square size={16} className="text-muted-foreground shrink-0" />
                                                )}
                                                <span className="text-xs font-medium truncate">{item.title}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteItem(item.id);
                                                }}
                                                className="text-muted-foreground/60 hover:text-destructive p-1 rounded transition-colors"
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
        </div>
    );
};

export default ChecklistModal;
