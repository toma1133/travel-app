import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import useAuth from "../../hooks/UseAuth";
import useBudgets from "../../hooks/budget/UseBudgets";
import useBudgetMutations from "../../hooks/budget/UseBudgetMutations";
import usePaymentMethods from "../../hooks/budget/UsePaymentMethods";
import usePaymentMethodMutations from "../../hooks/budget/UsePaymentMethodMutations";
import useTripMutations from "../../hooks/trip/UseTripMutations";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TripSettingConf, TripVM } from "../../models/types/TripTypes";
import SectionHeader from "../../components/common/SectionHeader";
import SettingModal from "../../components/budget/SettingModal";

type BudgetPageProps = {
    isPrinting?: boolean;
};

const BudgetPage = ({ isPrinting }: BudgetPageProps) => {
    const { session } = useAuth();
    const { id: tripId } = useParams<{ id: string }>();
    const { tripData } = useOutletContext<BookLayoutContextType>();
    const {
        data: budgets,
        isLoading: isBudgetsLoading,
        error: isBudgetsError,
    } = useBudgets(tripId);
    const {
        insert: insertBudget,
        update: updateBudget,
        remove: removeBudget,
        anyPending: anyBudgetPending,
    } = useBudgetMutations();
    const {
        data: paymentMethods,
        isLoading: isPaymentMethodsLoading,
        error: isPaymentMethodsError,
    } = usePaymentMethods(tripId);
    const {
        upsert: upsertPaymentMethod,
        remove: removePaymentMethod,
        anyPending: anyPaymentMethodPending,
    } = usePaymentMethodMutations();
    const { update: updateTrip, anyPending: anyTripPending } =
        useTripMutations();
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const mutatingCount = useIsMutating({
        mutationKey: ["trip", "budget_item", "payment_method"],
    });

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow =
            isBudgetsLoading ||
            isPaymentMethodsLoading ||
            anyBudgetPending ||
            anyPaymentMethodPending ||
            anyTripPending ||
            mutatingCount > 0;

        if (shouldShow) {
            timer = window.setTimeout(() => setIsPageLoading(true), 150);
        } else {
            setIsPageLoading(false);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            setIsPageLoading(false);
        };
    }, [
        isBudgetsLoading,
        isPaymentMethodsLoading,
        anyBudgetPending,
        anyPaymentMethodPending,
        anyTripPending,
        mutatingCount,
        setIsPageLoading,
    ]);

    // Setting Modal
    const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
    const [formSetting, setFormSetting] = useState<TripSettingConf | null>(
        null
    );
    const [formPaymentMethods, setFormPaymentMethods] = useState<
        PaymentMethodRow[] | undefined
    >([]);

    const handleSettingModalOpenBtnClick = () => {
        setFormSetting(tripData.settings_config);
        setFormPaymentMethods(paymentMethods);
        setIsSettingModalOpen(true);
    };

    const handleSettingModalCloseBtnClick = () => {
        setIsSettingModalOpen(false);
    };

    const handleSettingModalResetBtnClick = () => {
        setFormSetting(tripData.settings_config);
        setFormPaymentMethods(paymentMethods);
    };

    const handleSettingModalSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const updateTripData: TripVM = {
            ...tripData,
            settings_config: formSetting,
        };
        const paymentMethodsData: PaymentMethodRow[] = [...formPaymentMethods!];

        try {
            await updateTrip.mutateAsync(updateTripData);

            const deletePaymentMethods = paymentMethods?.filter(
                (ap) => formPaymentMethods!.findIndex((p) => p.id === ap.id) < 0
            );

            // upsert payment method
            for (const paymentMethod of paymentMethodsData) {
                await upsertPaymentMethod.mutateAsync(paymentMethod);
            }

            // remove
            for (const paymentMethod of deletePaymentMethods!) {
                await removePaymentMethod.mutateAsync(paymentMethod.id);
            }

            setFormPaymentMethods(undefined);
            setFormSetting(null);
            setIsSettingModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const initialPaymentState: PaymentMethodRow = useMemo(
        () => ({
            created_at: null,
            credit_limit: 0,
            currency_code: tripData.settings_config?.homeCurrency || "",
            id: crypto.randomUUID(),
            name: "新卡片",
            order: 0,
            trip_id: tripId || "",
            type: "credit",
            updated_at: null,
            user_id: session ? session.user.id : "",
        }),
        [tripId, session]
    );

    const handleDragPaymentItem = (event: DragEndEvent) => {
        if (!formPaymentMethods) return;

        if (event.over && event.active.id !== event.over.id) {
            const oldIndex = formPaymentMethods
                .map((m) => m.id)
                .indexOf(event.active.id.toString());
            const newIndex = formPaymentMethods
                .map((m) => m.id)
                .indexOf(event.over.id.toString());
            const afterDrag = arrayMove(formPaymentMethods, oldIndex, newIndex);
            const finalizedMethods = afterDrag.map((method, index) => ({
                ...method,
                order: index, // Synchronize the explicit 'order' property with the final array index
            }));
            setFormPaymentMethods(finalizedMethods);
        }
    };

    const handlePaymentChange = (
        index: number,
        field: string,
        value: string | number
    ) => {
        const newMethods = [...formPaymentMethods!];
        newMethods[index] = { ...newMethods[index], [field]: value };
        setFormPaymentMethods(newMethods);
    };

    const handleSettingChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormSetting(
            (prev) => ({ ...prev, [name]: value } as TripSettingConf)
        );
    };

    const handleAddPaymentBtnClick = () => {
        const newOrder = formPaymentMethods?.length;
        const newMethod: PaymentMethodRow = {
            ...initialPaymentState,
            id: crypto.randomUUID(),
            order: newOrder!,
        };
        let newPaymentMethods: PaymentMethodRow[] = [];

        if (Array.isArray(formPaymentMethods))
            newPaymentMethods = [...formPaymentMethods];

        setFormPaymentMethods([...newPaymentMethods, newMethod]);
    };

    const handleRemovePaymentBtnClick = (index: number) => {
        const newMethods = formPaymentMethods?.filter((_, i) => i !== index);
        const reorderedMethods = newMethods?.map((method, index) => ({
            ...method,
            order: index,
        }));
        setFormPaymentMethods(reorderedMethods);
    };

    const handlePaymentMoveUp = (index: number) => {
        if (!formPaymentMethods) return;

        if (index > 0) {
            const afterDrag = arrayMove(formPaymentMethods, index, index - 1);
            const finalizedMethods = afterDrag.map((method, index) => ({
                ...method,
                order: index, // Synchronize the explicit 'order' property with the final array index
            }));
            setFormPaymentMethods(finalizedMethods);
        }
    };

    const handlePaymentMoveDown = (index: number) => {
        if (!formPaymentMethods) return;

        if (index < formPaymentMethods.length - 1) {
            const afterDrag = arrayMove(formPaymentMethods, index, index + 1);
            const finalizedMethods = afterDrag.map((method, index) => ({
                ...method,
                order: index, // Synchronize the explicit 'order' property with the final array index
            }));
            setFormPaymentMethods(finalizedMethods);
        }
    };

    return (
        <div
            className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
                isPrinting
                    ? "p-4 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                    : `${
                          tripData?.theme_config?.bg || "bg-gray-100"
                      } py-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="消費總覽"
                    subtitle="Spending Analysis"
                    theme={tripData.theme_config}
                    rightAction={
                        <button
                            type="button"
                            onClick={handleSettingModalOpenBtnClick}
                            className="p-2 text-gray-400 bg-white rounded-full border border-gray-100 hover:text-[#8E354A] shadow-sm"
                            title="Setting"
                        >
                            <Settings size={18} />
                        </button>
                    }
                />
            )}
            {isSettingModalOpen && (
                <SettingModal
                    paymentMethods={formPaymentMethods}
                    setting={formSetting}
                    theme={tripData.theme_config}
                    onAddPaymentMethodBtnClick={handleAddPaymentBtnClick}
                    onCloseBtnClick={handleSettingModalCloseBtnClick}
                    onDragPaymentItem={handleDragPaymentItem}
                    onPaymentChange={handlePaymentChange}
                    onPaymentMoveDown={handlePaymentMoveDown}
                    onPaymentMoveUp={handlePaymentMoveUp}
                    onPaymentRemove={handleRemovePaymentBtnClick}
                    onResetBtnClick={handleSettingModalResetBtnClick}
                    onSettingChange={handleSettingChange}
                    onSubmit={handleSettingModalSubmit}
                />
            )}
        </div>
    );
};

export default BudgetPage;

// import { useState } from "react";
// import {
//     Bed,
//     Coffee,
//     CreditCard,
//     Plane,
//     Plus,
//     Settings,
//     ShoppingBag,
//     Ticket,
// } from "lucide-react";
// import ItemModal from "../../components/budget/ItemModal";
// import SectionHeader from "../../components/common/SectionHeader";
// import SettingsModal from "../../components/budget/SettingsModal";

// const BudgetPage = ({
//     theme,
//     budgetItems,
//     settings,
//     paymentMethods,
//     isPrinting,
//     onAdd,
//     onDelete,
//     onEdit,
//     setSettings,
//     resetData,
// }) => {
//     // --- State ---
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//     const [editItem, setEditItem] = useState(null);

//     // --- Logic ---
//     // 1. Convert everything to Home Currency for stats
//     const convertToHome = (amount, currency) => {
//         if (currency === settings.homeCurrency) return amount;
//         return Math.round(amount * settings.exchangeRate);
//     };

//     const totalSpentHome = Array.isArray(budgetItems)
//         ? budgetItems.reduce(
//               (sum, item) =>
//                   sum + convertToHome(item.amount, item.currency_code),
//               0
//           )
//         : 0;

//     // 2. Card Usage Logic
//     const calculateUsage = () => {
//         const usage = {};
//         if (Array.isArray(paymentMethods))
//             paymentMethods.forEach((pm) => (usage[pm.id] = 0));

//         if (Array.isArray(budgetItems))
//             budgetItems.forEach((item) => {
//                 if (usage[item.payment_method_id] !== undefined) {
//                     usage[item.payment_method_id] += convertToHome(
//                         item.amount,
//                         item.currency_code
//                     );
//                 }
//             });
//         return usage;
//     };
//     const usages = calculateUsage();

//     // 3. Chart Logic (Simple Grayscale/Tone Conic)
//     const categoryStats =
//         Array.isArray(budgetItems) &&
//         budgetItems.reduce((acc, item) => {
//             const homeAmount = convertToHome(item.amount, item.currency_code);
//             acc[item.category] = (acc[item.category] || 0) + homeAmount;
//             return acc;
//         }, {});

//     const getChartGradient = () => {
//         if (totalSpentHome === 0) return `conic-gradient(#E5E7EB 0% 100%)`;
//         let currentDeg = 0;
//         const gradients = Object.entries(categoryStats).map(([cat, amount]) => {
//             const percent = amount / totalSpentHome;
//             const deg = percent * 360;
//             const color = theme.categoryColor[cat] || "#9CA3AF";
//             const str = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
//             currentDeg += deg;
//             return str;
//         });
//         return `conic-gradient(${gradients.join(", ")})`;
//     };

//     const getCategoryIcon = (cat) => {
//         switch (cat) {
//             case "transport":
//                 return <Plane size={14} />;
//             case "stay":
//                 return <Bed size={14} />;
//             case "food":
//                 return <Coffee size={14} />;
//             case "shopping":
//                 return <ShoppingBag size={14} />;
//             case "ticket":
//                 return <Ticket size={14} />;
//             default:
//                 return <CreditCard size={14} />;
//         }
//     };

//     const getCategoryName = (cat) => {
//         const map = {
//             transport: "交通",
//             stay: "住宿",
//             food: "餐飲",
//             shopping: "購物",
//             ticket: "門票/活動",
//             other: "其他",
//         };
//         return map[cat] || "其他";
//     };

//     const handleOpenEdit = (item) => {
//         setEditItem(item);
//         setIsModalOpen(true);
//     };

//     return (
//         <div
//             className={`min-h-full py-12 pb-24 font-[Noto_Sans_TC] text-gray-800 ${
//                 isPrinting
//                     ? "p-0 h-auto break-after-page overflow-visible"
//                     : theme.bg
//             }`}
//         >
//             {/* Header */}
//             {!isPrinting && (
//                 <SectionHeader
//                     title="消費總覽"
//                     subtitle="Spending Analysis"
//                     theme={theme}
//                     rightAction={
//                         <button
//                             onClick={() => setIsSettingsOpen(true)}
//                             className="p-2 text-gray-400 bg-white rounded-full border border-gray-100 hover:text-[#8E354A] shadow-sm"
//                         >
//                             <Settings size={18} />
//                         </button>
//                     }
//                 />
//             )}

//             {/* Chart Section */}
//             <div
//                 className={`flex flex-row px-4 items-center justify-between ${
//                     isPrinting ? "mb-6 border border-gray-300 p-4" : "mb-10"
//                 }`}
//             >
//                 <div className="relative w-32 h-32 shrink-0">
//                     {/* Chart Ring */}
//                     <div
//                         className="w-full h-full rounded-full print:border print:border-gray-400"
//                         style={{
//                             background: getChartGradient(),
//                             mask: "radial-gradient(transparent 60%, black 61%)",
//                             WebkitMask:
//                                 "radial-gradient(transparent 60%, black 61%)",
//                         }}
//                     ></div>
//                     {/* Center Text */}
//                     <div className="absolute inset-0 flex items-center justify-center flex-col">
//                         <span className="text-[10px] text-gray-400 uppercase tracking-wider print:text-gray-600">
//                             總支出
//                         </span>
//                         <span className={`text-sm font-bold ${theme.mono}`}>
//                             {settings.homeCurrency}
//                         </span>
//                     </div>
//                 </div>
//                 <div className="flex-1 pl-6 text-right">
//                     <div className="text-5xl font-light tracking-tighter text-gray-900 font-mono print:text-right">
//                         {totalSpentHome.toLocaleString()}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-1 print:text-right">
//                         ≈ {settings.localCurrency}{" "}
//                         {Math.round(
//                             totalSpentHome / settings.exchangeRate
//                         ).toLocaleString()}
//                     </div>
//                     {/* Legend Mini */}
//                     <div
//                         className={`flex flex-wrap justify-end gap-2 mt-4 ${
//                             isPrinting ? "border-t border-gray-300 pt-4" : ""
//                         }`}
//                     >
//                         {Object.entries(categoryStats)
//                             .sort(([, a], [, b]) => b - a)
//                             .slice(0, 3)
//                             .map(([cat, val]) => (
//                                 <div
//                                     key={cat}
//                                     className="flex items-center text-[10px] text-gray-500"
//                                 >
//                                     <div
//                                         className="w-2 h-2 rounded-full mr-1"
//                                         style={{
//                                             backgroundColor:
//                                                 theme.categoryColor[cat],
//                                         }}
//                                     ></div>
//                                     {getCategoryName(cat)}
//                                     {Math.round((val / totalSpentHome) * 100)}%
//                                 </div>
//                             ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Cards & Limits Section */}
//             <div
//                 className={`px-4 ${
//                     isPrinting ? "mb-6 border border-gray-300 p-4" : "mb-8"
//                 }`}
//             >
//                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 print:text-gray-700 print:text-center print:border-b print:pb-2">
//                     支付額度狀態 ({settings.homeCurrency})
//                 </h4>
//                 <div
//                     className={`grid ${
//                         isPrinting ? "grid-cols-2 gap-x-4 gap-y-3" : "space-y-3"
//                     }`}
//                 >
//                     {Array.isArray(paymentMethods) &&
//                         paymentMethods.map((pm) => {
//                             const used = usages[pm.id] || 0;
//                             const percent = Math.min(
//                                 (used / pm.credit_limit) * 100,
//                                 100
//                             );
//                             return (
//                                 <div
//                                     key={pm.id}
//                                     className={`
//                                         ${
//                                             isPrinting
//                                                 ? "bg-gray-50 p-3 rounded-md border border-gray-200"
//                                                 : "bg-white border border-gray-200 p-3 shadow-sm rounded-lg"
//                                         }
//                                     `}
//                                 >
//                                     <div className="flex justify-between items-center mb-2">
//                                         <div className="flex items-center">
//                                             <CreditCard
//                                                 size={14}
//                                                 className="mr-2 text-gray-400"
//                                             />
//                                             <span className="text-xs font-bold text-gray-700">
//                                                 {pm.name}
//                                             </span>
//                                         </div>
//                                         <span
//                                             className={`text-xs ${theme.mono} ${
//                                                 percent > 90 &&
//                                                 pm.credit_limit != 0
//                                                     ? "text-red-600"
//                                                     : "text-gray-500"
//                                             }`}
//                                         >
//                                             {used.toLocaleString()} /{" "}
//                                             {pm.credit_limit === 0
//                                                 ? "∞"
//                                                 : pm.credit_limit.toLocaleString()}
//                                         </span>
//                                     </div>
//                                     <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
//                                         <div
//                                             className={`h-full transition-all duration-500 ${
//                                                 percent > 90 &&
//                                                 pm.credit_limit != 0
//                                                     ? "bg-red-500"
//                                                     : "bg-gray-800"
//                                             }`}
//                                             style={{
//                                                 width: `${
//                                                     pm.credit_limit == 0
//                                                         ? 100
//                                                         : percent
//                                                 }%`,
//                                             }}
//                                         ></div>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                 </div>
//             </div>

//             {/* Transaction List Header */}
//             <div
//                 className={`flex px-4 justify-between items-center ${
//                     isPrinting
//                         ? "border-b-2 border-gray-900 pb-2 mb-0"
//                         : "mb-4 sticky top-0 py-2 z-10"
//                 }`}
//             >
//                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
//                     交易紀錄
//                 </h4>
//                 {!isPrinting && (
//                     <button
//                         onClick={() => handleOpenEdit(null)}
//                         className="flex items-center text-xs font-bold text-gray-900 bg-white border border-gray-300 px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all"
//                     >
//                         <Plus size={14} className="mr-1" />
//                         新增
//                     </button>
//                 )}
//             </div>

//             {/* List */}
//             <div
//                 className={`px-4 ${
//                     isPrinting
//                         ? "text-xs divide-y divide-gray-200 border-b border-gray-200"
//                         : "space-y-2"
//                 }`}
//             >
//                 {Array.isArray(budgetItems) &&
//                     budgetItems.map((item) => {
//                         const pmName =
//                             paymentMethods.find(
//                                 (p) => p.id === item.payment_method_id
//                             )?.name || "Unknown";
//                         return (
//                             <button
//                                 key={item.id}
//                                 onClick={() =>
//                                     isPrinting ? null : handleOpenEdit(item)
//                                 }
//                                 className={`w-full bg-white flex justify-between text-left ${
//                                     isPrinting
//                                         ? "p-2 border-b border-gray-200"
//                                         : "group items-center p-4 border border-gray-100 hover:border-gray-400 transition-colors rounded-lg shadow-sm"
//                                 }`}
//                             >
//                                 <div
//                                     className={`flex items-start ${
//                                         isPrinting ? "w-1/2" : ""
//                                     }`}
//                                 >
//                                     {!isPrinting && (
//                                         <div
//                                             className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white shadow-sm"
//                                             style={{
//                                                 backgroundColor:
//                                                     theme.categoryColor[
//                                                         item.category
//                                                     ] ||
//                                                     theme.categoryColor.other,
//                                             }}
//                                         >
//                                             {getCategoryIcon(item.category)}
//                                         </div>
//                                     )}
//                                     <div
//                                         className={`${
//                                             isPrinting ? "flex-1" : ""
//                                         }`}
//                                     >
//                                         <div
//                                             className={`text-sm font-bold text-gray-900 ${
//                                                 !isPrinting
//                                                     ? "group-hover:text-[#9F1239] transition-colors "
//                                                     : ""
//                                             }`}
//                                         >
//                                             {item.title}
//                                         </div>
//                                         {/* Sub details row */}
//                                         <div className="text-[10px] text-gray-400 mt-0.5 flex items-center print:text-gray-600 print:mt-0">
//                                             <span
//                                                 className={`mr-2 ${
//                                                     isPrinting
//                                                         ? "font-semibold text-gray-500"
//                                                         : ""
//                                                 }`}
//                                             >
//                                                 {getCategoryName(item.category)}
//                                             </span>
//                                             <span className="mr-2">|</span>
//                                             <span className="print:text-gray-500">
//                                                 {item.expense_date}
//                                             </span>
//                                             <span
//                                                 className={`${
//                                                     isPrinting
//                                                         ? "hidden"
//                                                         : "bg-gray-100 px-1.5 rounded text-gray-500 ml-2"
//                                                 }`}
//                                             >
//                                                 {pmName}
//                                             </span>
//                                         </div>
//                                         {isPrinting && (
//                                             <div className="text-[10px] text-gray-500 mt-1">
//                                                 支付方式: {pmName}
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                                 {/* Amount Column */}
//                                 <div
//                                     className={`text-right ${
//                                         isPrinting ? "w-1/2" : ""
//                                     }`}
//                                 >
//                                     <div
//                                         className={`text-sm font-bold ${theme.mono} text-gray-900`}
//                                     >
//                                         {item.currency_code}{" "}
//                                         {item.amount.toLocaleString()}
//                                     </div>
//                                     {/* Home Currency Conversion (Always visible in print for calculation) */}
//                                     {item.currency_code !==
//                                         settings.homeCurrency && (
//                                         <div className="text-[10px] text-gray-400 font-mono">
//                                             ≈ {settings.homeCurrency}{" "}
//                                             {convertToHome(
//                                                 item.amount,
//                                                 item.currency_code
//                                             ).toLocaleString()}
//                                         </div>
//                                     )}
//                                 </div>
//                             </button>
//                         );
//                     })}
//                 {!Array.isArray(budgetItems) ||
//                     (budgetItems.length === 0 && (
//                         <div className="text-center py-10 text-gray-400 text-xs">
//                             尚無紀錄
//                         </div>
//                     ))}
//             </div>

//             {/* Modals (Hidden in Print) */}
//             {!isPrinting && (
//                 <>
//                     <ItemModal
//                         initialData={editItem}
//                         theme={theme}
//                         settings={settings}
//                         paymentMethods={paymentMethods}
//                         isOpen={isModalOpen}
//                         onClose={() => {
//                             setIsModalOpen(false);
//                             setEditItem(null);
//                         }}
//                         onSave={(data) => {
//                             if (editItem) onEdit(data);
//                             else onAdd(data);

//                             setEditItem(null);
//                         }}
//                         onDelete={(id) => {
//                             onDelete(id);
//                             setIsModalOpen(false);
//                             setEditItem(null);
//                         }}
//                     />

//                     <SettingsModal
//                         theme={theme}
//                         settings={settings}
//                         paymentMethods={paymentMethods}
//                         isOpen={isSettingsOpen}
//                         onClose={() => setIsSettingsOpen(false)}
//                         onSave={setSettings}
//                         onReset={resetData}
//                     />
//                 </>
//             )}
//         </div>
//     );
// };

// export default BudgetPage;
