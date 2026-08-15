import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useState, useEffect } from "react";
import { Banknote, CreditCard, Calendar, Trash2, Users, Check, DollarSign, Wallet, Tag } from "lucide-react";
import FormModal from "../common/FormModal";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import { formatThousands, handleThousandsInputChange, parseThousandsToNumber } from "../../utils/numberFormat";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";

type TransactionModalProps = {
    categories: {
        id: string;
        name: string;
        icon: any;
    }[];
    formData: BudgetRow;
    mode: string;
    paymentMethods?: PaymentMethodRow[];
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    tripMembers?: TripMemberVM[];
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDeleteBtnClick: (budgetItem: BudgetRow) => void;
    onFormDataChange: (name: string, value?: string | number | boolean) => void;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const TransactionModal = ({
    categories,
    formData,
    mode,
    paymentMethods,
    setting,
    theme,
    tripMembers,
    onCloseBtnClick,
    onDeleteBtnClick,
    onFormDataChange,
    onFormInputChange,
    onFormSubmit,
}: TransactionModalProps) => {
    const [activeTab, setActiveTab] = useState<"basic" | "split">("basic");

    const [displayAmount, setDisplayAmount] = useState<string>(
        formData.amount ? formatThousands(formData.amount, true) : ""
    );

    useEffect(() => {
        const numDisplay = parseThousandsToNumber(displayAmount);
        if (numDisplay !== formData.amount && !isNaN(formData.amount)) {
            setDisplayAmount(formData.amount ? formatThousands(formData.amount, true) : "");
        }
    }, [formData.amount]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleThousandsInputChange(
            e,
            (formatted, numericValue) => {
                setDisplayAmount(formatted);
                onFormDataChange("amount", numericValue);
            },
            { allowDecimal: true }
        );
    };

    return (
        <FormModal
            customAction={
                mode === "edit" ? (
                    <button
                        type="button"
                        onClick={() => onDeleteBtnClick(formData)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-3 py-1.5 rounded-full transition-all cursor-pointer mr-1"
                        title="刪除帳目"
                    >
                        刪除
                    </button>
                ) : undefined
            }
            formId="transaction-form"
            modalTitle={mode === "create" ? "新增帳目" : `編輯帳目`}
            modalSaveTitle={mode === "create" ? "新增" : "儲存"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
            maxWidthClass="sm:max-w-lg"
        >
            <div className="space-y-4">
                {/* 📱 iOS Segmented Control (基本記帳 / 分帳設定) */}
                <div className="bg-muted/60 p-1 rounded-2xl flex items-center shadow-2xs border border-border/60">
                    <button
                        type="button"
                        onClick={() => setActiveTab("basic")}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                            activeTab === "basic"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        💵 基本記帳
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("split")}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                            activeTab === "split"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span>👥 分帳設定</span>
                        {formData.split_with && formData.split_with.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                                {formData.split_with.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* 💵 Tab 1: 基本記帳 (Basic Tab) */}
                {activeTab === "basic" && (
                    <div className="space-y-4">
                        {/* 💰 Hero 金額輸入區塊 (Apple Pay 視覺風格) */}
                        <div className="bg-muted/30 border border-border/70 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    支出金額
                                </span>
                                {/* 幣別切換膠囊 */}
                                <div className="flex bg-muted/60 p-0.5 rounded-xl border border-border/60">
                                    {[setting?.localCurrency, setting?.homeCurrency]
                                        .filter(Boolean)
                                        .map((curr) => (
                                            <button
                                                key={curr}
                                                type="button"
                                                onClick={() => onFormDataChange("currency_code", curr)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                                    formData.currency_code === curr
                                                        ? "bg-blue-500 text-white shadow-xs"
                                                        : "text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                {curr}
                                            </button>
                                        ))}
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-mono font-bold text-muted-foreground">
                                    {formData.currency_code || setting?.localCurrency || "$"}
                                </span>
                                <input
                                    type="text"
                                    name="amount"
                                    inputMode="decimal"
                                    value={displayAmount}
                                    onChange={handleAmountChange}
                                    onFocus={(e) => e.currentTarget.select()}
                                    placeholder="0"
                                    className="flex-1 bg-transparent text-3xl sm:text-4xl font-mono font-black text-foreground outline-none tracking-tight placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>

                        {/* 📌 Inset Grouped Section: 交易明細 */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                                交易明細
                            </span>
                            <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                                {/* 標題 */}
                                <div className="p-3.5 bg-card/80 flex items-center gap-3">
                                    <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
                                        名稱 <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        name="title"
                                        value={formData.title}
                                        onChange={onFormInputChange}
                                        placeholder="例如：一蘭拉麵、地鐵西瓜卡加值"
                                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                                    />
                                </div>

                                {/* 分類 */}
                                <div className="p-3.5 bg-card/80">
                                    <CategoryCustomSelect
                                        label="分類 *"
                                        value={formData.category || "sight"}
                                        onChange={(newCatId) => onFormDataChange("category", newCatId)}
                                    />
                                </div>

                                {/* 支付方式 */}
                                <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Wallet size={14} className="text-emerald-500 shrink-0" />
                                        <span className="text-xs font-bold text-muted-foreground">
                                            支付方式
                                        </span>
                                    </div>
                                    <select
                                        id="payment_method"
                                        name="payment_method_id"
                                        value={formData.payment_method_id || ""}
                                        onChange={(e) => onFormDataChange("payment_method_id", e.target.value)}
                                        className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground font-medium outline-none cursor-pointer"
                                    >
                                        <option value="" disabled>
                                            請選擇支付方式
                                        </option>
                                        {Array.isArray(paymentMethods) &&
                                            paymentMethods.map((pm) => (
                                                <option key={pm.id} value={pm.id} className="bg-background text-foreground">
                                                    {pm.type === "credit" ? "💳 " : "💵 "}
                                                    {pm.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* 交易日期 */}
                                <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-500 shrink-0" />
                                        <span className="text-xs font-bold text-muted-foreground">
                                            交易日期 <span className="text-rose-500">*</span>
                                        </span>
                                    </div>
                                    <input
                                        type="date"
                                        required
                                        name="expense_date"
                                        value={formData.expense_date || ""}
                                        onChange={onFormInputChange}
                                        className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 👥 Tab 2: 分帳設定 (Split Tab) */}
                {activeTab === "split" && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    分帳對象
                                </span>
                                <span className="text-[10px] font-bold text-blue-500">
                                    {(formData.is_payer_included !== false ? 1 : 0) + (formData.split_with?.length || 0)} 人分攤
                                </span>
                            </div>

                            <div className="bg-muted/30 border border-border/70 rounded-2xl p-3.5 shadow-2xs space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {/* 自己 */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onFormDataChange(
                                                "is_payer_included",
                                                formData.is_payer_included === false ? true : false
                                            )
                                        }
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                            formData.is_payer_included !== false
                                                ? "bg-blue-500 text-white shadow-xs"
                                                : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {formData.is_payer_included !== false && <Check size={12} className="stroke-[3]" />}
                                        <span>自己 (參與分帳)</span>
                                    </button>

                                    {/* 其他旅伴 */}
                                    {Array.isArray(tripMembers) &&
                                        tripMembers
                                            .filter((tm) => tm.user_id !== formData.user_id)
                                            .map((tm, i) => {
                                                const isSelected =
                                                    formData.split_with?.includes(tm.user_id) || false;

                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => onFormDataChange("split_with", tm.user_id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                            isSelected
                                                                ? "bg-blue-500 text-white shadow-xs"
                                                                : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                                                        }`}
                                                    >
                                                        {isSelected && <Check size={12} className="stroke-[3]" />}
                                                        <span>{tm.profiles?.username}</span>
                                                    </button>
                                                );
                                            })}
                                </div>
                            </div>
                        </div>

                        {/* 收款狀態 (代墊收回) */}
                        {mode === "edit" && formData.split_with && formData.split_with.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        收款狀態 (代墊已收回)
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-500">
                                        {formData.settled_with?.length || 0} 人已結清
                                    </span>
                                </div>

                                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                                    {Array.isArray(tripMembers) &&
                                        tripMembers
                                            .filter((tm) => formData.split_with?.includes(tm.user_id))
                                            .map((tm, i) => {
                                                const isSettled =
                                                    formData.settled_with?.includes(tm.user_id) || false;
                                                return (
                                                    <label
                                                        key={i}
                                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div
                                                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                                    isSettled
                                                                        ? "bg-emerald-500 text-white"
                                                                        : "border-2 border-border/80 bg-background"
                                                                }`}
                                                            >
                                                                {isSettled && <Check size={13} className="stroke-[3]" />}
                                                            </div>
                                                            <span className="text-xs font-medium text-foreground">
                                                                已向 <strong className="font-bold">{tm.profiles?.username}</strong> 收回款項
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSettled}
                                                            onChange={() => onFormDataChange("settled_with", tm.user_id)}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                );
                                            })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </FormModal>
    );
};

export default TransactionModal;
