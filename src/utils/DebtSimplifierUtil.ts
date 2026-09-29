import type { BudgetRow } from "../models/types/BudgetTypes";
import type { ProfileRow } from "../models/types/ProfileTypes";
import type { TripMemberVM } from "../models/types/TripMemberTypes";

export interface MemberBalance {
    userId: string;
    userName: string;
    avatar?: string;
    totalPaid: number;      // 總墊付金額
    totalOwed: number;      // 總應付/分攤金額
    netBalance: number;     // 淨結餘 (totalPaid - totalOwed)
}

export interface SimplifiedSettlement {
    id: string;
    fromId: string;
    fromName: string;
    fromAvatar?: string;
    toId: string;
    toName: string;
    toAvatar?: string;
    amount: number;
}

export interface SettlementReport {
    tripTitle: string;
    currency: string;
    totalExpense: number;
    memberBalances: MemberBalance[];
    settlements: SimplifiedSettlement[];
    rawTransactionCount: number;
    simplifiedCount: number;
    savingsPercent: number;
    lineMessageText: string;
}

export interface CalculateDebtOptions {
    tripTitle?: string;
    currency?: string;
    exchangeRate?: number;
    convertToBaseCurrency?: (amount: number, currency: string) => number;
}

/**
 * 智慧平帳核心演算法（Greedy Balance Settlement）
 * 計算每位成員的淨餘額並抵銷環形債務，將轉帳筆數壓縮至最少 (最多 N-1 筆)
 */
export function calculateSimplifiedDebts(
    budgets: BudgetRow[] = [],
    profiles: ProfileRow[] = [],
    tripMembers: TripMemberVM[] = [],
    options: CalculateDebtOptions = {}
): SettlementReport {
    const currency = options.currency || "TWD";
    const tripTitle = options.tripTitle || "旅程";

    // 建立 Profile 查詢字典供查找稱呼與大頭貼
    const profileLookup = new Map<string, ProfileRow>();
    profiles.forEach((p) => {
        if (p.id) profileLookup.set(p.id, p);
    });

    // 建立此旅程專屬成員清單 (嚴格僅納入 tripMembers 與實際出現在帳目中的成員)
    const memberMap = new Map<string, { name: string; avatar?: string }>();

    // 1. 納入此旅程之正式成員 tripMembers
    tripMembers.forEach((tm) => {
        if (tm.user_id) {
            const p = profileLookup.get(tm.user_id);
            memberMap.set(tm.user_id, {
                name: tm.profiles?.username || p?.username || tm.user_id.slice(0, 6),
                avatar: tm.profiles?.avatar_url || p?.avatar_url || undefined,
            });
        }
    });

    // 2. 若有出現在此旅程帳本中的代墊人或分攤人，亦納入解析
    budgets.forEach((exp) => {
        if (exp.user_id && !memberMap.has(exp.user_id)) {
            const p = profileLookup.get(exp.user_id);
            memberMap.set(exp.user_id, {
                name: p?.username || exp.user_id.slice(0, 6),
                avatar: p?.avatar_url || undefined,
            });
        }
        (exp.split_with || []).forEach((uid) => {
            if (uid && !memberMap.has(uid)) {
                const p = profileLookup.get(uid);
                memberMap.set(uid, {
                    name: p?.username || uid.slice(0, 6),
                    avatar: p?.avatar_url || undefined,
                });
            }
        });
    });

    // 統計各成員總花費與總墊付
    const paidMap = new Map<string, number>();
    const owedMap = new Map<string, number>();
    let totalExpense = 0;

    // 初始化成員名單
    memberMap.forEach((_, id) => {
        paidMap.set(id, 0);
        owedMap.set(id, 0);
    });

    budgets.forEach((exp) => {
        const baseAmount = options.convertToBaseCurrency
            ? options.convertToBaseCurrency(exp.amount, exp.currency_code)
            : exp.amount;

        totalExpense += baseAmount;

        // 確保墊付者在名單中
        if (!memberMap.has(exp.user_id)) {
            memberMap.set(exp.user_id, { name: exp.user_id.slice(0, 6) });
            paidMap.set(exp.user_id, 0);
            owedMap.set(exp.user_id, 0);
        }

        paidMap.set(exp.user_id, (paidMap.get(exp.user_id) || 0) + baseAmount);

        // 分攤名單處理
        let splitList = exp.split_with ? [...exp.split_with] : [];
        if (exp.is_payer_included !== false) {
            splitList.push(exp.user_id);
        }
        splitList = Array.from(new Set(splitList));

        if (splitList.length === 0) {
            splitList = [exp.user_id];
        }

        const perPerson = baseAmount / splitList.length;

        splitList.forEach((uid) => {
            if (!memberMap.has(uid)) {
                memberMap.set(uid, { name: uid.slice(0, 6) });
                paidMap.set(uid, 0);
                owedMap.set(uid, 0);
            }

            // 若已有 settled_with 標記已結清，則此處不再記為未結帳款
            const isSettledWithPayer = uid !== exp.user_id && exp.settled_with?.includes(uid);
            if (!isSettledWithPayer) {
                owedMap.set(uid, (owedMap.get(uid) || 0) + perPerson);
            } else {
                // 已結清：抵銷墊付者的待收款與成員的應付款
                paidMap.set(exp.user_id, (paidMap.get(exp.user_id) || 0) - perPerson);
            }
        });
    });

    // 彙整 MemberBalance
    const memberBalances: MemberBalance[] = [];
    memberMap.forEach((info, uid) => {
        const totalPaid = Math.round(paidMap.get(uid) || 0);
        const totalOwed = Math.round(owedMap.get(uid) || 0);
        const netBalance = totalPaid - totalOwed;

        // 若無任何消費或借貸，且 netBalance 為 0，可保留或過濾
        memberBalances.push({
            userId: uid,
            userName: info.name,
            avatar: info.avatar,
            totalPaid,
            totalOwed,
            netBalance,
        });
    });

    // 分流債務人 (負餘額) 與債權人 (正餘額)
    const debtors: { id: string; name: string; avatar?: string; remaining: number }[] = [];
    const creditors: { id: string; name: string; avatar?: string; remaining: number }[] = [];

    memberBalances.forEach((mb) => {
        if (mb.netBalance < -0.5) {
            debtors.push({
                id: mb.userId,
                name: mb.userName,
                avatar: mb.avatar,
                remaining: Math.abs(mb.netBalance),
            });
        } else if (mb.netBalance > 0.5) {
            creditors.push({
                id: mb.userId,
                name: mb.userName,
                avatar: mb.avatar,
                remaining: mb.netBalance,
            });
        }
    });

    // 依金額降冪排序以達到最優配對
    debtors.sort((a, b) => b.remaining - a.remaining);
    creditors.sort((a, b) => b.remaining - a.remaining);

    // 貪婪配對結算
    const settlements: SimplifiedSettlement[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
        const debtor = debtors[dIdx];
        const creditor = creditors[cIdx];

        const transferAmount = Math.min(debtor.remaining, creditor.remaining);

        if (transferAmount >= 0.5) {
            settlements.push({
                id: `settle_${debtor.id}_${creditor.id}_${settlements.length}`,
                fromId: debtor.id,
                fromName: debtor.name,
                fromAvatar: debtor.avatar,
                toId: creditor.id,
                toName: creditor.name,
                toAvatar: creditor.avatar,
                amount: Math.round(transferAmount),
            });
        }

        debtor.remaining -= transferAmount;
        creditor.remaining -= transferAmount;

        if (debtor.remaining < 0.5) dIdx++;
        if (creditor.remaining < 0.5) cIdx++;
    }

    // 計算簡化成效
    const rawTransactionCount = Math.max(1, budgets.filter((b) => (b.split_with?.length || 0) > 0).length);
    const simplifiedCount = settlements.length;
    const savingsPercent = rawTransactionCount > simplifiedCount
        ? Math.round(((rawTransactionCount - simplifiedCount) / rawTransactionCount) * 100)
        : 0;

    // 產生 LINE / 通訊軟體排版訊息
    const lineMessageText = formatLineMessage({
        tripTitle,
        currency,
        settlements,
        memberBalances,
    });

    return {
        tripTitle,
        currency,
        totalExpense: Math.round(totalExpense),
        memberBalances,
        settlements,
        rawTransactionCount,
        simplifiedCount,
        savingsPercent,
        lineMessageText,
    };
}

/**
 * 產生適合分享到 LINE 或社群群組的文字排版
 */
function formatLineMessage({
    tripTitle,
    currency,
    settlements,
    memberBalances,
}: {
    tripTitle: string;
    currency: string;
    settlements: SimplifiedSettlement[];
    memberBalances: MemberBalance[];
}): string {
    if (settlements.length === 0) {
        return `🎉 【${tripTitle}】旅費平帳結算報告\n✅ 目前所有帳目皆已結清，無須進行任何轉帳！全員帳款平坦～`;
    }

    const totalSettledAmount = settlements.reduce((sum, s) => sum + s.amount, 0);

    const lines: string[] = [];
    lines.push(`🎉 【${tripTitle}】旅費智慧平帳建議`);
    lines.push(`💡 抵銷環形債務，僅需 ${settlements.length} 筆轉帳即可結清！\n`);
    lines.push(`📋 【轉帳指示】：`);

    settlements.forEach((s, idx) => {
        lines.push(`${idx + 1}. ${s.fromName} ➡️ 轉給 ${s.toName}：${currency} ${s.amount.toLocaleString()}`);
    });

    lines.push(`\n💰 結清總金額：${currency} ${totalSettledAmount.toLocaleString()}`);
    lines.push(`\n📊 【各成員淨收支結餘】：`);

    memberBalances.forEach((mb) => {
        if (mb.netBalance > 0) {
            lines.push(`• ${mb.userName}：應收回 +${currency} ${mb.netBalance.toLocaleString()} (代墊 ${currency} ${mb.totalPaid.toLocaleString()})`);
        } else if (mb.netBalance < 0) {
            lines.push(`• ${mb.userName}：應支付 -${currency} ${Math.abs(mb.netBalance).toLocaleString()} (應攤 ${currency} ${mb.totalOwed.toLocaleString()})`);
        } else {
            lines.push(`• ${mb.userName}：收支平手 (±0)`);
        }
    });

    lines.push(`\n✅ 全員轉帳完成後即可結清，感謝大家美好的旅程合作！`);

    return lines.join("\n");
}
