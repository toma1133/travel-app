import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Banknote, CreditCard, LucideIcon, X } from "lucide-react";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
} from "../../models/types/TripTypes";

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
    onFormDataChange: (name: string, value?: string | number) => void;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onDeleteBtnClick: MouseEventHandler<HTMLButtonElement>;
};

const TransactionModal = ({
    categories,
    formData,
    mode,
    paymentMethods,
    setting,
    theme,
    onCloseBtnClick,
    onFormDataChange,
    onFormInputChange,
    onSubmit,
    onDeleteBtnClick,
}: TransactionModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#F2F2F0] w-full max-w-sm p-6 rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom border border-gray-600">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-[Noto_Sans_TC] font-bold text-xl">
                        {mode === "create" ? `新增消費` : "編輯紀錄"}
                    </h3>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        title="Close"
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="space-y-5">
                    {/* Amount & Currency */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            金額
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={formData.amount}
                                    step="1"
                                    onChange={onFormInputChange}
                                    placeholder="0"
                                    className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl font-bold outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex bg-white border border-gray-300 rounded overflow-hidden shrink-0">
                                {[
                                    setting?.localCurrency,
                                    setting?.homeCurrency,
                                ].map((curr) => (
                                    <button
                                        key={curr}
                                        type="button"
                                        onClick={() =>
                                            onFormDataChange(
                                                "currency_code",
                                                curr
                                            )
                                        }
                                        className={`px-3 py-1 text-xs font-bold transition-colors ${
                                            formData.currency_code === curr
                                                ? "bg-black text-white"
                                                : "bg-white text-gray-400"
                                        }`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Payment Method */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            支付方式
                        </label>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
                            {Array.isArray(paymentMethods) &&
                                paymentMethods.map((pm) => (
                                    <button
                                        key={pm.id}
                                        type="button"
                                        onClick={() => setPaymentId(pm.id)}
                                        className={`flex items-center px-3 py-2 border whitespace-nowrap transition-all
                                        ${
                                            paymentId === pm.id
                                                ? "border-black bg-white shadow-md"
                                                : "border-gray-200 bg-gray-50 text-gray-400"
                                        }
                                    `}
                                    >
                                        {pm.type === "credit" ? (
                                            <CreditCard
                                                size={14}
                                                className="mr-2"
                                            />
                                        ) : (
                                            <Banknote
                                                size={14}
                                                className="mr-2"
                                            />
                                        )}
                                        <span className="text-xs font-medium">
                                            {pm.name}
                                        </span>
                                    </button>
                                ))}
                        </div>
                    </div>
                    {/* Category */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            分類
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {categories.map((cat) => (
                                <button
                                    type="button"
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
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
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            日期
                        </label>
                        <input
                            type="date"
                            value={formData.expense_date!}
                            onChange={onFormInputChange}
                            className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC]"
                            placeholder="日期"
                        />
                    </div>
                    {/* Title */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                            備註
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={onFormInputChange}
                            className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC]"
                            placeholder="備註..."
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        {formData && (
                            <button
                                type="button"
                                onClick={onDeleteBtnClick}
                                className="flex-1 py-3 bg-gray-200 text-gray-600 font-bold text-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                                刪除
                            </button>
                        )}
                        <button
                            type="submit"
                            className={`flex-2 py-3 ${theme?.accent} text-white font-bold text-sm shadow-lg hover:opacity-90`}
                        >
                            {mode === "create" ? `確認儲存` : "更新紀錄"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;

// import { useState, useEffect } from "react";
// import moment from "moment";
// import {
//     Banknote,
//     Bed,
//     Coffee,
//     CreditCard,
//     Plane,
//     ShoppingBag,
//     Ticket,
//     X,
// } from "lucide-react";

// const TransactionModal = ({
//     initialData,
//     theme,
//     settings,
//     paymentMethods,
//     isOpen,
//     onClose,
//     onSave,
//     onDelete,
// }) => {
//     const [id, setId] = useState(null);
//     const [amount, setAmount] = useState("");
//     const [title, setTitle] = useState("");
//     const [category, setCategory] = useState("food");
//     const [currency, setCurrency] = useState(settings.localCurrency);
//     const [paymentId, setPaymentId] = useState(
//         Array.isArray(paymentMethods) ? paymentMethods[0]?.id : null
//     );
//     const [date, setDate] = useState(moment().format("YYYY-MM-DD"));

//     useEffect(() => {
//         (async () => {
//             if (isOpen && initialData) {
//                 // Edit Mode
//                 setId(initialData.id || null);
//                 setAmount(initialData.amount || "");
//                 setTitle(initialData.title || "");
//                 setCategory(initialData.category || "food");
//                 setCurrency(
//                     initialData.currency_code || settings.localCurrency
//                 );
//                 setPaymentId(
//                     initialData.payment_method_id || paymentMethods[0]?.id
//                 );
//                 setDate(
//                     initialData.expense_date || moment().format("YYYY-MM-DD")
//                 );
//             } else {
//                 setId(null);
//                 setAmount("");
//                 setTitle("");
//                 setCategory("food");
//                 setCurrency(settings.localCurrency);
//                 setPaymentId(paymentMethods[0]?.id);
//                 setDate(moment().format("YYYY-MM-DD"));
//             }
//         })();
//     }, [isOpen, initialData, settings]);

//     if (!isOpen) return null;

//     const categories = [
//         { id: "food", name: "餐飲", icon: Coffee },
//         { id: "transport", name: "交通", icon: Plane },
//         { id: "stay", name: "住宿", icon: Bed },
//         { id: "shopping", name: "購物", icon: ShoppingBag },
//         { id: "ticket", name: "門票", icon: Ticket },
//         { id: "other", name: "其他", icon: CreditCard },
//     ];

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         if (!amount || !title) return;

//         onSave({
//             id,
//             amount: parseFloat(amount),
//             title,
//             category,
//             currency,
//             paymentId,
//             date,
//         });

//         onClose();
//     };

//     return (
//         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
//             <div className="bg-[#F2F2F0] w-full max-w-sm p-6 rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom border border-gray-600">
//                 <div className="flex justify-between items-center mb-6">
//                     <h3 className="font-[Noto_Sans_TC] font-bold text-xl">
//                         {initialData ? "編輯紀錄" : "新增消費"}
//                     </h3>
//                     <button onClick={onClose}>
//                         <X size={24} className="text-gray-400" />
//                     </button>
//                 </div>
//                 <form onSubmit={handleSubmit} className="space-y-5">
//                     {/* Amount & Currency */}
//                     <div>
//                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
//                             金額
//                         </label>
//                         <div className="flex gap-2">
//                             <div className="relative flex-1">
//                                 <input
//                                     type="number"
//                                     inputMode="decimal"
//                                     value={amount}
//                                     step="1"
//                                     onChange={(e) => setAmount(e.target.value)}
//                                     placeholder="0"
//                                     className="w-full bg-white border border-gray-300 p-3 font-mono text-2xl font-bold outline-none focus:border-black"
//                                 />
//                             </div>
//                             <div className="flex bg-white border border-gray-300 rounded overflow-hidden shrink-0">
//                                 {[
//                                     settings.localCurrency,
//                                     settings.homeCurrency,
//                                 ].map((curr) => (
//                                     <button
//                                         key={curr}
//                                         type="button"
//                                         onClick={() => setCurrency(curr)}
//                                         className={`px-3 py-1 text-xs font-bold transition-colors ${
//                                             currency === curr
//                                                 ? "bg-black text-white"
//                                                 : "bg-white text-gray-400"
//                                         }`}
//                                     >
//                                         {curr}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                     {/* Payment Method */}
//                     <div>
//                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
//                             支付方式
//                         </label>
//                         <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
//                             {Array.isArray(paymentMethods) &&
//                                 paymentMethods.map((pm) => (
//                                     <button
//                                         key={pm.id}
//                                         type="button"
//                                         onClick={() => setPaymentId(pm.id)}
//                                         className={`flex items-center px-3 py-2 border whitespace-nowrap transition-all
//                                         ${
//                                             paymentId === pm.id
//                                                 ? "border-black bg-white shadow-md"
//                                                 : "border-gray-200 bg-gray-50 text-gray-400"
//                                         }
//                                     `}
//                                     >
//                                         {pm.type === "credit" ? (
//                                             <CreditCard
//                                                 size={14}
//                                                 className="mr-2"
//                                             />
//                                         ) : (
//                                             <Banknote
//                                                 size={14}
//                                                 className="mr-2"
//                                             />
//                                         )}
//                                         <span className="text-xs font-medium">
//                                             {pm.name}
//                                         </span>
//                                     </button>
//                                 ))}
//                         </div>
//                     </div>
//                     {/* Category */}
//                     <div>
//                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
//                             分類
//                         </label>
//                         <div className="grid grid-cols-6 gap-2">
//                             {categories.map((cat) => (
//                                 <button
//                                     key={cat.id}
//                                     type="button"
//                                     onClick={() => setCategory(cat.id)}
//                                     className={`aspect-square flex flex-col items-center justify-center rounded-full transition-all
//                                         ${
//                                             category === cat.id
//                                                 ? "bg-black text-white"
//                                                 : "bg-gray-200 text-gray-400 hover:bg-gray-300"
//                                         }
//                                     `}
//                                 >
//                                     <cat.icon size={16} />
//                                 </button>
//                             ))}
//                         </div>
//                     </div>
//                     {/* Date */}
//                     <div>
//                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
//                             日期
//                         </label>
//                         <input
//                             type="date"
//                             value={date}
//                             onChange={(e) => setDate(e.target.value)}
//                             className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC]"
//                             placeholder="日期"
//                         />
//                     </div>
//                     {/* Title */}
//                     <div>
//                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
//                             備註
//                         </label>
//                         <input
//                             type="text"
//                             value={title}
//                             onChange={(e) => setTitle(e.target.value)}
//                             className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC]"
//                             placeholder="備註..."
//                         />
//                     </div>
//                     <div className="flex gap-3 pt-4">
//                         {initialData && (
//                             <button
//                                 type="button"
//                                 onClick={() => {
//                                     if (window.confirm("確定刪除？"))
//                                         onDelete(initialData.id);
//                                 }}
//                                 className="flex-1 py-3 bg-gray-200 text-gray-600 font-bold text-sm hover:bg-red-100 hover:text-red-600 transition-colors"
//                             >
//                                 刪除
//                             </button>
//                         )}
//                         <button
//                             type="submit"
//                             className={`flex-2 py-3 ${theme.accent} text-white font-bold text-sm shadow-lg hover:opacity-90`}
//                         >
//                             {initialData ? "更新紀錄" : "確認儲存"}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default TransactionModal;
