import React, { useState, useMemo, useEffect } from "react";
import { X, Volume2, Store, Tag, Sparkles } from "lucide-react";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";

type LanguageKey = "ja" | "ko" | "th" | "en" | "fr" | "vi" | "zh";

type LanguageConfig = {
    key: LanguageKey;
    label: string;
    flag: string;
    speechLang: string;
    phrases: {
        text: string;
        phonetic: string;
        zh: string;
    }[];
};

const LANGUAGES: LanguageConfig[] = [
    {
        key: "ja",
        label: "日語",
        flag: "🇯🇵",
        speechLang: "ja-JP",
        phrases: [
            {
                text: "すみません、この商品はありますか？",
                phonetic: "Sumimasen, kono shouhin wa arimasu ka?",
                zh: "不好意思，請問有這款商品嗎？",
            },
            {
                text: "在庫はありますか？",
                phonetic: "Zaiko wa arimasu ka?",
                zh: "請問目前店裡有庫存嗎？",
            },
            {
                text: "他の色やサイズはありますか？",
                phonetic: "Hoka no iro ya saizu wa arimasu ka?",
                zh: "請問有其他顏色或尺寸嗎？",
            },
            {
                text: "免税手続きはできますか？",
                phonetic: "Menzei tetsuzuki wa dekimasu ka?",
                zh: "請問可以在此辦理免稅嗎？",
            },
        ],
    },
    {
        key: "ko",
        label: "韓語",
        flag: "🇰🇷",
        speechLang: "ko-KR",
        phrases: [
            {
                text: "저기요, 이 상품 있나요?",
                phonetic: "Jeogiyo, i sangpum innayo?",
                zh: "不好意思，請問有這款商品嗎？",
            },
            {
                text: "재고가 남아 있나요?",
                phonetic: "Jaegoga nama innayo?",
                zh: "請問目前店裡有現貨庫存嗎？",
            },
            {
                text: "다른 색상이나 사이즈가 있나요?",
                phonetic: "Dareun saeksang-ina saijeuga innayo?",
                zh: "請問有其他顏色或尺寸嗎？",
            },
            {
                text: "면세 되나요?",
                phonetic: "Myeonse doenayo?",
                zh: "請問可以退稅/免稅嗎？",
            },
        ],
    },
    {
        key: "th",
        label: "泰語",
        flag: "🇹🇭",
        speechLang: "th-TH",
        phrases: [
            {
                text: "ขอโทษนะคะ มีสินค้านี้ไหมคะ?",
                phonetic: "Khor thot na kha, mee sin-kha nee mai kha?",
                zh: "不好意思，請問有這件商品嗎？",
            },
            {
                text: "มีของในสต็อกไหมคะ?",
                phonetic: "Mee khong nai stock mai kha?",
                zh: "請問還有庫存存貨嗎？",
            },
            {
                text: "มีสีอื่นหรือไซส์อื่นไหมคะ?",
                phonetic: "Mee see eun reu size eun mai kha?",
                zh: "請問有其他顏色或尺寸嗎？",
            },
            {
                text: "ที่นี่ทำ Tax Refund ได้ไหมคะ?",
                phonetic: "Thee nee tham Tax Refund dai mai kha?",
                zh: "請問這裡可以辦理退稅嗎？",
            },
        ],
    },
    {
        key: "en",
        label: "英語",
        flag: "🇬🇧",
        speechLang: "en-US",
        phrases: [
            {
                text: "Excuse me, do you have this item in stock?",
                phonetic: "Excuse me, do you have this item in stock?",
                zh: "不好意思，請問有這款商品嗎？",
            },
            {
                text: "Do you have any more in the back?",
                phonetic: "Do you have any more in the back?",
                zh: "請問倉庫還有現貨嗎？",
            },
            {
                text: "Do you have other colors or sizes?",
                phonetic: "Do you have other colors or sizes?",
                zh: "請問有其他顏色或尺寸嗎？",
            },
            {
                text: "Is tax-free / duty-free shopping available?",
                phonetic: "Is tax-free / duty-free shopping available?",
                zh: "請問可以辦理免稅嗎？",
            },
        ],
    },
    {
        key: "fr",
        label: "法語",
        flag: "🇫🇷",
        speechLang: "fr-FR",
        phrases: [
            {
                text: "Excusez-moi, avez-vous cet article ?",
                phonetic: "Ex-kew-zay mwah, ah-vay voo set ar-tee-kluh?",
                zh: "不好意思，請問有這件商品嗎？",
            },
            {
                text: "Avez-vous d'autres tailles ou couleurs ?",
                phonetic: "Ah-vay voo d'o-truh tai ou coo-leur?",
                zh: "請問有其他尺寸或顏色嗎？",
            },
            {
                text: "Est-ce que vous faites la détaxe ?",
                phonetic: "Es-kuh voo fet lah day-tax?",
                zh: "請問可以辦理退稅手續嗎？",
            },
        ],
    },
    {
        key: "vi",
        label: "越南語",
        flag: "🇻🇳",
        speechLang: "vi-VN",
        phrases: [
            {
                text: "Xin lỗi, ở đây có món này không ạ?",
                phonetic: "Sin loy, uh day co mon nay khong ah?",
                zh: "不好意思，請問有這款商品嗎？",
            },
            {
                text: "Còn hàng trong kho không ạ?",
                phonetic: "Con hang trong kho khong ah?",
                zh: "請問店裡還有庫存嗎？",
            },
            {
                text: "Có màu hoặc kích cỡ khác không ạ?",
                phonetic: "Co mau hoac kich co khac khong ah?",
                zh: "請問有其他顏色或尺寸嗎？",
            },
        ],
    },
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

    if (tripCurrency === "JPY") return "ja"; // 日圓 -> 日文
    if (tripCurrency === "KRW") return "ko"; // 韓元 -> 韓文
    if (tripCurrency === "THB") return "th"; // 泰銖 -> 泰文
    if (tripCurrency === "VND") return "vi"; // 越南盾 -> 越文
    if (tripCurrency === "EUR") return "fr"; // 歐元 -> 法文/歐洲
    if (["USD", "GBP", "AUD", "CAD", "NZD", "SGD"].includes(tripCurrency)) return "en"; // 英語系
    if (["TWD", "HKD", "CNY", "MOP"].includes(tripCurrency)) return "zh"; // 中文

    // 2. Fallback to Script/Text Analysis on item name
    const textToCheck = `${item.local_name || ""} ${item.name || ""}`;
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(textToCheck)) return "ja"; // Hiragana or Katakana
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(textToCheck)) return "ko"; // Hangul
    if (/[\u0E00-\u0E7F]/.test(textToCheck)) return "th"; // Thai
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(textToCheck)) return "vi"; // Vietnamese
    if (/[éàèùâêîôûëïüÿçœæ]/i.test(textToCheck)) return "fr"; // French

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

    // Default to Japanese (Standard for foreign duty-free shopping)
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

    const activeLanguage = useMemo(() => {
        return LANGUAGES.find((l) => l.key === langKey) || LANGUAGES[0];
    }, [langKey]);

    const [activePhrase, setActivePhrase] = useState(activeLanguage.phrases[0].text);

    // Sync active phrase when active language changes
    useEffect(() => {
        setActivePhrase(activeLanguage.phrases[0].text);
    }, [activeLanguage]);

    const speak = (text: string, speechLang: string) => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = speechLang;
            utterance.rate = 0.88;
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Top Bar with Language Badge and Close Button */}
            <div
                className="flex items-center justify-between text-white/90 max-w-2xl w-full mx-auto shrink-0 pb-3 border-b border-white/10 gap-2.5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <Sparkles size={13} />
                        <span>店員展示模式</span>
                    </span>
                    {item.store && (
                        <span className="text-xs text-white/60 flex items-center gap-1 truncate max-w-[150px]">
                            <Store size={12} />
                            {item.store}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Language Badge corresponding to trip currency */}
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

            {/* Main Content Area */}
            <div
                className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto my-auto py-3 text-center space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Product Image */}
                <div className="relative w-full max-w-[240px] sm:max-w-xs aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-card/60 backdrop-blur-md flex items-center justify-center">
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
                <div className="space-y-2 w-full px-2">
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
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-sm sm:text-base shadow-sm">
                        <Tag size={16} />
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
                            {activeLanguage.flag} {activeLanguage.label}向店員指示對話卡：
                        </span>
                        <span className="text-[10px] text-white/40">點擊播放發音</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeLanguage.phrases.map((phrase, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setActivePhrase(phrase.text);
                                    speak(phrase.text, activeLanguage.speechLang);
                                }}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                    activePhrase === phrase.text
                                        ? "bg-white/25 border-white/50 text-white shadow-lg scale-[1.01]"
                                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/15"
                                }`}
                            >
                                <div className="min-w-0 pr-1">
                                    <div className="font-bold text-xs sm:text-sm text-white leading-snug">
                                        {phrase.text}
                                    </div>
                                    <div className="text-[10px] text-white/50 mt-0.5 truncate">
                                        {phrase.phonetic}
                                    </div>
                                    <div className="text-[10px] text-rose-300/90 font-medium">
                                        {phrase.zh}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speak(phrase.text, activeLanguage.speechLang);
                                    }}
                                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors shrink-0"
                                    title="播放發音"
                                >
                                    <Volume2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Dismiss */}
            <div className="max-w-2xl w-full mx-auto shrink-0 pt-2 border-t border-white/10">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer"
                >
                    完成 / 關閉展示
                </button>
            </div>
        </div>
    );
};

export default ClerkShowModal;
