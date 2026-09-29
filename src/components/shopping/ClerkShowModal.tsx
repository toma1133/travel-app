import React, { useState, useMemo, useEffect } from "react";
import { X, Volume2, Store, Tag, Sparkles, MessageSquare, ShoppingBag, Maximize2 } from "lucide-react";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";
import {
    CLERK_PHRASES,
    PHRASE_CATEGORIES,
    type PhraseCategoryKey,
    type ClerkLanguageKey,
    type ClerkPhraseItem,
} from "../../constants/ClerkPhrases";
import { playPronunciation } from "../../utils/SpeechLanguageUtil";

type LanguageKey = "ja" | "ko" | "th" | "en" | "fr" | "vi" | "zh";

type LanguageConfig = {
    key: LanguageKey;
    label: string;
    flag: string;
    speechLang: string;
};

const LANGUAGES: LanguageConfig[] = [
    { key: "ja", label: "日語", flag: "🇯🇵", speechLang: "ja-JP" },
    { key: "ko", label: "韓語", flag: "🇰🇷", speechLang: "ko-KR" },
    { key: "th", label: "泰語", flag: "🇹🇭", speechLang: "th-TH" },
    { key: "en", label: "英語", flag: "🇬🇧", speechLang: "en-US" },
    { key: "fr", label: "法語", flag: "🇫🇷", speechLang: "fr-FR" },
    { key: "vi", label: "越南語", flag: "🇻🇳", speechLang: "vi-VN" },
];

// Helper to auto detect language directly from trip currency (primary) or text scripts (secondary)
export const detectAutoLanguage = (
    item: ShoppingItemVM,
    tripData?: TripVM | null
): LanguageKey => {
    // 1. Direct Mapping from Trip Local Currency (Top Priority: User specified currency in trip)
    const tripCurrency = (
        tripData?.settings_config?.localCurrency ||
        item.currency ||
        ""
    )
        .toUpperCase()
        .trim();

    if (tripCurrency === "JPY") return "ja";
    if (tripCurrency === "KRW") return "ko";
    if (tripCurrency === "THB") return "th";
    if (tripCurrency === "VND") return "vi";
    if (tripCurrency === "EUR") return "fr";
    if (["USD", "GBP", "AUD", "CAD", "NZD", "SGD"].includes(tripCurrency)) return "en";
    if (["TWD", "HKD", "CNY", "MOP"].includes(tripCurrency)) return "zh";

    // 2. Fallback to Script/Text Analysis on item name
    const textToCheck = `${item.local_name || ""} ${item.name || ""}`;
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(textToCheck)) return "ja";
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(textToCheck)) return "ko";
    if (/[\u0E00-\u0E7F]/.test(textToCheck)) return "th";
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(textToCheck)) return "vi";
    if (/[éàèùâêîôûëïüÿçœæ]/i.test(textToCheck)) return "fr";

    // 3. Fallback to title keywords if available
    if (tripData?.title) {
        const title = tripData.title.toLowerCase();
        if (/韓國|首爾|釜山/.test(title)) return "ko";
        if (/泰國|曼谷|清邁/.test(title)) return "th";
        if (/越南|峴港|河內/.test(title)) return "vi";
        if (/法國|巴黎|歐洲/.test(title)) return "fr";
        if (/美國|英國|澳洲/.test(title)) return "en";
        if (/日本|東京|大阪|京都|沖繩|北海道|福岡|名古屋/.test(title)) return "ja";
    }

    return "ja";
};

type ClerkShowModalProps = {
    item: ShoppingItemVM;
    tripData?: TripVM | null;
    onClose: () => void;
};

const ClerkShowModal = ({ item, tripData, onClose }: ClerkShowModalProps) => {
    const langKey = useMemo(() => detectAutoLanguage(item, tripData), [item, tripData]);
    const [imgFailed, setImgFailed] = useState(false);
    const [activeTab, setActiveTab] = useState<"item" | "phrases">("item");
    const [selectedCategory, setSelectedCategory] = useState<PhraseCategoryKey | "all">("all");

    // Standardize phrase lang to supported clerk languages: ja, ko, en, th
    const clerkPhraseLang: ClerkLanguageKey = useMemo(() => {
        if (langKey === "ko") return "ko";
        if (langKey === "th") return "th";
        if (langKey === "en") return "en";
        return "ja";
    }, [langKey]);

    const activeLanguage = useMemo(() => {
        return LANGUAGES.find((l) => l.key === langKey) || LANGUAGES[0];
    }, [langKey]);

    const [activePhrase, setActivePhrase] = useState<string>("");
    const [activeLargePhrase, setActiveLargePhrase] = useState<ClerkPhraseItem | null>(null);

    // Speak helper
    const speak = (text: string, speechLang: string) => {
        playPronunciation(text, {
            langCode: speechLang,
            rate: 0.86,
        });
    };

    // Filter phrases for this language & category
    const relevantPhrases = useMemo(() => {
        return CLERK_PHRASES.filter((p) => {
            if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
            return true;
        });
    }, [selectedCategory]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Top Bar with Tabs and Close Button */}
            <div
                className="flex items-center justify-between text-white/90 max-w-2xl w-full mx-auto shrink-0 pb-3 border-b border-white/10 gap-2.5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {/* View Switcher Tabs: 商品出示 / 常用結帳對話 */}
                    <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/15">
                        <button
                            type="button"
                            onClick={() => setActiveTab("item")}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === "item"
                                    ? "bg-rose-500 text-white shadow-xs"
                                    : "text-white/70 hover:text-white"
                            }`}
                        >
                            <ShoppingBag size={13} />
                            <span>商品展示</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("phrases")}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === "phrases"
                                    ? "bg-amber-500 text-neutral-950 font-black shadow-xs"
                                    : "text-white/70 hover:text-white"
                            }`}
                        >
                            <MessageSquare size={13} />
                            <span>常用對話句</span>
                        </button>
                    </div>

                    {item.store && activeTab === "item" && (
                        <span className="text-xs text-white/60 hidden sm:flex items-center gap-1 truncate max-w-[130px]">
                            <Store size={12} />
                            {item.store}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Language Badge */}
                    <span className="px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                        <span>{activeLanguage.flag}</span>
                        <span>{activeLanguage.label}</span>
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="關閉展示視窗"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* TAB 1: PRODUCT SHOWCASE */}
            {activeTab === "item" && (
                <div
                    className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto my-auto py-3 text-center space-y-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Product Image */}
                    <div className="relative w-full max-w-[220px] sm:max-w-xs aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-card/60 backdrop-blur-md flex items-center justify-center">
                        {item.image_url && !imgFailed ? (
                            <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-contain p-3 transition-transform hover:scale-105 duration-300"
                                onError={() => setImgFailed(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-500/15 via-amber-500/15 to-blue-500/15 p-6 text-foreground">
                                <span className="text-6xl mb-2 drop-shadow-md">🛍️</span>
                                <span className="text-base font-bold text-white/90 line-clamp-2">
                                    {item.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Local Native Name - Extra Large High-Contrast Font with Local Pronunciation */}
                    <div className="space-y-1.5 w-full px-2">
                        <div className="flex items-center justify-center gap-2.5 flex-wrap">
                            <div className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md break-words">
                                {item.local_name || item.name}
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    speak(
                                        item.local_name || item.name,
                                        activeLanguage.speechLang
                                    )
                                }
                                className="px-3 py-1.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold shrink-0 border border-white/20"
                                title={`播放品名當地發音 (${activeLanguage.label})`}
                            >
                                <Volume2 size={16} className="text-rose-400" />
                                <span>發音 ({activeLanguage.label})</span>
                            </button>
                        </div>
                        {item.local_name && (
                            <div className="text-sm sm:text-base font-medium text-white/70">
                                {item.name}
                            </div>
                        )}
                    </div>

                    {/* Target Specs & Details Highlight */}
                    {item.target_specs && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs sm:text-sm shadow-sm">
                            <Tag size={15} />
                            <span>目標規格/色號：{item.target_specs}</span>
                        </div>
                    )}

                    {item.note && (
                        <div className="text-xs sm:text-sm text-white/75 bg-white/10 px-4 py-1.5 rounded-xl max-w-md w-full">
                            備註：{item.note}
                        </div>
                    )}

                    {/* Clerk Conversation Cue Cards for Selected Language */}
                    <div className="w-full space-y-1.5 pt-1 text-left">
                        <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider px-1 flex items-center justify-between">
                            <span>
                                {activeLanguage.flag} 向店員指示常用對話卡：
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveTab("phrases")}
                                className="text-[11px] text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                                <span>查看更多對話庫 ({CLERK_PHRASES.length})</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {relevantPhrases.slice(0, 4).map((phrase) => {
                                const trans = phrase.translations[clerkPhraseLang];
                                const isCurrent = activePhrase === trans.text;
                                return (
                                    <div
                                        key={phrase.id}
                                        onClick={() => {
                                            setActivePhrase(trans.text);
                                            speak(trans.text, trans.speechLang);
                                        }}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                            isCurrent
                                                ? "bg-white/25 border-white/50 text-white shadow-lg scale-[1.01]"
                                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/15"
                                        }`}
                                    >
                                        <div className="min-w-0 pr-1">
                                            <div className="font-bold text-xs sm:text-sm text-white leading-snug">
                                                {trans.text}
                                            </div>
                                            <div className="text-[10px] text-white/50 mt-0.5 truncate font-mono">
                                                {trans.phonetic}
                                            </div>
                                            <div className="text-[10px] text-rose-300/90 font-medium">
                                                {phrase.zh}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    speak(trans.text, trans.speechLang);
                                                }}
                                                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
                                                title="播放發音"
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: POCKETBOOK PHRASES VIEW */}
            {activeTab === "phrases" && (
                <div
                    className="flex-1 flex flex-col max-w-2xl w-full mx-auto my-2 text-left space-y-3 overflow-y-auto p-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-1">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory("all")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                selectedCategory === "all"
                                    ? "bg-amber-400 text-neutral-950 font-black shadow-xs"
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                        >
                            全部 ({CLERK_PHRASES.length})
                        </button>
                        {PHRASE_CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                                        isSelected
                                            ? "bg-amber-400 text-neutral-950 font-black shadow-xs"
                                            : "bg-white/10 text-white/70 hover:bg-white/20"
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Phrases Grid */}
                    <div className="space-y-2 overflow-y-auto pr-1">
                        {relevantPhrases.map((phrase) => {
                            const trans = phrase.translations[clerkPhraseLang];
                            return (
                                <div
                                    key={phrase.id}
                                    className="p-3.5 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                >
                                    <div
                                        className="space-y-1 cursor-pointer flex-1"
                                        onClick={() => {
                                            setActiveLargePhrase(phrase);
                                            speak(trans.text, trans.speechLang);
                                        }}
                                    >
                                        <div className="text-xs font-bold text-amber-300">
                                            {phrase.zh}
                                        </div>
                                        <div className="text-base sm:text-lg font-black text-white leading-snug">
                                            {trans.text}
                                        </div>
                                        <div className="text-xs text-white/60 font-mono">
                                            {trans.phonetic}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => speak(trans.text, trans.speechLang)}
                                            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Volume2 size={15} />
                                            <span>發音</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveLargePhrase(phrase);
                                                speak(trans.text, trans.speechLang);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-amber-400 text-neutral-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-amber-300"
                                        >
                                            <Maximize2 size={14} />
                                            <span>大字</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom Dismiss */}
            <div
                className="max-w-2xl w-full mx-auto shrink-0 pt-2 border-t border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer"
                >
                    完成 / 關閉展示
                </button>
            </div>

            {/* FULLSCREEN LARGE CARD OVERLAY IF CLICKED */}
            {activeLargePhrase && (
                <div
                    className="fixed inset-0 z-60 bg-black/95 text-white flex flex-col justify-between p-6 sm:p-10 animate-in zoom-in-95 duration-200"
                    onClick={() => setActiveLargePhrase(null)}
                >
                    <div
                        className="flex items-center justify-between w-full max-w-3xl mx-auto pb-4 border-b border-white/15"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md">
                            <Sparkles size={14} />
                            <span>店員大字展示卡</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    speak(
                                        activeLargePhrase.translations[clerkPhraseLang].text,
                                        activeLargePhrase.translations[clerkPhraseLang].speechLang
                                    )
                                }
                                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Volume2 size={16} className="text-amber-400" />
                                <span>播放語音</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveLargePhrase(null)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div
                        className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl w-full mx-auto my-auto py-8 space-y-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-3xl sm:text-5xl md:text-6xl font-black text-amber-300 tracking-tight leading-tight select-all">
                            {activeLargePhrase.translations[clerkPhraseLang].text}
                        </div>
                        <div className="text-base sm:text-2xl text-white/70 font-mono">
                            {activeLargePhrase.translations[clerkPhraseLang].phonetic}
                        </div>
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white/10 border border-white/15 text-white/90 text-sm sm:text-lg font-bold">
                            <span>中文：{activeLargePhrase.zh}</span>
                        </div>
                    </div>

                    <div
                        className="max-w-3xl w-full mx-auto pt-4 border-t border-white/15 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveLargePhrase(null)}
                            className="w-full py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm cursor-pointer"
                        >
                            返回
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClerkShowModal;
