import { MouseEventHandler, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { X } from "lucide-react";
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
                className={`${theme?.bg} w-full max-w-sm rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom border border-gray-600`}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800">
                        結算中心
                    </h3>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Body - Scrollable */}
                <div className="overflow-y-auto no-scrollbar space-y-3 px-6 max-h-[50vh]">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        {settlements.length === 0 ? (
                            <div className="text-center py-10 flex flex-col items-center gap-3">
                                <p className="text-slate-400 text-sm font-medium">
                                    恭喜！你目前的帳務已結清
                                </p>
                            </div>
                        ) : (
                            settlements.map((s, idx) => {
                                const isIOWE = s.fromId === session?.user.id;

                                return (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-center"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {isIOWE
                                                    ? s.toName
                                                          .charAt(0)
                                                          .toUpperCase()
                                                    : s.fromName
                                                          .charAt(0)
                                                          .toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">
                                                {isIOWE
                                                    ? `你應支付給 ${s.toName}`
                                                    : `你應收回自 ${s.fromName}`}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold">
                                            <div
                                                className={`font-mono font-bold text-lg ${
                                                    isIOWE
                                                        ? "text-rose-600"
                                                        : "text-emerald-600"
                                                }`}
                                            >
                                                {setting?.homeCurrency}{" "}
                                                {s.amount.toLocaleString(
                                                    undefined,
                                                    { maximumFractionDigits: 0 }
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                ≈ {setting?.localCurrency}{" "}
                                                {convertToLocal(
                                                    s.amount,
                                                    setting?.homeCurrency!,
                                                    setting?.localCurrency,
                                                    setting?.exchangeRate
                                                ).toLocaleString()}
                                            </div>
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end space-x-3"></div>
            </div>
        </div>
    );
};

export default SplitInfoModal;
