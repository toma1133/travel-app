import { MouseEventHandler, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import {
    CheckCircle2,
    ArrowRight,
    Copy,
    Check,
    Sparkles,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Share2,
} from "lucide-react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { ProfileRow } from "../../models/types/ProfileTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import {
    calculateSimplifiedDebts,
    SettlementReport,
} from "../../utils/DebtSimplifierUtil";

type SplitInfoModalProps = {
    budgets?: BudgetRow[];
    profiles?: ProfileRow[];
    tripMembers?: TripMemberVM[];
    tripTitle?: string;
    session: Session | null;
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
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
};

const SplitInfoModal = ({
    budgets = [],
    profiles = [],
    tripMembers = [],
    tripTitle = "旅程",
    session,
    setting,
    theme,
    convertToHome,
    convertToLocal,
    onCloseBtnClick,
}: SplitInfoModalProps) => {
    const [activeTab, setActiveTab] = useState<"smart" | "balances">("smart");
    const [hasCopied, setHasCopied] = useState<boolean>(false);

    // 透過最少轉帳平帳演算法計算報告
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

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
            <div
                className="bg-card text-card-foreground w-full max-w-sm sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 border border-border/80 flex flex-col max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* 📱 iOS 原生導航列 */}
                <div className="px-4 py-3 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0">
                    <span className="w-12" />

                    <div className="text-center min-w-0">
                        <h3 className="text-sm font-black tracking-tight text-foreground flex items-center justify-center gap-1.5">
                            <Sparkles size={14} className="text-emerald-500" />
                            <span>分帳結算中心</span>
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-mono">
                            Smart Debt Settlement
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                        完成
                    </button>
                </div>

                {/* 頁籤切換：最少轉帳 vs 各員結餘 */}
                <div className="px-4 pt-3 pb-1 shrink-0">
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab("smart")}
                            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                                activeTab === "smart"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span>最少轉帳</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                {report.settlements.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("balances")}
                            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                                activeTab === "balances"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span>各員淨收支</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                                {report.memberBalances.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="overflow-y-auto no-scrollbar p-4 space-y-3 flex-1">
                    {activeTab === "smart" && (
                        <>
                            {report.settlements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h4 className="font-bold text-foreground mb-1">
                                        無待結算帳款
                                    </h4>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        恭喜！目前所有的帳目都已經結清，
                                        <br />
                                        沒有任何需要支付或收回的款項。
                                    </p>
                                </div>
                            ) : (
                                report.settlements.map((s, idx) => {
                                    const isIOWE = s.fromId === session?.user.id;
                                    const isOwingMe = s.toId === session?.user.id;

                                    return (
                                        <div
                                            key={s.id || idx}
                                            className="bg-background rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col gap-3 relative overflow-hidden group hover:border-emerald-500/50 transition-colors"
                                        >
                                            {/* Top: Users flow */}
                                            <div className="flex items-center justify-between relative z-10">
                                                {/* From User */}
                                                <div className="flex flex-col items-center gap-1.5 w-16">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                                                            isIOWE
                                                                ? "bg-rose-500 text-white"
                                                                : "bg-muted text-foreground border border-border"
                                                        }`}
                                                    >
                                                        {s.fromName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-foreground w-full text-center truncate">
                                                        {s.fromName}
                                                    </span>
                                                </div>

                                                {/* Arrow & Label */}
                                                <div className="flex-1 flex flex-col items-center justify-center px-2">
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                                                            isIOWE
                                                                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                                                                : isOwingMe
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                                : "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {isIOWE
                                                            ? "你需要支付"
                                                            : isOwingMe
                                                            ? "你需要收回"
                                                            : "平帳轉帳"}
                                                    </span>
                                                    <div className="flex items-center w-full relative">
                                                        <div className="h-[2px] bg-border w-full rounded-full"></div>
                                                        <ArrowRight
                                                            size={14}
                                                            className="text-muted-foreground absolute right-0 -mr-1"
                                                        />
                                                    </div>
                                                </div>

                                                {/* To User */}
                                                <div className="flex flex-col items-center gap-1.5 w-16">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                                                            isOwingMe
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-muted text-foreground border border-border"
                                                        }`}
                                                    >
                                                        {s.toName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-foreground w-full text-center truncate">
                                                        {s.toName}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom: Amount */}
                                            <div
                                                className={`flex flex-col items-center justify-center rounded-xl py-2.5 border relative z-10 ${
                                                    isIOWE
                                                        ? "bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50"
                                                        : isOwingMe
                                                        ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                                                        : "bg-muted/30 border-border/60"
                                                }`}
                                            >
                                                <div
                                                    className={`font-mono font-black text-xl tracking-tight ${
                                                        isIOWE
                                                            ? "text-rose-600 dark:text-rose-400"
                                                            : isOwingMe
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    <span className="text-xs mr-1 font-bold">
                                                        {setting?.homeCurrency}
                                                    </span>
                                                    {s.amount.toLocaleString(undefined, {
                                                        maximumFractionDigits: 0,
                                                    })}
                                                </div>
                                                {setting?.localCurrency &&
                                                    setting.localCurrency !== setting.homeCurrency && (
                                                        <div className="text-[9px] text-muted-foreground font-medium mt-0.5 font-mono">
                                                            ≈ {setting.localCurrency}{" "}
                                                            {convertToLocal(
                                                                s.amount,
                                                                setting.homeCurrency!,
                                                                setting.localCurrency,
                                                                setting.exchangeRate
                                                            ).toLocaleString(undefined, {
                                                                maximumFractionDigits: 0,
                                                            })}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    );
                                })
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
                                        className="bg-background rounded-2xl p-3.5 border border-border/70 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs shrink-0">
                                                {mb.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs truncate text-foreground">
                                                    {mb.userName}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                                    <span>墊: ${mb.totalPaid.toLocaleString()}</span>
                                                    <span>•</span>
                                                    <span>攤: ${mb.totalOwed.toLocaleString()}</span>
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

                {/* 底部一鍵複製 LINE 訊息 */}
                {report.settlements.length > 0 && (
                    <div className="p-3.5 border-t border-border/70 bg-card/90 backdrop-blur-md shrink-0">
                        <button
                            type="button"
                            onClick={handleCopyLine}
                            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 ${
                                hasCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                            }`}
                        >
                            {hasCopied ? (
                                <>
                                    <Check size={14} />
                                    <span>已複製 LINE 結算訊息！</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={14} />
                                    <span>複製 LINE 結算訊息 ({report.settlements.length} 筆最少轉帳)</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SplitInfoModal;
