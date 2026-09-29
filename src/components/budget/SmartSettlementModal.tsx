import React, { useState, useMemo } from "react";
import {
    X,
    CheckCircle2,
    ArrowRight,
    Copy,
    Check,
    Share2,
    Sparkles,
    Users,
    TrendingUp,
    TrendingDown,
    ArrowDownRight,
    ArrowUpRight,
} from "lucide-react";
import { Session } from "@supabase/supabase-js";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { ProfileRow } from "../../models/types/ProfileTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";
import type { TripSettingConf, TripThemeConf } from "../../models/types/TripTypes";
import {
    calculateSimplifiedDebts,
    SettlementReport,
} from "../../utils/DebtSimplifierUtil";

export interface SmartSettlementModalProps {
    budgets?: BudgetRow[];
    profiles?: ProfileRow[];
    tripMembers?: TripMemberVM[];
    tripTitle?: string;
    session?: Session | null;
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    convertToHome: (
        amount: number,
        currency: string,
        homeCurrency?: string,
        exchangeRate?: number
    ) => number;
    convertToLocal: (
        amount: number,
        currency: string,
        localCurrency?: string,
        exchangeRate?: number
    ) => number;
    onClose: () => void;
}

export const SmartSettlementModal: React.FC<SmartSettlementModalProps> = ({
    budgets = [],
    profiles = [],
    tripMembers = [],
    tripTitle = "旅程",
    session,
    setting,
    theme,
    convertToHome,
    convertToLocal,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<"settlement" | "balances">("settlement");
    const [hasCopied, setHasCopied] = useState<boolean>(false);

    // 計算最少轉帳次數平帳演算法報告
    const report: SettlementReport = useMemo(() => {
        return calculateSimplifiedDebts(budgets, profiles, tripMembers, {
            tripTitle,
            currency: setting?.homeCurrency || "TWD",
            exchangeRate: setting?.exchangeRate || 1,
            convertToBaseCurrency: (amount, currency) =>
                convertToHome(
                    amount,
                    currency,
                    setting?.homeCurrency,
                    setting?.exchangeRate
                ),
        });
    }, [budgets, profiles, tripMembers, tripTitle, setting, convertToHome]);

    const handleCopyLine = async () => {
        try {
            await navigator.clipboard.writeText(report.lineMessageText);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2500);
        } catch (err) {
            console.error("複製失敗:", err);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `【${tripTitle}】旅費平帳建議`,
                    text: report.lineMessageText,
                });
            } catch (err) {
                // User cancelled or unsupported
            }
        } else {
            handleCopyLine();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 border border-border/80 flex flex-col max-h-[92vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 行動把手 */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* 導航列 */}
                <div className="px-5 py-3.5 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight text-foreground">
                                分帳結算中心
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-mono">
                                Smart Debt Settlement
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 化簡成效統計膠囊 */}
                <div className="px-5 pt-3.5 pb-2 shrink-0">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                最少轉帳抵銷結果
                            </div>
                            <div className="text-base font-black text-foreground flex items-center gap-1.5 mt-0.5">
                                <span>只需 {report.simplifiedCount} 筆轉帳</span>
                                {report.savingsPercent > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                                        化簡率 {report.savingsPercent}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-mono text-muted-foreground">
                                旅程總支出
                            </div>
                            <div className="text-sm font-mono font-bold text-foreground">
                                {setting?.homeCurrency} {report.totalExpense.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* 分頁切換 */}
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl mt-3 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab("settlement")}
                            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                                activeTab === "settlement"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            轉帳建議 ({report.settlements.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("balances")}
                            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                                activeTab === "balances"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            各員淨收支表 ({report.memberBalances.length})
                        </button>
                    </div>
                </div>

                {/* 內容滑動區 */}
                <div className="overflow-y-auto no-scrollbar px-5 py-3 space-y-3 flex-1">
                    {activeTab === "settlement" && (
                        <>
                            {report.settlements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
                                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <h4 className="font-bold text-foreground text-sm mb-1">
                                        全員帳目已平坦
                                    </h4>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        目前沒有任何需要互相轉帳的項目，所有墊付與分攤皆已抵銷完畢！
                                    </p>
                                </div>
                            ) : (
                                report.settlements.map((s, idx) => (
                                    <div
                                        key={s.id || idx}
                                        className="bg-card rounded-2xl p-4 shadow-sm border border-border/70 flex flex-col gap-3 group hover:border-emerald-500/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            {/* 付款人 */}
                                            <div className="flex flex-col items-center gap-1.5 w-16">
                                                <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center text-xs font-black shadow-xs">
                                                    {s.fromName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[11px] font-bold text-foreground w-full text-center truncate">
                                                    {s.fromName}
                                                </span>
                                            </div>

                                            {/* 轉帳箭頭與金額標籤 */}
                                            <div className="flex-1 flex flex-col items-center justify-center px-3">
                                                {session?.user?.id && (s.fromId === session.user.id || s.toId === session.user.id) && (
                                                    <span
                                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                                                            s.fromId === session.user.id
                                                                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                                                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                        }`}
                                                    >
                                                        {s.fromId === session.user.id ? "你需要支付" : "你需要收回"}
                                                    </span>
                                                )}
                                                <div className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {setting?.homeCurrency}
                                                    </span>
                                                    {s.amount.toLocaleString()}
                                                </div>
                                                {setting?.localCurrency &&
                                                    setting.localCurrency !== setting.homeCurrency && (
                                                        <div className="text-[10px] text-muted-foreground font-mono">
                                                            ≈ {setting.localCurrency}{" "}
                                                            {convertToLocal(
                                                                s.amount,
                                                                setting.homeCurrency!,
                                                                setting.localCurrency,
                                                                setting.exchangeRate
                                                            ).toLocaleString()}
                                                        </div>
                                                    )}
                                                <div className="flex items-center w-full relative mt-1.5">
                                                    <div className="h-[2px] bg-emerald-500/30 w-full rounded-full" />
                                                    <ArrowRight
                                                        size={14}
                                                        className="text-emerald-500 absolute right-0 -mr-1"
                                                    />
                                                </div>
                                                <span className="text-[9px] text-muted-foreground mt-1">
                                                    第 {idx + 1} 筆轉帳
                                                </span>
                                            </div>

                                            {/* 收款人 */}
                                            <div className="flex flex-col items-center gap-1.5 w-16">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-black shadow-xs">
                                                    {s.toName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[11px] font-bold text-foreground w-full text-center truncate">
                                                    {s.toName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {activeTab === "balances" && (
                        <div className="space-y-2.5">
                            {report.memberBalances.map((mb) => {
                                const isPositive = mb.netBalance > 0;
                                const isZero = Math.abs(mb.netBalance) === 0;

                                return (
                                    <div
                                        key={mb.userId}
                                        className="bg-card rounded-2xl p-3.5 border border-border/70 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center font-bold text-xs shrink-0">
                                                {mb.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs truncate text-foreground">
                                                    {mb.userName}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                                                    <span>墊付: ${mb.totalPaid.toLocaleString()}</span>
                                                    <span>•</span>
                                                    <span>應攤: ${mb.totalOwed.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div
                                                className={`text-xs font-mono font-bold flex items-center gap-0.5 justify-end ${
                                                    isZero
                                                        ? "text-muted-foreground"
                                                        : isPositive
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-rose-600 dark:text-rose-400"
                                                }`}
                                            >
                                                {isPositive && <ArrowUpRight size={12} />}
                                                {!isPositive && !isZero && <ArrowDownRight size={12} />}
                                                <span>
                                                    {isPositive ? "+" : ""}
                                                    {mb.netBalance.toLocaleString()} {setting?.homeCurrency}
                                                </span>
                                            </div>
                                            <div className="text-[9px] text-muted-foreground">
                                                {isZero ? "收支平衡" : isPositive ? "應收回" : "應支付"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 底部操作工具列 */}
                <div className="px-5 py-3.5 border-t border-border/70 bg-card/90 backdrop-blur-md flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleCopyLine}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 ${
                            hasCopied
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        }`}
                    >
                        {hasCopied ? (
                            <>
                                <Check size={15} />
                                <span>已複製 LINE 結算訊息！</span>
                            </>
                        ) : (
                            <>
                                <Copy size={15} />
                                <span>複製 LINE 結算訊息</span>
                            </>
                        )}
                    </button>

                    {typeof navigator !== "undefined" && (navigator as any).share && (
                        <button
                            type="button"
                            onClick={handleNativeShare}
                            className="p-2.5 rounded-xl border border-border/80 bg-muted/50 hover:bg-muted text-foreground transition-colors cursor-pointer"
                            title="分享"
                        >
                            <Share2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartSettlementModal;
