import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, LucideIcon } from "lucide-react";
import { CATEGORY_DEFINITIONS, getCategoryIcon } from "../../constants/Categories";

type CategorySelectProps = {
    value: string;
    onChange: (value: string) => void;
    label?: string;
};

export const CategoryCustomSelect = ({ value, onChange, label = "類型 *" }: CategorySelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentItem = CATEGORY_DEFINITIONS.find((c) => c.id === value) || CATEGORY_DEFINITIONS[0];
    const CurrentIcon: LucideIcon = currentItem.icon;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <label className="block font-bold uppercase mb-2 flex items-center text-muted-foreground text-xs">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-transparent border-b border-border py-2 text-left outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2.5">
                    <span className="p-1 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                        <CurrentIcon size={16} />
                    </span>
                    <span className="font-semibold text-sm">{currentItem.label}</span>
                </div>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 no-scrollbar">
                    {CATEGORY_DEFINITIONS.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = cat.id === (value || "sight");
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    onChange(cat.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors text-left ${
                                    isSelected
                                        ? "bg-primary/10 text-primary font-bold"
                                        : "hover:bg-muted text-foreground"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className={`p-1 rounded-md ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                        <Icon size={16} />
                                    </span>
                                    <span>{cat.label}</span>
                                </div>
                                {isSelected && <Check size={16} className="text-primary" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
