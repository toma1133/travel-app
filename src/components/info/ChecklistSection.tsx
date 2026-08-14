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
                    : "bg-card p-5 rounded-xl shadow-sm relative transition-all font-[Noto_Sans_TC]"
            }
        >
            {/* Header matching FlightList style */}
            <div
                className={`flex items-center justify-between select-none ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : `${isOpen ? "mb-4" : "mb-0"} text-[#8E354A] cursor-pointer`
                }`}
                onClick={() => !isPrinting && setIsOpen(!isOpen)}
            >
                <div className="flex items-baseline gap-3">
                    {isPrinting && (
                        <span className="text-3xl font-black text-gray-400 leading-none">
                            04
                        </span>
                    )}
                    <div className="flex items-center">
                        {!isPrinting && <Luggage size={18} className="mr-2" />}
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting ? "text-xl text-black" : "text-sm"
                            }`}
                        >
                            Packing Checklist
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
                            className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 text-xs"
                            title="重置為預設"
                        >
                            <RotateCcw size={14} />
                            <span className="hidden sm:inline">重置</span>
                        </button>
                    )}
                    {!isPrinting && (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-1 transition-transform duration-200"
                        >
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {(isOpen || isPrinting) && (
                <div className="space-y-4 pt-1">
                    {/* Progress bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>完成進度</span>
                            <span className="font-mono font-semibold">{completedCount} / {items.length} ({progressPercent}%)</span>
                        </div>
                        <div className="w-full bg-accent/40 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-2 transition-all duration-300 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Add Form */}
                    {!isPrinting && (
                        <form onSubmit={addItem} className="flex gap-2 flex-wrap sm:flex-nowrap">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as any)}
                                className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground outline-none shrink-0"
                            >
                                {CHECKLIST_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="新增自訂打包項目 (如: 護木油 / 隱形眼鏡)"
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shrink-0 hover:opacity-90 transition-opacity"
                            >
                                <Plus size={14} /> 新增
                            </button>
                        </form>
                    )}

            {/* Category Groups */}
            <div className="space-y-4 pt-2">
                {CHECKLIST_CATEGORIES.map((cat) => {
                    const catItems = items.filter((i) => i.category === cat.id);
                    if (catItems.length === 0) return null;

                    return (
                        <div key={cat.id} className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 border-b border-border/40 pb-1">
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">
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
                                                ? "bg-accent/20 border-border/40 text-muted-foreground line-through opacity-75"
                                                : "bg-background border-border text-foreground hover:border-primary/50 shadow-2xs"
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
