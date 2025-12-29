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
    onFormDataChange: (name: string, value: string | number) => void;
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
                    className="font-bold uppercase mb-1 flex items-center justify-between text-gray-500 text-xs"
                >
                    分類
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onFormDataChange("category", "all")}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                            formData.category === "all"
                                ? "bg-indigo-600 text-white shadow-md border-indigo-600"
                                : "bg-white text-indigo-400"
                        }`}
                    >
                        全部
                    </button>
                    {Array.isArray(categories) &&
                        categories.map((category, i) => {
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() =>
                                        onFormDataChange(
                                            "category",
                                            category.id
                                        )
                                    }
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                                        formData.category === category.id
                                            ? "bg-indigo-600 text-white shadow-md border-indigo-600"
                                            : "bg-white text-indigo-400"
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
                    className="font-bold uppercase mb-1 flex items-center justify-between text-gray-500 text-xs"
                >
                    支付方式
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onFormDataChange("payment_method_id", "all")
                        }
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                            formData.payment_method_id === "all"
                                ? "bg-indigo-600 text-white shadow-md border-indigo-600"
                                : "bg-white text-indigo-400"
                        }`}
                    >
                        全部
                    </button>
                    {Array.isArray(paymentMethods) &&
                        paymentMethods.map((paymentMethod, i) => {
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() =>
                                        onFormDataChange(
                                            "payment_method_id",
                                            paymentMethod.id
                                        )
                                    }
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                                        formData.payment_method_id ===
                                        paymentMethod.id
                                            ? "bg-indigo-600 text-white shadow-md border-indigo-600"
                                            : "bg-white text-indigo-400"
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
