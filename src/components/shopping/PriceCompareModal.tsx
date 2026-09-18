import React, { useState } from "react";
import {
    X,
    Plus,
    Trash2,
    Copy,
    Check,
    TrendingDown,
    Calculator,
    Store,
    Users,
} from "lucide-react";
import type {
    ShoppingItemVM,
    ShoppingRecord,
} from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";
import { getCurrencySymbol, getCurrencyName } from "../../utils/CurrencyUtil";

type PriceCompareModalProps = {
    item: ShoppingItemVM;
    tripData?: TripVM | null;
    onSaveRecords: (records: ShoppingRecord[]) => void;
    onClose: () => void;
};

const PriceCompareModal = ({
    item,
    tripData,
    onSaveRecords,
    onClose,
}: PriceCompareModalProps) => {
    const [records, setRecords] = useState<ShoppingRecord[]>(
        () => item.records || []
    );
    const [newStore, setNewStore] = useState(item.store || "");
    const [newPrice, setNewPrice] = useState("");
    const [newQuantity, setNewQuantity] = useState("1");
    const [copied, setCopied] = useState(false);

    // Currency configuration
    const localCurrency =
        item.currency || tripData?.settings_config?.localCurrency || "JPY";
    const homeCurrency = tripData?.settings_config?.homeCurrency || "TWD";
    const exchangeRate = tripData?.settings_config?.exchangeRate || 0;
    const localSymbol = getCurrencySymbol(localCurrency);
    const homeSymbol = getCurrencySymbol(homeCurrency);

    // Calculate total quantity and weighted sum
    const totalQuantity = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalAmount = records.reduce(
        (sum, r) => sum + (r.price || 0) * (r.quantity || 0),
        0
    );
    const averagePrice =
        totalQuantity > 0 ? Math.round(totalAmount / totalQuantity) : 0;

    // Find lowest price
    const lowestPriceRecord =
        records.length > 0
            ? [...records].sort((a, b) => a.price - b.price)[0]
            : null;

    const handleAddRecord = (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(newPrice);
        const qtyNum = parseInt(newQuantity, 10);
        if (isNaN(priceNum) || priceNum <= 0) return;
        if (isNaN(qtyNum) || qtyNum <= 0) return;

        const newRecord: ShoppingRecord = {
            id: crypto.randomUUID(),
            store: newStore.trim() || "未知店家",
            price: priceNum,
            quantity: qtyNum,
            date: new Date().toISOString().split("T")[0],
        };

        const updated = [...records, newRecord];
        setRecords(updated);
        onSaveRecords(updated);
        setNewPrice("");
        setNewQuantity("1");
    };

    const handleDeleteRecord = (idx: number) => {
        const updated = records.filter((_, i) => i !== idx);
        setRecords(updated);
        onSaveRecords(updated);
    };

    // User Story 5: 一鍵生成並複製請款明細
    const handleCopySummary = () => {
        const recipientsList = item.recipients?.length ? item.recipients : ["自己"];
        const perPersonQty =
            totalQuantity > 0
                ? (totalQuantity / recipientsList.length).toFixed(1)
                : 0;
        const perPersonAmount =
            recipientsList.length > 0
                ? Math.round(totalAmount / recipientsList.length)
                : 0;

        const lines = [
            `【${item.name} 採購比價與分攤明細】`,
            item.local_name ? `🌐 外文品名：${item.local_name}` : "",
            item.target_specs ? `🔖 規格/色號：${item.target_specs}` : "",
            `────────────────────`,
            `🛒 分批採購紀錄：`,
            ...records.map(
                (r, i) =>
                    `  ${i + 1}. [${r.store}] 單價 ${localSymbol}${r.price.toLocaleString()} × ${r.quantity} 件 = ${localSymbol}${(r.price * r.quantity).toLocaleString()}`
            ),
            `────────────────────`,
            `📊 採購統計：`,
            `  • 總採購數量：${totalQuantity} 件`,
            `  • 總採購金額：${localSymbol}${totalAmount.toLocaleString()}${exchangeRate > 0 && localCurrency !== homeCurrency ? ` (≈ ${homeSymbol}${Math.round(totalAmount * exchangeRate).toLocaleString()} ${homeCurrency})` : ""}`,
            `  • 加權均價：${localSymbol}${averagePrice.toLocaleString()} / 件`,
            lowestPriceRecord
                ? `  • 最低單價門市：${lowestPriceRecord.store} (${localSymbol}${lowestPriceRecord.price.toLocaleString()})`
                : "",
            `────────────────────`,
            `👥 受贈/代購對象分攤明細：`,
            ...recipientsList.map(
                (rec) =>
                    `  • ${rec}：約 ${perPersonQty} 件，應付金額 ${localSymbol}${perPersonAmount.toLocaleString()}${exchangeRate > 0 && localCurrency !== homeCurrency ? ` (折合約 ${homeSymbol}${Math.round(perPersonAmount * exchangeRate).toLocaleString()})` : ""}`
            ),
            `────────────────────`,
            exchangeRate > 0 && localCurrency !== homeCurrency
                ? `* 匯率參考約 ${exchangeRate} (${localCurrency} -> ${homeCurrency})，實際請款以刷卡扣款當日帳單或約定為準。`
                : "",
        ].filter(Boolean);

        const text = lines.join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleCopyBillingSummary = handleCopySummary;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-sans"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground border border-border/80 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Calculator size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                                跨店比價與加權均價
                            </h3>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                                {item.name}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                    {/* Summary Card */}
                    <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-muted/40 border border-border/60">
                        <div>
                            <div className="text-[11px] text-muted-foreground font-medium">
                                加權平均單價
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5">
                                {localSymbol}{averagePrice.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                                共採購 {totalQuantity} 件 (總計 {localSymbol}{totalAmount.toLocaleString()})
                                {exchangeRate > 0 && localCurrency !== homeCurrency && (
                                    <span className="block font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                        ≈ {homeSymbol}{Math.round(totalAmount * exchangeRate).toLocaleString()} {homeCurrency}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                <TrendingDown size={12} className="text-emerald-500" />
                                門市最殺低價
                            </div>
                            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500 mt-0.5">
                                {lowestPriceRecord
                                    ? `${localSymbol}${lowestPriceRecord.price.toLocaleString()}`
                                    : "尚未紀錄"}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                                {lowestPriceRecord ? `@ ${lowestPriceRecord.store}` : "輸入紀錄自動比價"}
                            </div>
                        </div>
                    </div>

                    {/* Records List */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                            <span>門市採購/報價紀錄 ({records.length})</span>
                            <span className="text-[10px] font-normal">加權計算均價</span>
                        </div>

                        {records.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/70">
                                尚無跨店比價資料，請於下方新增在各店家看見的價格
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {records.map((rec, idx) => {
                                    const isLowest =
                                        lowestPriceRecord &&
                                        rec.price === lowestPriceRecord.price;
                                    return (
                                        <div
                                            key={rec.id || idx}
                                            className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                                                isLowest
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                                                    : "bg-background border-border/70 text-foreground"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Store size={14} className="text-muted-foreground shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="font-bold flex items-center gap-1.5 truncate">
                                                        <span>{rec.store}</span>
                                                        {isLowest && (
                                                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500 text-white shrink-0">
                                                                最低
                                                            </span>
                                                        )}
                                                    </div>
                                                    {rec.date && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {rec.date}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right font-mono">
                                                    <div className="font-black text-foreground">
                                                        {localSymbol}{rec.price.toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        × {rec.quantity} 件
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRecord(idx)}
                                                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="刪除紀錄"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add Record Form */}
                    <form onSubmit={handleAddRecord} className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 space-y-2">
                        <div className="text-xs font-bold text-foreground flex items-center gap-1">
                            <Plus size={13} />
                            <span>新增採購紀錄 / 店家報價</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="店家 (如: 松本清)"
                                value={newStore}
                                onChange={(e) => setNewStore(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-card border border-border rounded-xl text-foreground outline-none"
                            />
                            <input
                                type="number"
                                placeholder={`單價 (${localCurrency} ${localSymbol})`}
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-card border border-border rounded-xl text-foreground outline-none font-mono"
                                required
                            />
                            <div className="flex gap-1.5">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="數量"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(e.target.value)}
                                    className="w-16 px-2 py-1.5 text-xs bg-card border border-border rounded-xl text-foreground outline-none font-mono text-center"
                                />
                                <button
                                    type="submit"
                                    className="flex-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    加入
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer with One-Click Copy Billing Summary */}
                <div className="p-4 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleCopyBillingSummary}
                        disabled={records.length === 0}
                        className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            copied
                                ? "bg-emerald-500 text-white"
                                : "bg-foreground text-background hover:opacity-90"
                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? "已複製明細到剪貼簿！" : "複製請款明細 (貼至 LINE)"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-2xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceCompareModal;
