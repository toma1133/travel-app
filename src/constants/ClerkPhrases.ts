/**
 * ClerkPhrases.ts
 * Pocketbook of essential overseas shopping & checkout phrases for travelers.
 * Supports: Japanese (ja), Korean (ko), English (en), and Thai (th).
 */

export type PhraseCategoryKey = "tax_free" | "packaging" | "stock" | "receipt";

export interface PhraseCategory {
    key: PhraseCategoryKey;
    label: string;
    icon: string;
    description: string;
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
    {
        key: "tax_free",
        label: "免稅付款",
        icon: "💳",
        description: "退稅申請、分開結帳、支付方式與門檻詢問",
    },
    {
        key: "packaging",
        label: "包裝袋子",
        icon: "🛍️",
        description: "塑膠袋要求、禮物包裝與分袋",
    },
    {
        key: "stock",
        label: "庫存規格",
        icon: "📦",
        description: "新品庫存、調貨、顏色尺寸與試穿試用",
    },
    {
        key: "receipt",
        label: "發票憑證",
        icon: "🧾",
        description: "明細收據、退稅文件、保固與售後確認",
    },
];

export type ClerkLanguageKey = "ja" | "ko" | "en" | "th";

export interface ClerkLanguageMeta {
    key: ClerkLanguageKey;
    label: string;
    flag: string;
    speechLang: string;
}

export const CLERK_LANGUAGES: ClerkLanguageMeta[] = [
    { key: "ja", label: "日語", flag: "🇯🇵", speechLang: "ja-JP" },
    { key: "ko", label: "韓語", flag: "🇰🇷", speechLang: "ko-KR" },
    { key: "en", label: "英語", flag: "🇬🇧", speechLang: "en-US" },
    { key: "th", label: "泰語", flag: "🇹🇭", speechLang: "th-TH" },
];

export interface PhraseTranslation {
    text: string;
    phonetic: string;
    speechLang: string;
}

export interface ClerkPhraseItem {
    id: string;
    category: PhraseCategoryKey;
    zh: string;
    translations: Record<ClerkLanguageKey, PhraseTranslation>;
}

export const CLERK_PHRASES: ClerkPhraseItem[] = [
    // 1. 💳 免稅付款 (Tax Free & Payment)
    {
        id: "tax_free_eligible",
        category: "tax_free",
        zh: "請問這裡可以辦理免稅嗎？",
        translations: {
            ja: {
                text: "免税手続きはできますか？",
                phonetic: "Menzei tetsuzuki wa dekimasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "면세(Tax Free) 되나요?",
                phonetic: "Myeonse doenayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Is tax-free / duty-free shopping available here?",
                phonetic: "Is tax-free shopping available here?",
                speechLang: "en-US",
            },
            th: {
                text: "ที่นี่ทำ Tax Refund ได้ไหมคะ?",
                phonetic: "Thee nee tham Tax Refund dai mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "tax_free_threshold",
        category: "tax_free",
        zh: "請問免稅門檻是多少錢？",
        translations: {
            ja: {
                text: "免税になるにはいくらからですか？",
                phonetic: "Menzei ni naru ni wa ikura kara desu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "면세 기준 금액이 얼마인가요?",
                phonetic: "Myeonse gijun geumaegi eolmaingayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "What is the minimum spend for tax exemption?",
                phonetic: "What is the minimum spend for tax exemption?",
                speechLang: "en-US",
            },
            th: {
                text: "ยอดซื้อขั้นต่ำสำหรับการทำ Tax Refund คือเท่าไหร่คะ?",
                phonetic: "Yot sue khan tam sam rap kan tham Tax Refund khue thao rai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "split_bill",
        category: "tax_free",
        zh: "請幫我分開結帳，謝謝。",
        translations: {
            ja: {
                text: "お会計を別々にしてもらえますか？",
                phonetic: "O-kaikei o betsubetsu ni shite moraemasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "따로따로 계산해 주세요.",
                phonetic: "Ttarottaro gyesanhae juseyo.",
                speechLang: "ko-KR",
            },
            en: {
                text: "Could you please split the bill into separate receipts?",
                phonetic: "Could you please split the bill?",
                speechLang: "en-US",
            },
            th: {
                text: "ช่วยแยกบิลให้หน่อยได้ไหมคะ?",
                phonetic: "Chuai yaek bin hai noi dai mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "payment_methods",
        category: "tax_free",
        zh: "請問可以使用信用卡或行動支付嗎？",
        translations: {
            ja: {
                text: "クレジットカードや電子マネーは使えますか？",
                phonetic: "Kurejitto kaado ya denshi manee wa tsukaemasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "신용카드나 모바일 간편결제 가능한가요?",
                phonetic: "Sinyongkadeuna mobail gampyeongyeolje ganeunghangayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Do you accept credit cards or mobile payment (Apple Pay)?",
                phonetic: "Do you accept credit cards or mobile pay?",
                speechLang: "en-US",
            },
            th: {
                text: "รับบัตรเครดิตหรือสแกนจ่ายไหมคะ?",
                phonetic: "Rap bat khredit reu scan jai mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "passport_tax_free",
        category: "tax_free",
        zh: "這是我的護照，請幫我辦理免稅手續。",
        translations: {
            ja: {
                text: "パスポートです。免税手続きをお願いします。",
                phonetic: "Pasupooto desu. Menzei tetsuzuki o onegaishimasu.",
                speechLang: "ja-JP",
            },
            ko: {
                text: "여권 여기 있습니다. 면세 처리 부탁드려요.",
                phonetic: "Yeogwon yeogi isseumnida. Myeonse cheori butakdeuryeoyo.",
                speechLang: "ko-KR",
            },
            en: {
                text: "Here is my passport. Please process the tax-free refund.",
                phonetic: "Here is my passport for tax refund.",
                speechLang: "en-US",
            },
            th: {
                text: "นี่คือหนังสือเดินทาง ช่วยทำเรื่องคืนภาษีให้ด้วยนะคะ",
                phonetic: "Nee khue nang sue doen thang chuai tham rueang khuen pha see hai duai na kha",
                speechLang: "th-TH",
            },
        },
    },

    // 2. 🛍️ 包裝袋子 (Bags & Packaging)
    {
        id: "big_bag",
        category: "packaging",
        zh: "請給我一個大一點的袋子。",
        translations: {
            ja: {
                text: "大きめの袋を1枚いただけますか？",
                phonetic: "Ooki-me no fukuro o ichi-mai itadakemasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "큰 봉투 하나 주시겠어요?",
                phonetic: "Keun bongtu hana jusigesseoyo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Could I get a larger shopping bag, please?",
                phonetic: "Could I get a larger bag, please?",
                speechLang: "en-US",
            },
            th: {
                text: "ขอกระเป๋าหรือถุงใบใหญ่กว่านี้ได้ไหมคะ?",
                phonetic: "Khor kra pao reu thung bai yai kwa nee dai mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "no_bag",
        category: "packaging",
        zh: "不需要塑膠袋，我有自備環保袋，謝謝！",
        translations: {
            ja: {
                text: "レジ袋は要りません、エコバッグがあります。ありがとうございます！",
                phonetic: "Rejibukuro wa irimasen, ekobaggu ga arimasu. Arigatou gozaimasu!",
                speechLang: "ja-JP",
            },
            ko: {
                text: "비닐봉투는 필요 없어요, 가방에 넣을게요. 감사합니다!",
                phonetic: "Binilbongtuneun piryo eopseoyo, gabange neoheulgeyo. Gamsahamnida!",
                speechLang: "ko-KR",
            },
            en: {
                text: "No bag needed, I have my own reusable bag. Thank you!",
                phonetic: "No bag needed, thank you!",
                speechLang: "en-US",
            },
            th: {
                text: "ไม่รับถุงพลาสติก มีถุงผ้ามาเองค่ะ ขอบคุณค่ะ!",
                phonetic: "Mai rap thung phlas-tik, mee thung pha ma eng kha. Khop khun kha!",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "gift_wrap",
        category: "packaging",
        zh: "請問可以幫我包裝成送人的禮物嗎？",
        translations: {
            ja: {
                text: "プレゼント用にラッピングしていただけますか？",
                phonetic: "Purezento-you ni rappingu shite itadakemasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "선물용으로 포장해 주실 수 있나요?",
                phonetic: "Seonmuryongeuro pojanghae jusil su innayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Could you wrap this as a gift, please?",
                phonetic: "Could you wrap this as a gift, please?",
                speechLang: "en-US",
            },
            th: {
                text: "ช่วยห่อเป็นของขวัญให้หน่อยได้ไหมคะ?",
                phonetic: "Chuai hor pen khong khwan hai noi dai mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "separate_bags",
        category: "packaging",
        zh: "可以多給我幾個小袋子（送禮用）嗎？",
        translations: {
            ja: {
                text: "お土産用のお小分け袋を何枚かいただけますか？",
                phonetic: "Omiyage-you no owakebukuro o nan-mai ka itadakemasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "선물 나눌 수 있게 작은 봉투 몇 개 더 주실 수 있나요?",
                phonetic: "Seonmul nanul su itge jageun bongtu myeot gae deo jusil su innayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Could I have a few small souvenir bags for gifts?",
                phonetic: "Could I have a few small gift bags?",
                speechLang: "en-US",
            },
            th: {
                text: "ขอถุงใบเล็กๆ เพิ่มสักสองสามใบได้ไหมคะ?",
                phonetic: "Khor thung bai lek lek phoem sak song sam bai dai mai kha?",
                speechLang: "th-TH",
            },
        },
    },

    // 3. 📦 庫存規格 (Stock & Sizes)
    {
        id: "unopened_stock",
        category: "stock",
        zh: "請問這個有未開封的全新庫存嗎？",
        translations: {
            ja: {
                text: "こちら未開封の新しい在庫はありますか？",
                phonetic: "Kochira mikaifuu no atarashii zaiko wa arimasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "이거 미개봉 새 제품 재고 있나요?",
                phonetic: "Igeo migaebong sae jepum jaego innayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Do you have an unopened, brand-new one in stock?",
                phonetic: "Do you have an unopened brand new one?",
                speechLang: "en-US",
            },
            th: {
                text: "มีสินค้าของใหม่ที่ยังไม่แกะในสต็อกไหมคะ?",
                phonetic: "Mee sin kha khong mai thee yang mai kae nai stock mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "warehouse_stock",
        category: "stock",
        zh: "架上沒有了，請問後方倉庫還有現貨嗎？",
        translations: {
            ja: {
                text: "棚にないのですが、バックヤードに在庫はありますか？",
                phonetic: "Tana ni nai no desu ga, bakkuyaado ni zaiko wa arimasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "진열대에 없는데 창고에 재고가 더 남아 있나요?",
                phonetic: "Jinyeoldae-e eomneunde changgo-e jaegoga deo nama innayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "It is out on the shelf, do you have any more in the back?",
                phonetic: "Do you have more in the back?",
                speechLang: "en-US",
            },
            th: {
                text: "บนเชลฟ์หมดแล้ว ในคลังยังมีของเหลืออยู่ไหมคะ?",
                phonetic: "Bon shelf mot laew, nai khlang yang mee khong luea yoo mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "other_color_size",
        category: "stock",
        zh: "請問這個有其他顏色或尺寸嗎？",
        translations: {
            ja: {
                text: "他の色やサイズはありますか？",
                phonetic: "Hoka no iro ya saizu wa arimasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "다른 색상이나 사이즈가 있나요?",
                phonetic: "Dareun saeksang-ina saijeuga innayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Do you have other colors or sizes for this item?",
                phonetic: "Do you have other colors or sizes?",
                speechLang: "en-US",
            },
            th: {
                text: "มีสีอื่นหรือขนาด (ไซส์) อื่นไหมคะ?",
                phonetic: "Mee see eun reu kha nat (size) eun mai kha?",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "try_on",
        category: "stock",
        zh: "請問可以試穿或試用看看嗎？",
        translations: {
            ja: {
                text: "試着（またはテスター）してみてもいいですか？",
                phonetic: "Shichaku (matawa tesutaa) shite mite mo ii desu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "입어보거나 테스트해 봐도 될까요?",
                phonetic: "Ibeobogeona testeuhae bwado doelkkayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "May I try this on / try the tester, please?",
                phonetic: "May I try this on?",
                speechLang: "en-US",
            },
            th: {
                text: "ขอลองใส่หรือลองเทสต์ดูได้ไหมคะ?",
                phonetic: "Khor long sai reu long test doo dai mai kha?",
                speechLang: "th-TH",
            },
        },
    },

    // 4. 🧾 發票憑證 (Receipt & Warranty)
    {
        id: "itemized_receipt",
        category: "receipt",
        zh: "請給我明細收據，謝謝。",
        translations: {
            ja: {
                text: "明細付きのレシートをいただけますか？",
                phonetic: "Meisai-tsuki no reshiito o itadakemasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "상세 영수증 좀 챙겨주시겠어요?",
                phonetic: "Sangse yeongsujeung jom chaenggyeojusigesseoyo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Could I have the itemized receipt, please?",
                phonetic: "Could I have the itemized receipt, please?",
                speechLang: "en-US",
            },
            th: {
                text: "ขอใบเสร็จรับเงินแบบแจกแจงรายการด้วยนะคะ",
                phonetic: "Khor bai set rap ngoen baep jaek jaeng rai kan duai na kha",
                speechLang: "th-TH",
            },
        },
    },
    {
        id: "warranty_global",
        category: "receipt",
        zh: "請問這項商品有國際保固或台灣售後服務嗎？",
        translations: {
            ja: {
                text: "この商品には国際保証（海外サポート）は付いていますか？",
                phonetic: "Kono shouhin ni wa kokusai hoshou wa tsuite imasu ka?",
                speechLang: "ja-JP",
            },
            ko: {
                text: "이 상품은 국제 보증(Global Warranty)이 적용되나요?",
                phonetic: "I sangpumeun gukje bojeung-i jeokyongdoenayo?",
                speechLang: "ko-KR",
            },
            en: {
                text: "Does this product come with an international warranty?",
                phonetic: "Does this product come with international warranty?",
                speechLang: "en-US",
            },
            th: {
                text: "สินค้านี้มีประกันระหว่างประเทศหรือเปล่าคะ?",
                phonetic: "Sin kha nee mee pra kan ra wang pra thet reu plao kha?",
                speechLang: "th-TH",
            },
        },
    },
];

/**
 * Filter phrases by category and optional search keyword
 */
export function getPhrasesByCategory(
    category: PhraseCategoryKey | "all",
    searchQuery: string = "",
    lang: ClerkLanguageKey = "ja"
): ClerkPhraseItem[] {
    const q = searchQuery.toLowerCase().trim();
    return CLERK_PHRASES.filter((item) => {
        if (category !== "all" && item.category !== category) return false;
        if (!q) return true;

        const trans = item.translations[lang];
        return (
            item.zh.toLowerCase().includes(q) ||
            trans.text.toLowerCase().includes(q) ||
            trans.phonetic.toLowerCase().includes(q)
        );
    });
}
