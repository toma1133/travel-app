import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import {
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    Bed,
    CheckCircle2,
    Coffee,
    CreditCard,
    LucideIcon,
    Plane,
    Plus,
    Settings,
    ShoppingBag,
    Ticket,
} from "lucide-react";
import moment from "moment";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import useAuth from "../../hooks/UseAuth";
import useBudgets from "../../hooks/budget/UseBudgets";
import useBudgetMutations from "../../hooks/budget/UseBudgetMutations";
import usePaymentMethods from "../../hooks/budget/UsePaymentMethods";
import usePaymentMethodMutations from "../../hooks/budget/UsePaymentMethodMutations";
import useProfiles from "../../hooks/profile/UseProfiles";
import useTripMutations from "../../hooks/trip/UseTripMutations";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type { TransactionFilterType } from "../../models/types/TransactionFilterTypes";
import type {
    TripSettingConf,
    TripThemeConf,
    TripVM,
} from "../../models/types/TripTypes";
import DeleteModal from "../../components/common/DeleteModal";
import SectionHeader from "../../components/common/SectionHeader";
import SettingModal from "../../components/budget/SettingModal";
import BudgetChart from "../../components/budget/BudgetChart";
import BudgetLimitList from "../../components/budget/BudgetLimitList";
import TransactionList from "../../components/budget/TransactionList";
import TransactionModal from "../../components/budget/TransactionModal";
import TransactionFilter from "../../components/budget/TransactionFilter";

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
    } = useBudgets(tripId, session?.user.id);
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
    } = usePaymentMethods(tripId, session?.user.id);
    const {
        upsert: upsertPaymentMethod,
        remove: removePaymentMethod,
        anyPending: anyPaymentMethodPending,
    } = usePaymentMethodMutations();
    const {
        data: profiles,
        isLoading: isProfilesLoading,
        error: profilesError,
    } = useProfiles(true);
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
            isProfilesLoading ||
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
        isProfilesLoading,
        anyBudgetPending,
        anyPaymentMethodPending,
        anyTripPending,
        mutatingCount,
        setIsPageLoading,
    ]);

    // --- Common delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteType, setDeleteType] = useState("");
    const [deleteKey, setDeleteKey] = useState("");

    // Utils
    const convertToHome = (
        amount: number,
        currency: string,
        homeCurrency?: string,
        exchangeRate?: number
    ) => {
        if (currency === homeCurrency) return amount;
        return Math.round(amount * exchangeRate!);
    };
    const convertToLocal = (
        amount: number,
        currency: string,
        localCurrency?: string,
        exchangeRate?: number
    ) => {
        if (currency === localCurrency) return amount;
        return Math.round(amount / exchangeRate!);
    };

    const getChartGradient = (
        totalSpentHome: number,
        categoryStats: { [key: string]: number },
        theme: TripThemeConf | null
    ) => {
        if (totalSpentHome === 0) return `conic-gradient(#E5E7EB 0% 100%)`;
        let currentDeg = 0;
        const gradients = Object.entries(categoryStats).map(([cat, amount]) => {
            const percent = amount / totalSpentHome;
            const deg = percent * 360;
            const color = theme?.categoryColor[cat] || "#9CA3AF";
            const str = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
            currentDeg += deg;
            return str;
        });
        return `conic-gradient(${gradients.join(", ")})`;
    };

    const getCategoryName = (cat: string) => {
        const map: { [key: string]: string } = {
            transport: "交通",
            stay: "住宿",
            food: "餐飲",
            shopping: "購物",
            ticket: "門票/活動",
            other: "其他",
        };
        return map[cat] || "其他";
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "transport":
                return <Plane size={14} />;
            case "stay":
                return <Bed size={14} />;
            case "food":
                return <Coffee size={14} />;
            case "shopping":
                return <ShoppingBag size={14} />;
            case "ticket":
                return <Ticket size={14} />;
            default:
                return <CreditCard size={14} />;
        }
    };

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
        setFormSetting(tripData?.settings_config);
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
            currency_code: tripData?.settings_config?.homeCurrency || "",
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

    // Budget Modal
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const initialBudgetState: BudgetRow = useMemo(
        () => ({
            amount: 0,
            category: "food",
            created_at: null,
            currency_code: tripData.settings_config?.localCurrency || "",
            expense_date: moment().format("YYYY-MM-DD"),
            id: crypto.randomUUID(),
            payment_method_id:
                Array.isArray(paymentMethods) && paymentMethods.length > 0
                    ? paymentMethods[0].id
                    : "",
            title: "",
            trip_id: tripId || "",
            updated_at: null,
            user_id: session ? session.user.id : "",
            split_with: [],
        }),
        [tripId, session]
    );
    const [budgetModalMode, setBudgetModalMode] = useState("create"); // 'create' | 'edit'
    const [formBudget, setFormBudget] = useState<BudgetRow>(initialBudgetState);
    const [budgetCategory] = useState<
        {
            id: string;
            name: string;
            icon: LucideIcon;
        }[]
    >([
        { id: "food", name: "餐飲", icon: Coffee },
        { id: "transport", name: "交通", icon: Plane },
        { id: "stay", name: "住宿", icon: Bed },
        { id: "shopping", name: "購物", icon: ShoppingBag },
        { id: "ticket", name: "門票", icon: Ticket },
        { id: "other", name: "其他", icon: CreditCard },
    ]);
    const [budgetToDelete, setBudgetToDelete] = useState<BudgetRow | null>(
        null
    );

    const handleAddBudgetBtnClick = () => {
        setBudgetModalMode("create");
        setFormBudget(initialBudgetState);
        setIsBudgetModalOpen(true);
    };

    const handleEditBudgetBtnClick = (transactionItem: BudgetRow) => {
        setBudgetModalMode("edit");
        setFormBudget(transactionItem);
        setIsBudgetModalOpen(true);
    };

    const handleCloseBudgetModalClick = () => {
        setBudgetModalMode("create");
        setFormBudget(initialBudgetState);
        setIsBudgetModalOpen(false);
    };

    const handleBudgetFormDataChange = (
        name: string,
        value?: string | number
    ) => {
        if (name == "split_with") {
            if (formBudget.split_with!.indexOf(value!.toString()) > -1) {
                setFormBudget((prev) => ({
                    ...prev,
                    split_with: prev.split_with!.filter(
                        (x) => x !== value!.toString()
                    ),
                }));
            } else {
                setFormBudget((prev) => ({
                    ...prev,
                    split_with: [...prev.split_with!, value!.toString()],
                }));
            }
        } else {
            setFormBudget((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleBudgetFormInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormBudget((prev) => ({ ...prev, [name]: value }));
    };

    const handleBudgetFormSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const budgetData = { ...formBudget };

        try {
            if (budgetModalMode === "create") {
                await insertBudget.mutateAsync({
                    ...budgetData,
                    id: crypto.randomUUID(),
                });
            } else {
                await updateBudget.mutateAsync(budgetData);
            }
            setFormBudget(initialBudgetState);
            setIsBudgetModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDeleteBudgetModal = (budgetItem: BudgetRow) => {
        setBudgetToDelete(budgetItem);
        setDeleteType("budget_item");
        setDeleteKey(`
            ${moment(budgetItem.expense_date).format("YYYY-MM-DD")} ${
            budgetItem.title
        }`);
        setIsDeleteModalOpen(true);
    };

    // --- Filter
    const initialFilterState: TransactionFilterType = useMemo(
        () => ({
            category: "all",
            payment_method_id: "all",
        }),
        []
    );
    const [filters, setFilters] = useState(initialFilterState);
    const filteredBudgets = useMemo(() => {
        return budgets?.filter((ex) => {
            const matchCategory =
                filters.category !== "all"
                    ? ex.category === filters.category
                    : true;
            const matchMethod =
                filters.payment_method_id !== "all"
                    ? ex.payment_method_id === filters.payment_method_id
                    : true;
            return matchCategory && matchMethod;
        });
    }, [budgets, filters]);
    const filteredPayments = useMemo(() => {
        return paymentMethods?.filter((ex) => {
            const matchMethod =
                filters.payment_method_id !== "all"
                    ? ex.id === filters.payment_method_id
                    : true;
            return matchMethod;
        });
    }, [paymentMethods, filters]);
    const handleFilterChange = (name: string, value?: string | number) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // Split
    const settlements = useMemo(() => {
        const balances: { [key: string]: number } = {};

        // Reset
        profiles?.forEach((p) => (balances[p.id] = 0));

        budgets?.forEach((exp) => {
            const amountInBase = convertToHome(
                exp.amount,
                exp.currency_code,
                tripData.settings_config?.homeCurrency,
                tripData.settings_config?.exchangeRate
            );
            const splitList = [exp.user_id].concat(
                exp.split_with ? [...exp.split_with] : []
            );
            const perPersonAmount =
                splitList.length > 0
                    ? amountInBase / splitList.length
                    : amountInBase;

            if (balances[exp.user_id] !== undefined) {
                balances[exp.user_id] += amountInBase;
            }

            splitList.forEach((personId) => {
                if (balances[personId] !== undefined) {
                    balances[personId] -= perPersonAmount;
                }
            });
        });

        const transactions: {
            fromId: string;
            fromName: string;
            toId: string;
            toName: string;
            amount: number;
        }[] = [];
        const creditors: {
            id: string;
            name: string;
            amount: number;
        }[] = [];
        const debtors: {
            id: string;
            name: string;
            amount: number;
        }[] = [];

        Object.keys(balances).forEach((id) => {
            const profile = profiles?.find((p) => p.id === id);
            const name = profile ? profile.username : id;
            const amount = balances[id];

            if (amount > 0.1) {
                creditors.push({ id, name: name!, amount });
            } else if (amount < -0.1) {
                debtors.push({ id, name: name!, amount: Math.abs(amount) });
            }
        });

        let i = 0,
            j = 0;
        const tDebtors: { id: string; name: string; amount: number }[] =
            JSON.parse(JSON.stringify(debtors));
        const tCreditors: { id: string; name: string; amount: number }[] =
            JSON.parse(JSON.stringify(creditors));

        while (i < tDebtors.length && j < tCreditors.length) {
            const payAmount = Math.min(
                tDebtors[i].amount,
                tCreditors[j].amount
            );

            transactions.push({
                fromId: tDebtors[i].id,
                fromName: tDebtors[i].name,
                toId: tCreditors[j].id,
                toName: tCreditors[j].name,
                amount: payAmount,
            });

            tDebtors[i].amount -= payAmount;
            tCreditors[j].amount -= payAmount;

            if (tDebtors[i].amount < 0.1) i++;
            if (tCreditors[j].amount < 0.1) j++;
        }

        return transactions;
    }, [budgets]);

    // --- Common Modal Handlers ---
    const handleConfirmDelete = async () => {
        try {
            switch (deleteType) {
                case "budget_item":
                    if (!budgetToDelete) return;
                    await removeBudget.mutateAsync(budgetToDelete.id);
                    break;
            }

            setIsDeleteModalOpen(false);
            setIsBudgetModalOpen(false);
            setBudgetToDelete(null);
            setDeleteType("");
            setDeleteKey("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setBudgetToDelete(null);
        setDeleteType("");
        setDeleteKey("");
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
                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                onClick={handleSettingModalOpenBtnClick}
                                className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity`}
                                title="Setting"
                            >
                                <Settings size={16} className="mr-1" />
                                <span>設定</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleAddBudgetBtnClick}
                                className={`flex items-center text-sm font-medium text-white px-4 py-2 rounded-lg shadow-md ${tripData?.theme_config?.accent} hover:opacity-90 transition-opacity`}
                                title="Create"
                            >
                                <Plus size={16} className="mr-1" />
                                <span>新增</span>
                            </button>
                        </div>
                    }
                />
            )}
            <div
                className={`flex flex-col px-4 justify-center items-center ${
                    isPrinting
                        ? "border-b-2 border-gray-900 pb-2 mb-0"
                        : "mb-4 top-0 z-10"
                }`}
            >
                <div className="w-full flex justify-between items-center py-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        分帳結算
                    </h4>
                </div>
                <div
                    className={`w-full ${
                        isPrinting
                            ? "text-xs divide-y divide-gray-200 border-b border-gray-200"
                            : "space-y-2"
                    }`}
                >
                    {settlements.length === 0 ? (
                        <div className="text-center py-10 flex flex-col items-center gap-3 bg-white">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">
                                恭喜！你目前的帳務已結清
                            </p>
                        </div>
                    ) : (
                        settlements.map((s, idx) => {
                            const isIOWE = s.fromId === session?.user.id;

                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all bg-white ${
                                        isIOWE
                                            ? "bg-rose-50/30 border-rose-100"
                                            : "bg-emerald-50/30 border-emerald-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                isIOWE
                                                    ? "bg-rose-100 text-rose-600"
                                                    : "bg-emerald-100 text-emerald-600"
                                            }`}
                                        >
                                            {isIOWE ? (
                                                <ArrowUpRight className="w-5 h-5" />
                                            ) : (
                                                <ArrowDownLeft className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                                {isIOWE
                                                    ? "你應支付給"
                                                    : "你應收回自"}
                                            </div>
                                            <div className="font-bold text-slate-800 text-base">
                                                {isIOWE ? s.toName : s.fromName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div
                                            className={`font-mono font-bold text-lg ${
                                                isIOWE
                                                    ? "text-rose-600"
                                                    : "text-emerald-600"
                                            }`}
                                        >
                                            {
                                                tripData.settings_config
                                                    ?.homeCurrency
                                            }{" "}
                                            {s.amount.toLocaleString(
                                                undefined,
                                                { maximumFractionDigits: 0 }
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            ≈{" "}
                                            {
                                                tripData.settings_config
                                                    ?.localCurrency
                                            }{" "}
                                            {convertToLocal(
                                                s.amount,
                                                tripData.settings_config
                                                    ?.homeCurrency!,
                                                tripData.settings_config
                                                    ?.localCurrency,
                                                tripData.settings_config
                                                    ?.exchangeRate
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {!isPrinting && (
                <TransactionFilter
                    categories={budgetCategory}
                    formData={filters}
                    paymentMethods={paymentMethods}
                    totalCount={filteredBudgets?.length}
                    onFormDataChange={handleFilterChange}
                />
            )}
            <BudgetChart
                budgetItems={filteredBudgets}
                isPrinting={isPrinting}
                setting={tripData.settings_config}
                theme={tripData.theme_config}
                convertToHome={convertToHome}
                getChartGradient={getChartGradient}
                getCategoryName={getCategoryName}
            />
            <BudgetLimitList
                budgetItems={filteredBudgets}
                isPrinting={isPrinting}
                paymentMethods={filteredPayments}
                setting={tripData.settings_config}
                theme={tripData.theme_config}
                convertToHome={convertToHome}
            />
            <TransactionList
                categories={budgetCategory}
                budgetItems={filteredBudgets}
                isPrinting={isPrinting}
                paymentMethods={paymentMethods}
                profiles={profiles}
                session={session}
                setting={tripData.settings_config}
                theme={tripData.theme_config}
                convertToHome={convertToHome}
                getCategoryIcon={getCategoryIcon}
                getCategoryName={getCategoryName}
                onEditBtnClick={handleEditBudgetBtnClick}
            />
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
                    onFormSubmit={handleSettingModalSubmit}
                />
            )}
            {isBudgetModalOpen && (
                <TransactionModal
                    categories={budgetCategory}
                    formData={formBudget}
                    mode={budgetModalMode}
                    paymentMethods={paymentMethods}
                    profiles={profiles}
                    setting={tripData.settings_config}
                    theme={tripData.theme_config}
                    trip={tripData}
                    onCloseBtnClick={handleCloseBudgetModalClick}
                    onDeleteBtnClick={handleOpenDeleteBudgetModal}
                    onFormDataChange={handleBudgetFormDataChange}
                    onFormInputChange={handleBudgetFormInputChange}
                    onFormSubmit={handleBudgetFormSubmit}
                />
            )}
            {isDeleteModalOpen && (
                <DeleteModal
                    deleteKey={deleteKey}
                    onCloseClick={handleCloseDeleteModal}
                    onConfirmClick={handleConfirmDelete}
                />
            )}
        </div>
    );
};

export default BudgetPage;
