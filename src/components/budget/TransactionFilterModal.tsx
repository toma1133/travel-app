import { FormEventHandler, MouseEventHandler } from "react";
import { LucideIcon } from "lucide-react";
import FormModal from "../common/FormModal";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TransactionFilterType } from "../../models/types/TransactionFilterTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type TransactionFilterModalProps = {
    categories?: {
        id: string;
        name: string;
        icon: LucideIcon;
    }[];
    formData: TransactionFilterType;
    theme: TripThemeConf | null;
    paymentMethods?: PaymentMethodRow[];
    onCancelBtnClick: MouseEventHandler<HTMLButtonElement>;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormDataChange: (name: string, value: string | number | string[]) => void;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const TransactionFilterModal = ({
    categories,
    formData,
    paymentMethods,
    theme,
    onCancelBtnClick,
    onCloseBtnClick,
    onFormDataChange,
    onFormSubmit,
}: TransactionFilterModalProps) => {
    return (
        <FormModal
            formId={"transaction-form"}
            modalTitle="交易過濾"
            modalSaveTitle="應用"
            theme={theme}
            onCancelBtnClick={onCancelBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* 分類 */}
            <div>
                <label
                    htmlFor="category"
                    className="font-bold uppercase mb-1 flex items-center justify-between text-muted-foreground text-xs"
                >
                    分類
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onFormDataChange("categories", [])}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                            formData.categories.length === 0
                                ? "bg-indigo-600 text-primary-foreground shadow-sm border-indigo-600"
                                : "bg-card text-indigo-400"
                        }`}
                    >
                        全部
                    </button>
                    {Array.isArray(categories) &&
                        categories.map((category, i) => {
                            const isSelected = formData.categories.includes(category.id);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        const newCategories = isSelected
                                            ? formData.categories.filter(id => id !== category.id)
                                            : [...formData.categories, category.id];
                                        onFormDataChange("categories", newCategories);
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                                        isSelected
                                            ? "bg-indigo-600 text-primary-foreground shadow-sm border-indigo-600"
                                            : "bg-card text-indigo-400"
                                    }`}
                                >
                                    {category.name}
                                </button>
                            );
                        })}
                </div>
            </div>
            {/* 支付方式 */}
            <div>
                <label
                    htmlFor="category"
                    className="font-bold uppercase mb-1 flex items-center justify-between text-muted-foreground text-xs"
                >
                    支付方式
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onFormDataChange("payment_method_ids", [])
                        }
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                            formData.payment_method_ids.length === 0
                                ? "bg-indigo-600 text-primary-foreground shadow-sm border-indigo-600"
                                : "bg-card text-indigo-400"
                        }`}
                    >
                        全部
                    </button>
                    {Array.isArray(paymentMethods) &&
                        paymentMethods.map((paymentMethod, i) => {
                            const isSelected = formData.payment_method_ids.includes(paymentMethod.id);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        const newIds = isSelected
                                            ? formData.payment_method_ids.filter(id => id !== paymentMethod.id)
                                            : [...formData.payment_method_ids, paymentMethod.id];
                                        onFormDataChange("payment_method_ids", newIds);
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                                        isSelected
                                            ? "bg-indigo-600 text-primary-foreground shadow-sm border-indigo-600"
                                            : "bg-card text-indigo-400"
                                    }`}
                                >
                                    {paymentMethod.name}
                                </button>
                            );
                        })}
                </div>
            </div>
        </FormModal>
    );
};

export default TransactionFilterModal;
