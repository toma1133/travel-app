import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Banknote, CreditCard, LucideIcon, X } from "lucide-react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

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
    onCloseBtnClick,
    onDeleteBtnClick,
    onFormDataChange,
    onFormInputChange,
    onFormSubmit,
}: TransactionModalProps) => {
    return (
        <FormModal
            customAction={
                mode === "edit" ? (
                    <button
                        type="button"
                        onClick={() => onDeleteBtnClick(formData)}
                        className={`${theme?.accent} px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:bg-opacity-90`}
                    >
                        刪除
                    </button>
                ) : (
                    <></>
                )
            }
            formId={"transaction-form"}
            modalTitle={"系統設定"}
            modalSaveTitle={"儲存變更"}
            theme={theme}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Amount & Currency */}
            <div>
                <label
                    htmlFor="amount"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    金額
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            name="amount"
                            inputMode="decimal"
                            value={formData.amount}
                            step="1"
                            onChange={onFormInputChange}
                            onFocus={(e) => {
                                e.currentTarget.select();
                            }}
                            placeholder="0"
                            className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl font-bold outline-none focus:border-black"
                        />
                    </div>
                    <div className="flex bg-white border border-gray-300 rounded overflow-hidden shrink-0">
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
                                            ? "bg-black text-white"
                                            : "bg-white text-gray-400"
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
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    支付方式
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
                    {Array.isArray(paymentMethods) &&
                        paymentMethods.map((paymentMethod, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() =>
                                    onFormDataChange(
                                        "payment_method_id",
                                        paymentMethod.id
                                    )
                                }
                                className={`flex items-center px-3 py-2 border whitespace-nowrap transition-all
                                        ${
                                            formData.payment_method_id ===
                                            paymentMethod.id
                                                ? "border-black bg-white shadow-md"
                                                : "border-gray-200 bg-gray-50 text-gray-400"
                                        }
                                    `}
                            >
                                {paymentMethod.type === "credit" ? (
                                    <CreditCard size={14} className="mr-2" />
                                ) : (
                                    <Banknote size={14} className="mr-2" />
                                )}
                                <span className="text-xs font-medium">
                                    {paymentMethod.name}
                                </span>
                            </button>
                        ))}
                </div>
            </div>
            {/* Category */}
            <div>
                <label
                    htmlFor="category"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
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
                                                ? "bg-black text-white"
                                                : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                                        }
                                    `}
                            title={cat.id}
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
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    日期
                </label>
                <input
                    type="date"
                    required
                    name="expense_date"
                    value={formData.expense_date!}
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC]"
                    placeholder="日期"
                />
            </div>
            {/* Title */}
            <div>
                <label
                    htmlFor="title"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    標題
                </label>
                <input
                    type="text"
                    required
                    name="title"
                    value={formData.title}
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC]"
                    placeholder="標題..."
                />
            </div>
        </FormModal>
    );
};

export default TransactionModal;
