import { FilterIcon, LucideIcon } from "lucide-react";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TransactionFilterType } from "../../models/types/TransactionFilterTypes";

type TransactionFilterProps = {
    categories?: {
        id: string;
        name: string;
        icon: LucideIcon;
    }[];
    formData: TransactionFilterType;
    paymentMethods?: PaymentMethodRow[];
    onFormDataChange: (name: string, value: string | number) => void;
};

const TransactionFilter = ({
    categories,
    formData,
    paymentMethods,
    onFormDataChange,
}: TransactionFilterProps) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
            {/* <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                    formData.startDate ||
                    formData.endDate ||
                    formData.paymentMethod !== "全部"
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "bg-slate-50 border-transparent text-slate-500"
                }`}
            >
                <FilterIcon size={14} />
                進階篩選
            </button> */}
            {/* <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <button
                type="button"
                onClick={() => onFormDataChange("category", "all")}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    formData.category === "all"
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-400 hover:bg-slate-50"
                }`}
            >
                全部
            </button>
            {categories?.map((cat, i) => (
                <button
                    type="button"
                    key={i}
                    onClick={() => onFormDataChange("category", cat.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formData.category === cat.id
                            ? "bg-slate-900 text-white shadow-lg"
                            : "text-slate-400 hover:bg-slate-50"
                    }`}
                >
                    {cat.name}
                </button>
            ))} */}
        </div>
        // <div className="px-4 mb-4">
        //     <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 mb-2 w-full">
        //         <div className="flex justify-between items-center mb-2">
        //             <h2 className="font-bold text-slate-800 flex items-center gap-2">
        //                 <Filter size={18} className="text-blue-500" /> 篩選條件
        //             </h2>
        //         </div>
        //         <div className="grid grid-cols-2 gap-2">
        //             <select
        //                 name="category"
        //                 value={formData.category}
        //                 onChange={(e) =>
        //                     onFormDataChange("category", e.target.value)
        //                 }
        //                 className="p-2 bg-slate-50 rounded-lg text-sm border-none outline-none"
        //                 title="Category"
        //             >
        //                 <option value="all">所有類別</option>
        //                 {Array.isArray(categories) &&
        //                     categories.map((c) => (
        //                         <option key={c.id} value={c.id}>
        //                             {c.name}
        //                         </option>
        //                     ))}
        //             </select>
        //             <select
        //                 value={formData.payment_method_id}
        //                 onChange={(e) =>
        //                     onFormDataChange(
        //                         "payment_method_id",
        //                         e.target.value
        //                     )
        //                 }
        //                 className="p-2 bg-slate-50 rounded-lg text-sm border-none outline-none"
        //                 title="Payment"
        //             >
        //                 <option value="all">所有付款方式</option>
        //                 {Array.isArray(paymentMethods) &&
        //                     paymentMethods.map((pm) => (
        //                         <option key={pm.id} value={pm.id}>
        //                             {pm.name}
        //                         </option>
        //                     ))}
        //             </select>
        //         </div>
        //     </div>
        // </div>
    );
};

export default TransactionFilter;
