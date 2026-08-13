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
                    className="font-bold uppercase mb-2 flex items-center justify-between text-muted-foreground text-xs"
                >
                    分類
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onFormDataChange("categories", [])}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            formData.categories.length === 0
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                        }`}
                    >
                        全部
                    </button>
                    {Array.isArray(categories) &&
                        categories.map((category) => {
                            const isSelected = formData.categories.includes(category.id);
                            const IconComponent = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                        const newCategories = isSelected
                                            ? formData.categories.filter(id => id !== category.id)
                                            : [...formData.categories, category.id];
                                        onFormDataChange("categories", newCategories);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-card text-muted-foreground border-border hover:bg-muted"
                                    }`}
                                >
                                    <IconComponent size={14} />
                                    <span>{category.name}</span>
                                </button>
                            );
                        })}
                </div>
            </div>
            {/* 支付方式 */}
            <div>
                <label
                    htmlFor="payment_method"
                    className="font-bold uppercase mb-2 flex items-center justify-between text-muted-foreground text-xs"
                >
                    支付方式
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onFormDataChange("payment_method_ids", [])
                        }
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            formData.payment_method_ids.length === 0
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                        }`}
                    >
                        全部
                    </button>
                    {Array.isArray(paymentMethods) &&
                        paymentMethods.map((paymentMethod) => {
                            const isSelected = formData.payment_method_ids.includes(paymentMethod.id);
                            return (
                                <button
                                    key={paymentMethod.id}
                                    type="button"
                                    onClick={() => {
                                        const newIds = isSelected
                                            ? formData.payment_method_ids.filter(id => id !== paymentMethod.id)
                                            : [...formData.payment_method_ids, paymentMethod.id];
                                        onFormDataChange("payment_method_ids", newIds);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-card text-muted-foreground border-border hover:bg-muted"
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
