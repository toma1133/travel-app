import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    X,
    Image,
    Store,
    Tag,
    Users,
    AlertCircle,
    Check,
    Plus,
    Minus,
    MapPin,
    Search,
    Calculator,
    Trash2,
    User,
} from "lucide-react";
import type {
    ShoppingItemRow,
    ShoppingItemVM,
    ShoppingRecord,
} from "../../models/types/ShoppingTypes";
import { SHOPPING_CATEGORIES } from "../../models/types/ShoppingTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";
import type { TripVM } from "../../models/types/TripTypes";
import {
    getCurrencySymbol,
    getCurrencyName,
} from "../../utils/CurrencyUtil";

type ShoppingItemModalProps = {
    isOpen: boolean;
    mode: "create" | "edit";
    initialData?: ShoppingItemVM | null;
    places?: PlaceVM[];
    tripMembers?: TripMemberVM[];
    currentUserId?: string;
    tripData?: TripVM | null;
    onClose: () => void;
    onSubmit: (data: Partial<ShoppingItemRow>) => void;
};

const COMMON_RECIPIENTS = ["媽媽", "爸爸", "同事", "伴侶", "朋友"];

const ShoppingItemModal = ({
    isOpen,
    mode,
    initialData,
    places = [],
    tripMembers = [],
    currentUserId,
    tripData,
    onClose,
    onSubmit,
}: ShoppingItemModalProps) => {
    const [name, setName] = useState(initialData?.name || "");
    const [localName, setLocalName] = useState(initialData?.local_name || "");
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
    const [store, setStore] = useState(initialData?.store || "");
    const [placeId, setPlaceId] = useState<string | null>(
        initialData?.place_id || null
    );
    const [category, setCategory] = useState(
        initialData?.category || "cosmetics"
    );
    const [targetSpecs, setTargetSpecs] = useState(
        initialData?.target_specs || ""
    );

    // Derive current user's display name and all trip member options
    const myMember = tripMembers?.find((m) => m.user_id === currentUserId);
    const myName =
        myMember?.profiles?.username ||
        myMember?.profiles?.email?.split("@")[0] ||
        "我";

    const tripMemberOptions = useMemo(() => {
        if (!tripMembers || tripMembers.length === 0) {
            return [{ name: myName, isMe: true }];
        }
        const list: { name: string; isMe: boolean }[] = [];
        list.push({ name: myName, isMe: true });
        tripMembers.forEach((m) => {
            if (m.user_id !== currentUserId) {
                const name =
                    m.profiles?.username ||
                    m.profiles?.email?.split("@")[0] ||
                    "旅伴";
                if (!list.some((it) => it.name === name)) {
                    list.push({ name, isMe: false });
                }
            }
        });
        return list;
    }, [tripMembers, currentUserId, myName]);

    const resolveInitRecipients = (recs?: string[] | null) => {
        if (!recs || recs.length === 0) return [myName];
        return recs.map((r) => (r === "自己" ? myName : r));
    };

    const resolveInitAllocations = (
        allocs?: Record<string, number> | null,
        recs?: string[]
    ) => {
        const res: Record<string, number> = {};
        if (allocs) {
            Object.entries(allocs).forEach(([k, v]) => {
                const resolvedKey = k === "自己" ? myName : k;
                res[resolvedKey] = v;
            });
        }
        if (Object.keys(res).length === 0 && recs && recs.length > 0) {
            recs.forEach((r) => {
                res[r] = 1;
            });
        }
        if (Object.keys(res).length === 0) {
            res[myName] = 1;
        }
        return res;
    };

    // Quantities & Recipients
    const [targetQuantity, setTargetQuantity] = useState<number>(
        initialData?.target_quantity || 1
    );
    const [recipients, setRecipients] = useState<string[]>(() =>
        resolveInitRecipients(initialData?.recipients)
    );
    const [recipientAllocations, setRecipientAllocations] = useState<
        Record<string, number>
    >(() =>
        resolveInitAllocations(
            initialData?.recipient_allocations,
            initialData?.recipients ? resolveInitRecipients(initialData.recipients) : undefined
        )
    );
    const [newRecipientInput, setNewRecipientInput] = useState("");

    // Custom recipients tags pool (persists custom tags so they can be toggled or deleted)
    const [customTagList, setCustomTagList] = useState<string[]>(() => {
        if (!initialData?.recipients) return [];
        const memberNames = tripMemberOptions.map((t) => t.name);
        return initialData.recipients
            .map((r) => (r === "自己" ? myName : r))
            .filter((r) => !COMMON_RECIPIENTS.includes(r) && !memberNames.includes(r));
    });

    // Trip Currency & Rates
    const tripLocalCurrency =
        tripData?.settings_config?.localCurrency || "JPY";
    const homeCurrency = tripData?.settings_config?.homeCurrency || "TWD";
    const exchangeRate = tripData?.settings_config?.exchangeRate || 0;

    const [currency, setCurrency] = useState<string>(
        initialData?.currency || tripLocalCurrency
    );

    // Records & Pricing
    const [records, setRecords] = useState<ShoppingRecord[]>(
        initialData?.records || []
    );
    const [initialPriceInput, setInitialPriceInput] = useState(
        initialData?.records && initialData.records.length > 0
            ? initialData.records[0].price.toString()
            : ""
    );
    const [note, setNote] = useState(initialData?.note || "");
    const [imgPreviewFailed, setImgPreviewFailed] = useState(false);

    // Toggle between local currency and home currency with smart value conversion
    const handleCurrencyToggle = (targetCurrency: string) => {
        if (targetCurrency === currency) return;
        const num = parseFloat(initialPriceInput);
        if (!isNaN(num) && num > 0 && exchangeRate > 0) {
            if (targetCurrency === homeCurrency && currency === tripLocalCurrency) {
                setInitialPriceInput(Math.round(num * exchangeRate).toString());
            } else if (targetCurrency === tripLocalCurrency && currency === homeCurrency) {
                setInitialPriceInput(Math.round(num / exchangeRate).toString());
            }
        }
        setCurrency(targetCurrency);
    };

    // Sync all form states whenever modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            const memberNames = tripMemberOptions.map((t) => t.name);
            if (initialData) {
                setName(initialData.name || "");
                setLocalName(initialData.local_name || "");
                setImageUrl(initialData.image_url || "");
                setStore(initialData.store || "");
                setPlaceId(initialData.place_id || null);
                setCategory(initialData.category || "cosmetics");
                setTargetSpecs(initialData.target_specs || "");
                setTargetQuantity(initialData.target_quantity || 1);
                const resRecs = resolveInitRecipients(initialData.recipients);
                setRecipients(resRecs);
                setRecipientAllocations(
                    resolveInitAllocations(initialData.recipient_allocations, resRecs)
                );
                const custom = initialData.recipients
                    ? initialData.recipients
                          .map((r) => (r === "自己" ? myName : r))
                          .filter((r) => !COMMON_RECIPIENTS.includes(r) && !memberNames.includes(r))
                    : [];
                setCustomTagList(custom);
                setRecords(initialData.records || []);
                setInitialPriceInput(
                    initialData.records && initialData.records.length > 0
                        ? initialData.records[0].price.toString()
                        : ""
                );
                setCurrency(initialData.currency || tripLocalCurrency);
                setNote(initialData.note || "");
                setImgPreviewFailed(false);
            } else {
                // Reset to create mode defaults
                setName("");
                setLocalName("");
                setImageUrl("");
                setStore("");
                setPlaceId(null);
                setCategory("cosmetics");
                setTargetSpecs("");
                setTargetQuantity(1);
                setRecipients([myName]);
                setRecipientAllocations({ [myName]: 1 });
                setCustomTagList([]);
                setRecords([]);
                setInitialPriceInput("");
                setCurrency(tripLocalCurrency);
                setNote("");
                setImgPreviewFailed(false);
            }
            setNewRecipientInput("");
            setIsPlaceDropdownOpen(false);
            setPlaceSearchQuery("");
        }
    }, [isOpen, initialData]);

    // Place Search Combobox state & ref
    const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
    const [placeSearchQuery, setPlaceSearchQuery] = useState("");
    const placeComboboxRef = useRef<HTMLDivElement>(null);

    // Auto-close place dropdown when clicking outside or switching focus to other inputs
    useEffect(() => {
        const handleOutsideInteraction = (e: Event) => {
            if (
                placeComboboxRef.current &&
                !placeComboboxRef.current.contains(e.target as Node)
            ) {
                setIsPlaceDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideInteraction);
        document.addEventListener("focusin", handleOutsideInteraction);
        return () => {
            document.removeEventListener("mousedown", handleOutsideInteraction);
            document.removeEventListener("focusin", handleOutsideInteraction);
        };
    }, []);

    if (!isOpen) return null;

    // Filter places based on search query
    const filteredPlaces = places.filter((p) => {
        if (!placeSearchQuery.trim()) return true;
        const q = placeSearchQuery.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            (p.eng_name && p.eng_name.toLowerCase().includes(q)) ||
            (p.tags && p.tags.toLowerCase().includes(q))
        );
    });

    const handleSelectPlace = (place: PlaceVM) => {
        setStore(place.name);
        setPlaceId(place.id);
        setIsPlaceDropdownOpen(false);
        setPlaceSearchQuery("");
    };

    // Helper to safely add custom recipient
    const addRecipientSafely = (rawText: string) => {
        const trimmed = rawText.trim();
        if (!trimmed) return;
        if (!COMMON_RECIPIENTS.includes(trimmed)) {
            setCustomTagList((prev) =>
                prev.includes(trimmed) ? prev : [...prev, trimmed]
            );
        }
        if (!recipients.includes(trimmed)) {
            const updated = [...recipients, trimmed];
            setRecipients(updated);
            setRecipientAllocations((prev) => ({
                ...prev,
                [trimmed]: prev[trimmed] || 1,
            }));
        }
    };

    // Delete custom recipient tag completely
    const handleDeleteCustomTag = (tag: string) => {
        setCustomTagList((prev) => prev.filter((t) => t !== tag));
        setRecipients((prev) => prev.filter((r) => r !== tag));
        setRecipientAllocations((prev) => {
            const copy = { ...prev };
            delete copy[tag];
            return copy;
        });
    };

    // Remove recipient from current item selection
    const handleRemoveRecipient = (tag: string) => {
        setRecipients((prev) => prev.filter((r) => r !== tag));
        setRecipientAllocations((prev) => {
            const copy = { ...prev };
            delete copy[tag];
            return copy;
        });
    };

    const handleToggleRecipient = (tag: string) => {
        if (recipients.includes(tag)) {
            const next = recipients.filter((r) => r !== tag);
            setRecipients(next);
            const copy = { ...recipientAllocations };
            delete copy[tag];
            setRecipientAllocations(copy);
        } else {
            setRecipients([...recipients, tag]);
            setRecipientAllocations((prev) => ({ ...prev, [tag]: 1 }));
        }
    };

    const handleUpdateRecipientQty = (tag: string, delta: number) => {
        setRecipientAllocations((prev) => {
            const current = prev[tag] || 1;
            const updated = Math.max(1, current + delta);
            const next = { ...prev, [tag]: updated };
            // Optionally auto-update targetQuantity to sum of allocations
            const total = Object.values(next).reduce((s, v) => s + v, 0);
            setTargetQuantity(total);
            return next;
        });
    };

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Auto-flush any uncommitted custom recipient input
        let finalRecipients = [...recipients];
        let finalAllocations = { ...recipientAllocations };
        if (newRecipientInput.trim()) {
            const extra = newRecipientInput.trim();
            if (!finalRecipients.includes(extra)) {
                finalRecipients.push(extra);
                finalAllocations[extra] = 1;
            }
        }
        if (finalRecipients.length === 0) {
            finalRecipients = [myName];
            finalAllocations = { [myName]: targetQuantity };
        }

        // Handle single or multi-records
        let finalRecords = [...records];
        if (initialPriceInput.trim()) {
            const p = parseFloat(initialPriceInput);
            if (!isNaN(p) && p >= 0) {
                if (finalRecords.length === 0) {
                    const initialBoughtQty =
                        mode === "edit" && initialData?.is_completed ? targetQuantity : 0;
                    finalRecords = [
                        {
                            id: crypto.randomUUID(),
                            store: store.trim() || "預計門市",
                            price: p,
                            quantity: initialBoughtQty,
                            date: new Date().toISOString().split("T")[0],
                        },
                    ];
                } else if (finalRecords.length === 1) {
                    finalRecords = [
                        {
                            ...finalRecords[0],
                            price: p,
                            store: store.trim() || finalRecords[0].store,
                        },
                    ];
                }
            }
        }

        const totalBought = finalRecords.reduce((s, r) => s + (r.quantity || 0), 0);
        const isCompletedNow =
            mode === "create"
                ? false
                : targetQuantity > 0
                ? totalBought >= targetQuantity
                : Boolean(initialData?.is_completed);

        onSubmit({
            id: initialData?.id,
            name: name.trim(),
            local_name: localName.trim() || null,
            image_url: imageUrl.trim() || null,
            store: store.trim() || null,
            place_id: placeId,
            category,
            target_specs: targetSpecs.trim() || null,
            target_quantity: targetQuantity,
            is_completed: isCompletedNow,
            recipients: finalRecipients,
            recipient_allocations: finalAllocations,
            records: finalRecords,
            currency: currency || null,
            note: note.trim() || null,
        });

        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-sans"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground border border-border/80 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
                    <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                        <span>{mode === "create" ? "✨ 新增商品至願望清單" : "✏️ 編輯商品資訊"}</span>
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="shopping-item-form"
                    onSubmit={handleSubmitForm}
                    className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar text-xs"
                >
                    {/* Image URL & Instant Preview */}
                    <div className="space-y-2">
                        <label className="font-bold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Image size={13} />
                                <span>商品外鏈圖片網址 (Image URL)</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                                免上傳檔案，貼上直接載入
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                placeholder="貼上網路圖片網址 (https://...)"
                                value={imageUrl}
                                onChange={(e) => {
                                    setImageUrl(e.target.value);
                                    setImgPreviewFailed(false);
                                }}
                                className="flex-1 px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                            />
                            {imageUrl && (
                                <button
                                    type="button"
                                    onClick={() => setImageUrl("")}
                                    className="px-2.5 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground"
                                >
                                    清除
                                </button>
                            )}
                        </div>

                        {/* Image Preview Box */}
                        {imageUrl && (
                            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center">
                                {!imgPreviewFailed ? (
                                    <img
                                        src={imageUrl}
                                        alt="即時預覽"
                                        className="w-full h-full object-contain p-2"
                                        onError={() => setImgPreviewFailed(true)}
                                    />
                                ) : (
                                    <div className="flex items-center gap-1.5 text-amber-500 text-xs">
                                        <AlertCircle size={14} />
                                        <span>圖片網址無效或無法存取，將自動以毛玻璃漸層替代</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Product Name & Local Native Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">
                                商品名稱 <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例: KATE 怪獸級持色唇膏"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground flex items-center justify-between">
                                <span>當地原文名稱 (日/韓/英)</span>
                                <span className="text-[10px] text-rose-500 font-semibold">
                                    問路神器專用
                                </span>
                            </label>
                            <input
                                type="text"
                                placeholder="例: リップモンスター 03 陽炎"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs font-medium text-rose-600 dark:text-rose-400"
                            />
                        </div>
                    </div>

                    {/* Category & Target Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">商品類別</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                            >
                                {SHOPPING_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground flex items-center gap-1">
                                <Tag size={12} />
                                <span>目標規格 / 色號 / 容量</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例: 03 陽炎 3g / 240錠"
                                value={targetSpecs}
                                onChange={(e) => setTargetSpecs(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                            />
                        </div>
                    </div>

                    {/* Store Selection: Combobox with Searchable Places */}
                    <div className="space-y-1 relative" ref={placeComboboxRef}>
                        <label className="font-bold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1">
                                <Store size={12} />
                                <span>預計購買店家 / 地點</span>
                            </span>
                            {placeId && (
                                <span className="text-[10px] text-primary flex items-center gap-0.5">
                                    <MapPin size={11} /> 已關聯行程地標
                                </span>
                            )}
                        </label>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="輸入店家名稱，或搜尋行程既有地標..."
                                value={store}
                                onChange={(e) => {
                                    setStore(e.target.value);
                                    setPlaceSearchQuery(e.target.value);
                                    setPlaceId(null);
                                    setIsPlaceDropdownOpen(true);
                                }}
                                onFocus={() => setIsPlaceDropdownOpen(true)}
                                className="w-full pl-3 pr-24 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    setIsPlaceDropdownOpen(!isPlaceDropdownOpen);
                                    setPlaceSearchQuery("");
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg border border-border/70 flex items-center gap-1 cursor-pointer"
                            >
                                <MapPin size={11} className="text-primary" />
                                <span>選地標</span>
                            </button>
                        </div>

                        {/* Searchable Places Autocomplete Popup */}
                        {isPlaceDropdownOpen && places.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-card border border-border/80 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-1">
                                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                    <span>行程地標候選 ({filteredPlaces.length})</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsPlaceDropdownOpen(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        關閉
                                    </button>
                                </div>
                                {filteredPlaces.map((p) => (
                                    <div
                                        key={p.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelectPlace(p);
                                        }}
                                        onClick={() => handleSelectPlace(p)}
                                        className="px-2.5 py-1.5 rounded-xl hover:bg-muted cursor-pointer flex items-center justify-between text-xs transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <MapPin size={13} className="text-primary shrink-0" />
                                            <div className="truncate">
                                                <span className="font-bold text-foreground">
                                                    {p.name}
                                                </span>
                                                {p.eng_name && (
                                                    <span className="text-[10px] text-muted-foreground ml-1.5">
                                                        ({p.eng_name})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {p.tags && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0">
                                                {p.tags.split(",")[0]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Target Quantity & Estimated Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/25 border border-border/60">
                        {/* Target Quantity Stepper */}
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">
                                預計採購總數量
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTargetQuantity(Math.max(1, targetQuantity - 1))}
                                    className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted cursor-pointer"
                                >
                                    <Minus size={14} />
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={targetQuantity}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        if (!isNaN(v) && v >= 1) setTargetQuantity(v);
                                    }}
                                    className="w-16 h-8 text-center font-mono font-bold text-sm bg-background border border-input rounded-xl text-foreground"
                                />
                                <button
                                    type="button"
                                    onClick={() => setTargetQuantity(targetQuantity + 1)}
                                    className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted cursor-pointer"
                                >
                                    <Plus size={14} />
                                </button>
                                <span className="text-xs text-muted-foreground">件</span>
                            </div>
                        </div>

                        {/* Estimated / Recorded Unit Price */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-1.5">
                                <label className="font-bold text-foreground">
                                    預估 / 購入單價
                                </label>

                                {/* Currency Switcher: Local Currency vs Home Currency only (default to Local Currency) */}
                                <div className="inline-flex items-center rounded-lg border border-border bg-muted/60 p-0.5 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => handleCurrencyToggle(tripLocalCurrency)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                            currency === tripLocalCurrency
                                                ? "bg-primary text-primary-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span>{getCurrencySymbol(tripLocalCurrency)}</span>
                                        <span>當地幣 ({tripLocalCurrency})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCurrencyToggle(homeCurrency)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                            currency === homeCurrency
                                                ? "bg-primary text-primary-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span>{getCurrencySymbol(homeCurrency)}</span>
                                        <span>本國幣 ({homeCurrency})</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground pointer-events-none">
                                    {getCurrencySymbol(currency)}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder={
                                        currency === tripLocalCurrency
                                            ? `例: ${tripLocalCurrency === "JPY" ? "1400" : tripLocalCurrency === "KRW" ? "15000" : "50"}`
                                            : "例: 350"
                                    }
                                    value={initialPriceInput}
                                    onChange={(e) => setInitialPriceInput(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs font-mono font-bold"
                                />
                            </div>

                            {/* Live Conversion Display */}
                            {initialPriceInput &&
                                parseFloat(initialPriceInput) > 0 &&
                                exchangeRate > 0 &&
                                tripLocalCurrency.toUpperCase() !== homeCurrency.toUpperCase() && (
                                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
                                        <span>換算參考：</span>
                                        {currency === tripLocalCurrency ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                ≈ {getCurrencySymbol(homeCurrency)}{" "}
                                                {Math.round(
                                                    parseFloat(initialPriceInput) * exchangeRate
                                                ).toLocaleString()}{" "}
                                                {homeCurrency} (匯率 {exchangeRate})
                                            </span>
                                        ) : (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                ≈ {getCurrencySymbol(tripLocalCurrency)}{" "}
                                                {Math.round(
                                                    parseFloat(initialPriceInput) / exchangeRate
                                                ).toLocaleString()}{" "}
                                                {tripLocalCurrency} (匯率 {exchangeRate})
                                            </span>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Recipients Tagging & Quantities (User Story 2 & Feedback #4) */}
                    <div className="space-y-2.5 p-3.5 rounded-2xl bg-muted/20 border border-border/70">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-foreground flex items-center gap-1">
                                <Users size={13} />
                                <span>送禮 / 代購對象與分配數量</span>
                            </label>
                            <span className="text-[10px] text-muted-foreground">
                                點選勾選，可指派每人購買件數
                            </span>
                        </div>

                        {/* Recipient Options by Group: 1. 旅伴成員, 2. 親友/其他 */}
                        <div className="space-y-2">
                            {/* Trip Members */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Users size={11} className="text-primary" />
                                    <span>旅伴成員</span>
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {tripMemberOptions.map((m) => {
                                        const isChecked = recipients.includes(m.name);
                                        return (
                                            <button
                                                key={m.name}
                                                type="button"
                                                onClick={() => handleToggleRecipient(m.name)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                                                    isChecked
                                                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                                        : "bg-card text-muted-foreground border-border/70 hover:bg-muted"
                                                }`}
                                            >
                                                {isChecked ? (
                                                    <Check size={12} />
                                                ) : (
                                                    <User size={11} className="opacity-70" />
                                                )}
                                                <span>
                                                    {m.name}
                                                    {m.isMe ? " (我)" : ""}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Standard common recipients & custom tags */}
                            <div className="space-y-1 pt-1 border-t border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    親友 / 其他
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {COMMON_RECIPIENTS.map((rec) => {
                                        const isChecked = recipients.includes(rec);
                                        return (
                                            <button
                                                key={rec}
                                                type="button"
                                                onClick={() => handleToggleRecipient(rec)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                                                    isChecked
                                                        ? "bg-foreground text-background border-foreground shadow-2xs"
                                                        : "bg-card text-muted-foreground border-border/70 hover:bg-muted"
                                                }`}
                                            >
                                                {isChecked && <Check size={12} />}
                                                <span>{rec}</span>
                                            </button>
                                        );
                                    })}

                                    {/* Custom recipients list with easy toggle and delete */}
                                    {customTagList.map((customRec) => {
                                        const isChecked = recipients.includes(customRec);
                                        return (
                                            <div
                                                key={customRec}
                                                className={`inline-flex items-center rounded-full text-xs font-bold transition-all border shadow-2xs pl-3 pr-1 py-0.5 gap-1 ${
                                                    isChecked
                                                        ? "bg-foreground text-background border-foreground"
                                                        : "bg-card text-muted-foreground border-border/70 hover:bg-muted"
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleRecipient(customRec)}
                                                    className="flex items-center gap-1 cursor-pointer py-0.5"
                                                >
                                                    {isChecked && <Check size={12} />}
                                                    <span>{customRec}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCustomTag(customRec);
                                                    }}
                                                    className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                                                        isChecked
                                                            ? "text-background/70 hover:text-background hover:bg-background/20"
                                                            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    }`}
                                                    title={`刪除自訂對象「${customRec}」`}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Custom Recipient Input (Instant Apply Fix) */}
                        <div className="flex gap-2 pt-1">
                            <input
                                type="text"
                                placeholder="新增自訂受贈人 (打字後按 Enter 或確認皆自動加入)"
                                value={newRecipientInput}
                                onChange={(e) => setNewRecipientInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addRecipientSafely(newRecipientInput);
                                        setNewRecipientInput("");
                                    }
                                }}
                                onBlur={() => {
                                    if (newRecipientInput.trim()) {
                                        addRecipientSafely(newRecipientInput);
                                        setNewRecipientInput("");
                                    }
                                }}
                                className="flex-1 px-3 py-1.5 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    addRecipientSafely(newRecipientInput);
                                    setNewRecipientInput("");
                                }}
                                className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1"
                            >
                                <Plus size={13} />
                                <span>加入</span>
                            </button>
                        </div>

                        {/* Selected Recipients Allocation Cards */}
                        {recipients.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                                <div className="text-[11px] font-bold text-muted-foreground">
                                    各對象配額件數：
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {recipients.map((rec) => {
                                        const qty = recipientAllocations[rec] || 1;
                                        return (
                                            <div
                                                key={rec}
                                                className="p-2 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-1 shadow-2xs"
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRecipient(rec)}
                                                        className="p-1 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
                                                        title="移除此受贈人"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                    <span className="font-bold text-xs truncate">
                                                        {rec}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateRecipientQty(rec, -1)}
                                                        className="w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-muted text-xs font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="font-mono text-xs font-bold w-5 text-center">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateRecipientQty(rec, 1)}
                                                        className="w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-muted text-xs font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note & Alternatives */}
                    <div className="space-y-1">
                        <label className="font-bold text-foreground">
                            備註與替代品選項
                        </label>
                        <textarea
                            rows={2}
                            placeholder="例: 找 03 色號，若缺貨可買 05；每人限購 2 支"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none text-xs"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border/70 bg-muted/10 flex items-center justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        form="shopping-item-form"
                        className="py-2 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                    >
                        {mode === "create" ? "確認新增" : "儲存修改"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShoppingItemModal;
