import React, { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";

export interface SpeedDialAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    colorClass?: string;
    badge?: string | number;
}

export interface FloatingSpeedDialProps {
    actions: SpeedDialAction[];
    mainIcon?: React.ReactNode;
    mainLabel?: string;
    className?: string;
    themeAccent?: string;
}

export const FloatingSpeedDial: React.FC<FloatingSpeedDialProps> = ({
    actions,
    mainIcon,
    mainLabel = "快捷操作",
    className = "",
    themeAccent,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside or Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    if (!actions || actions.length === 0) return null;

    const handleMainClick = () => {
        if (actions.length === 1) {
            actions[0].onClick();
            return;
        }
        setIsOpen((prev) => !prev);
    };

    const handleActionClick = (action: SpeedDialAction) => {
        setIsOpen(false);
        action.onClick();
    };

    return (
        <>
            {/* Backdrop overlay when speed dial is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div
                ref={containerRef}
                className={`fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-6 z-40 flex flex-col items-end ${className}`}
            >
                {/* Expanded Action Items Column */}
                {isOpen && (
                    <div className="mb-3 flex flex-col items-end gap-2.5 animate-in slide-in-from-bottom-3 fade-in duration-200">
                        {actions.map((act) => (
                            <div
                                key={act.id}
                                className="flex items-center gap-2.5 group cursor-pointer"
                                onClick={() => handleActionClick(act)}
                            >
                                {/* Text Label Pill */}
                                <div className="px-3 py-1.5 rounded-xl bg-card/95 border border-border/80 shadow-lg text-xs font-bold text-foreground tracking-wide backdrop-blur-md group-hover:bg-muted group-hover:scale-105 active:scale-95 transition-all select-none flex items-center gap-1.5">
                                    <span>{act.label}</span>
                                    {act.badge && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary/10 text-primary">
                                            {act.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Circular Action Button */}
                                <button
                                    type="button"
                                    aria-label={act.label}
                                    className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 group-hover:scale-105 cursor-pointer ${
                                        act.colorClass ||
                                        "bg-card border border-border text-foreground hover:bg-muted"
                                    }`}
                                >
                                    {act.icon}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Primary Floating Trigger Button */}
                <button
                    type="button"
                    onClick={handleMainClick}
                    aria-label={isOpen ? "收合選單" : mainLabel}
                    title={isOpen ? "收合選單" : mainLabel}
                    className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all duration-300 cursor-pointer ${
                        isOpen
                            ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 rotate-90 shadow-2xl scale-105"
                            : themeAccent ||
                              "bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 shadow-primary/30"
                    }`}
                >
                    <div
                        className={`transition-transform duration-300 ${
                            isOpen ? "rotate-45" : ""
                        }`}
                    >
                        {mainIcon || <Plus size={22} />}
                    </div>
                </button>
            </div>
        </>
    );
};

export default FloatingSpeedDial;
