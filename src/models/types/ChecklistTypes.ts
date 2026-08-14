export type ChecklistCategory = "documents" | "electronics" | "clothing" | "medicine" | "other";

export type ChecklistItem = {
    id: string;
    category: ChecklistCategory;
    title: string;
    isCompleted: boolean;
    assignee?: string;
};

export const CHECKLIST_CATEGORIES: { id: ChecklistCategory; label: string; icon: string }[] = [
    { id: "documents", label: "重要證件與卡片", icon: "🪪" },
    { id: "electronics", label: "3C 與充電設備", icon: "🔌" },
    { id: "clothing", label: "衣物與個人用品", icon: "👕" },
    { id: "medicine", label: "常備藥品與防疫", icon: "💊" },
    { id: "other", label: "其他雜項", icon: "🧳" },
];

export const DEFAULT_CHECKLIST_ITEMS: Omit<ChecklistItem, "id">[] = [
    { category: "documents", title: "護照 (效期6個月以上)", isCompleted: false },
    { category: "documents", title: "身分證 / 駕照 / 國際駕照", isCompleted: false },
    { category: "documents", title: "外幣現金 / 信用卡", isCompleted: false },
    { category: "documents", title: "機票 / 飯店預訂憑證影本", isCompleted: false },
    
    { category: "electronics", title: "手機與充電線", isCompleted: false },
    { category: "electronics", title: "行動電源 (需隨身攜帶)", isCompleted: false },
    { category: "electronics", title: "萬國轉接頭 / 變壓器", isCompleted: false },
    { category: "electronics", title: "網卡 / Wi-Fi 分享器", isCompleted: false },

    { category: "clothing", title: "換洗衣物與內著", isCompleted: false },
    { category: "clothing", title: "舒適走路鞋 / 拖鞋", isCompleted: false },
    { category: "clothing", title: "雨傘 / 折疊雨具", isCompleted: false },

    { category: "medicine", title: "個人常用藥 / 腸胃藥 / 止痛藥", isCompleted: false },
    { category: "medicine", title: "口罩 / 綠油精 / 貼布", isCompleted: false },
];
