/**
 * SpeechLanguageUtil.ts
 * Smart multilingual detection and text-to-speech audio pronunciation utility for travel apps.
 * Supports: Japanese, Korean, Thai, Icelandic, Italian, French, German, Spanish, Vietnamese, etc.
 */

export interface DetectedLanguage {
    code: string;       // BCP 47 language code, e.g. "ja-JP", "th-TH", "is-IS", "it-IT"
    name: string;       // Traditional Chinese name, e.g. "日語", "泰語", "冰島語", "義大利語"
    flag: string;       // Emoji flag representation
}

/**
 * Automatically detect spoken language from text characters, scripts, diacritics, and keywords.
 */
export function detectLanguage(
    text?: string | null,
    context?: {
        address?: string | null;
        mapUrl?: string | null;
        currency?: string | null;
    }
): DetectedLanguage {
    if (!text || !text.trim()) {
        return { code: "en-US", name: "英語", flag: "🌐" };
    }

    const t = text.trim();
    const lower = t.toLowerCase();

    // 1. 🇹🇭 Thai (泰文: U+0E00 - U+0E7F)
    if (/[\u0E00-\u0E7F]/.test(t)) {
        return { code: "th-TH", name: "泰語", flag: "🇹🇭" };
    }

    // 2. 🇰🇷 Korean (韓文 Hangul: U+AC00-U+D7AF, U+1100-U+11FF, U+3130-U+318F)
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(t)) {
        return { code: "ko-KR", name: "韓語", flag: "🇰🇷" };
    }

    // 3. 🇯🇵 Japanese (日文 Hiragana U+3040-U+309F, Katakana U+30A0-U+30FF)
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) {
        return { code: "ja-JP", name: "日語", flag: "🇯🇵" };
    }

    // 4. 🇮🇸 Icelandic (冰島文: ð, Ð, þ, Þ, æ, Æ, ö, Ö, í, á, ó, ú, ý)
    if (/[ðÐþÞ]/.test(t) || (/[æöíóúý]/i.test(t) && context?.currency === "ISK")) {
        return { code: "is-IS", name: "冰島語", flag: "🇮🇸" };
    }

    // 5. 🇻🇳 Vietnamese (越南文特有聲調字母)
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(t)) {
        return { code: "vi-VN", name: "越南語", flag: "🇻🇳" };
    }

    // 6. 🇬🇷 Greek (希臘文: U+0370 - U+03FF)
    if (/[\u0370-\u03FF]/.test(t)) {
        return { code: "el-GR", name: "希臘語", flag: "🇬🇷" };
    }

    // 7. 🇷🇺 Cyrillic / Russian (斯拉夫/俄語: U+0400 - U+04FF)
    if (/[\u0400-\u04FF]/.test(t)) {
        return { code: "ru-RU", name: "俄語", flag: "🇷🇺" };
    }

    // 8. 🇸🇦 Arabic (阿拉伯語: U+0600 - U+06FF)
    if (/[\u0600-\u06FF]/.test(t)) {
        return { code: "ar-SA", name: "阿拉伯語", flag: "🇸🇦" };
    }

    // 9. 🇮🇹 Italian (義大利文常見關鍵詞與形態特徵)
    if (
        /\b(piazza|via|corso|duomo|caffè|gelateria|trattoria|osteria|ristorante|basilica|palazzo|castello|ponte|fontana|museo|chiesa|stazione|san|santa|via|viale|borgo|largo|vicolo)\b/i.test(lower) ||
        context?.currency === "EUR" && /\b(di|del|della|degli|dei|san|santa|monte)\b/i.test(lower)
    ) {
        return { code: "it-IT", name: "義大利語", flag: "🇮🇹" };
    }

    // 10. 🇫🇷 French (法文: œ, æ, ç, è, é, ê, ë, à, â, î, ï, ô, ù, û, ü, ÿ 及常用詞)
    if (
        /[œæç]/i.test(t) ||
        /\b(rue|avenue|boulevard|château|palais|tour|musée|pont|place|église|cathédrale|gare|saint|sainte|boulangerie|brasserie|bistro|le|la|les|du|des)\b/i.test(lower)
    ) {
        return { code: "fr-FR", name: "法語", flag: "🇫🇷" };
    }

    // 11. 🇩🇪 German (德文: ä, ö, ü, ß 及常用詞)
    if (
        /[ß]/i.test(t) ||
        /\b(straße|strasse|platz|schloss|burg|kirche|dom|bahnhof|rathaus|gasthaus|gasse|brücke|tor|altstadt|markt|park)\b/i.test(lower)
    ) {
        return { code: "de-DE", name: "德語", flag: "🇩🇪" };
    }

    // 12. 🇪🇸 Spanish (西班牙文: ñ, á, é, í, ó, ú, ü, ¡, ¿ 及常用詞)
    if (
        /[ñ¡¿]/i.test(t) ||
        /\b(calle|plaza|palacio|iglesia|catedral|estación|castillo|mercado|puente|avenida|paseo|parque|cervecería|tapas|taquería|el|la|los|las)\b/i.test(lower)
    ) {
        return { code: "es-ES", name: "西班牙語", flag: "🇪🇸" };
    }

    // 13. 🇵🇹 Portuguese (葡萄牙文: ã, õ, ç 及常用詞)
    if (
        /[ãõ]/i.test(t) ||
        /\b(rua|praça|avenida|mosteiro|palácio|igreja|castelo|parque|mercado|estação|tasca|pastelaria)\b/i.test(lower)
    ) {
        return { code: "pt-PT", name: "葡萄牙語", flag: "🇵🇹" };
    }

    // 14. 🇨🇳 / 🇹🇼 Chinese (漢字: U+4E00 - U+9FFF)
    if (/[\u4E00-\u9FFF]/.test(t)) {
        // Check if context points to Japan or Korea
        if (context?.currency === "JPY" || (context?.address && /日本|京都|東京|大阪|北海道|福岡|沖繩/i.test(context.address))) {
            return { code: "ja-JP", name: "日語 (漢字)", flag: "🇯🇵" };
        }
        if (context?.currency === "KRW" || (context?.address && /韓國|首爾|釜山|濟州/i.test(context.address))) {
            return { code: "ko-KR", name: "韓語 (漢字)", flag: "🇰🇷" };
        }
        return { code: "zh-TW", name: "中文", flag: "🇹🇼" };
    }

    // 15. Context fallback based on currency or address
    if (context?.currency === "JPY") return { code: "ja-JP", name: "日語 (羅馬拼音)", flag: "🇯🇵" };
    if (context?.currency === "KRW") return { code: "ko-KR", name: "韓語 (羅馬拼音)", flag: "🇰🇷" };
    if (context?.currency === "THB") return { code: "th-TH", name: "泰語 (拼音)", flag: "🇹🇭" };
    if (context?.currency === "ISK") return { code: "is-IS", name: "冰島語", flag: "🇮🇸" };

    // Default to English
    return { code: "en-US", name: "英語", flag: "🌐" };
}

/**
 * Speak text out loud using Web Speech API with the best available native voice.
 */
export function playPronunciation(
    text?: string | null,
    options?: {
        langCode?: string;
        rate?: number;
        pitch?: number;
        context?: {
            address?: string | null;
            mapUrl?: string | null;
            currency?: string | null;
        };
        onStart?: () => void;
        onEnd?: () => void;
        onError?: (err: any) => void;
    }
): { detectedLang: DetectedLanguage; supported: boolean } {
    const detected = detectLanguage(text, options?.context);
    const targetLang = options?.langCode || detected.code;

    if (!("speechSynthesis" in window) || !text || !text.trim()) {
        options?.onEnd?.();
        return { detectedLang: detected, supported: false };
    }

    try {
        window.speechSynthesis.cancel(); // Stop any pending speech

        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = targetLang;
        utterance.rate = options?.rate ?? 0.85; // Slightly slower for clear travel listening
        utterance.pitch = options?.pitch ?? 1.0;

        // Try to pick the most natural voice for this language
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(
            (v) =>
                v.lang.toLowerCase() === targetLang.toLowerCase() ||
                v.lang.toLowerCase().startsWith(targetLang.split("-")[0].toLowerCase())
        );

        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
            options?.onStart?.();
        };

        utterance.onend = () => {
            options?.onEnd?.();
        };

        utterance.onerror = (e) => {
            options?.onError?.(e);
            options?.onEnd?.();
        };

        window.speechSynthesis.speak(utterance);
        return { detectedLang: detected, supported: true };
    } catch (err) {
        options?.onError?.(err);
        options?.onEnd?.();
        return { detectedLang: detected, supported: false };
    }
}
