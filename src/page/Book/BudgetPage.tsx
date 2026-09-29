import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { Wallet, Filter, Settings, Plus, Camera, Sparkles, Loader2 } from "lucide-react";
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
import SettingModal from "../../components/budget/SettingModal";
import BudgetOverviewCard from "../../components/budget/BudgetOverviewCard";
import TransactionList from "../../components/budget/TransactionList";
import TransactionModal from "../../components/budget/TransactionModal";
import TransactionFilterModal from "../../components/budget/TransactionFilterModal";
import QuickExpenseBar from "../../components/budget/QuickExpenseBar";
import ReceiptBatchSplitModal from "../../components/budget/ReceiptBatchSplitModal";
import ReceiptViewerModal from "../../components/budget/ReceiptViewerModal";
import SmartSettlementModal from "../../components/budget/SmartSettlementModal";
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
    const [isSmartSettlementModalOpen, setIsSmartSettlementModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [budgetToDelete, setBudgetToDelete] = useState<BudgetRow | null>(null);

    // Phase 5: 收據管理與批次分帳 State
    const { receiptMap, refreshReceipts } = useTripReceipts(tripId);
    const desktopFileInputRef = React.useRef<HTMLInputElement>(null);
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
        <div className={`min-h-full font-[Noto_Sans_TC] text-foreground ${isPrinting ? "h-auto overflow-visible bg-white pointer-events-none" : `${tripData?.theme_config?.bg || "bg-background"} dark:bg-background pb-24 lg:pb-0 lg:h-[100dvh] lg:overflow-hidden lg:flex lg:flex-col`}`}>
            {/* 隱藏式收據照片上傳 Input (供桌面版 Header 觸發) */}
            <input
                ref={desktopFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleReceiptFileSelected(f);
                    if (desktopFileInputRef.current) desktopFileInputRef.current.value = "";
                }}
            />

            {!isPrinting && (
                <SectionHeader
                    title="帳本" subtitle="Budget" theme={tripData?.theme_config!} hasBackBtn={true}
                    rightAction={
                        <div className="flex justify-center items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setIsSmartSettlementModalOpen(true)}
                                className="flex items-center text-sm font-medium bg-card text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                                title="分帳結算中心"
                            >
                                <Wallet size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => desktopFileInputRef.current?.click()}
                                className="hidden sm:flex items-center text-sm font-medium bg-card text-purple-600 dark:text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl shadow-xs hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                                title="拍收據/上傳發票自動辨識分帳"
                            >
                                <Camera size={16} />
                            </button>
                            <button type="button" onClick={() => setIsFilterModalOpen(true)} className={`flex items-center text-sm font-medium bg-card text-blue-500 border border-border/50 px-3 py-1.5 rounded-xl shadow-xs hover:bg-muted/50 transition-colors ${filters.categories.length > 0 || filters.payment_method_ids.length > 0 ? "bg-blue-50 dark:bg-blue-900/20" : ""}`} title="交易過濾">
                                <Filter size={16} fill={filters.categories.length > 0 || filters.payment_method_ids.length > 0 ? "currentColor" : "none"} />
                            </button>
                            <button type="button" onClick={() => { pmSettings.setFormSetting(tripData?.settings_config!); pmSettings.setFormPaymentMethods(paymentMethods); pmSettings.setIsSettingModalOpen(true); }} className="flex items-center text-sm font-medium px-3 py-1.5 rounded-xl shadow-xs bg-card text-foreground border border-border/50 hover:bg-muted/50 transition-colors" title="設定">
                                <Settings size={16} />
                            </button>
                            <button type="button" onClick={() => { setBudgetModalMode("create"); setFormBudget(initialBudgetState); setIsBudgetModalOpen(true); }} className={`flex items-center gap-1 text-sm font-bold text-white px-3.5 py-1.5 rounded-xl shadow-xs ${tripData?.theme_config?.accent} hover:opacity-90 transition-opacity`} title="記一筆">
                                <Plus size={16} />
                                <span className="hidden sm:inline">記一筆</span>
                            </button>
                        </div>
                    }
                />
            )}

            {!isPrinting && (
                <div className="px-4 mt-3 lg:hidden">
                    <QuickExpenseBar
                        onQuickAdd={(catId) => { setBudgetModalMode("create"); setFormBudget({ ...initialBudgetState, id: crypto.randomUUID(), category: catId, currency_code: tripData?.settings_config?.localCurrency || "", payment_method_id: paymentMethods?.[0]?.id || "" }); setIsBudgetModalOpen(true); }}
                        onOpenGeneralAdd={() => { setBudgetModalMode("create"); setFormBudget(initialBudgetState); setIsBudgetModalOpen(true); }}
                        onReceiptFileSelected={handleReceiptFileSelected}
                    />
                </div>
            )}

            <div className={`lg:flex-1 ${isPrinting ? "px-0" : "lg:flex lg:flex-row lg:overflow-hidden px-4 mt-4 lg:mt-6"}`}>
                <div className={`${isPrinting ? "w-full mb-8" : "lg:w-[350px] xl:w-[400px] lg:flex-shrink-0 lg:overflow-y-auto no-scrollbar lg:pr-6 lg:border-r lg:border-border lg:mr-6 mb-6 lg:mb-0"}`}>
                    <BudgetOverviewCard budgetItems={filteredBudgets} isPrinting={isPrinting} paymentMethods={filteredPayments} setting={currentSetting} theme={currentTheme} convertToHome={convertToHome} convertToLocal={convertToLocal} />
                </div>

                <div className={`${isPrinting ? "w-full" : "lg:flex-1 lg:overflow-y-auto no-scrollbar lg:min-w-0 flex flex-col pb-20 lg:pb-0"}`}>
                    <TransactionList
                        categories={budgetCategory} budgetItems={filteredBudgets} isPrinting={isPrinting}
                        paymentMethods={paymentMethods} session={session} setting={currentSetting}
                        theme={currentTheme} tripMembers={tripMembers} convertToHome={convertToHome}
                        receiptMap={receiptMap}
                        onOpenReceiptModal={(rec, item) => setViewingReceipt({ imageId: rec.id, title: item.title, date: item.expense_date || undefined, amount: item.amount, currency: item.currency_code })}
                        getCategoryIcon={(cat) => { const item = CATEGORY_DEFINITIONS.find((c) => c.id === cat) || CATEGORY_DEFINITIONS[CATEGORY_DEFINITIONS.length - 1]; const Icon = item.icon; return <Icon size={14} />; }}
                        getCategoryName={(cat) => CATEGORY_DEFINITIONS.find((c) => c.id === cat)?.label || "其他"}
                        onEditBtnClick={(item) => { setBudgetModalMode("edit"); setFormBudget(item); setIsBudgetModalOpen(true); }}
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

            {/* 分帳結算中心彈窗 (最少轉帳演算法與各員淨收支) */}
            {isSmartSettlementModalOpen && (
                <SmartSettlementModal
                    budgets={filteredBudgets}
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
        </div>
    );
};

export default BudgetPage;

