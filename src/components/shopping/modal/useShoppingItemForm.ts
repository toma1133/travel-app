import { useState, useMemo, useRef, useEffect } from "react";
import type {
    ShoppingItemRow,
    ShoppingItemVM,
    ShoppingRecord,
} from "../../../models/types/ShoppingTypes";
import type { PlaceVM } from "../../../models/types/PlaceTypes";
import type { TripMemberVM } from "../../../models/types/TripMemberTypes";
import type { TripVM } from "../../../models/types/TripTypes";

export const COMMON_RECIPIENTS = ["媽媽", "爸爸", "同事", "伴侶", "朋友"];

export interface UseShoppingItemFormProps {
    isOpen: boolean;
    mode: "create" | "edit";
    initialData?: ShoppingItemVM | null;
    places?: PlaceVM[];
    tripMembers?: TripMemberVM[];
    currentUserId?: string;
    tripData?: TripVM | null;
    onClose: () => void;
    onSubmit: (data: Partial<ShoppingItemRow>) => void;
}

export function useShoppingItemForm({
    isOpen,
    mode,
    initialData,
    places = [],
    tripMembers = [],
    currentUserId,
    tripData,
    onClose,
    onSubmit,
}: UseShoppingItemFormProps) {
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
                const memberName =
                    m.profiles?.username ||
                    m.profiles?.email?.split("@")[0] ||
                    "旅伴";
                if (!list.some((it) => it.name === memberName)) {
                    list.push({ name: memberName, isMe: false });
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

    // Custom recipients tags pool
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

    // Records, Pricing & Tax-Free
    const [records, setRecords] = useState<ShoppingRecord[]>(
        initialData?.records || []
    );
    const [initialPriceInput, setInitialPriceInput] = useState(
        initialData?.records && initialData.records.length > 0
            ? initialData.records[0].price.toString()
            : ""
    );
    const [isTaxFree, setIsTaxFree] = useState(false);
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

    // Place Search Combobox state & ref
    const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
    const [placeSearchQuery, setPlaceSearchQuery] = useState("");
    const placeComboboxRef = useRef<HTMLDivElement>(null);

    // Auto-close place dropdown when clicking outside or switching focus
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

    // Filter places based on search query
    const filteredPlaces = useMemo(() => {
        if (!placeSearchQuery.trim()) return places;
        const q = placeSearchQuery.toLowerCase();
        return places.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.eng_name && p.eng_name.toLowerCase().includes(q)) ||
                (p.tags && p.tags.toLowerCase().includes(q))
        );
    }, [places, placeSearchQuery]);

    const handleSelectPlace = (place: PlaceVM) => {
        setStore(place.name);
        setPlaceId(place.id);
        setIsPlaceDropdownOpen(false);
        setPlaceSearchQuery("");
    };

    // Recipient operations
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

    const handleDeleteCustomTag = (tag: string) => {
        setCustomTagList((prev) => prev.filter((t) => t !== tag));
        setRecipients((prev) => prev.filter((r) => r !== tag));
        setRecipientAllocations((prev) => {
            const copy = { ...prev };
            delete copy[tag];
            return copy;
        });
    };

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
            const total = Object.values(next).reduce((s, v) => s + v, 0);
            setTargetQuantity(total);
            return next;
        });
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
                setIsTaxFree(false);
            } else {
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
                setIsTaxFree(false);
            }
            setNewRecipientInput("");
            setIsPlaceDropdownOpen(false);
            setPlaceSearchQuery("");
        }
    }, [isOpen, initialData]);

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

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

    return {
        name,
        setName,
        localName,
        setLocalName,
        imageUrl,
        setImageUrl,
        store,
        setStore,
        placeId,
        setPlaceId,
        category,
        setCategory,
        targetSpecs,
        setTargetSpecs,
        targetQuantity,
        setTargetQuantity,
        recipients,
        setRecipients,
        recipientAllocations,
        setRecipientAllocations,
        newRecipientInput,
        setNewRecipientInput,
        customTagList,
        currency,
        setCurrency,
        initialPriceInput,
        setInitialPriceInput,
        isTaxFree,
        setIsTaxFree,
        note,
        setNote,
        imgPreviewFailed,
        setImgPreviewFailed,
        myName,
        tripMemberOptions,
        tripLocalCurrency,
        homeCurrency,
        exchangeRate,
        isPlaceDropdownOpen,
        setIsPlaceDropdownOpen,
        placeSearchQuery,
        setPlaceSearchQuery,
        placeComboboxRef,
        filteredPlaces,
        handleSelectPlace,
        handleCurrencyToggle,
        addRecipientSafely,
        handleDeleteCustomTag,
        handleRemoveRecipient,
        handleToggleRecipient,
        handleUpdateRecipientQty,
        handleSubmitForm,
    };
}
