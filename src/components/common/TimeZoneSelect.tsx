import { useState, useRef, useEffect, useLayoutEffect, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Globe, Search, X } from "lucide-react";
import { getBrowserTimeZone, getTimeZones } from "../../utils/DateTimeUtil";

const staticZones = getTimeZones();

export type TimeZoneSelectProps = {
    value?: string | null;
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
};

export default function TimeZoneSelect({
    value,
    onChange,
    label = "時區",
    disabled = false,
    className = "",
}: TimeZoneSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const menuId = useId();

    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
        maxHeight: 280,
    });

    const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);
    const current = value || browserTimeZone;

    // 所有時區列表（包含當前選中時區）
    const allZones = useMemo(() => {
        return [...new Set([current, ...staticZones])];
    }, [current]);

    // 依搜尋條件過濾時區
    const filteredZones = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            // 無搜尋字串時，優先將瀏覽器時區置頂
            const others = allZones.filter((z) => z !== browserTimeZone);
            return browserTimeZone ? [browserTimeZone, ...others] : allZones;
        }

        return allZones.filter((zone) => {
            const lower = zone.toLowerCase();
            const withSpaces = lower.replace(/[/_]/g, " ");
            const isBrowserMatch =
                zone === browserTimeZone &&
                ("瀏覽器時區".includes(q) || "browser".includes(q) || "本機".includes(q));
            return lower.includes(q) || withSpaces.includes(q) || isBrowserMatch;
        });
    }, [allZones, searchQuery, browserTimeZone]);

    // 計算彈出選單位置（支援視窗防溢位與向上展開）
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
            const preferredHeight = 300;

            const below = viewportTop + viewportHeight - rect.bottom - gap - margin;
            const above = rect.top - viewportTop - gap - margin;
            const openAbove = below < 220 && above > below;
            const maxHeight = Math.max(140, Math.min(preferredHeight, openAbove ? above : below));
            const width = Math.min(
                Math.max(rect.width, 260),
                Math.max(0, viewportWidth - margin * 2)
            );
            const left = Math.max(
                viewportLeft + margin,
                Math.min(rect.left, viewportLeft + viewportWidth - width - margin)
            );
            const top = openAbove ? rect.top - gap - maxHeight : rect.bottom + gap;

            setMenuPosition({
                top,
                left,
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

    // 點擊外部自動關閉
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: PointerEvent | MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node) &&
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        return () => document.removeEventListener("pointerdown", handleClickOutside);
    }, [isOpen]);

    // 按下 Escape 關閉
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setIsOpen(false);
                setSearchQuery("");
                triggerRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleEscape, true);
        return () => window.removeEventListener("keydown", handleEscape, true);
    }, [isOpen]);

    // 開啟時自動 focus 搜尋框
    useEffect(() => {
        if (isOpen) {
            const timer = window.setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
            return () => window.clearTimeout(timer);
        } else {
            setSearchQuery("");
        }
    }, [isOpen]);

    const handleSelect = (zone: string) => {
        onChange(zone);
        setIsOpen(false);
        setSearchQuery("");
        triggerRef.current?.focus();
    };

    return (
        <div
            ref={containerRef}
            className={`inline-flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${className}`}
        >
            {label && <span className="font-bold shrink-0">{label}</span>}

            {/* 下拉觸發按鈕 */}
            <button
                type="button"
                ref={triggerRef}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? menuId : undefined}
                aria-label={label}
                onClick={() => {
                    if (!disabled) setIsOpen((prev) => !prev);
                }}
                className={`inline-flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground transition-all cursor-pointer hover:bg-muted/70 active:scale-98 ${
                    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                }`}
            >
                <div className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[260px]">
                    <Globe size={13} className="text-primary shrink-0" />
                    <span className="truncate font-medium">{current}</span>
                    {current === browserTimeZone && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.2 rounded-sm shrink-0">
                            本機
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={13}
                    className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* 搜尋下拉選單 Popover (透過 Portal 渲染至 body，避免被 modal overflow 截斷) */}
            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        id={menuId}
                        role="listbox"
                        aria-label={label}
                        style={{
                            position: "fixed",
                            top: menuPosition.top,
                            left: menuPosition.left,
                            width: menuPosition.width,
                            maxHeight: menuPosition.maxHeight,
                        }}
                        className="z-[9999] bg-card text-card-foreground border border-border rounded-2xl shadow-xl flex flex-col p-2.5 animate-in fade-in slide-in-from-top-2 duration-150 font-[Noto_Sans_TC]"
                    >
                        {/* 選單標題與計數 */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/50 mb-2 shrink-0">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                <Globe size={12} className="text-primary" />
                                選擇時區
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {filteredZones.length} 個時區
                            </span>
                        </div>

                        {/* 搜尋框 */}
                        <div className="relative mb-2 shrink-0">
                            <Search
                                size={13}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜尋時區 (如 Taipei, Tokyo)..."
                                className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/60 border border-border/70 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    title="清除搜尋"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* 時區選項清單 */}
                        <div className="space-y-0.5 overflow-y-auto no-scrollbar flex-1 min-h-0 pt-0.5">
                            {filteredZones.length > 0 ? (
                                filteredZones.map((zone) => {
                                    const isSelected = zone === current;
                                    const isBrowser = zone === browserTimeZone;
                                    return (
                                        <button
                                            key={zone}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => handleSelect(zone)}
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                                isSelected
                                                    ? "bg-primary/15 text-primary font-bold"
                                                    : "text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="truncate">{zone}</span>
                                                {isBrowser && (
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-medium shrink-0">
                                                        瀏覽器時區
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check
                                                    size={14}
                                                    className="text-primary shrink-0 ml-1.5"
                                                />
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-xs text-muted-foreground">
                                    無符合時區
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
