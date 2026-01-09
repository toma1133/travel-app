import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import {
    Bed,
    Coffee,
    CreditCard,
    Filter,
    LucideIcon,
    Plane,
    Plus,
    Settings,
    ShoppingBag,
    Ticket,
    Wallet,
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
import useTripMembers from "../../hooks/tripMember/UseTripMembers";
import useTripMutations from "../../hooks/trip/UseTripMutations";
import DeleteModal from "../../components/common/DeleteModal";
import SectionHeader from "../../components/common/SectionHeader";
import SettingModal from "../../components/budget/SettingModal";
import BudgetChart from "../../components/budget/BudgetChart";
import BudgetLimitList from "../../components/budget/BudgetLimitList";
import TransactionList from "../../components/budget/TransactionList";
import TransactionModal from "../../components/budget/TransactionModal";
import TransactionFilter from "../../components/budget/TransactionFilter";
import SplitInfoModal from "../../components/budget/SplitInfoModal";
import TransactionFilterModal from "../../components/budget/TransactionFilterModal";
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

type BudgetPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const BudgetPage = ({
    isPrinting,
    tripDataOverride,
    tripIdOverride,
}: BudgetPageProps) => {
    const { session } = useAuth();
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;
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
    const {
        data: tripMembers,
        isLoading: isTripMembersLoading,
        error: tripMembersError,
    } = useTripMembers(tripId, true);
    const { update: updateTrip, anyPending: anyTripPending } =
        useTripMutations();
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const mutatingCount = useIsMutating({
        mutationKey: ["trip", "budget_item", "payment_method"],
    });
    const currentSetting = tripData?.settings_config || null;
    const currentTheme = tripData?.theme_config || null;

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow =
            isBudgetsLoading ||
            isPaymentMethodsLoading ||
            isProfilesLoading ||
            isTripMembersLoading ||
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
        isTripMembersLoading,
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
        setFormSetting(tripData?.settings_config!);
        setFormPaymentMethods(paymentMethods);
        setIsSettingModalOpen(true);
    };

    const handleSettingModalCloseBtnClick = () => {
        setIsSettingModalOpen(false);
    };

    const handleSettingModalResetBtnClick = () => {
        setFormSetting(tripData?.settings_config!);
        setFormPaymentMethods(paymentMethods);
    };

    const handleSettingModalSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const updateTripData: TripVM = {
            ...tripData!,
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
            currency_code: tripData?.settings_config?.localCurrency || "",
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
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const initialFilterState: TransactionFilterType = useMemo(
        () => ({
            category: "all",
            payment_method_id: "all",
            start_date: moment().format("YYYY-MM-DD"),
            end_date: moment().format("YYYY-MM-DD"),
        }),
        []
    );
    const [filters, setFilters] = useState(initialFilterState);
    const [formFilter, setFormFilter] = useState(initialFilterState);
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
        setFormFilter((prev) => ({ ...prev, [name]: value }));
    };
    const handleFilterModalOpenBtnClick = () => {
        setIsFilterModalOpen(true);
    };
    const handleFilterModalCancelBtnClick = () => {
        setIsFilterModalOpen(false);
    };
    const handleCloseFilterModalClick = () => {
        setIsFilterModalOpen(false);
    };
    const handleFilterFormSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const filterData = { ...formFilter };

        try {
            setFilters(filterData);
            setIsFilterModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    // Split info
    const [isSplitInfoModalOpen, setSplitInfoModalOpen] = useState(false);

    const handleSplitInfoModalOpenBtnClick = () => {
        setSplitInfoModalOpen(true);
    };

    const handleCloseSplitInfoModalClick = () => {
        setSplitInfoModalOpen(false);
    };

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
                    ? "h-auto min-h-[50vh] break-after-page overflow-visible bg-white" // 移除 print: modifier
                    : `${
                          tripData?.theme_config?.bg || "bg-gray-100"
                      } py-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="消費總覽"
                    subtitle="Spending Analysis"
                    theme={tripData?.theme_config!}
                    rightAction={
                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                onClick={handleSplitInfoModalOpenBtnClick}
                                className={`flex items-center text-sm font-medium bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity`}
                                title="Wallet"
                            >
                                <Wallet size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handleFilterModalOpenBtnClick}
                                className={`flex items-center text-sm font-medium bg-white text-blue px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity`}
                                title="Filter"
                            >
                                <Filter size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handleSettingModalOpenBtnClick}
                                className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg shadow-md ${tripData?.theme_config?.card} hover:opacity-90 transition-opacity`}
                                title="Setting"
                            >
                                <Settings size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handleAddBudgetBtnClick}
                                className={`flex items-center text-sm font-medium text-white px-4 py-2 rounded-lg shadow-md ${tripData?.theme_config?.accent} hover:opacity-90 transition-opacity`}
                                title="Create"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    }
                />
            )}
            {!isPrinting && (
                <TransactionFilter
                    categories={budgetCategory}
                    formData={filters}
                    paymentMethods={paymentMethods}
                    onFormDataChange={handleFilterChange}
                />
            )}
            <div className={`${isPrinting ? "px-0" : "px-4"}`}>
                <BudgetChart
                    budgetItems={filteredBudgets}
                    isPrinting={isPrinting}
                    setting={currentSetting}
                    theme={currentTheme}
                    convertToHome={convertToHome}
                    convertToLocal={convertToLocal}
                    getChartGradient={getChartGradient}
                    getCategoryName={getCategoryName}
                />
                <BudgetLimitList
                    budgetItems={filteredBudgets}
                    isPrinting={isPrinting}
                    paymentMethods={filteredPayments}
                    setting={currentSetting}
                    theme={currentTheme}
                    convertToHome={convertToHome}
                />
                <TransactionList
                    categories={budgetCategory}
                    budgetItems={filteredBudgets}
                    isPrinting={isPrinting}
                    paymentMethods={paymentMethods}
                    session={session}
                    setting={currentSetting}
                    theme={currentTheme}
                    tripMembers={tripMembers}
                    convertToHome={convertToHome}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryName={getCategoryName}
                    onEditBtnClick={handleEditBudgetBtnClick}
                />
            </div>
            {isSettingModalOpen && (
                <SettingModal
                    paymentMethods={formPaymentMethods}
                    setting={formSetting}
                    theme={currentTheme}
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
                    setting={currentSetting}
                    theme={currentTheme}
                    tripMembers={tripMembers}
                    onCloseBtnClick={handleCloseBudgetModalClick}
                    onDeleteBtnClick={handleOpenDeleteBudgetModal}
                    onFormDataChange={handleBudgetFormDataChange}
                    onFormInputChange={handleBudgetFormInputChange}
                    onFormSubmit={handleBudgetFormSubmit}
                />
            )}
            {isSplitInfoModalOpen && (
                <SplitInfoModal
                    budgets={budgets}
                    profiles={profiles}
                    session={session}
                    setting={currentSetting}
                    theme={currentTheme}
                    convertToHome={convertToHome}
                    convertToLocal={convertToLocal}
                    onCloseBtnClick={handleCloseSplitInfoModalClick}
                />
            )}
            {isFilterModalOpen && (
                <TransactionFilterModal
                    categories={budgetCategory}
                    formData={formFilter}
                    paymentMethods={paymentMethods}
                    theme={currentTheme}
                    onFormDataChange={handleFilterChange}
                    onCancelBtnClick={handleFilterModalCancelBtnClick}
                    onCloseBtnClick={handleCloseFilterModalClick}
                    onFormSubmit={handleFilterFormSubmit}
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
