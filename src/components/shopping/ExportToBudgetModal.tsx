import React, { useState, useEffect } from "react";
import { X, Wallet, Check, AlertCircle, Plus, CreditCard, UserCheck } from "lucide-react";
import usePaymentMethods from "../../hooks/budget/UsePaymentMethods";
import usePaymentMethodMutations from "../../hooks/budget/UsePaymentMethodMutations";
import useBudgetMutations from "../../hooks/budget/UseBudgetMutations";
import useTripMembers from "../../hooks/tripMember/UseTripMembers";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";
import { getCurrencySymbol } from "../../utils/CurrencyUtil";

type ExportToBudgetModalProps = {
    item: ShoppingItemVM;
    tripId: string;
    userId: string;
    tripData?: TripVM | null;
    onClose: () => void;
    onSuccess: () => void;
};

const ExportToBudgetModal = ({
    item,
    tripId,
    userId,
    tripData,
    onClose,
    onSuccess,
}: ExportToBudgetModalProps) => {
    // Query payment methods and trip members
    const { data: paymentMethods = [], isLoading: isPaymentMethodsLoading } =
        usePaymentMethods(tripId, userId);
    const { data: tripMembers = [] } = useTripMembers(tripId, true);
    const { upsert: upsertPaymentMethod } = usePaymentMethodMutations();
    const { insert: insertBudget } = useBudgetMutations();

    // Currencies & exchange rate (defaults to local currency)
    const localCurrency = tripData?.settings_config?.localCurrency || "JPY";
    const homeCurrency = tripData?.settings_config?.homeCurrency || "TWD";
    const exchangeRate = tripData?.settings_config?.exchangeRate || 0.215;

    // Calculate default purchase amount
    const records = item.records || [];
    const calculatedAmount = records.reduce(
        (sum, r) => sum + (r.price || 0) * (r.quantity || 0),
        0
    );

    // Default currency is always local currency as requested: "且預設就當地幣就好"
    const defaultCurrency = localCurrency;

    // If item was previously recorded in home currency, convert to local currency default
    const itemCurrency = item.currency || localCurrency;
    let initialAmountNum = calculatedAmount;
    if (itemCurrency === homeCurrency && localCurrency !== homeCurrency && exchangeRate > 0) {
        initialAmountNum = Math.round(calculatedAmount / exchangeRate);
    }

    const recipientTag = item.recipients?.length
        ? ` (代購: ${item.recipients.join(", ")})`
        : "";

    const [title, setTitle] = useState(`購物: ${item.name}${recipientTag}`);
    const [amount, setAmount] = useState(
        initialAmountNum > 0 ? initialAmountNum.toString() : ""
    );
    const [currencyCode, setCurrencyCode] = useState(defaultCurrency);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
    const [expenseDate, setExpenseDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    // Toggle between local currency and home currency with smart value conversion
    const handleToggleCurrency = (targetCurrency: string) => {
        if (targetCurrency === currencyCode) return;
        const currentNum = parseFloat(amount);
        if (!isNaN(currentNum) && currentNum > 0 && exchangeRate > 0) {
            if (targetCurrency === homeCurrency && currencyCode === localCurrency) {
                setAmount(Math.round(currentNum * exchangeRate).toString());
            } else if (targetCurrency === localCurrency && currencyCode === homeCurrency) {
                setAmount(Math.round(currentNum / exchangeRate).toString());
            }
        }
        setCurrencyCode(targetCurrency);
    };

    // Split with actual trip members (only valid UUIDs)
    const [splitWithMembers, setSplitWithMembers] = useState<string[]>([]);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);
    const [newPaymentName, setNewPaymentName] = useState("現金");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Auto-select first payment method if available
    useEffect(() => {
        if (paymentMethods.length > 0 && !selectedPaymentMethodId) {
            setSelectedPaymentMethodId(paymentMethods[0].id);
        }
    }, [paymentMethods, selectedPaymentMethodId]);

    const handleCreateDefaultPayment = async () => {
        try {
            const newPayment = await upsertPaymentMethod.mutateAsync({
                id: crypto.randomUUID(),
                name: newPaymentName.trim() || "現金",
                trip_id: tripId,
                type: "cash",
                currency_code: currencyCode,
                user_id: userId,
                credit_limit: null,
                order: 0,
            });
            if (newPayment) {
                setSelectedPaymentMethodId(newPayment.id);
                setIsCreatingPayment(false);
            }
        } catch (err) {
            console.error("Failed to create payment method:", err);
            setErrorMsg("建立付款方式失敗，請重試");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setErrorMsg("請輸入有效的支出金額");
            return;
        }

        let paymentId = selectedPaymentMethodId;
        // If no payment method exists yet, auto-create a default cash payment method
        if (!paymentId) {
            if (paymentMethods.length > 0) {
                paymentId = paymentMethods[0].id;
            } else {
                try {
                    const created = await upsertPaymentMethod.mutateAsync({
                        id: crypto.randomUUID(),
                        name: "現金",
                        trip_id: tripId,
                        type: "cash",
                        currency_code: currencyCode,
                        user_id: userId,
                        credit_limit: null,
                        order: 0,
                    });
                    if (created) paymentId = created.id;
                } catch {
                    setErrorMsg("請選擇或新增一筆付款方式");
                    return;
                }
            }
        }

        setIsSubmitting(true);
        try {
            // Default to payer payment, no invalid string splits
            await insertBudget.mutateAsync({
                trip_id: tripId,
                user_id: userId,
                title: title.trim(),
                amount: parsedAmount,
                currency_code: currencyCode,
                category: "shopping",
                expense_date: expenseDate,
                payment_method_id: paymentId,
                split_with: splitWithMembers.length > 0 ? splitWithMembers : [],
                is_payer_included: true,
                settled_with: [],
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to export to budget:", err);
            setErrorMsg(err.message || "轉入記帳本失敗，請確認資料填寫是否完整");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-sans"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground border border-border/80 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Wallet size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                                轉入記帳本
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

                {/* Form Body */}
                <form
                    id="export-budget-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-5 space-y-3.5 no-scrollbar text-xs"
                >
                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Payer Default Notice */}
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-2.5 text-muted-foreground">
                        <UserCheck size={18} className="text-emerald-500 shrink-0" />
                        <div className="text-[11px] leading-relaxed">
                            <span className="font-bold text-foreground">預設由登入人付款，記入個人記帳。</span>
                            <div>伴手禮/代購受贈對象僅記錄於項目備註，不產生無效分帳對象。</div>
                        </div>
                    </div>

                    {/* Expense Title */}
                    <div className="space-y-1">
                        <label className="font-bold text-foreground">支出項目名稱</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                            required
                        />
                    </div>

                    {/* Amount & Currency */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <label className="font-bold text-foreground">
                                支出金額 <span className="text-destructive">*</span>
                            </label>

                            {/* Currency Switcher: Local Currency vs Home Currency only (default to Local Currency) */}
                            <div className="inline-flex items-center rounded-lg border border-border bg-muted/60 p-0.5 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => handleToggleCurrency(localCurrency)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                        currencyCode === localCurrency
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <span>{getCurrencySymbol(localCurrency)}</span>
                                    <span>當地幣 ({localCurrency})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleCurrency(homeCurrency)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                        currencyCode === homeCurrency
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <span>{getCurrencySymbol(homeCurrency)}</span>
                                    <span>本國幣 ({homeCurrency})</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground pointer-events-none">
                                {getCurrencySymbol(currencyCode)}
                            </span>
                            <input
                                type="number"
                                step="any"
                                placeholder={
                                    currencyCode === localCurrency
                                        ? `例: ${localCurrency === "JPY" ? "1400" : localCurrency === "KRW" ? "15000" : "50"}`
                                        : "例: 350"
                                }
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs font-mono font-bold"
                                required
                            />
                        </div>

                        {/* Live Conversion Display */}
                        {amount &&
                            parseFloat(amount) > 0 &&
                            exchangeRate > 0 &&
                            localCurrency.toUpperCase() !== homeCurrency.toUpperCase() && (
                                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
                                    <span>換算參考：</span>
                                    {currencyCode === localCurrency ? (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            ≈ {getCurrencySymbol(homeCurrency)}{" "}
                                            {Math.round(
                                                parseFloat(amount) * exchangeRate
                                            ).toLocaleString()}{" "}
                                            {homeCurrency} (匯率 {exchangeRate})
                                        </span>
                                    ) : (
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            ≈ {getCurrencySymbol(localCurrency)}{" "}
                                            {Math.round(
                                                parseFloat(amount) / exchangeRate
                                            ).toLocaleString()}{" "}
                                            {localCurrency} (匯率 {exchangeRate})
                                        </span>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-foreground flex items-center gap-1">
                                <CreditCard size={12} />
                                <span>付款方式</span> <span className="text-destructive">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsCreatingPayment(!isCreatingPayment)}
                                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                            >
                                <Plus size={12} />
                                <span>新增付款方式</span>
                            </button>
                        </div>

                        {/* Inline Create Payment Form */}
                        {isCreatingPayment && (
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="名稱 (例: 現金、玉山熊本熊卡)"
                                    value={newPaymentName}
                                    onChange={(e) => setNewPaymentName(e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateDefaultPayment}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs shrink-0"
                                >
                                    建立
                                </button>
                            </div>
                        )}

                        {paymentMethods.length > 0 ? (
                            <select
                                value={selectedPaymentMethodId}
                                onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                                required
                            >
                                {paymentMethods.map((pm) => (
                                    <option key={pm.id} value={pm.id}>
                                        {pm.name} ({pm.type === "cash" ? "現金" : "信用卡/行動支付"})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                                尚未建立付款方式，系統將為您自動建立「現金 (Cash)」入帳。
                            </div>
                        )}
                    </div>

                    {/* Expense Date */}
                    <div className="space-y-1">
                        <label className="font-bold text-foreground">消費日期</label>
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs font-mono"
                            required
                        />
                    </div>

                    {/* Optional Split with Other Trip Members (Only valid members) */}
                    {tripMembers.length > 1 && (
                        <div className="space-y-1.5 pt-1">
                            <label className="font-bold text-foreground text-xs">
                                與同行旅伴分攤？（選填，預設為個人支出）
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {tripMembers
                                    .filter((m) => m.user_id !== userId)
                                    .map((m) => {
                                        const isChecked = splitWithMembers.includes(m.user_id);
                                        return (
                                            <button
                                                key={m.user_id}
                                                type="button"
                                                onClick={() => {
                                                    if (isChecked) {
                                                        setSplitWithMembers(splitWithMembers.filter((id) => id !== m.user_id));
                                                    } else {
                                                        setSplitWithMembers([...splitWithMembers, m.user_id]);
                                                    }
                                                }}
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                                    isChecked
                                                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                                        : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted"
                                                }`}
                                            >
                                                {isChecked && <Check size={11} />}
                                                <span>
                                                    {m.profiles?.username ||
                                                        m.profiles?.email?.split("@")[0] ||
                                                        `旅伴 (${m.user_id.slice(0, 6)})`}
                                                </span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border/70 bg-muted/10 flex items-center justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        form="export-budget-form"
                        disabled={isSubmitting}
                        className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? "記帳中..." : "確認記帳"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportToBudgetModal;
