import { useState, useRef, useEffect, useLayoutEffect, useId } from "react";
import { createPortal } from "react-dom";
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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });

    useLayoutEffect(() => {
        if (!isOpen) return;
        const updatePosition = () => {
            const trigger = triggerRef.current;
            if (!trigger) return;
            const rect = trigger.getBoundingClientRect();
            const viewport = window.visualViewport;
            const viewportTop = viewport?.offsetTop ?? 0;
            const viewportLeft = viewport?.offsetLeft ?? 0;
            const viewportHeight = viewport?.height ?? window.innerHeight;
            const viewportWidth = viewport?.width ?? window.innerWidth;
            const margin = 8;
            const gap = 4;
            const below = viewportTop + viewportHeight - rect.bottom - gap - margin;
            const above = rect.top - viewportTop - gap - margin;
            const openAbove = below < 240 && above > below;
            const maxHeight = Math.max(0, Math.min(240, openAbove ? above : below));
            const width = Math.min(rect.width, Math.max(0, viewportWidth - margin * 2));
            setMenuPosition({
                top: openAbove ? rect.top - gap - maxHeight : rect.bottom + gap,
                left: Math.max(viewportLeft + margin, Math.min(rect.left, viewportLeft + viewportWidth - width - margin)),
                width,
                maxHeight,
            });
        };
        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        window.visualViewport?.addEventListener("resize", updatePosition);
        window.visualViewport?.addEventListener("scroll", updatePosition);
        const observer = new ResizeObserver(updatePosition);
        if (triggerRef.current) observer.observe(triggerRef.current);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            window.visualViewport?.removeEventListener("resize", updatePosition);
            window.visualViewport?.removeEventListener("scroll", updatePosition);
            observer.disconnect();
        };
    }, [isOpen]);

    const currentItem = CATEGORY_DEFINITIONS.find((c) => c.id === value) || CATEGORY_DEFINITIONS[0];
    const CurrentIcon: LucideIcon = currentItem.icon;

    useEffect(() => {
        const handleClickOutside = (e: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("pointerdown", handleClickOutside);
        return () => document.removeEventListener("pointerdown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopImmediatePropagation();
            setIsOpen(false);
            triggerRef.current?.focus();
        };
        window.addEventListener("keydown", handleEscape, true);
        return () => window.removeEventListener("keydown", handleEscape, true);
    }, [isOpen]);

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <label className="block font-bold uppercase mb-2 flex items-center text-muted-foreground text-xs">
                    {label}
                </label>
            )}
            <button
                type="button"
                ref={triggerRef}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={isOpen ? menuId : undefined}
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

            {isOpen && createPortal(
                <div ref={menuRef} id={menuId} role="listbox" aria-label={label || "分類"}
                    style={menuPosition}
                    className="fixed z-[100] bg-card border border-border rounded-xl shadow-xl py-1 overflow-y-auto animate-in fade-in zoom-in-95 no-scrollbar font-[Noto_Sans_TC]">
                    {CATEGORY_DEFINITIONS.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = cat.id === (value || "sight");
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(cat.id);
                                    setIsOpen(false);
                                    triggerRef.current?.focus();
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
                </div>,
                document.body
            )}
        </div>
    );
};
