import {
    ChangeEvent,
    FormEvent,
    JSX,
    MouseEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import {
    Bed,
    Coffee,
    CreditCard,
    LucideIcon,
    Plane,
    Settings,
    ShoppingBag,
    Ticket,
} from "lucide-react";
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
import type { BudgetRow } from "../../models/types/BudgetTypes";
import type { PaymentMethodRow } from "../../models/types/PaymentMethodTypes";
import type {
    TripSettingConf,
    TripThemeConf,
    TripVM,
} from "../../models/types/TripTypes";
import SectionHeader from "../../components/common/SectionHeader";
import SettingModal from "../../components/budget/SettingModal";
import BudgetChart from "../../components/budget/BudgetChart";
import BudgetLimitList from "../../components/budget/BudgetLimitList";
import TransactionList from "../../components/budget/TransactionList";
import TransactionModal from "../../components/budget/TransactionModal";

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

    // Budget Modal
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [formBudget, setFormBudget] = useState<BudgetRow | null>(null);
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
            <BudgetChart
                budgetItems={budgets}
                isPrinting={isPrinting}
                setting={tripData.settings_config}
                theme={tripData.theme_config}
                convertToHome={convertToHome}
                getChartGradient={getChartGradient}
                getCategoryName={getCategoryName}
            />
            <BudgetLimitList
                budgetItems={budgets}
                isPrinting={isPrinting}
                paymentMethods={paymentMethods}
                setting={tripData.settings_config}
                theme={tripData.theme_config}
                convertToHome={convertToHome}
            />
            <TransactionList
                budgetItems={budgets}
                isPrinting={isPrinting}
                paymentMethods={paymentMethods}
                setting={tripData.settings_config}
                theme={tripData.theme_config}
                convertToHome={convertToHome}
                getCategoryIcon={getCategoryIcon}
                getCategoryName={getCategoryName}
                onAddBtnClick={function (
                    event: MouseEvent<HTMLButtonElement, MouseEvent>
                ): void {
                    throw new Error("Function not implemented.");
                }}
                onEditBtnClick={function (transactionItem: BudgetRow): void {
                    throw new Error("Function not implemented.");
                }}
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
                    onSubmit={handleSettingModalSubmit}
                />
            )}
            {isBudgetModalOpen && <TransactionModal />}
        </div>
    );
};

export default BudgetPage;
