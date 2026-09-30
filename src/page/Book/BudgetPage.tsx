import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { Calculator, Camera, Loader2, Plus } from "lucide-react";
import { CATEGORY_DEFINITIONS } from "../../constants/Categories";
import moment from "moment";
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
import FloatingSpeedDial from "../../components/common/FloatingSpeedDial";
import SettingModal from "../../components/budget/SettingModal";
import BudgetOverviewCard from "../../components/budget/BudgetOverviewCard";
import TransactionList from "../../components/budget/TransactionList";
import TransactionModal from "../../components/budget/TransactionModal";
import TransactionFilterModal from "../../components/budget/TransactionFilterModal";
import QuickExpenseBar from "../../components/budget/QuickExpenseBar";
import ReceiptBatchSplitModal from "../../components/budget/ReceiptBatchSplitModal";
import ReceiptViewerModal from "../../components/budget/ReceiptViewerModal";
import SmartSettlementModal from "../../components/budget/SmartSettlementModal";
import FloatingCurrencyConverter from "../../components/shopping/FloatingCurrencyConverter";
import { ReceiptScanner } from "../../services/receipt/ReceiptScannerService";
import { useTripReceipts } from "../../hooks/budget/useTripReceipts";
import { usePaymentMethodSettings } from "../../components/budget/usePaymentMethodSettings";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type { BudgetRow, BudgetRowInsert } from "../../models/types/BudgetTypes";
import type { ParsedReceiptData } from "../../models/types/ReceiptScannerTypes";
import type { TransactionFilterType } from "../../models/types/TransactionFilterTypes";
import type { TripVM } from "../../models/types/TripTypes";

type BudgetPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const BudgetPage: React.FC<BudgetPageProps> = ({
    isPrinting,
    tripDataOverride,
    tripIdOverride,
}) => {
    const { session } = useAuth();
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;

    const { data: budgets, isLoading: isBudgetsLoading } = useBudgets(tripId, session?.user.id);
    const { insert: insertBudget, update: updateBudget, remove: removeBudget, anyPending: anyBudgetPending } = useBudgetMutations();
    const { data: paymentMethods, isLoading: isPaymentMethodsLoading } = usePaymentMethods(tripId, session?.user.id);
    const { upsert: upsertPaymentMethod, remove: removePaymentMethod, anyPending: anyPaymentMethodPending } = usePaymentMethodMutations();
    const { data: profiles, isLoading: isProfilesLoading } = useProfiles(true);
    const { data: tripMembers, isLoading: isTripMembersLoading } = useTripMembers(tripId, true);
    const { update: updateTrip, anyPending: anyTripPending } = useTripMutations();
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();
    const mutatingCount = useIsMutating({ mutationKey: ["trip", "budget_item", "payment_method"] });
    const currentSetting = tripData?.settings_config || null;
    const currentTheme = tripData?.theme_config || null;

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow = isBudgetsLoading || isPaymentMethodsLoading || isProfilesLoading || isTripMembersLoading || anyBudgetPending || anyPaymentMethodPending || anyTripPending || mutatingCount > 0;
        if (shouldShow) timer = window.setTimeout(() => setIsPageLoading(true), 150);
        else setIsPageLoading(false);
        return () => { if (timer) clearTimeout(timer); setIsPageLoading(false); };
    }, [isBudgetsLoading, isPaymentMethodsLoading, isProfilesLoading, isTripMembersLoading, anyBudgetPending, anyPaymentMethodPending, anyTripPending, mutatingCount, setIsPageLoading]);

    // 幣別換算工具
    const convertToHome = (amount: number, currency: string, homeCurrency?: string, exchangeRate?: number) => {
        if (currency === homeCurrency) return amount;
        return Math.round(amount * (exchangeRate || 1));
    };
    const convertToLocal = (amount: number, currency: string, localCurrency?: string, exchangeRate?: number) => {
        if (currency === localCurrency) return amount;
        return Math.round(amount / (exchangeRate || 1));
    };

    // Filter State & Logic
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const initialFilterState: TransactionFilterType = useMemo(() => ({ categories: [], payment_method_ids: [], start_date: moment().format("YYYY-MM-DD"), end_date: moment().format("YYYY-MM-DD") }), []);
    const [filters, setFilters] = useState(initialFilterState);
    const [formFilter, setFormFilter] = useState(initialFilterState);

    const handleToggleCategoryFilter = (catId: string) => {
        setFilters((prev) => {
            const isSelected = prev.categories.includes(catId);
            return {
                ...prev,
                categories: isSelected
                    ? prev.categories.filter((id) => id !== catId)
                    : [...prev.categories, catId],
            };
        });
    };

    const handleTogglePaymentMethodFilter = (pmId: string) => {
        setFilters((prev) => {
            const isSelected = prev.payment_method_ids.includes(pmId);
            return {
                ...prev,
                payment_method_ids: isSelected
                    ? prev.payment_method_ids.filter((id) => id !== pmId)
                    : [...prev.payment_method_ids, pmId],
            };
        });
    };

    const handleClearAllFilters = () => {
        setFilters(initialFilterState);
    };

    const filteredBudgets = useMemo(() => budgets?.filter((ex) => {
        const matchCategory = filters.categories.length > 0 ? filters.categories.includes(ex.category) : true;
        const matchMethod = filters.payment_method_ids.length > 0 ? filters.payment_method_ids.includes(ex.payment_method_id) : true;
        return matchCategory && matchMethod;
    }), [budgets, filters]);

    const filteredPayments = useMemo(() => paymentMethods?.filter((ex) => {
        return filters.payment_method_ids.length > 0 ? filters.payment_method_ids.includes(ex.id) : true;
    }), [paymentMethods, filters]);

    // Budget Create/Edit State
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isCurrencyConverterOpen, setIsCurrencyConverterOpen] = useState(false);
    const [isSmartSettlementModalOpen, setIsSmartSettlementModalOpen] = useState(false);
    const [budgetModalMode, setBudgetModalMode] = useState<"create" | "edit">("create");
    const initialBudgetState: BudgetRow = useMemo(() => ({
        amount: 0, category: "food", created_at: null,
        currency_code: tripData?.settings_config?.localCurrency || "",
        expense_date: moment().format("YYYY-MM-DD"), id: crypto.randomUUID(),
        payment_method_id: paymentMethods?.[0]?.id || "",
        title: "", trip_id: tripId || "", updated_at: null,
        user_id: session ? session.user.id : "", split_with: [],
        is_payer_included: true, settled_with: [],
    }), [tripId, session, tripData, paymentMethods]);
    const [formBudget, setFormBudget] = useState<BudgetRow>(initialBudgetState);
    const budgetCategory = useMemo(() => CATEGORY_DEFINITIONS.map((cat) => ({ id: cat.id, name: cat.label, icon: cat.icon })), []);

    // Payment Setting hook
    const pmSettings = usePaymentMethodSettings();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [budgetToDelete, setBudgetToDelete] = useState<BudgetRow | null>(null);

    const handleDeleteTransaction = (item: BudgetRow) => {
        setBudgetToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleToggleSettleTransaction = async (item: BudgetRow) => {
        try {
            const otherMembers = item.split_with?.filter((uid) => uid !== item.user_id) || [];
            const isCreator = item.user_id === session?.user?.id;
            let newSettledWith: string[] = [];

            if (otherMembers.length > 0) {
                if (isCreator) {
                    const isFullySettled = otherMembers.every((uid) => item.settled_with?.includes(uid));
                    if (isFullySettled) {
                        newSettledWith = (item.settled_with || []).filter((uid) => !otherMembers.includes(uid));
                    } else {
                        newSettledWith = Array.from(new Set([...(item.settled_with || []), ...otherMembers]));
                    }
                } else if (session?.user?.id) {
                    const myId = session.user.id;
                    const isMyDebtSettled = item.settled_with?.includes(myId);
                    if (isMyDebtSettled) {
                        newSettledWith = (item.settled_with || []).filter((uid) => uid !== myId);
                    } else {
                        newSettledWith = [...(item.settled_with || []), myId];
                    }
                }
            } else {
                const isSelfSettled =
                    item.settled_with?.includes("settled") ||
                    (item.user_id ? item.settled_with?.includes(item.user_id) : false);
                if (isSelfSettled) {
                    newSettledWith = [];
                } else {
                    newSettledWith = [item.user_id || "settled"];
                }
            }

            await updateBudget.mutateAsync({
                id: item.id,
                settled_with: newSettledWith,
            });
        } catch (err) {
            console.error("切換結算狀態出錯:", err);
        }
    };

    // Phase 5: 收據管理與批次分帳 State
    const { receiptMap, refreshReceipts } = useTripReceipts(tripId);
    const mobileReceiptInputRef = useRef<HTMLInputElement>(null);
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);
    const [batchSplitData, setBatchSplitData] = useState<{ parsed: ParsedReceiptData; file: File } | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<{ imageId?: string; title?: string; date?: string; amount?: number; currency?: string } | null>(null);

    const handleReceiptFileSelected = async (file: File) => {
        setIsScanningReceipt(true);
        try {
            const parsed = await ReceiptScanner.scanReceipt(file, {
                tripCurrency: tripData?.settings_config?.localCurrency || "JPY",
                allMemberIds: tripMembers?.map((m) => m.user_id).filter(Boolean) as string[],
            });
            setBatchSplitData({ parsed, file });
        } catch (err) {
            console.error("收據辨識出錯:", err);
            alert("收據解析失敗，請重試或確認照片是否清晰");
        } finally {
            setIsScanningReceipt(false);
        }
    };

    const handleBatchInsertBudgets = async (items: BudgetRowInsert[]) => {
        for (const item of items) {
            await insertBudget.mutateAsync(item);
        }
        await refreshReceipts();
    };

    const handleBudgetSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            if (budgetModalMode === "create") {
                await insertBudget.mutateAsync({ ...formBudget, id: crypto.randomUUID() });
            } else {
                await updateBudget.mutateAsync(formBudget);
            }
            setFormBudget(initialBudgetState);
            setIsBudgetModalOpen(false);
        } catch (err) { console.error(err); }
    };

    const handleConfirmDelete = async () => {
        if (!budgetToDelete) return;
        try {
            await removeBudget.mutateAsync(budgetToDelete.id);
            setIsDeleteModalOpen(false);
            setIsBudgetModalOpen(false);
            setBudgetToDelete(null);
            await refreshReceipts();
        } catch (err) { console.error(err); }
    };

    const handleSettingSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await updateTrip.mutateAsync({ ...tripData!, settings_config: pmSettings.formSetting });
            const deleteMethods = paymentMethods?.filter((ap) => pmSettings.formPaymentMethods!.findIndex((p) => p.id === ap.id) < 0);
            for (const pm of pmSettings.formPaymentMethods || []) await upsertPaymentMethod.mutateAsync(pm);
            for (const dm of deleteMethods || []) await removePaymentMethod.mutateAsync(dm.id);
            pmSettings.setIsSettingModalOpen(false);
        } catch (err) { console.error(err); }
    };

    return (
        <div className={`h-full font-[Noto_Sans_TC] text-foreground flex flex-col overflow-hidden ${isPrinting ? "h-auto overflow-visible bg-white pointer-events-none" : `${tripData?.theme_config?.bg || "bg-background"} dark:bg-background`}`}>
            {!isPrinting && (
                <div className="shrink-0">
                    <SectionHeader
                        title="帳本"
                        subtitle="Budget"
                        theme={tripData?.theme_config!}
                        hasBackBtn={true}
                    />

                    {/* 手機版：快速記帳列 (提供 1 鍵極速分類，主新增按鈕移至右下角 FAB) */}
                    <div className="px-4 mt-2 lg:hidden">
                        <QuickExpenseBar
                            onQuickAdd={(catId) => {
                                setBudgetModalMode("create");
                                setFormBudget({
                                    ...initialBudgetState,
                                    id: crypto.randomUUID(),
                                    category: catId,
                                    currency_code: tripData?.settings_config?.localCurrency || "",
                                    payment_method_id: paymentMethods?.[0]?.id || "",
                                });
                                setIsBudgetModalOpen(true);
                            }}
                            onReceiptFileSelected={handleReceiptFileSelected}
                        />
                    </div>
                </div>
            )}

            <div
                className={`flex-1 min-h-0 ${
                    isPrinting
                        ? "px-0 overflow-visible"
                        : "flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden px-4 pt-2.5 pb-2 lg:pb-4 gap-6"
                } no-scrollbar`}
                data-scroll-container="true"
            >
                <div
                    className={`${
                        isPrinting
                            ? "w-full mb-8"
                            : "w-full lg:w-[350px] xl:w-[400px] shrink-0 lg:h-full lg:overflow-y-auto no-scrollbar lg:pr-6 lg:border-r lg:border-border"
                    }`}
                >
                    <BudgetOverviewCard
                        budgetItems={budgets}
                        isPrinting={isPrinting}
                        paymentMethods={paymentMethods}
                        setting={currentSetting}
                        theme={currentTheme}
                        convertToHome={convertToHome}
                        convertToLocal={convertToLocal}
                        selectedCategories={filters.categories}
                        onToggleCategoryFilter={handleToggleCategoryFilter}
                        onClearCategoryFilter={() => setFilters((p) => ({ ...p, categories: [] }))}
                        selectedPaymentMethods={filters.payment_method_ids}
                        onTogglePaymentMethodFilter={handleTogglePaymentMethodFilter}
                        onOpenSmartSettlement={() => setIsSmartSettlementModalOpen(true)}
                        onOpenSettings={() => {
                            pmSettings.setFormSetting(tripData?.settings_config!);
                            pmSettings.setFormPaymentMethods(paymentMethods);
                            pmSettings.setIsSettingModalOpen(true);
                        }}
                    />
                </div>

                <div
                    className={`${
                        isPrinting
                            ? "w-full"
                            : "w-full lg:flex-1 lg:h-full min-w-0 lg:overflow-y-auto no-scrollbar pb-28 lg:pb-8"
                    }`}
                >
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
                        receiptMap={receiptMap}
                        selectedCategories={filters.categories}
                        selectedPaymentMethods={filters.payment_method_ids}
                        onToggleCategoryFilter={handleToggleCategoryFilter}
                        onTogglePaymentMethodFilter={handleTogglePaymentMethodFilter}
                        onClearAllFilters={handleClearAllFilters}
                        onOpenReceiptModal={(rec, item) =>
                            setViewingReceipt({
                                imageId: rec.id,
                                title: item.title,
                                date: item.expense_date || undefined,
                                amount: item.amount,
                                currency: item.currency_code,
                            })
                        }
                        getCategoryIcon={(cat) => {
                            const item =
                                CATEGORY_DEFINITIONS.find((c) => c.id === cat) ||
                                CATEGORY_DEFINITIONS[CATEGORY_DEFINITIONS.length - 1];
                            const Icon = item.icon;
                            return <Icon size={14} />;
                        }}
                        getCategoryName={(cat) =>
                            CATEGORY_DEFINITIONS.find((c) => c.id === cat)?.label || "其他"
                        }
                        onEditBtnClick={(item) => {
                            setBudgetModalMode("edit");
                            setFormBudget(item);
                            setIsBudgetModalOpen(true);
                        }}
                        onDeleteBtnClick={handleDeleteTransaction}
                        onToggleSettle={handleToggleSettleTransaction}
                        onOpenFilterModal={() => setIsFilterModalOpen(true)}
                        hasActiveFilters={
                            filters.categories.length > 0 ||
                            filters.payment_method_ids.length > 0
                        }
                        onAddTransaction={() => {
                            setBudgetModalMode("create");
                            setFormBudget(initialBudgetState);
                            setIsBudgetModalOpen(true);
                        }}
                        onReceiptFileSelected={handleReceiptFileSelected}
                    />
                </div>
            </div>

            {pmSettings.isSettingModalOpen && (
                <SettingModal
                    paymentMethods={pmSettings.formPaymentMethods} setting={pmSettings.formSetting} theme={currentTheme}
                    onAddPaymentMethodBtnClick={() => pmSettings.handleAddPayment(tripId || "", tripData?.settings_config?.localCurrency || "", session?.user.id || "")}
                    onCloseBtnClick={() => pmSettings.setIsSettingModalOpen(false)}
                    onDragPaymentItem={pmSettings.handleDragPaymentItem}
                    onPaymentChange={pmSettings.handlePaymentChange}
                    onPaymentMoveDown={(idx) => pmSettings.handlePaymentMove(idx, "down")}
                    onPaymentMoveUp={(idx) => pmSettings.handlePaymentMove(idx, "up")}
                    onPaymentRemove={pmSettings.handlePaymentRemove}
                    onResetBtnClick={() => { pmSettings.setFormSetting(tripData?.settings_config!); pmSettings.setFormPaymentMethods(paymentMethods); }}
                    onSettingChange={pmSettings.handleSettingChange}
                    onFormSubmit={handleSettingSubmit}
                />
            )}
            {isBudgetModalOpen && (
                <TransactionModal
                    categories={budgetCategory} formData={formBudget} mode={budgetModalMode}
                    paymentMethods={paymentMethods} setting={currentSetting} theme={currentTheme}
                    tripMembers={tripMembers} onCloseBtnClick={() => setIsBudgetModalOpen(false)}
                    onDeleteBtnClick={(item) => { setBudgetToDelete(item); setIsDeleteModalOpen(true); }}
                    onFormDataChange={(name, value) => {
                        if (name === "split_with" || name === "settled_with") {
                            const field = name as "split_with" | "settled_with";
                            const val = value!.toString();
                            const arr = formBudget[field] || [];
                            const exists = arr.includes(val);
                            setFormBudget((prev) => ({ ...prev, [field]: exists ? arr.filter((x) => x !== val) : [...arr, val] }));
                        } else {
                            setFormBudget((prev) => ({ ...prev, [name]: value }));
                        }
                    }}
                    onFormInputChange={(e) => setFormBudget((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
                    onFormSubmit={handleBudgetSubmit}
                />
            )}
            {isFilterModalOpen && (
                <TransactionFilterModal categories={budgetCategory} formData={formFilter} paymentMethods={paymentMethods} theme={currentTheme} onFormDataChange={(name, val) => setFormFilter((p) => ({ ...p, [name]: val }))} onCancelBtnClick={() => setIsFilterModalOpen(false)} onCloseBtnClick={() => setIsFilterModalOpen(false)} onFormSubmit={(e) => { e.preventDefault(); setFilters(formFilter); setIsFilterModalOpen(false); }} />
            )}
            {isDeleteModalOpen && budgetToDelete && (
                <DeleteModal deleteKey={`${moment(budgetToDelete.expense_date).format("YYYY-MM-DD")} ${budgetToDelete.title}`} onCloseClick={() => { setIsDeleteModalOpen(false); setBudgetToDelete(null); }} onConfirmClick={handleConfirmDelete} />
            )}
            {isSmartSettlementModalOpen && (
                <SmartSettlementModal
                    budgets={budgets}
                    profiles={profiles}
                    tripMembers={tripMembers}
                    tripTitle={tripData?.title}
                    session={session}
                    setting={currentSetting}
                    theme={currentTheme}
                    convertToHome={convertToHome}
                    convertToLocal={convertToLocal}
                    onClose={() => setIsSmartSettlementModalOpen(false)}
                />
            )}

            {/* 收據辨識中 Loading 遮罩 */}
            {isScanningReceipt && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="p-6 rounded-3xl bg-card border border-border text-center shadow-2xl flex flex-col items-center gap-3 max-w-xs mx-4">
                        <Loader2 size={36} className="text-primary animate-spin" />
                        <div className="text-sm font-bold text-foreground">收據智慧解析中...</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            正在提取收據店名、日期、幣別與各商品品項明細，請稍候
                        </p>
                    </div>
                </div>
            )}

            {/* 收據批次拆帳確認視窗 */}
            {batchSplitData && (
                <ReceiptBatchSplitModal
                    parsedData={batchSplitData.parsed}
                    imageFile={batchSplitData.file}
                    tripId={tripId || ""}
                    currentUserId={session?.user.id || ""}
                    paymentMethods={paymentMethods}
                    tripMembers={tripMembers}
                    defaultCurrency={tripData?.settings_config?.localCurrency || tripData?.settings_config?.homeCurrency || "TWD"}
                    onClose={() => setBatchSplitData(null)}
                    onBatchSaved={() => {
                        setBatchSplitData(null);
                    }}
                    insertBudgetBatch={handleBatchInsertBudgets}
                />
            )}

            {/* 收據照片燈箱檢視器 */}
            {viewingReceipt && (
                <ReceiptViewerModal
                    imageId={viewingReceipt.imageId}
                    title={viewingReceipt.title}
                    date={viewingReceipt.date}
                    amount={viewingReceipt.amount}
                    currency={viewingReceipt.currency}
                    onClose={() => setViewingReceipt(null)}
                />
            )}

            {/* 隱藏的手機版收據辨識上傳 input（移除 capture 讓 iOS/行動端彈出原生選單：拍照、照片圖庫、從檔案選擇） */}
            <input
                ref={mobileReceiptInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        handleReceiptFileSelected(file);
                    }
                    if (mobileReceiptInputRef.current) {
                        mobileReceiptInputRef.current.value = "";
                    }
                }}
            />

            {/* 手機版統一摺疊式懸浮按鈕 (Speed Dial) - 初始狀態僅顯示單一按鈕 */}
            {!isPrinting && (
                <>
                    <FloatingSpeedDial
                        className="lg:hidden"
                        mainLabel="帳本快捷功能"
                        themeAccent={typeof currentTheme?.accent === "string" ? currentTheme.accent : undefined}
                        actions={[
                            {
                                id: "manual-expense",
                                label: "手動記一筆",
                                icon: <Plus size={20} />,
                                colorClass: "bg-primary text-primary-foreground",
                                onClick: () => {
                                    setBudgetModalMode("create");
                                    setFormBudget(initialBudgetState);
                                    setIsBudgetModalOpen(true);
                                },
                            },
                            {
                                id: "receipt-scan",
                                label: "拍收據辨識",
                                icon: <Camera size={18} />,
                                colorClass: "bg-purple-600 text-white",
                                onClick: () => mobileReceiptInputRef.current?.click(),
                            },
                            {
                                id: "currency-converter",
                                label: "即時匯率換算",
                                icon: <Calculator size={18} />,
                                colorClass: "bg-amber-500 text-white",
                                onClick: () => setIsCurrencyConverterOpen(true),
                            },
                        ]}
                    />

                    {/* 即時匯率換算小計算機 */}
                    <FloatingCurrencyConverter
                        tripData={tripData}
                        isOpen={isCurrencyConverterOpen}
                        onOpenChange={setIsCurrencyConverterOpen}
                        hideTriggerButtonOnMobile={true}
                    />
                </>
            )}
        </div>
    );
};

export default BudgetPage;

