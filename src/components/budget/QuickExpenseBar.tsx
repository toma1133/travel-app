import React, { useRef } from "react";
import { Utensils, Train, Ticket, ShoppingBag, Coffee, Sparkles, Plus, Camera } from "lucide-react";
import { GlassCard } from "../ui";

export interface QuickExpenseCategory {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    colorClass: string;
}

const DEFAULT_QUICK_CATEGORIES: QuickExpenseCategory[] = [
    { id: "food", label: "餐飲美食", icon: Utensils, colorClass: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" },
    { id: "transport", label: "大眾交通", icon: Train, colorClass: "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20" },
    { id: "shopping", label: "購物伴手禮", icon: ShoppingBag, colorClass: "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" },
    { id: "ticket", label: "門票體驗", icon: Ticket, colorClass: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20" },
    { id: "cafe", label: "咖啡點心", icon: Coffee, colorClass: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20" },
];

export interface QuickExpenseBarProps {
    onQuickAdd: (categoryId: string) => void;
    onOpenGeneralAdd?: () => void;
    onReceiptFileSelected?: (file: File) => void;
    className?: string;
}

export const QuickExpenseBar: React.FC<QuickExpenseBarProps> = ({
    onQuickAdd,
    onOpenGeneralAdd,
    onReceiptFileSelected,
    className = "",
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onReceiptFileSelected) {
            onReceiptFileSelected(file);
        }
        // Reset input value so same file can be re-selected if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <GlassCard
            variant="elevated"
            rounded="2xl"
            padding="sm"
            className={`flex items-center gap-2 overflow-x-auto no-scrollbar border-white/30 dark:border-white/10 shadow-md ${className}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 shrink-0">
                <Sparkles size={13} className="text-primary animate-pulse" />
                <span className="hidden sm:inline">極速記帳</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-0.5">
                {/* 拍收據入口按鈕 */}
                {onReceiptFileSelected && (
                    <button
                        type="button"
                        onClick={handleCameraClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all active:scale-95 bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20"
                        title="拍攝或上傳收據自動辨識分帳"
                    >
                        <Camera size={14} className="shrink-0" />
                        <span>拍收據</span>
                    </button>
                )}

                {DEFAULT_QUICK_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => onQuickAdd(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all active:scale-95 border border-white/20 dark:border-white/10 ${cat.colorClass}`}
                        >
                            <Icon size={14} className="shrink-0" />
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {onOpenGeneralAdd && (
                <button
                    type="button"
                    onClick={onOpenGeneralAdd}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs"
                >
                    <Plus size={14} />
                    <span>記一筆</span>
                </button>
            )}
        </GlassCard>
    );
};

export default QuickExpenseBar;
