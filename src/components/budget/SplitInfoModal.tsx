import { MouseEventHandler, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { ProfileRow } from "../../models/types/ProfileTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";

type SplitInfoModalProps = {
    budgets?: BudgetRow[];
    profiles?: ProfileRow[];
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
    budgets,
    profiles,
    session,
    setting,
    theme,
    convertToHome,
    convertToLocal,
    onCloseBtnClick,
}: SplitInfoModalProps) => {
    const settlements = useMemo(() => {
        const balances: { [key: string]: number } = {};

        // Reset
        profiles?.forEach((p) => (balances[p.id] = 0));

        budgets?.forEach((exp) => {
            const amountInBase = convertToHome(
                exp.amount,
                exp.currency_code,
                setting?.homeCurrency,
                setting?.exchangeRate
            );
            const splitList = [exp.user_id].concat(
                exp.split_with ? [...exp.split_with] : []
            );
            const perPersonAmount =
                splitList.length > 0
                    ? amountInBase / splitList.length
                    : amountInBase;

            if (balances[exp.user_id] !== undefined) {
                balances[exp.user_id] += amountInBase;
            }

            splitList.forEach((personId) => {
                if (balances[personId] !== undefined) {
                    balances[personId] -= perPersonAmount;
                }
            });
        });

        const transactions: {
            fromId: string;
            fromName: string;
            toId: string;
            toName: string;
            amount: number;
        }[] = [];
        const creditors: {
            id: string;
            name: string;
            amount: number;
        }[] = [];
        const debtors: {
            id: string;
            name: string;
            amount: number;
        }[] = [];

        Object.keys(balances).forEach((id) => {
            const profile = profiles?.find((p) => p.id === id);
            const name = profile ? profile.username : id;
            const amount = balances[id];

            if (amount > 0.1) {
                creditors.push({ id, name: name!, amount });
            } else if (amount < -0.1) {
                debtors.push({ id, name: name!, amount: Math.abs(amount) });
            }
        });

        let i = 0,
            j = 0;
        const tDebtors: { id: string; name: string; amount: number }[] =
            JSON.parse(JSON.stringify(debtors));
        const tCreditors: { id: string; name: string; amount: number }[] =
            JSON.parse(JSON.stringify(creditors));

        while (i < tDebtors.length && j < tCreditors.length) {
            const payAmount = Math.min(
                tDebtors[i].amount,
                tCreditors[j].amount
            );

            transactions.push({
                fromId: tDebtors[i].id,
                fromName: tDebtors[i].name,
                toId: tCreditors[j].id,
                toName: tCreditors[j].name,
                amount: payAmount,
            });

            tDebtors[i].amount -= payAmount;
            tCreditors[j].amount -= payAmount;

            if (tDebtors[i].amount < 0.1) i++;
            if (tCreditors[j].amount < 0.1) j++;
        }

        return transactions;
    }, [budgets]);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div
                className={`bg-card w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom border border-border flex flex-col max-h-[85vh]`}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-border/50 p-6">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-foreground">
                            結算中心
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Settlement Overview</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                {/* Body - Scrollable */}
                <div className="overflow-y-auto custom-scrollbar p-6 space-y-4 flex-1">
                    {settlements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h4 className="font-bold text-foreground mb-1">無待結算帳款</h4>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                恭喜！目前所有的帳目都已經結清，<br/>沒有任何需要支付或收回的款項。
                            </p>
                        </div>
                    ) : (
                        settlements.map((s, idx) => {
                            const isIOWE = s.fromId === session?.user.id;

                            return (
                                <div
                                    key={idx}
                                    className="bg-background rounded-2xl p-5 shadow-sm border border-border/60 flex flex-col gap-4 relative overflow-hidden group hover:border-border transition-colors"
                                >
                                    {/* Top: Users flow */}
                                    <div className="flex items-center justify-between relative z-10">
                                        {/* From User */}
                                        <div className="flex flex-col items-center gap-1.5 w-16">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isIOWE ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground border border-border'}`}>
                                                {s.fromName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground w-full text-center truncate">{s.fromName}</span>
                                        </div>
                                        
                                        {/* Arrow & Label */}
                                        <div className="flex-1 flex flex-col items-center justify-center px-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${isIOWE ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                                {isIOWE ? "你需要支付" : "你需要收回"}
                                            </span>
                                            <div className="flex items-center w-full relative">
                                                <div className="h-[2px] bg-border w-full rounded-full"></div>
                                                <ArrowRight size={14} className="text-muted-foreground absolute right-0 -mr-1" />
                                            </div>
                                        </div>

                                        {/* To User */}
                                        <div className="flex flex-col items-center gap-1.5 w-16">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${!isIOWE ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground border border-border'}`}>
                                                {s.toName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground w-full text-center truncate">{s.toName}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Bottom: Amount */}
                                    <div className={`flex flex-col items-center justify-center rounded-xl py-3 border relative z-10 ${isIOWE ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50' : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50'}`}>
                                        <div className={`font-mono font-black text-2xl tracking-tight ${isIOWE ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                            <span className="text-sm mr-1 font-bold">{setting?.homeCurrency}</span>
                                            {s.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                            ≈ {setting?.localCurrency} {convertToLocal(s.amount, setting?.homeCurrency!, setting?.localCurrency, setting?.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SplitInfoModal;
