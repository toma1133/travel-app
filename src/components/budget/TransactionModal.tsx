import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useState, useEffect } from "react";
import { Banknote, CreditCard, LucideIcon } from "lucide-react";
import FormModal from "../common/FormModal";
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
        icon: LucideIcon;
    }[];
    formData: BudgetRow;
    mode: string;
    paymentMethods?: PaymentMethodRow[];
    setting: TripSettingConf | null;
    theme: TripThemeConf | null;
    tripMembers?: TripMemberVM[];
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onDeleteBtnClick: (budgetItem: BudgetRow) => void;
    onFormDataChange: (name: string, value?: string | number) => void;
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
        formData.amount ? formData.amount.toLocaleString("en-US") : ""
    );

    useEffect(() => {
        const numDisplay = Number(displayAmount.replace(/,/g, ''));
        if (numDisplay !== formData.amount && !isNaN(formData.amount)) {
            setDisplayAmount(formData.amount ? formData.amount.toLocaleString("en-US") : "");
        }
    }, [formData.amount]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let rawValue = e.target.value.replace(/[^0-9.,]/g, '');
        const cleanValue = rawValue.replace(/,/g, '');
        
        if (cleanValue === '') {
            setDisplayAmount('');
            onFormDataChange("amount", 0);
            return;
        }

        const dotCount = (cleanValue.match(/\./g) || []).length;
        if (dotCount > 1) return;

        let parsedStr = cleanValue;
        if (parsedStr.length > 1 && parsedStr.startsWith('0') && !parsedStr.startsWith('0.')) {
            parsedStr = parsedStr.replace(/^0+/, '');
            if (parsedStr === '') parsedStr = '0';
        }
        if (parsedStr.startsWith('.')) {
            parsedStr = '0' + parsedStr;
        }

        const parts = parsedStr.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

        const formattedInteger = integerPart ? parseInt(integerPart, 10).toLocaleString("en-US") : '';
        const finalDisplay = formattedInteger + decimalPart;

        setDisplayAmount(finalDisplay);
        onFormDataChange("amount", Number(parsedStr));
    };

    return (
        <FormModal
            customAction={
                mode === "edit" ? (
                    <button
                        type="button"
                        onClick={() => onDeleteBtnClick(formData)}
                        className={`${theme?.accent} px-6 py-2 rounded-lg text-sm font-bold text-primary-foreground shadow-sm hover:shadow-lg transition-all transform active:scale-95 hover:bg-opacity-90`}
                    >
                        刪除
                    </button>
                ) : (
                    <></>
                )
            }
            formId={"transaction-form"}
            modalTitle={mode === "create" ? "新增帳目" : `編輯帳目`}
            modalSaveTitle={"儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            <div className="flex border-b border-border mb-4">
                <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className={`flex-1 pb-2 text-center text-sm font-bold transition-all ${
                        activeTab === "basic"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    基本記帳
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("split")}
                    className={`flex-1 pb-2 text-center text-sm font-bold transition-all ${
                        activeTab === "split"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    分帳設定
                </button>
            </div>

            {/* Basic Tab */}
            <div className={`flex flex-col gap-4 ${activeTab !== "basic" ? "hidden" : ""}`}>
                {/* Title */}
            <div>
                <label
                    htmlFor="title"
                    className="font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    標題
                </label>
                <input
                    type="text"
                    required
                    name="title"
                    value={formData.title}
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC]"
                    placeholder="標題..."
                />
            </div>
            {/* Amount & Currency */}
            <div>
                <label
                    htmlFor="amount"
                    className="font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    金額
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            name="amount"
                            inputMode="decimal"
                            value={displayAmount}
                            onChange={handleAmountChange}
                            onFocus={(e) => {
                                e.currentTarget.select();
                            }}
                            placeholder="0"
                            className="w-full bg-card border border-border p-3 font-mono text-2xl font-bold outline-none focus:border-foreground"
                        />
                    </div>
                    <div className="flex bg-card border border-border rounded overflow-hidden shrink-0">
                        {[setting?.localCurrency, setting?.homeCurrency].map(
                            (curr) => (
                                <button
                                    key={curr}
                                    type="button"
                                    onClick={() =>
                                        onFormDataChange("currency_code", curr)
                                    }
                                    className={`px-3 py-1 text-xs font-bold transition-colors ${
                                        formData.currency_code === curr
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card text-muted-foreground"
                                    }`}
                                >
                                    {curr}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
            {/* Payment Method */}
            <div>
                <label
                    htmlFor="payment_method"
                    className="font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    支付方式
                </label>
                <select
                    id="payment_method"
                    name="payment_method_id"
                    value={formData.payment_method_id || ""}
                    onChange={(e) =>
                        onFormDataChange("payment_method_id", e.target.value)
                    }
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] dark:bg-card"
                >
                    <option value="" disabled>
                        請選擇支付方式
                    </option>
                    {Array.isArray(paymentMethods) &&
                        paymentMethods.map((paymentMethod) => (
                            <option key={paymentMethod.id} value={paymentMethod.id}>
                                {paymentMethod.name} ({paymentMethod.type === "credit" ? "信用卡" : "現金"})
                            </option>
                        ))}
                </select>
            </div>

            {/* Category */}
            <div>
                <label
                    htmlFor="category"
                    className="font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    分類
                </label>
                <div className="grid grid-cols-6 gap-2">
                    {categories.map((cat) => (
                        <button
                            type="button"
                            key={cat.id}
                            onClick={() => onFormDataChange("category", cat.id)}
                            className={`aspect-square flex flex-col items-center justify-center rounded-full transition-all
                                        ${
                                            formData.category === cat.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-card text-muted-foreground hover:bg-muted-foreground"
                                        }
                                    `}
                            title={cat.name}
                        >
                            <cat.icon size={16} />
                        </button>
                    ))}
                </div>
            </div>
            {/* Date */}
            <div>
                <label
                    htmlFor="expense_date"
                    className="font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    日期
                </label>
                <input
                    type="date"
                    required
                    name="expense_date"
                    value={formData.expense_date!}
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] dark:[color-scheme:dark]"
                    placeholder="日期"
                />
            </div>
            </div>

            {/* Split Tab */}
            <div className={`flex flex-col gap-4 ${activeTab !== "split" ? "hidden" : ""}`}>
                {/* Split with */}
            <div>
                <label
                    htmlFor="split_with"
                    className="font-bold uppercase mb-1 flex items-center justify-between text-muted-foreground text-xs"
                >
                    分帳夥伴
                    <span className="text-indigo-500">
                        {formData.split_with?.length} 人分帳
                    </span>
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onFormDataChange("is_payer_included", formData.is_payer_included === false ? true : false)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                            formData.is_payer_included !== false
                                ? "bg-indigo-600 text-primary-foreground shadow-sm border-indigo-600"
                                : "bg-card text-indigo-400"
                        }`}
                    >
                        自己 (參與分帳)
                    </button>
                    {Array.isArray(tripMembers) &&
                        tripMembers
                            .filter(
                                (tripMember) =>
                                    tripMember.user_id !== formData.user_id
                            )
                            .map((tripMember, i) => {
                                const isSelected = formData.split_with?.includes(tripMember.user_id) || false;

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => onFormDataChange("split_with", tripMember.user_id)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                                            isSelected
                                                ? "bg-indigo-600 text-primary-foreground shadow-sm border-indigo-600"
                                                : "bg-card text-indigo-400"
                                        }`}
                                    >
                                        {tripMember.profiles?.username}
                                    </button>
                                );
                            })}
                </div>

                {mode === "edit" && formData.split_with && formData.split_with.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                        <label className="font-bold uppercase mb-2 flex items-center justify-between text-muted-foreground text-xs">
                            收款狀態 (代墊收回)
                            <span className="text-emerald-500">
                                {formData.settled_with?.length || 0} 人已付
                            </span>
                        </label>
                        <div className="flex flex-col gap-2">
                            {Array.isArray(tripMembers) &&
                                tripMembers
                                    .filter((tripMember) => formData.split_with?.includes(tripMember.user_id))
                                    .map((tripMember, i) => {
                                        const isSettled = formData.settled_with?.includes(tripMember.user_id) || false;
                                        return (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`settled_${tripMember.user_id}`}
                                                    checked={isSettled}
                                                    onChange={() => onFormDataChange("settled_with", tripMember.user_id)}
                                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                />
                                                <label htmlFor={`settled_${tripMember.user_id}`} className="text-sm text-foreground">
                                                    已向 <span className="font-bold">{tripMember.profiles?.username}</span> 收回
                                                </label>
                                            </div>
                                        );
                                    })}
                        </div>
                    </div>
                )}
            </div>
            </div>
        </FormModal>
    );
};

export default TransactionModal;
