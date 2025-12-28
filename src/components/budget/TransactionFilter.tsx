import { Filter, Icon, LucideIcon } from "lucide-react";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TransactionFilterType } from "../../models/types/TransactionFilterTypes";
import type { TripSettingConf } from "../../models/types/TripTypes";

type TransactionFilterProps = {
    categories?: {
        id: string;
        name: string;
        icon: LucideIcon;
    }[];
    formData: TransactionFilterType;
    paymentMethods?: PaymentMethodRow[];
    totalCount?: number;
    onFormDataChange: (name: string, value: string | number) => void;
};

const TransactionFilter = ({
    categories,
    formData,
    paymentMethods,
    totalCount,
    onFormDataChange,
}: TransactionFilterProps) => {
    return (
        <div className="px-4 mb-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 mb-2 w-full">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Filter size={18} className="text-blue-500" /> 篩選條件
                    </h2>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                        共 {totalCount} 筆
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <select
                        name="category"
                        value={formData.category}
                        onChange={(e) =>
                            onFormDataChange("category", e.target.value)
                        }
                        className="p-2 bg-slate-50 rounded-lg text-sm border-none outline-none"
                        title="Category"
                    >
                        <option value="all">所有類別</option>
                        {Array.isArray(categories) &&
                            categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                    </select>
                    <select
                        value={formData.payment_method_id}
                        onChange={(e) =>
                            onFormDataChange(
                                "payment_method_id",
                                e.target.value
                            )
                        }
                        className="p-2 bg-slate-50 rounded-lg text-sm border-none outline-none"
                        title="Payment"
                    >
                        <option value="all">所有付款方式</option>
                        {Array.isArray(paymentMethods) &&
                            paymentMethods.map((pm) => (
                                <option key={pm.id} value={pm.id}>
                                    {pm.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default TransactionFilter;
