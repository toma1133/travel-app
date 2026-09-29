import React, { useState, useMemo } from "react";
import {
    X,
    Volume2,
    Search,
    Maximize2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    VolumeX,
} from "lucide-react";
import {
    CLERK_PHRASES,
    PHRASE_CATEGORIES,
    CLERK_LANGUAGES,
    type PhraseCategoryKey,
    type ClerkLanguageKey,
    type ClerkPhraseItem,
} from "../../constants/ClerkPhrases";
import { playPronunciation } from "../../utils/SpeechLanguageUtil";
import type { TripVM } from "../../models/types/TripTypes";
import { hapticFeedback } from "../../utils/HapticUtil";

export interface ClerkPhraseModalProps {
    isOpen: boolean;
    tripData?: TripVM | null;
    initialCategory?: PhraseCategoryKey | "all";
    onClose: () => void;
}

const ClerkPhraseModal: React.FC<ClerkPhraseModalProps> = ({
    isOpen,
    tripData,
    initialCategory = "all",
    onClose,
}) => {
    // Detect default language from trip currency
    const defaultLang = useMemo<ClerkLanguageKey>(() => {
        const cur = (tripData?.settings_config?.localCurrency || "").toUpperCase();
        if (cur === "KRW") return "ko";
        if (cur === "THB") return "th";
        if (["USD", "EUR", "GBP", "AUD", "CAD", "SGD"].includes(cur)) return "en";
        return "ja"; // default Japanese
    }, [tripData]);

    const [selectedLang, setSelectedLang] = useState<ClerkLanguageKey>(defaultLang);
    const [selectedCategory, setSelectedCategory] = useState<PhraseCategoryKey | "all">(
        initialCategory
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [activeLargePhrase, setActiveLargePhrase] = useState<ClerkPhraseItem | null>(null);
    const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

    // Filtered phrases
    const filteredPhrases = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return CLERK_PHRASES.filter((item) => {
            if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
            if (!q) return true;
            const trans = item.translations[selectedLang];
            return (
                item.zh.toLowerCase().includes(q) ||
                trans.text.toLowerCase().includes(q) ||
                trans.phonetic.toLowerCase().includes(q)
            );
        });
    }, [selectedCategory, searchQuery, selectedLang]);

    const handlePlaySpeech = (text: string, langKey: ClerkLanguageKey) => {
        const langConfig = CLERK_LANGUAGES.find((l) => l.key === langKey);
        setIsPlayingSpeech(true);
        playPronunciation(text, {
            langCode: langConfig?.speechLang || "ja-JP",
            onEnd: () => setIsPlayingSpeech(false),
            onError: () => setIsPlayingSpeech(false),
        });
    };

    // Find next / prev in large card view
    const currentLargeIndex = activeLargePhrase
        ? filteredPhrases.findIndex((p) => p.id === activeLargePhrase.id)
        : -1;

    const handleNextLarge = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentLargeIndex >= 0 && currentLargeIndex < filteredPhrases.length - 1) {
            const nextItem = filteredPhrases[currentLargeIndex + 1];
            setActiveLargePhrase(nextItem);
            handlePlaySpeech(nextItem.translations[selectedLang].text, selectedLang);
        }
    };

    const handlePrevLarge = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentLargeIndex > 0) {
            const prevItem = filteredPhrases[currentLargeIndex - 1];
            setActiveLargePhrase(prevItem);
            handlePlaySpeech(prevItem.translations[selectedLang].text, selectedLang);
        }
    };

    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartYRef = React.useRef(0);
    const touchCurrentYRef = React.useRef(0);

    const handleDismiss = () => {
        hapticFeedback.light();
        onClose();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartYRef.current = touch.clientY;
        touchCurrentYRef.current = touch.clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        touchCurrentYRef.current = touch.clientY;
        const deltaY = touchCurrentYRef.current - touchStartYRef.current;

        if (deltaY > 0) {
            setTranslateY(Math.pow(deltaY, 0.92));
        } else {
            setTranslateY(0);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const deltaY = touchCurrentYRef.current - touchStartYRef.current;
        if (deltaY > 80) {
            handleDismiss();
        } else {
            setTranslateY(0);
        }
    };

    if (!isOpen) return null;

    const backdropOpacity = Math.max(0.2, 1 - translateY / 320);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            style={{ opacity: backdropOpacity }}
            onClick={handleDismiss}
        >
            {/* Main Dialog Container */}
            <div
                style={{
                    transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="bg-card text-card-foreground border border-border/80 shadow-2xl rounded-t-3xl md:rounded-3xl w-full max-w-full md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 */}
                <div
                    className="w-full pt-3 pb-1 md:hidden flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-10 h-1.5 rounded-full bg-muted-foreground/35 hover:bg-muted-foreground/50 transition-colors" />
                </div>

                {/* Header */}
                <div
                    className="px-5 py-3.5 md:py-4 border-b border-border/60 bg-muted/30 flex items-center justify-between shrink-0 touch-none select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg shadow-2xs">
                            💬
                        </div>
                        <div>
                            <h2 className="font-bold text-base text-foreground flex items-center gap-1.5">
                                出國結帳對話速查
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                    大字展示卡
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                免稅結帳、規格詢問與包裝要求，一鍵出示給店員
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="關閉"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Controls Bar: Language Selector & Search */}
                <div className="p-4 space-y-3 border-b border-border/40 bg-card shrink-0">
                    {/* Language Pills */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            {CLERK_LANGUAGES.map((lang) => {
                                const isSelected = selectedLang === lang.key;
                                return (
                                    <button
                                        key={lang.key}
                                        type="button"
                                        onClick={() => setSelectedLang(lang.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-2xs scale-[1.02]"
                                                : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <span>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[160px]">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                type="text"
                                placeholder="搜尋中文或發音關鍵字..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-muted/40 border border-border text-xs outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory("all")}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                selectedCategory === "all"
                                    ? "bg-foreground text-background shadow-2xs"
                                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            全部 ({CLERK_PHRASES.length})
                        </button>
                        {PHRASE_CATEGORIES.map((cat) => {
                            const count = CLERK_PHRASES.filter((p) => p.category === cat.key).length;
                            const isSelected = selectedCategory === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "bg-muted/40 text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span className="text-[10px] opacity-70">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Phrase Cards List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {filteredPhrases.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground space-y-2">
                            <div className="text-3xl">🔍</div>
                            <div className="text-xs font-bold">找不到相符的結帳對話句</div>
                        </div>
                    ) : (
                        filteredPhrases.map((phrase) => {
                            const trans = phrase.translations[selectedLang];
                            return (
                                <div
                                    key={phrase.id}
                                    className="p-3.5 rounded-2xl border border-border/70 hover:border-primary/50 bg-card hover:bg-muted/30 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                >
                                    <div
                                        className="space-y-1 cursor-pointer flex-1"
                                        onClick={() => {
                                            setActiveLargePhrase(phrase);
                                            handlePlaySpeech(trans.text, selectedLang);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                                                {phrase.zh}
                                            </span>
                                        </div>
                                        <div className="text-base sm:text-lg font-black text-foreground tracking-tight leading-snug">
                                            {trans.text}
                                        </div>
                                        <div className="text-xs text-muted-foreground/80 font-mono">
                                            {trans.phonetic}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => handlePlaySpeech(trans.text, selectedLang)}
                                            className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                            title="播放語音發音"
                                        >
                                            <Volume2 size={15} />
                                            <span>發音</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveLargePhrase(phrase);
                                                handlePlaySpeech(trans.text, selectedLang);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                            title="出示全螢幕大字給店員看"
                                        >
                                            <Maximize2 size={14} />
                                            <span>大字出示</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Tip */}
                <div className="px-5 py-3 border-t border-border/40 bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" />
                        <span>點擊任何卡片即可進入極大字出示模式，手機橫向閱讀更清晰</span>
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-bold text-foreground hover:underline cursor-pointer"
                    >
                        關閉
                    </button>
                </div>
            </div>

            {/* ULTRA-BIG FONT FULLSCREEN CARD OVERLAY */}
            {activeLargePhrase && (
                <div
                    className="fixed inset-0 z-60 bg-black/95 text-white flex flex-col justify-between p-6 sm:p-10 animate-in zoom-in-95 duration-200"
                    onClick={() => setActiveLargePhrase(null)}
                >
                    {/* Top Bar with Language Badge and Dismiss */}
                    <div
                        className="flex items-center justify-between w-full max-w-4xl mx-auto shrink-0 pb-4 border-b border-white/15"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md">
                                <Sparkles size={14} />
                                <span>店員對話卡模式 (CLERK CARD)</span>
                            </span>
                            <span className="text-white/60 text-xs font-bold hidden sm:inline">
                                請直接將螢幕轉向店員
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Speech Toggle in Fullscreen */}
                            <button
                                type="button"
                                onClick={() =>
                                    handlePlaySpeech(
                                        activeLargePhrase.translations[selectedLang].text,
                                        selectedLang
                                    )
                                }
                                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
                            >
                                <Volume2 size={16} className="text-amber-400" />
                                <span>播放語音 ({CLERK_LANGUAGES.find((l) => l.key === selectedLang)?.label})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveLargePhrase(null)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                title="關閉大字模式"
                            >
                                <X size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Central Huge Text Area */}
                    <div
                        className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl w-full mx-auto my-auto py-8 space-y-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Target Foreign Language Text (Extra Large, High Contrast) */}
                        <div className="text-3xl sm:text-5xl md:text-6xl font-black text-amber-300 tracking-tight leading-tight drop-shadow-xl select-all px-2">
                            {activeLargePhrase.translations[selectedLang].text}
                        </div>

                        {/* Romanized Phonetic */}
                        <div className="text-base sm:text-2xl text-white/70 font-mono font-medium max-w-2xl px-4">
                            {activeLargePhrase.translations[selectedLang].phonetic}
                        </div>

                        {/* Traditional Chinese Translation */}
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white/10 border border-white/15 text-white/90 text-sm sm:text-lg font-bold shadow-md">
                            <span>中文含意：</span>
                            <span>{activeLargePhrase.zh}</span>
                        </div>
                    </div>

                    {/* Bottom Navigation & Controls */}
                    <div
                        className="flex items-center justify-between w-full max-w-4xl mx-auto shrink-0 pt-4 border-t border-white/15 gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            disabled={currentLargeIndex <= 0}
                            onClick={handlePrevLarge}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                        >
                            <ChevronLeft size={18} />
                            <span>上一句</span>
                        </button>

                        <div className="text-xs text-white/50 font-bold font-mono">
                            {currentLargeIndex + 1} / {filteredPhrases.length}
                        </div>

                        <button
                            type="button"
                            disabled={currentLargeIndex >= filteredPhrases.length - 1}
                            onClick={handleNextLarge}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                        >
                            <span>下一句</span>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClerkPhraseModal;
