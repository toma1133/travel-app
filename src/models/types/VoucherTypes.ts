export type VoucherCategory =
    | "immigration" // 入境申報 (Visit Japan Web / Q-Code)
    | "flight"      // 機票登機證 (Boarding Pass)
    | "transport"   // 鐵路交通券 (Train / Metro / Bus)
    | "ticket"      // 景點門票 (Attraction / Museum / Theme park)
    | "hotel"       // 飯店憑證 (Hotel / Booking)
    | "esim"        // eSIM 開通碼 (eSIM / SIM)
    | "other";      // 其他憑證 (Other)

export interface VoucherCategoryConfig {
    id: VoucherCategory;
    label: string;
    icon: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
}

export const VOUCHER_CATEGORIES: Record<VoucherCategory, VoucherCategoryConfig> = {
    immigration: {
        id: "immigration",
        label: "入境申報",
        icon: "🇯🇵",
        description: "Visit Japan Web / Q-Code 申報碼",
        badgeBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
        badgeText: "text-rose-600 dark:text-rose-400",
        borderColor: "border-rose-500/30",
    },
    flight: {
        id: "flight",
        label: "機票登機",
        icon: "✈️",
        description: "航空公司登機證與報到憑證",
        badgeBg: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
        badgeText: "text-sky-600 dark:text-sky-400",
        borderColor: "border-sky-500/30",
    },
    transport: {
        id: "transport",
        label: "交通車票",
        icon: "🚄",
        description: "鐵路周遊券、特急指定席、巴士 QR",
        badgeBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
        badgeText: "text-indigo-600 dark:text-indigo-400",
        borderColor: "border-indigo-500/30",
    },
    ticket: {
        id: "ticket",
        label: "景點門票",
        icon: "🎟️",
        description: "主題樂園、觀景台、博物館電子票",
        badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        badgeText: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-500/30",
    },
    hotel: {
        id: "hotel",
        label: "住宿憑證",
        icon: "🏨",
        description: "飯店訂房代碼、Check-in QR",
        badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        badgeText: "text-emerald-600 dark:text-emerald-400",
        borderColor: "border-emerald-500/30",
    },
    esim: {
        id: "esim",
        label: "eSIM 上網",
        icon: "📶",
        description: "手機 eSIM 開通條碼、漫遊啟用碼",
        badgeBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
        badgeText: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-500/30",
    },
    other: {
        id: "other",
        label: "其他憑證",
        icon: "📄",
        description: "購物優惠券、行李寄送碼等其他憑證",
        badgeBg: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
        badgeText: "text-slate-600 dark:text-slate-400",
        borderColor: "border-slate-500/30",
    },
};

export interface VoucherItem {
    id: string;
    trip_id: string;
    title: string;                 // 票券名稱
    category: VoucherCategory;     // 票券分類
    code?: string;                 // 憑證代碼 / 訂位代號 / PIN 碼 (支援一鍵複製)
    qr_content?: string;           // 向量 QR 碼內容 (URL 或文字代碼，0 KB 免存圖片)
    image_id?: string;             // 關聯至 ImageVaultDB 的截圖圖檔 ID
    valid_date?: string;           // 有效日期 (YYYY-MM-DD 或 YYYY-MM-DD HH:mm)
    notes?: string;                // 備註說明
    created_at: string;
    updated_at: string;
}

export interface VoucherTemplatePreset {
    title: string;
    category: VoucherCategory;
    placeholderCode?: string;
    placeholderQR?: string;
    notes?: string;
}

export const VOUCHER_TEMPLATE_PRESETS: VoucherTemplatePreset[] = [
    {
        title: "Visit Japan Web 入境審查 & 申報",
        category: "immigration",
        placeholderQR: "https://www.vjw.digital.go.jp/",
        notes: "下飛機檢疫與入境海關審查出示",
    },
    {
        title: "電子機票登機證",
        category: "flight",
        placeholderCode: "BR198 / NH108",
        notes: "登機門或自助報到機掃描",
    },
    {
        title: "JR Pass 鐵路周遊券兌換碼",
        category: "transport",
        placeholderCode: "JRP-12345678",
        notes: "綠色窗口或指定售票機領取實體票",
    },
    {
        title: "景點門票 QR Code (Klook / KKday)",
        category: "ticket",
        placeholderCode: "KLK-883921",
        notes: "景點驗票口直接感應掃描入場",
    },
    {
        title: "eSIM 國際上網開通條碼",
        category: "esim",
        placeholderQR: "LPA:1$smdp.example.com$ACTIVATION-CODE",
        notes: "飛機降落後開啟相機掃描加入行動方案",
    },
    {
        title: "飯店 Check-in 預訂確認",
        category: "hotel",
        placeholderCode: "BOOKING-994821",
        notes: "櫃台登記入住出示",
    },
];
