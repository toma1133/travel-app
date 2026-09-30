import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import {
    Plus,
    Share2,
    Search,
    Store,
    ShoppingBag,
    CheckCircle2,
    Filter,
    ArrowUpDown,
    Gift,
    Users,
    User,
    MessageSquare,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    Calculator,
} from "lucide-react";
import FloatingSpeedDial from "../../components/common/FloatingSpeedDial";
import { useQueryClient } from "@tanstack/react-query";
import useShoppingItems from "../../hooks/shopping/UseShoppingItems";
import useShoppingMutations from "../../hooks/shopping/UseShoppingMutations";
import usePlaces from "../../hooks/place/UsePlaces";
import useTripMembers from "../../hooks/tripMember/UseTripMembers";
import useAuth from "../../hooks/UseAuth";
import { shoppingRepo } from "../../services/repositories/ShoppingRepo";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import ShoppingCard from "../../components/shopping/ShoppingCard";
import SwipeableRow from "../../components/common/SwipeableRow";
import ClerkShowModal from "../../components/shopping/ClerkShowModal";
import TaxFreeBar from "../../components/shopping/TaxFreeBar";
import PriceCompareModal from "../../components/shopping/PriceCompareModal";
import ShoppingItemModal from "../../components/shopping/ShoppingItemModal";
import StoreBatchBuyModal, {
    type BatchItemUpdate,
} from "../../components/shopping/StoreBatchBuyModal";
import RecipientFilter from "../../components/shopping/RecipientFilter";
import RecipientSummaryModal from "../../components/shopping/RecipientSummaryModal";
import ShareShoppingModal from "../../components/shopping/ShareShoppingModal";
import ExportToBudgetModal from "../../components/shopping/ExportToBudgetModal";
import PreviewPlaceModal from "../../components/itinerary/PreviewPlaceModal";
import ClerkPhraseModal from "../../components/shopping/ClerkPhraseModal";
import FloatingCurrencyConverter from "../../components/shopping/FloatingCurrencyConverter";
import TaxFreeCelebration from "../../components/shopping/TaxFreeCelebration";
import { decodeShoppingListFromUrl } from "../../utils/ShoppingShareUtil";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type LayoutContextType from "../../models/types/LayoutContextTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type {
    ShoppingItemVM,
    ShoppingItemRow,
    ShoppingRecord,
} from "../../models/types/ShoppingTypes";
import type { TripVM } from "../../models/types/TripTypes";

type ShoppingPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const ShoppingPage = ({
    isPrinting,
    tripDataOverride,
    tripIdOverride,
}: ShoppingPageProps) => {
    const { session } = useAuth();
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();
    const queryClient = useQueryClient();

    // React Query & Mutations
    const { data: rawItems = [], isLoading } = useShoppingItems(tripId);
    const { insert, update, remove, toggleComplete } = useShoppingMutations();
    const { data: places = [] } = usePlaces(tripId);
    const { data: tripMembers = [] } = useTripMembers(tripId, true);

    // Local UI states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStore, setSelectedStore] = useState("all");
    const [selectedRecipient, setSelectedRecipient] = useState("all");
    const [selectedUser, setSelectedUser] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "unbought" | "bought">("all");
    const [isFilterCollapsed, setIsFilterCollapsed] = useState(() => {
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
            return false;
        }
        return true;
    });
    const [isCurrencyConverterOpen, setIsCurrencyConverterOpen] = useState(false);
    const [isStoreBatchBuyOpen, setIsStoreBatchBuyOpen] = useState(false);
    const [batchBuyStore, setBatchBuyStore] = useState<string>("");
    const [storeThresholds, setStoreThresholds] = useState<Record<string, number>>(() => {
        try {
            if (tripId) {
                const saved = localStorage.getItem(`tax_free_thresholds_${tripId}`);
                if (saved) return JSON.parse(saved);
            }
        } catch {}
        return {};
    });
    const [taxFreeStore, setTaxFreeStore] = useState<string>("");

    // Sync store thresholds from rawItems and localStorage
    useEffect(() => {
        if (!tripId) return;
        setStoreThresholds((prev) => {
            let changed = false;
            const updated = { ...prev };

            try {
                const saved = localStorage.getItem(`tax_free_thresholds_${tripId}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    Object.entries(parsed).forEach(([k, v]) => {
                        if (typeof v === "number" && updated[k] === undefined) {
                            updated[k] = v;
                            changed = true;
                        }
                    });
                }
            } catch {}

            rawItems.forEach((item) => {
                const storeName = item.store || "未指定店家";
                if (
                    item.tax_free_threshold !== null &&
                    item.tax_free_threshold !== undefined &&
                    item.tax_free_threshold > 0 &&
                    updated[storeName] === undefined
                ) {
                    updated[storeName] = item.tax_free_threshold;
                    changed = true;
                }
            });
            return changed ? updated : prev;
        });
    }, [tripId, rawItems]);

    const handleUpdateThreshold = async (storeName: string, newThreshold: number) => {
        setStoreThresholds((prev) => ({
            ...prev,
            [storeName]: newThreshold,
        }));
        if (tripId) {
            await shoppingRepo.updateStoreThreshold(tripId, storeName, newThreshold);
            queryClient.invalidateQueries({ queryKey: ["shopping_items", tripId] });
        }
    };

    // Modals
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [itemModalMode, setItemModalMode] = useState<"create" | "edit">("create");
    const [editingItem, setEditingItem] = useState<ShoppingItemVM | null>(null);

    const [clerkItem, setClerkItem] = useState<ShoppingItemVM | null>(null);
    const [priceCompareItem, setPriceCompareItem] = useState<ShoppingItemVM | null>(null);
    const [isRecipientSummaryOpen, setIsRecipientSummaryOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [budgetExportItem, setBudgetExportItem] = useState<ShoppingItemVM | null>(null);
    const [previewPlace, setPreviewPlace] = useState<PlaceVM | null>(null);
    const [isClerkPhraseModalOpen, setIsClerkPhraseModalOpen] = useState(false);

    const [itemToDelete, setItemToDelete] = useState<ShoppingItemVM | null>(null);
    const [budgetSuccessNotice, setBudgetSuccessNotice] = useState("");

    // Page loading sync
    useEffect(() => {
        setIsPageLoading(isLoading);
        return () => setIsPageLoading(false);
    }, [isLoading, setIsPageLoading]);

    // Check for incoming share hash on page load
    useEffect(() => {
        if (window.location.hash.startsWith("#share=")) {
            const hashData = window.location.hash.replace("#share=", "");
            const sharedItems = decodeShoppingListFromUrl(hashData);
            if (sharedItems.length > 0 && tripId) {
                const confirmed = window.confirm(
                    `收到包含 ${sharedItems.length} 項商品的分享清單，是否要將這些商品匯入目前行程中？`
                );
                if (confirmed) {
                    sharedItems.forEach((it) => {
                        insert.mutate({
                            ...it,
                            trip_id: tripId,
                            user_id: session?.user.id || "",
                        });
                    });
                    window.location.hash = "";
                }
            }
        }
    }, [tripId, session, insert]);

    // Group stores with unbought / total counts
    const storeStats = useMemo(() => {
        const map = new Map<string, { total: number; unbought: number; amount: number }>();
        rawItems.forEach((item) => {
            const storeName = item.store || "未指定店家";
            const current = map.get(storeName) || { total: 0, unbought: 0, amount: 0 };
            current.total += 1;
            if (!item.is_completed) current.unbought += 1;

            // Calculate amount for tax-free calculation
            if (item.records && item.records.length > 0) {
                const itemTotal = item.records.reduce(
                    (s, r) => s + (r.price || 0) * (r.quantity || 0),
                    0
                );
                current.amount += itemTotal;
            }
            map.set(storeName, current);
        });
        return Array.from(map.entries());
    }, [rawItems]);

    // Helper: Map ambiguous "自己" to the creator's username or "我"
    const resolveRecipientName = (rec: string, itemUserId?: string | null) => {
        if (rec === "自己") {
            if (session?.user?.id && itemUserId === session.user.id) {
                const myMember = tripMembers.find((m) => m.user_id === session.user.id);
                return myMember?.profiles?.username || myMember?.profiles?.email?.split("@")[0] || "我";
            }
            const creator = tripMembers.find((m) => m.user_id === itemUserId);
            return creator?.profiles?.username || creator?.profiles?.email?.split("@")[0] || "旅伴";
        }
        return rec;
    };

    // Filtered items
    const filteredItems = useMemo(() => {
        return rawItems.filter((item) => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = item.name.toLowerCase().includes(q);
                const matchLocal = item.local_name?.toLowerCase().includes(q) || false;
                const matchStore = item.store?.toLowerCase().includes(q) || false;
                const matchSpecs = item.target_specs?.toLowerCase().includes(q) || false;
                if (!matchName && !matchLocal && !matchStore && !matchSpecs) return false;
            }

            // Store filter
            if (selectedStore !== "all") {
                const itemStore = item.store || "未指定店家";
                if (itemStore !== selectedStore) return false;
            }

            // Recipient filter
            if (selectedRecipient !== "all") {
                const rawRecs = item.recipients?.length ? item.recipients : ["自己"];
                const recs = rawRecs.map((r) => resolveRecipientName(r, item.user_id));
                if (!recs.includes(selectedRecipient)) return false;
            }

            // Member filter (Option A: View by User / Shared Trip)
            if (selectedUser === "me") {
                if (session?.user?.id && item.user_id !== session.user.id) return false;
            } else if (selectedUser !== "all") {
                if (item.user_id !== selectedUser) return false;
            }

            // Status filter
            if (statusFilter === "unbought" && item.is_completed) return false;
            if (statusFilter === "bought" && !item.is_completed) return false;

            return true;
        });
    }, [rawItems, searchQuery, selectedStore, selectedRecipient, selectedUser, statusFilter, session?.user?.id]);

    // Completed / Total summary
    const completedCount = rawItems.filter((i) => i.is_completed).length;

    // All stores stats array with thresholds for unified TaxFreeBar
    const allStores = useMemo(() => {
        return storeStats.map(([name, stat]) => ({
            name,
            amount: stat.amount,
            total: stat.total,
            unbought: stat.unbought,
            threshold: storeThresholds[name] || 5000,
        }));
    }, [storeStats, storeThresholds]);

    const handleViewPlace = (placeId: string) => {
        const found = places.find((p) => p.id === placeId);
        if (found) {
            setPreviewPlace(found);
        }
    };

    // Handlers
    const handleOpenCreateModal = (prefillData?: Partial<ShoppingItemVM>) => {
        setItemModalMode("create");
        if (prefillData) {
            setEditingItem(prefillData as ShoppingItemVM);
        } else {
            setEditingItem(null);
        }
        setIsItemModalOpen(true);
    };

    const handleOpenEditModal = (item: ShoppingItemVM) => {
        setItemModalMode("edit");
        setEditingItem(item);
        setIsItemModalOpen(true);
    };

    const handleSubmitItemModal = (payload: Partial<ShoppingItemRow>) => {
        const targetQty = payload.target_quantity ?? 1;
        const currentRecords = payload.records ?? [];
        const totalBought = currentRecords.reduce((s, r) => s + (r.quantity || 0), 0);
        const isCompletedNow = targetQty > 0 ? totalBought >= targetQty : false;

        if (itemModalMode === "create") {
            insert.mutate({
                ...payload,
                name: payload.name || "未命名商品",
                trip_id: tripId || "",
                user_id: session?.user.id || "",
                is_completed: false,
            });
        } else if (payload.id) {
            update.mutate({
                ...payload,
                is_completed: isCompletedNow,
            } as any);
        }
    };

    const handleSaveRecords = (item: ShoppingItemVM, records: ShoppingRecord[]) => {
        const totalBought = records.reduce((s, r) => s + (r.quantity || 0), 0);
        const targetQty = item.target_quantity || 1;
        const isCompletedNow = targetQty > 0 ? totalBought >= targetQty : false;
        update.mutate({
            id: item.id,
            records: records as any,
            is_completed: isCompletedNow,
        });
    };

    // Flexible in-store bought quantity stepper (+1 or -1 with full reversal)
    const handleUpdateBoughtQty = (item: ShoppingItemVM, newQty: number) => {
        const safeQty = Math.max(0, newQty);
        const targetQty = item.target_quantity || 1;
        const records = item.records || [];

        let nextRecords: ShoppingRecord[] = [];
        if (records.length === 0) {
            if (safeQty > 0) {
                nextRecords = [
                    {
                        id: crypto.randomUUID(),
                        store: item.store || "門市",
                        price: 0,
                        quantity: safeQty,
                        date: new Date().toISOString().split("T")[0],
                    },
                ];
            }
        } else if (records.length === 1) {
            nextRecords = [
                {
                    ...records[0],
                    quantity: safeQty,
                },
            ];
        } else {
            const otherTotal = records.slice(1).reduce((s, r) => s + (r.quantity || 0), 0);
            const primaryQty = Math.max(0, safeQty - otherTotal);
            nextRecords = [
                {
                    ...records[0],
                    quantity: primaryQty,
                },
                ...records.slice(1),
            ];
        }

        const isCompletedNow = targetQty > 0 ? safeQty >= targetQty : false;
        update.mutate({
            id: item.id,
            records: nextRecords as any,
            is_completed: isCompletedNow,
        });
    };

    // Master complete checkbox toggle (Checked = full targetQty, Unchecked = 0 quantity reversal)
    const handleToggleComplete = (item: ShoppingItemVM, targetCompleted: boolean) => {
        const targetQty = item.target_quantity || 1;
        const records = item.records || [];

        if (!targetCompleted) {
            // User unchecks: completely reset is_completed to false and set records quantity to 0
            const nextRecords = records.map((r) => ({ ...r, quantity: 0 }));
            update.mutate({
                id: item.id,
                records: nextRecords as any,
                is_completed: false,
            });
        } else {
            // User checks: mark as completed and set records quantity to targetQty
            let nextRecords = [...records];
            if (nextRecords.length === 0) {
                nextRecords = [
                    {
                        id: crypto.randomUUID(),
                        store: item.store || "門市",
                        price: 0,
                        quantity: targetQty,
                        date: new Date().toISOString().split("T")[0],
                    },
                ];
            } else {
                nextRecords[0] = {
                    ...nextRecords[0],
                    quantity: targetQty,
                };
            }
            update.mutate({
                id: item.id,
                records: nextRecords as any,
                is_completed: true,
            });
        }
    };

    // Helper: Determine creator label for each shopping item
    const getCreatorLabel = (userId?: string | null) => {
        if (!userId) return null;
        if (session?.user?.id && userId === session.user.id) {
            return "由我新增";
        }
        const member = tripMembers.find((m) => m.user_id === userId);
        if (member) {
            const name = member.profiles?.username || member.profiles?.email?.split("@")[0] || "旅伴";
            return `由 ${name} 新增`;
        }
        return "旅伴新增";
    };

    // Other trip members for filtering pills
    const otherMembers = useMemo(() => {
        return tripMembers.filter((m) => m.user_id !== session?.user?.id);
    }, [tripMembers, session?.user?.id]);

    // Open store batch buy modal
    const handleOpenStoreBatchBuy = (storeName?: string) => {
        const targetStore =
            storeName ||
            (selectedStore !== "all" ? selectedStore : allStores[0]?.name || "未指定店家");
        setBatchBuyStore(targetStore);
        setIsStoreBatchBuyOpen(true);
    };

    // Batch update handler
    const handleSaveStoreBatchBuy = async (updates: BatchItemUpdate[]) => {
        try {
            await Promise.all(
                updates.map((up) => {
                    const original = rawItems.find((it) => it.id === up.id);
                    const records = original?.records || [];
                    let nextRecords: ShoppingRecord[] = [];
                    if (records.length <= 1) {
                        nextRecords = [
                            {
                                id: records[0]?.id || crypto.randomUUID(),
                                store: original?.store || batchBuyStore || "門市",
                                price: up.unit_price,
                                quantity: up.bought_quantity,
                                date: records[0]?.date || new Date().toISOString().split("T")[0],
                            },
                        ];
                    } else {
                        const otherTotal = records.slice(1).reduce((s, r) => s + (r.quantity || 0), 0);
                        const primaryQty = Math.max(0, up.bought_quantity - otherTotal);
                        nextRecords = [
                            {
                                ...records[0],
                                price: up.unit_price,
                                quantity: primaryQty,
                            },
                            ...records.slice(1),
                        ];
                    }

                    return update.mutateAsync({
                        id: up.id,
                        records: nextRecords as any,
                        is_completed: up.is_completed,
                    });
                })
            );
            setBudgetSuccessNotice(`已成功批量儲存 ${updates.length} 項商品的採買數量！`);
            setTimeout(() => setBudgetSuccessNotice(""), 3500);
        } catch (err) {
            console.error("Batch update error:", err);
        }
    };

    const handleExportToBudget = (item: ShoppingItemVM) => {
        setBudgetExportItem(item);
    };

    const handleImportFromShare = (imported: ShoppingItemVM[]) => {
        if (!tripId) return;
        imported.forEach((it) => {
            insert.mutate({
                ...it,
                trip_id: tripId,
                user_id: session?.user.id || "",
            });
        });
    };

    return (
        <div
            className={`font-[Noto_Sans_TC] h-full text-foreground ${
                tripData?.theme_config?.bg || "bg-background"
            } dark:bg-background overflow-hidden flex flex-col w-full`}
        >
            {/* Pinned Top: Header, Notices, Filters & Tax-Free Hub */}
            <div className="shrink-0 w-full flex flex-col">
                {!isPrinting && (
                    <SectionHeader
                        title="購物清單"
                        subtitle="Shopping & Wishlist"
                        theme={tripData?.theme_config!}
                        hasBackBtn={true}
                    />
                )}

                {/* Success Toast Notice */}
                {budgetSuccessNotice && (
                    <div className="mx-4 sm:mx-6 md:mx-8 mt-2 p-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-md animate-in fade-in flex items-center justify-between">
                        <span>{budgetSuccessNotice}</span>
                        <button
                            type="button"
                            onClick={() => setBudgetSuccessNotice("")}
                            className="text-white/80 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Pinned Controls, Filters & Tax-Free Hub */}
                <div className="px-4 sm:px-6 md:px-8 pt-2.5 pb-2.5 space-y-2.5 w-full border-b border-border/40 bg-background/50 backdrop-blur-xs">
                    {/* Search & Actions Controls */}
                    <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
                        {/* Search bar */}
                        <div className="relative flex-1">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                type="text"
                                placeholder="搜尋商品名稱、外文原名、店家或規格標籤..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-2xl text-xs text-foreground outline-none shadow-2xs placeholder:text-muted-foreground/50"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Actions & Status Filters */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                            {/* 結帳小卡 */}
                            <button
                                type="button"
                                onClick={() => setIsClerkPhraseModalOpen(true)}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="出國結帳對話速查庫 (大字展示與語音發音)"
                            >
                                <MessageSquare size={13} />
                                <span>結帳小卡</span>
                            </button>

                            {/* 分享 */}
                            <button
                                type="button"
                                onClick={() => setIsShareModalOpen(true)}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="分享或匯入購物清單"
                            >
                                <Share2 size={13} />
                                <span>分享</span>
                            </button>

                            {/* Status Filters: 全部 / 未買 / 已買 */}
                            <div className="flex items-center gap-1 bg-card border border-border/80 p-1 rounded-xl shrink-0 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("all")}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        statusFilter === "all"
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    全部 ({rawItems.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("unbought")}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        statusFilter === "unbought"
                                            ? "bg-rose-500 text-white shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    未買 ({rawItems.length - completedCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("bought")}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        statusFilter === "bought"
                                            ? "bg-emerald-500 text-white shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    已買 ({completedCount})
                                </button>
                            </div>

                            {/* 展開 / 收合進階篩選 (精簡模式切換) */}
                            <button
                                type="button"
                                onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                    !isFilterCollapsed || selectedUser !== "all" || selectedRecipient !== "all" || selectedStore !== "all"
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-card text-muted-foreground hover:text-foreground border-border"
                                }`}
                                title={isFilterCollapsed ? "展開進階篩選與免稅進度" : "收合篩選 (精簡模式)"}
                            >
                                <SlidersHorizontal size={13} />
                                <span className="hidden sm:inline">{isFilterCollapsed ? "進階篩選" : "精簡模式"}</span>
                                <ChevronDown size={13} className={`transition-transform duration-200 ${isFilterCollapsed ? "" : "rotate-180"}`} />
                            </button>

                            {/* 新增商品主按鈕 (桌面版顯示，手機版使用右下角 FAB) */}
                            <button
                                type="button"
                                onClick={() => handleOpenCreateModal()}
                                className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
                            >
                                <Plus size={14} />
                                <span>新增商品</span>
                            </button>
                        </div>
                    </div>

                    {/* Compact Filter Status Bar (shown when collapsed) */}
                    {isFilterCollapsed && (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setIsFilterCollapsed(false)}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 text-xs cursor-pointer shadow-2xs hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                <span className="text-muted-foreground shrink-0 text-[11px] font-bold">篩選：</span>
                                {selectedUser !== "all" && (
                                    <span className="shrink-0 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold">
                                        👤 {selectedUser === "me" ? "我的清單" : otherMembers.find((m) => m.user_id === selectedUser)?.profiles?.username || "旅伴"}
                                    </span>
                                )}
                                {selectedRecipient !== "all" && (
                                    <span className="shrink-0 px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-bold">
                                        🎁 {resolveRecipientName(selectedRecipient, session?.user?.id)}
                                    </span>
                                )}
                                {selectedStore !== "all" && (
                                    <span className="shrink-0 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                        🏪 {selectedStore}
                                    </span>
                                )}
                                {selectedUser === "all" && selectedRecipient === "all" && selectedStore === "all" && (
                                    <span className="text-muted-foreground text-[11px]">
                                        所有店家、成員與對象
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 text-primary text-[11px] font-bold">
                                <span>展開篩選</span>
                                <ChevronDown size={12} />
                            </div>
                        </div>
                    )}

                    {/* Full Filter Section (MemberFilter, RecipientFilter, TaxFreeBar) */}
                    <div className={`${isFilterCollapsed ? "hidden" : "block"} space-y-2.5 animate-in fade-in duration-200`}>
                        {/* Member Filter Row */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground font-bold text-xs shrink-0 pr-1">
                                <Users size={13} className="text-primary" />
                                <span>成員：</span>
                            </div>

                            {/* All Members */}
                            <button
                                type="button"
                                onClick={() => setSelectedUser("all")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                                    selectedUser === "all"
                                        ? "bg-foreground text-background border-foreground shadow-2xs"
                                        : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <span>全部旅伴</span>
                                <span className="text-[10px] font-mono opacity-80">({rawItems.length})</span>
                            </button>

                            {/* My Items */}
                            <button
                                type="button"
                                onClick={() => setSelectedUser("me")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                                    selectedUser === "me"
                                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                        : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <User size={11} />
                                <span>我的清單</span>
                                <span className="text-[10px] font-mono opacity-80">
                                    ({rawItems.filter((i) => i.user_id === session?.user?.id).length})
                                </span>
                            </button>

                            {/* Other members */}
                            {otherMembers.map((m) => {
                                const count = rawItems.filter((i) => i.user_id === m.user_id).length;
                                const name = m.profiles?.username || m.profiles?.email?.split("@")[0] || "旅伴";
                                const isSelected = selectedUser === m.user_id;

                                return (
                                    <button
                                        key={m.user_id}
                                        type="button"
                                        onClick={() => setSelectedUser(m.user_id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                                : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span>{name}</span>
                                        <span className="text-[10px] font-mono opacity-80">({count})</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Recipient Filter Row */}
                        <RecipientFilter
                            items={rawItems}
                            selectedRecipient={selectedRecipient}
                            resolveRecipient={(rec, item) => resolveRecipientName(rec, item.user_id)}
                            onSelectRecipient={setSelectedRecipient}
                            onOpenSummary={() => setIsRecipientSummaryOpen(true)}
                        />

                        {/* Unified Store & Tax-Free Hub */}
                        {allStores.length > 0 && (
                            <TaxFreeBar
                                selectedStore={selectedStore}
                                allStores={allStores}
                                currency={tripData?.settings_config?.localCurrency || "JPY"}
                                onSelectStore={(st) => {
                                    setSelectedStore(st);
                                    setTaxFreeStore(st);
                                }}
                                onUpdateThreshold={handleUpdateThreshold}
                                onOpenStoreBatchBuy={handleOpenStoreBatchBuy}
                            />
                        )}

                        {/* Mobile Quick Collapse Button when expanded */}
                        <div className="md:hidden flex justify-center pt-0.5">
                            <button
                                type="button"
                                onClick={() => setIsFilterCollapsed(true)}
                                className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground py-1 px-3 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
                            >
                                <span>收合篩選 (精簡模式)</span>
                                <ChevronUp size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Shopping Items Container */}
            <div
                data-scroll-container="true"
                className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 sm:px-6 md:px-8 py-3 pb-28 md:pb-12 w-full"
            >
                {/* Shopping Cards Grid */}
                {filteredItems.length === 0 ? (
                    <div className="py-16 text-center space-y-3 bg-card/60 rounded-3xl border border-dashed border-border/80">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto text-3xl">
                            🛍️
                        </div>
                        <div className="text-sm font-bold text-foreground">
                            {rawItems.length === 0
                                ? "願望清單目前空空如也"
                                : "沒有符合篩選條件的商品"}
                        </div>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            {rawItems.length === 0
                                ? "點擊上方「新增商品」開始建立日本/海外旅遊必買伴手禮清單吧！"
                                : "嘗試調整搜尋關鍵字、店家或受贈對象篩選條件。"}
                        </p>
                        {rawItems.length === 0 && (
                            <button
                                type="button"
                                onClick={() => handleOpenCreateModal()}
                                className="mt-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                            >
                                <Plus size={15} />
                                <span>新增第一筆商品</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
                        {filteredItems.map((item) => (
                            <SwipeableRow
                                key={item.id}
                                className="h-full"
                                onSwipeRight={() => handleToggleComplete(item, !item.is_completed)}
                                rightLabel={item.is_completed ? "設為未購" : "標記已購"}
                                onSwipeLeft={() => setItemToDelete(item)}
                                leftLabel="刪除商品"
                            >
                                <ShoppingCard
                                    item={item}
                                    tripData={tripData}
                                    creatorLabel={getCreatorLabel(item.user_id)}
                                    resolveRecipient={(rec) => resolveRecipientName(rec, item.user_id)}
                                    onToggleComplete={handleToggleComplete}
                                    onUpdateBoughtQty={handleUpdateBoughtQty}
                                    onShowToClerk={setClerkItem}
                                    onOpenPriceCompare={setPriceCompareItem}
                                    onEdit={handleOpenEditModal}
                                    onDelete={setItemToDelete}
                                    onExportToBudget={handleExportToBudget}
                                    onViewPlace={handleViewPlace}
                                />
                            </SwipeableRow>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <ShoppingItemModal
                key={isItemModalOpen ? (editingItem?.id || "create") : "closed"}
                isOpen={isItemModalOpen}
                mode={itemModalMode}
                initialData={editingItem}
                places={places}
                tripMembers={tripMembers}
                currentUserId={session?.user?.id}
                tripData={tripData}
                onClose={() => {
                    setIsItemModalOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={handleSubmitItemModal}
            />

            {clerkItem && (
                <ClerkShowModal
                    item={clerkItem}
                    tripData={tripData}
                    onClose={() => setClerkItem(null)}
                />
            )}

            {priceCompareItem && (
                <PriceCompareModal
                    item={priceCompareItem}
                    tripData={tripData}
                    places={places}
                    onSaveRecords={(records) =>
                        handleSaveRecords(priceCompareItem, records)
                    }
                    onClose={() => setPriceCompareItem(null)}
                />
            )}

            {isRecipientSummaryOpen && (
                <RecipientSummaryModal
                    items={rawItems}
                    tripData={tripData}
                    resolveRecipient={(rec, item) => resolveRecipientName(rec, item.user_id)}
                    onClose={() => setIsRecipientSummaryOpen(false)}
                />
            )}

            {isShareModalOpen && (
                <ShareShoppingModal
                    items={rawItems}
                    tripTitle={tripData?.title}
                    onImportItems={handleImportFromShare}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}

            {/* Export To Budget Modal (Requirement 5) */}
            {budgetExportItem && (
                <ExportToBudgetModal
                    item={budgetExportItem}
                    tripId={tripId || ""}
                    userId={session?.user.id || ""}
                    tripData={tripData}
                    onClose={() => setBudgetExportItem(null)}
                    onSuccess={() => {
                        setBudgetSuccessNotice(
                            `已成功將「${budgetExportItem.name}」轉入帳本支出紀錄！`
                        );
                        setTimeout(() => setBudgetSuccessNotice(""), 3500);
                    }}
                />
            )}

            {itemToDelete && (
                <DeleteModal
                    title="刪除商品"
                    description={`確定要將「${itemToDelete.name}」從願望清單中移除嗎？此動作無法復原。`}
                    confirmText="確認刪除"
                    onCloseClick={() => setItemToDelete(null)}
                    onConfirmClick={() => {
                        remove.mutate(itemToDelete.id);
                        setItemToDelete(null);
                    }}
                />
            )}

            {isStoreBatchBuyOpen && (
                <StoreBatchBuyModal
                    isOpen={isStoreBatchBuyOpen}
                    storeName={batchBuyStore}
                    allItems={rawItems}
                    storeThresholds={storeThresholds}
                    tripData={tripData}
                    resolveRecipient={(rec, item) => resolveRecipientName(rec, item.user_id)}
                    onClose={() => setIsStoreBatchBuyOpen(false)}
                    onSaveBatch={handleSaveStoreBatchBuy}
                />
            )}

            {previewPlace && (
                <PreviewPlaceModal
                    place={previewPlace}
                    theme={tripData?.theme_config!}
                    onCloseBtnClick={() => setPreviewPlace(null)}
                />
            )}

            {/* Tax Free Celebration Animation & Confetti */}
            <TaxFreeCelebration
                allStores={allStores}
                currency={tripData?.settings_config?.localCurrency || "JPY"}
                onOpenClerkPhrases={() => setIsClerkPhraseModalOpen(true)}
            />

            {/* Floating Instant Currency Converter */}
            <FloatingCurrencyConverter
                tripData={tripData}
                isOpen={isCurrencyConverterOpen}
                onOpenChange={setIsCurrencyConverterOpen}
                hideTriggerButtonOnMobile={true}
                onAddToList={(amount, currency) => {
                    const targetStore = selectedStore !== "all" ? selectedStore : "";
                    handleOpenCreateModal({
                        currency,
                        store: targetStore,
                        records: [
                            {
                                id: crypto.randomUUID(),
                                store: targetStore || "門市",
                                price: amount,
                                quantity: 1,
                                date: new Date().toISOString().split("T")[0],
                            },
                        ],
                    });
                }}
            />

            {/* Standalone Clerk Phrase Pocketbook Modal */}
            <ClerkPhraseModal
                isOpen={isClerkPhraseModalOpen}
                tripData={tripData}
                onClose={() => setIsClerkPhraseModalOpen(false)}
            />

            {/* 手機版統一摺疊式懸浮按鈕 (Speed Dial) - 初始狀態僅顯示單一懸浮按鈕 */}
            <FloatingSpeedDial
                className="md:hidden"
                mainLabel="購物快捷功能"
                themeAccent={typeof tripData?.theme_config?.accent === "string" ? tripData.theme_config.accent : undefined}
                actions={[
                    {
                        id: "create-item",
                        label: "新增商品",
                        icon: <Plus size={20} />,
                        colorClass: "bg-primary text-primary-foreground",
                        onClick: () => handleOpenCreateModal(),
                    },
                    {
                        id: "currency-calc",
                        label: "即時匯率換算",
                        icon: <Calculator size={18} />,
                        colorClass: "bg-blue-600 text-white",
                        onClick: () => setIsCurrencyConverterOpen(true),
                    },
                ]}
            />
        </div>
    );
};

export default ShoppingPage;
