import React, { ChangeEvent } from "react";
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
} from "lucide-react";
import type { PlaceVM, RecommendedItem } from "../../models/types/PlaceTypes";
import { CURRENCIES } from "../../constants/Currencies";

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

// --- 推薦品項分頁組件 ---
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
    };

    const handleDeleteItem = (index: number) => {
        const updated = items.filter((_, i) => i !== index);
        onFormInputChange({
            target: {
                name: "info.recommended_items",
                value: updated,
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20">
                <div className="flex items-center gap-2">
                    <Utensils size={18} className="text-amber-500" />
                    <div>
                        <h4 className="text-sm font-bold text-foreground">
                            {isShopping ? "🛍️ 推薦購買商品 / 必買清單" : "🍽️ 推薦菜單 / 必點品項"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            支援中文名、當地原文與發音拼音，出國點餐直接出示或發音
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs shrink-0 cursor-pointer"
                >
                    <Plus size={14} /> 新增品項
                </button>
            </div>

            {items.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-border/80 rounded-2xl bg-card/40 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <Utensils size={20} />
                    </div>
                    <div className="text-sm font-medium text-foreground">尚無推薦品項</div>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        可記錄網友推薦的招牌料理、限定商品或人氣必點，出國對照超省時！
                    </p>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-colors mt-2 cursor-pointer"
                    >
                        <Plus size={14} /> 新增第一筆推薦
                    </button>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {items.map((item, idx) => {
                        // 解析價格與幣別
                        const parts = (item.price || "").match(/^([A-Z]{3})?\s*(.*)$/);
                        let itemCurrency = localCurrency || "JPY";
                        let itemAmount = item.price || "";

                        if (parts && parts[1] && knownCurrencies.includes(parts[1])) {
                            itemCurrency = parts[1];
                            itemAmount = parts[2];
                        }
                        itemAmount = itemAmount.replace(/^[¥$€₩NT£฿krfr]+\s*/i, "").trim();

                        return (
                            <div
                                key={idx}
                                className="bg-card border border-border/80 p-3.5 rounded-2xl space-y-3 shadow-xs transition-all hover:border-primary/40"
                            >
                                {/* 第 1 行：編號 + 分類標籤 + 中文名稱 + 幣別金額 + 刪除 */}
                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                        {idx + 1}
                                    </span>

                                    {/* 分類標籤 */}
                                    <select
                                        value={item.category || (isShopping ? "🎁 必買伴手禮" : "⭐ 必點招牌")}
                                        onChange={(e) => handleUpdateItem(idx, "category", e.target.value)}
                                        className="bg-muted text-foreground text-xs px-2.5 py-1.5 rounded-xl outline-none cursor-pointer shrink-0 border border-border/60 font-semibold"
                                    >
                                        <option value="⭐ 必點招牌">⭐ 必點招牌</option>
                                        <option value="🔥 人氣推薦">🔥 人氣推薦</option>
                                        <option value="🌸 季節限定">🌸 季節限定</option>
                                        <option value="🎁 必買伴手禮">🎁 必買伴手禮</option>
                                        <option value="👨‍🍳 主廚推薦">👨‍🍳 主廚推薦</option>
                                        <option value="🍰 甜點飲品">🍰 甜點飲品</option>
                                        <option value="🏷️ 自訂推薦">🏷️ 自訂推薦</option>
                                    </select>

                                    {/* 中文 / 主要名稱 */}
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
                                        placeholder={isShopping ? "中文/商品名稱 (例：晴王麝香葡萄大福)" : "中文/品項名稱 (例：招牌特厚炸豬排定食)"}
                                        className="flex-1 min-w-[150px] bg-transparent border-b border-border/70 py-1 text-sm font-bold text-foreground outline-none focus:border-primary"
                                    />

                                    {/* 金額與幣別（含千分位） */}
                                    <div className="flex items-center gap-1 bg-muted/40 border border-border/60 px-2 py-1 rounded-xl shrink-0">
                                        <select
                                            value={itemCurrency}
                                            onChange={(e) => {
                                                const newCurr = e.target.value;
                                                const updatedPrice = itemAmount ? `${newCurr} ${itemAmount}` : newCurr;
                                                handleUpdateItem(idx, "price", updatedPrice);
                                            }}
                                            className="bg-transparent text-xs font-mono font-bold text-foreground outline-none cursor-pointer"
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
                                                const raw = e.target.value.replace(/,/g, "");
                                                const formatted = raw.replace(/\d+/g, (match) =>
                                                    parseInt(match, 10).toLocaleString("en-US")
                                                );
                                                const updatedPrice = formatted ? `${itemCurrency} ${formatted}` : itemCurrency;
                                                handleUpdateItem(idx, "price", updatedPrice);
                                            }}
                                            placeholder="金額 (例: 1,800)"
                                            className="w-24 bg-transparent text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 outline-none text-right"
                                        />
                                    </div>

                                    {/* 刪除按鈕 */}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteItem(idx)}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                                        title="刪除品項"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                {/* 第 2 行：當地原文名稱 + 羅馬拼音/讀音發音 */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                                    <div className="flex items-center gap-1.5 bg-muted/20 border border-border/50 px-2.5 py-1.5 rounded-xl">
                                        <Languages size={12} className="text-purple-500 shrink-0" />
                                        <input
                                            type="text"
                                            value={item.native_name || ""}
                                            onChange={(e) => handleUpdateItem(idx, "native_name", e.target.value)}
                                            placeholder="當地原文 (例：厚切りとんかつ定食，選填)"
                                            className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-muted/20 border border-border/50 px-2.5 py-1.5 rounded-xl">
                                        <Volume2 size={12} className="text-indigo-500 shrink-0" />
                                        <input
                                            type="text"
                                            value={item.romaji || ""}
                                            onChange={(e) => handleUpdateItem(idx, "romaji", e.target.value)}
                                            placeholder="羅馬拼音 / 讀音 (例：Atsugiri Tonkatsu，選填)"
                                            className="w-full bg-transparent text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/60"
                                        />
                                    </div>
                                </div>

                                {/* 第 3 行：推薦原因與備註 */}
                                <div className="pt-0.5">
                                    <input
                                        type="text"
                                        value={item.note || ""}
                                        onChange={(e) => handleUpdateItem(idx, "note", e.target.value)}
                                        placeholder="推薦原因 / 點餐備註 (例：肉汁超多、每日限量 30 份、可免費續高麗菜絲)"
                                        className="w-full bg-transparent text-xs text-muted-foreground outline-none border-b border-border/40 focus:border-primary py-1"
                                    />
                                </div>
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
        <div className="space-y-5">
            {/* 人均消費預算 */}
            <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <DollarSign size={13} className="text-emerald-500" />
                    <span>人均預算 / 消費價位</span>
                </label>
                <div className="flex items-center gap-2 border-b border-border focus-within:border-primary transition-colors pb-1">
                    {(() => {
                        const knownCurrencies = CURRENCIES.map((c) => c.code);
                        const parts = (formData?.info?.price || "").match(/^([A-Z]{3})?\s*(.*)$/);
                        let currency = localCurrency || "JPY"; // 預設使用旅程當地幣別
                        let amount = formData?.info?.price || "";

                        if (parts && parts[1] && knownCurrencies.includes(parts[1])) {
                            currency = parts[1];
                            amount = parts[2];
                        }

                        amount = amount.replace(/^[¥$€₩NT£฿krfr]+\s*/i, "").trim();

                        return (
                            <>
                                <select
                                    className="bg-muted text-foreground px-2 py-1 rounded-lg text-xs font-mono font-bold outline-none cursor-pointer border border-border/60"
                                    value={currency}
                                    onChange={(e) => {
                                        const newCurr = e.target.value;
                                        const event = {
                                            target: { name: "info.price", value: `${newCurr} ${amount}` },
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
                                        const raw = e.target.value.replace(/,/g, "");
                                        const formatted = raw.replace(/\d+/g, (match) =>
                                            parseInt(match, 10).toLocaleString("en-US")
                                        );
                                        const event = {
                                            target: { name: "info.price", value: `${currency} ${formatted}` },
                                        } as any;
                                        onFormInputChange(event);
                                    }}
                                    placeholder="例如: 2,000 - 3,000 / 人"
                                    className="flex-1 bg-transparent py-1.5 outline-none font-[Noto_Sans_TC] text-sm text-foreground min-w-0"
                                />
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* 評價分數與評論來源 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card border border-border/80 p-4 rounded-2xl">
                <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Star size={12} className="text-amber-500" />
                        <span>評價分數</span>
                    </label>
                    <input
                        name="info.rating"
                        value={formData?.info?.rating || ""}
                        onChange={onFormInputChange}
                        placeholder="如: 4.6"
                        className="w-full bg-transparent border-b border-border py-1.5 outline-none font-mono text-sm text-foreground focus:border-primary"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        評價人數
                    </label>
                    <input
                        name="info.rating_count"
                        value={(formData?.info?.rating_count || "").toString().replace(/\d+/g, (match) =>
                            parseInt(match, 10).toLocaleString("en-US")
                        )}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            const formatted = raw.replace(/\d+/g, (match) =>
                                parseInt(match, 10).toLocaleString("en-US")
                            );
                            const event = { target: { name: "info.rating_count", value: formatted } } as any;
                            onFormInputChange(event);
                        }}
                        placeholder="如: 1,200"
                        className="w-full bg-transparent border-b border-border py-1.5 outline-none font-mono text-sm text-foreground focus:border-primary"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        評分來源
                    </label>
                    <select
                        name="info.rating_source"
                        value={formData?.info?.rating_source || ""}
                        onChange={onFormInputChange}
                        className="w-full bg-transparent dark:bg-background border-b border-border py-1.5 outline-none text-sm text-foreground focus:border-primary cursor-pointer"
                    >
                        <option value="" className="bg-background text-foreground">請選擇</option>
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

            {/* 預約與購票狀態 + 連結 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card border border-border/80 p-4 rounded-2xl">
                <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Ticket size={13} className="text-emerald-500" />
                        <span>預約 / 購票狀態</span>
                    </label>
                    <select
                        name="info.booking_status"
                        value={formData.info?.booking_status || ""}
                        onChange={onFormInputChange}
                        className="w-full bg-transparent dark:bg-background border-b border-border py-1.5 text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                        <option value="" className="bg-background text-foreground">無需特別註明</option>
                        <option value="none" className="bg-background text-foreground">🟢 免預約 / 自由入場</option>
                        <option value="recommended" className="bg-background text-foreground">🟡 建議提前預約 / 網路訂位</option>
                        <option value="required" className="bg-background text-foreground">🔴 必須提前預約 (需票券憑證)</option>
                        <option value="walk_in" className="bg-background text-foreground">🚶 現場排隊領號碼牌</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <ExternalLink size={13} className="text-blue-500" />
                        <span>預約 / 購票連結</span>
                    </label>
                    <input
                        type="text"
                        name="info.booking_url"
                        value={formData.info?.booking_url || ""}
                        onChange={onFormInputChange}
                        placeholder="https://... (Klook / KKday / 官網)"
                        className="w-full bg-transparent border-b border-border py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* 官方網站 / 社群連結 */}
            <div className="bg-card border border-border/80 p-4 rounded-2xl">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    <Globe size={13} className="text-purple-500" />
                    <span>官方網站 / 社群連結 (Instagram, 官網)</span>
                </label>
                <input
                    type="text"
                    name="info.website_url"
                    value={formData.info?.website_url || ""}
                    onChange={onFormInputChange}
                    placeholder="https://..."
                    className="w-full bg-transparent border-b border-border py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary"
                />
            </div>

            {/* 支援支付方式 */}
            <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <CreditCard size={13} className="text-amber-500" />
                    <span>支援支付方式 (可多選)</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {COMMON_PAYMENT_METHODS.map((method) => {
                        const isSelected = paymentList.includes(method);
                        return (
                            <button
                                key={method}
                                type="button"
                                onClick={() => togglePayment(method)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                                    isSelected
                                        ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold"
                                        : "bg-muted/50 border-border text-muted-foreground hover:border-border/80"
                                }`}
                            >
                                {method}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 便利設施標籤 */}
            <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Wifi size={13} className="text-teal-500" />
                    <span>便利設施標籤 (可多選)</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {COMMON_AMENITIES.map((amenity) => {
                        const isSelected = amenitiesList.includes(amenity);
                        return (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                                    isSelected
                                        ? "bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300 font-semibold"
                                        : "bg-muted/50 border-border text-muted-foreground hover:border-border/80"
                                }`}
                            >
                                {amenity}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
