import React, { ChangeEvent, useState, useRef, useEffect } from "react";
import {
    Utensils,
    Plus,
    Trash2,
    Clock,
    Train,
    Ticket,
    ExternalLink,
    Globe,
    CreditCard,
    Wifi,
    Sparkles,
    DollarSign,
    Star,
    CalendarX,
    MapPin,
    Phone,
    ImageIcon,
    MapIcon,
    Tag,
    X,
    Check,
    Navigation,
    Languages,
    Volume2,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
} from "lucide-react";
import type { PlaceVM, RecommendedItem } from "../../models/types/PlaceTypes";
import { CURRENCIES } from "../../constants/Currencies";
import { formatThousands, handleThousandsInputChange } from "../../utils/numberFormat";
import { detectLanguage, playPronunciation } from "../../utils/SpeechLanguageUtil";

export const COMMON_PAYMENT_METHODS = [
    "僅收現金 (Cash Only)",
    "信用卡 (Credit Card)",
    "交通IC卡 (Suica/Pasmo/悠遊卡)",
    "PayPay",
    "Apple Pay",
    "LINE Pay",
];

export const COMMON_AMENITIES = [
    "免費 Wi-Fi",
    "充電插座",
    "行李寄存 / 置物櫃",
    "全面禁菸",
    "洗手間",
    "無障礙設施",
    "寵物友善",
    "雨天備案 (室內)",
];

// --- 推薦品項分頁組件 (Apple HIG Inset Grouped Accordion List) ---
export const RecommendedItemsSection = ({
    formData,
    localCurrency = "JPY",
    onFormInputChange,
}: {
    formData: PlaceVM;
    localCurrency?: string;
    onFormInputChange: (e: any) => void;
}) => {
    const items: RecommendedItem[] = formData.info?.recommended_items || [];
    const isShopping = formData.type === "shopping";
    const knownCurrencies = CURRENCIES.map((c) => c.code);
    const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

    // 折疊狀態管理：記錄展開的索引集合 (預設展開第 1 筆)
    const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({ 0: true });
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const toggleExpand = (index: number) => {
        setExpandedIndices((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const toggleExpandAll = () => {
        const allExpanded = items.every((_, i) => expandedIndices[i]);
        const newState: Record<number, boolean> = {};
        items.forEach((_, i) => {
            newState[i] = !allExpanded;
        });
        setExpandedIndices(newState);
    };

    const handleSpeakItem = (item: RecommendedItem, idx: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!item.native_name) return;
        playPronunciation(item.native_name, {
            context: {
                address: formData?.info?.loc,
                mapUrl: formData.map_url,
                currency: localCurrency,
            },
            onStart: () => setSpeakingIdx(idx),
            onEnd: () => setSpeakingIdx(null),
            onError: () => setSpeakingIdx(null),
        });
    };

    const handleUpdateItem = (index: number, field: keyof RecommendedItem, value: string) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onFormInputChange({
            target: {
                name: "info.recommended_items",
                value: updated,
            },
        });
    };

    const handleAddItem = () => {
        const defaultCat = isShopping ? "🎁 必買伴手禮" : "⭐ 必點招牌";
        const newIndex = items.length;
        const updated = [
            ...items,
            {
                name: "",
                native_name: "",
                romaji: "",
                price: "",
                category: defaultCat,
                note: "",
            },
        ];
        onFormInputChange({
            target: {
                name: "info.recommended_items",
                value: updated,
            },
        });

        // 自動展開新項目
        setExpandedIndices((prev) => ({
            ...prev,
            [newIndex]: true,
        }));

        // 平滑滾動到新增的卡片位置
        setTimeout(() => {
            if (itemRefs.current[newIndex]) {
                itemRefs.current[newIndex]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        }, 80);
    };

    const handleDeleteItem = (index: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const updated = items.filter((_, i) => i !== index);
        onFormInputChange({
            target: {
                name: "info.recommended_items",
                value: updated,
            },
        });
    };

    const isAllExpanded = items.length > 0 && items.every((_, i) => expandedIndices[i]);

    return (
        <div className="space-y-3">
            {/* 頂部控制列 (數量徽章 + 全部展開/收合 + 新增按鈕) */}
            <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {isShopping ? "必買清單 (SHOPPING)" : "必點推薦 (RECOMMENDED)"}
                    </span>
                    {items.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold border border-blue-500/20">
                            共 {items.length} 項
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {items.length > 1 && (
                        <button
                            type="button"
                            onClick={toggleExpandAll}
                            className="flex items-center gap-1 px-2.5 py-1 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer border border-border/50"
                        >
                            <ChevronsUpDown size={12} />
                            <span>{isAllExpanded ? "全部收合" : "全部展開"}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                    >
                        <Plus size={13} /> 新增品項
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border/80 p-8 text-center space-y-2.5 shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                        <Utensils size={20} />
                    </div>
                    <div className="font-bold text-sm text-foreground">
                        {isShopping ? "尚無推薦商品" : "尚無推薦菜單"}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        可記錄網友大推的招牌料理、限定商品或人氣必點，出國點餐直接出示或播放語音！
                    </p>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-all shadow-xs cursor-pointer active:scale-95 mt-1"
                    >
                        <Plus size={14} /> 新增第一筆品項
                    </button>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {items.map((item, idx) => {
                        const isExpanded = !!expandedIndices[idx];

                        // 解析價格與幣別
                        const parts = (item.price || "").match(/^([A-Z]{3})?\s*(.*)$/);
                        let itemCurrency = localCurrency || "JPY";
                        let itemAmount = item.price || "";

                        if (parts && parts[1] && knownCurrencies.includes(parts[1])) {
                            itemCurrency = parts[1];
                            itemAmount = parts[2];
                        }
                        itemAmount = itemAmount.replace(/^[¥$€₩NT£฿krfr]+\s*/i, "").trim();

                        const detectedLang = detectLanguage(item.native_name, {
                            currency: itemCurrency,
                        });

                        return (
                            <div
                                key={idx}
                                ref={(el) => {
                                    itemRefs.current[idx] = el;
                                }}
                                className={`rounded-2xl bg-card border transition-all shadow-2xs overflow-hidden ${
                                    isExpanded
                                        ? "border-border/90 divide-y divide-border/60 ring-1 ring-blue-500/20"
                                        : "border-border/70 hover:border-border"
                                }`}
                            >
                                {/* 📱 iOS 摺疊式摘要標題列 (點擊可切換展開/收合) */}
                                <div
                                    onClick={() => toggleExpand(idx)}
                                    className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/15 cursor-pointer select-none transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                                            {idx + 1}
                                        </span>

                                        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-xs text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                                                {item.name || (
                                                    <span className="text-muted-foreground/60 italic font-normal">
                                                        {isShopping ? "未命名商品" : "未命名品項"}
                                                    </span>
                                                )}
                                            </span>

                                            {item.native_name && (
                                                <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px] hidden sm:inline-block">
                                                    · {item.native_name}
                                                </span>
                                            )}

                                            {item.category && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold shrink-0">
                                                    {item.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 右側：金額摘要 + 發音按鈕 + 展開指示箭頭 + 刪除按鈕 */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {itemAmount && (
                                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {itemCurrency} {itemAmount}
                                            </span>
                                        )}

                                        {item.native_name && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleSpeakItem(item, idx, e)}
                                                disabled={speakingIdx === idx}
                                                className={`p-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                                                    speakingIdx === idx
                                                        ? "bg-blue-500 text-white border-blue-500 animate-pulse"
                                                        : "bg-muted/40 text-blue-500 border-border/70 hover:bg-blue-500/10"
                                                }`}
                                                title={`發音 (${detectedLang.flag} ${detectedLang.name})`}
                                            >
                                                <Volume2 size={13} />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteItem(idx, e)}
                                            className="p-1 text-muted-foreground/60 hover:text-rose-500 transition-colors cursor-pointer"
                                            title="刪除品項"
                                        >
                                            <Trash2 size={13} />
                                        </button>

                                        <span className="text-muted-foreground/60 p-0.5">
                                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </span>
                                    </div>
                                </div>

                                {/* 展開後的詳細 Inset Grouped 表單內容 */}
                                {isExpanded && (
                                    <div className="divide-y divide-border/60 text-xs animate-in slide-in-from-top-2 duration-150 bg-card">
                                        {/* 1. 品項/商品名稱 */}
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                                <span>{isShopping ? "商品名稱" : "品項名稱"}</span>
                                                <span className="text-rose-500 font-bold">*</span>
                                            </span>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
                                                placeholder={isShopping ? "例: 麝香葡萄大福" : "例: 特厚炸豬排定食"}
                                                className="min-w-0 flex-1 text-left font-bold text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>

                                        {/* 2. 當地原文 + 🔊 智慧發音按鈕 */}
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                                <Languages size={13} className="text-purple-500" />
                                                <span>當地原文</span>
                                            </span>
                                            <div className="min-w-0 flex-1 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item.native_name || ""}
                                                    onChange={(e) => handleUpdateItem(idx, "native_name", e.target.value)}
                                                    placeholder={isShopping ? "例: マスカット大福" : "例: 厚切りとんかつ"}
                                                    className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                                />
                                                {item.native_name && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleSpeakItem(item, idx, e)}
                                                        disabled={speakingIdx === idx}
                                                        className={`p-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                                                            speakingIdx === idx
                                                                ? "bg-blue-500 text-white border-blue-500 animate-pulse"
                                                                : "bg-muted/40 text-blue-500 border-border/70 hover:bg-blue-500/10"
                                                        }`}
                                                        title={`點擊發音 (${detectedLang.flag} ${detectedLang.name})`}
                                                    >
                                                        <Volume2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. 讀音拼音 / 英文 */}
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                                讀音拼音
                                            </span>
                                            <input
                                                type="text"
                                                value={item.romaji || ""}
                                                onChange={(e) => handleUpdateItem(idx, "romaji", e.target.value)}
                                                placeholder="例: Atsugiri Tonkatsu"
                                                className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>

                                        {/* 4. 金額與幣別 */}
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                                <DollarSign size={13} className="text-emerald-500" />
                                                <span>預估金額</span>
                                            </span>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <select
                                                    value={itemCurrency}
                                                    onChange={(e) => {
                                                        const newCurr = e.target.value;
                                                        const cleanItemAmount = itemAmount.trim();
                                                        const updatedPrice = cleanItemAmount ? `${newCurr} ${cleanItemAmount}` : "";
                                                        handleUpdateItem(idx, "price", updatedPrice);
                                                    }}
                                                    className="bg-muted/40 text-foreground text-xs font-mono font-bold px-2 py-1 rounded-xl outline-none cursor-pointer border border-border/60"
                                                >
                                                    {CURRENCIES.map((c) => (
                                                        <option key={c.code} value={c.code} className="bg-background text-foreground">
                                                            {c.code}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    value={itemAmount}
                                                    onChange={(e) => {
                                                        handleThousandsInputChange(
                                                            e,
                                                            (formatted) => {
                                                                const cleanFormatted = formatted.trim();
                                                                const updatedPrice = cleanFormatted ? `${itemCurrency} ${cleanFormatted}` : "";
                                                                handleUpdateItem(idx, "price", updatedPrice);
                                                            },
                                                            { allowDecimal: true }
                                                        );
                                                    }}
                                                    placeholder="例: 1,800"
                                                    className="w-24 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-transparent outline-none placeholder:text-muted-foreground/40"
                                                />
                                            </div>
                                        </div>

                                        {/* 5. 分類推薦標籤 (選填) */}
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                                <Tag size={13} className="text-amber-500" />
                                                <span>推薦標籤</span>
                                            </span>
                                            <select
                                                value={item.category || (isShopping ? "🎁 必買伴手禮" : "⭐ 必點招牌")}
                                                onChange={(e) => handleUpdateItem(idx, "category", e.target.value)}
                                                className="bg-muted/30 text-foreground text-xs font-semibold px-2.5 py-1 rounded-xl outline-none cursor-pointer border border-border/60"
                                            >
                                                <option value="⭐ 必點招牌">⭐ 必點招牌</option>
                                                <option value="🔥 人氣推薦">🔥 人氣推薦</option>
                                                <option value="🌸 季節限定">🌸 季節限定</option>
                                                <option value="🎁 必買伴手禮">🎁 必買伴手禮</option>
                                                <option value="👨‍🍳 主廚推薦">👨‍🍳 主廚推薦</option>
                                                <option value="🍰 甜點飲品">🍰 甜點飲品</option>
                                                <option value="🏷️ 自訂推薦">🏷️ 自訂推薦</option>
                                                <option value="">（無標籤）</option>
                                            </select>
                                        </div>

                                        {/* 6. 推薦備註與原因 */}
                                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium">
                                                推薦備註
                                            </span>
                                            <input
                                                type="text"
                                                value={item.note || ""}
                                                onChange={(e) => handleUpdateItem(idx, "note", e.target.value)}
                                                placeholder="例: 招牌必點、每日限量 30 份"
                                                className="min-w-0 flex-1 text-left font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- 預算與細節分頁組件 ---
export const BudgetAndDetailsSection = ({
    formData,
    localCurrency = "JPY",
    onFormInputChange,
}: {
    formData: PlaceVM;
    localCurrency?: string;
    onFormInputChange: (e: any) => void;
}) => {
    const rawPayment = formData.info?.payment_methods;
    const paymentList: string[] = Array.isArray(rawPayment)
        ? rawPayment
        : typeof rawPayment === "string"
        ? rawPayment.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const togglePayment = (method: string) => {
        const updated = paymentList.includes(method)
            ? paymentList.filter((m) => m !== method)
            : [...paymentList, method];
        onFormInputChange({
            target: {
                name: "info.payment_methods",
                value: updated,
            },
        });
    };

    const rawAmenities = formData.info?.amenities;
    const amenitiesList: string[] = Array.isArray(rawAmenities)
        ? rawAmenities
        : typeof rawAmenities === "string"
        ? rawAmenities.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const toggleAmenity = (amenity: string) => {
        const updated = amenitiesList.includes(amenity)
            ? amenitiesList.filter((a) => a !== amenity)
            : [...amenitiesList, amenity];
        onFormInputChange({
            target: {
                name: "info.amenities",
                value: updated,
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* 💰 預算與評分 */}
            <div className="rounded-2xl bg-card border border-border/80 divide-y divide-border/50 text-xs overflow-hidden shadow-2xs">
                {/* 人均預算 */}
                <div className="p-3 sm:p-3.5 space-y-2.5">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                        <DollarSign size={13} className="text-emerald-500" />
                        <span>人均預算 / 消費價位</span>
                    </span>
                    <div className="flex items-center gap-2">
                        {(() => {
                            const knownCurrencies = CURRENCIES.map((c) => c.code);
                            const parts = (formData?.info?.price || "").match(/^([A-Z]{3})?\s*(.*)$/);
                            let currency = localCurrency || "JPY";
                            let amount = formData?.info?.price || "";

                            if (parts && parts[1] && knownCurrencies.includes(parts[1])) {
                                currency = parts[1];
                                amount = parts[2];
                            }

                            amount = amount.replace(/^[¥$€₩NT£฿krfr]+\s*/i, "").trim();

                            return (
                                <>
                                    <select
                                        className="bg-muted/40 text-foreground px-2.5 py-2 rounded-xl text-xs font-mono font-bold outline-none cursor-pointer border border-border/60 shrink-0"
                                        value={currency}
                                        onChange={(e) => {
                                            const newCurr = e.target.value;
                                            const cleanAmount = amount.trim();
                                            const event = {
                                                target: { name: "info.price", value: cleanAmount ? `${newCurr} ${cleanAmount}` : "" },
                                            } as any;
                                            onFormInputChange(event);
                                        }}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c.code} value={c.code} className="bg-background text-foreground">
                                                {c.code} ({c.label})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        name="info.price"
                                        value={amount}
                                        onChange={(e) => {
                                            handleThousandsInputChange(
                                                e,
                                                (formatted) => {
                                                    const cleanFormatted = formatted.trim();
                                                    const event = {
                                                        target: { name: "info.price", value: cleanFormatted ? `${currency} ${cleanFormatted}` : "" },
                                                    } as any;
                                                    onFormInputChange(event);
                                                },
                                                { isFreeText: true }
                                            );
                                        }}
                                        placeholder="例：2,000 - 3,000 / 人"
                                        className="flex-1 bg-muted/20 border border-border/60 focus:border-primary focus:bg-background rounded-xl px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/45 transition-all min-w-0"
                                    />
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* 評價分數與評論來源 */}
                <div className="p-3 sm:p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/5">
                    <div className="space-y-1.5">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1">
                            <Star size={12} className="text-amber-500" />
                            <span>評價分數</span>
                        </span>
                        <input
                            name="info.rating"
                            value={formData?.info?.rating || ""}
                            onChange={onFormInputChange}
                            placeholder="例: 4.6"
                            className="w-full bg-muted/20 border border-border/60 focus:border-primary focus:bg-background rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/45 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-muted-foreground font-semibold block">
                            評價人數
                        </span>
                        <input
                            name="info.rating_count"
                            value={formData?.info?.rating_count ? formatThousands(formData.info.rating_count, false) : ""}
                            onChange={(e) => {
                                handleThousandsInputChange(
                                    e,
                                    (formatted) => {
                                        const event = { target: { name: "info.rating_count", value: formatted } } as any;
                                        onFormInputChange(event);
                                    },
                                    { allowDecimal: false }
                                );
                            }}
                            placeholder="例: 1,200"
                            className="w-full bg-muted/20 border border-border/60 focus:border-primary focus:bg-background rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/45 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-muted-foreground font-semibold block">
                            評分來源
                        </span>
                        <select
                            name="info.rating_source"
                            value={formData?.info?.rating_source || ""}
                            onChange={onFormInputChange}
                            className="w-full bg-muted/20 dark:bg-background border border-border/60 focus:border-primary rounded-xl px-2.5 py-2 text-xs text-foreground outline-none cursor-pointer transition-all"
                        >
                            <option value="" className="bg-background text-foreground">請選擇來源</option>
                            {(formData.type === "hotel" || formData.type === "stay"
                                ? ["Google", "Agoda", "Booking.com", "TripAdvisor", "Airbnb"]
                                : formData.type === "food" || formData.type === "restaurant" || formData.type === "cafe"
                                ? ["Google", "Tabelog", "TripAdvisor", "米其林指南", "Yelp"]
                                : ["Google", "TripAdvisor", "Yelp"]
                            ).map((preset) => (
                                <option key={preset} value={preset} className="bg-background text-foreground">
                                    {preset}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 🎫 預約與外部連結 */}
            <div className="rounded-2xl bg-card border border-border/80 divide-y divide-border/50 text-xs overflow-hidden shadow-2xs">
                <div className="p-3 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1">
                            <Ticket size={13} className="text-emerald-500" />
                            <span>預約 / 購票狀態</span>
                        </span>
                        <select
                            name="info.booking_status"
                            value={formData.info?.booking_status || ""}
                            onChange={onFormInputChange}
                            className="w-full bg-muted/20 dark:bg-background border border-border/60 focus:border-primary rounded-xl px-2.5 py-2 text-xs text-foreground outline-none cursor-pointer transition-all"
                        >
                            <option value="" className="bg-background text-foreground">無需特別註明</option>
                            <option value="none" className="bg-background text-foreground">🟢 免預約 / 自由入場</option>
                            <option value="recommended" className="bg-background text-foreground">🟡 建議提前預約 / 網路訂位</option>
                            <option value="required" className="bg-background text-foreground">🔴 必須提前預約 (需票券憑證)</option>
                            <option value="walk_in" className="bg-background text-foreground">🚶 現場排隊領號碼牌</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1">
                            <ExternalLink size={13} className="text-blue-500" />
                            <span>預約 / 購票連結</span>
                        </span>
                        <input
                            type="text"
                            name="info.booking_url"
                            value={formData.info?.booking_url || ""}
                            onChange={onFormInputChange}
                            placeholder="https://... (Klook/KKday/官網)"
                            className="w-full bg-muted/20 border border-border/60 focus:border-primary focus:bg-background rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/45 transition-all"
                        />
                    </div>
                </div>

                <div className="p-3 sm:p-3.5 space-y-1.5 bg-muted/5">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Globe size={13} className="text-purple-500" />
                        <span>官方網站 / 社群連結 (Instagram / 官網)</span>
                    </span>
                    <input
                        type="text"
                        name="info.website_url"
                        value={formData.info?.website_url || ""}
                        onChange={onFormInputChange}
                        placeholder="https://..."
                        className="w-full bg-muted/20 border border-border/60 focus:border-primary focus:bg-background rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/45 transition-all"
                    />
                </div>
            </div>

            {/* 💳 支援支付方式與便利設施 */}
            <div className="rounded-2xl bg-card border border-border/80 divide-y divide-border/50 text-xs overflow-hidden shadow-2xs">
                {/* 支援支付方式 */}
                <div className="p-3.5 sm:p-4 space-y-3">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                        <CreditCard size={14} className="text-amber-500" />
                        <span>支援支付方式 (可多選)</span>
                    </span>
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-0.5">
                        {COMMON_PAYMENT_METHODS.map((method) => {
                            const isSelected = paymentList.includes(method);
                            return (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => togglePayment(method)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                                        isSelected
                                            ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-2xs scale-105"
                                            : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
                                    }`}
                                >
                                    {method}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 便利設施標籤 */}
                <div className="p-3.5 sm:p-4 space-y-3 bg-muted/5">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Wifi size={14} className="text-teal-500" />
                        <span>便利設施標籤 (可多選)</span>
                    </span>
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-0.5">
                        {COMMON_AMENITIES.map((amenity) => {
                            const isSelected = amenitiesList.includes(amenity);
                            return (
                                <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => toggleAmenity(amenity)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                                        isSelected
                                            ? "bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300 shadow-2xs scale-105"
                                            : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
                                    }`}
                                >
                                    {amenity}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
