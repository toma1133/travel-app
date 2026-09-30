import React from "react";
import { Tag } from "lucide-react";
import { GlassModal, GlassButton } from "../ui";
import type {
    ShoppingItemRow,
    ShoppingItemVM,
} from "../../models/types/ShoppingTypes";
import { SHOPPING_CATEGORIES } from "../../models/types/ShoppingTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import type { TripMemberVM } from "../../models/types/TripMemberTypes";
import type { TripVM } from "../../models/types/TripTypes";
import { useShoppingItemForm } from "./modal/useShoppingItemForm";
import { ShoppingPriceSection } from "./modal/ShoppingPriceSection";
import { ShoppingPhotoSection } from "./modal/ShoppingPhotoSection";
import { ShoppingRecipientsSection } from "./modal/ShoppingRecipientsSection";
import { ShoppingStoreSelect } from "./modal/ShoppingStoreSelect";

export type ShoppingItemModalProps = {
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

const ShoppingItemModal: React.FC<ShoppingItemModalProps> = (props) => {
    const { isOpen, mode, onClose, places = [] } = props;
    const form = useShoppingItemForm(props);

    if (!isOpen) return null;

    return (
        <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="xl" className="md:!max-w-[640px]">
            <GlassModal.Header
                title={mode === "create" ? "✨ 新增商品" : "✏️ 編輯商品"}
                onClose={onClose}
                rightAction={
                    <button
                        type="submit"
                        form="shopping-item-form"
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        完成
                    </button>
                }
            />

            <GlassModal.Body className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
                <form id="shopping-item-form" onSubmit={form.handleSubmitForm} className="space-y-4">
                    {/* 商品圖片與預覽 */}
                    <ShoppingPhotoSection
                        imageUrl={form.imageUrl}
                        imgPreviewFailed={form.imgPreviewFailed}
                        onImageUrlChange={(url) => { form.setImageUrl(url); form.setImgPreviewFailed(false); }}
                        onImageError={() => form.setImgPreviewFailed(true)}
                    />

                    {/* 商品名稱與當地名稱 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                                商品名稱 <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例: KATE 怪獸級持色唇膏"
                                value={form.name}
                                onChange={(e) => form.setName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-neutral-50/90 dark:bg-neutral-900/80 border border-black/15 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs focus:bg-white dark:focus:bg-neutral-900 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 font-medium shadow-2xs transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-neutral-900 dark:text-neutral-100 text-xs flex items-center justify-between">
                                <span>當地原文名稱 (日/韓/英)</span>
                                <span className="text-[10px] text-rose-500 font-bold">問路神器</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例: リップモンスター 03 陽炎"
                                value={form.localName}
                                onChange={(e) => form.setLocalName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-neutral-50/90 dark:bg-neutral-900/80 border border-black/15 dark:border-white/15 rounded-xl text-rose-600 dark:text-rose-400 outline-none text-xs focus:bg-white dark:focus:bg-neutral-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20 font-medium shadow-2xs transition-all"
                            />
                        </div>
                    </div>

                    {/* 商品類別與規格 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">商品類別</label>
                            <select
                                value={form.category}
                                onChange={(e) => form.setCategory(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-neutral-50/90 dark:bg-neutral-900/80 border border-black/15 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs focus:bg-white dark:focus:bg-neutral-900 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 font-medium shadow-2xs transition-all cursor-pointer"
                            >
                                {SHOPPING_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                                        {cat.emoji} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1">
                                <Tag size={12} className="text-primary" />
                                <span>目標規格 / 色號 / 容量</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例: 03 陽炎 3g / 240錠"
                                value={form.targetSpecs}
                                onChange={(e) => form.setTargetSpecs(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-neutral-50/90 dark:bg-neutral-900/80 border border-black/15 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs focus:bg-white dark:focus:bg-neutral-900 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 font-medium shadow-2xs transition-all"
                            />
                        </div>
                    </div>

                    {/* 預計購買地點與行程地標 Combobox */}
                    <ShoppingStoreSelect
                        store={form.store}
                        placeId={form.placeId}
                        places={places}
                        filteredPlaces={form.filteredPlaces}
                        isPlaceDropdownOpen={form.isPlaceDropdownOpen}
                        placeComboboxRef={form.placeComboboxRef}
                        onStoreChange={(val) => {
                            form.setStore(val);
                            form.setPlaceSearchQuery(val);
                            form.setPlaceId(null);
                            form.setIsPlaceDropdownOpen(true);
                        }}
                        onToggleDropdown={() => {
                            form.setIsPlaceDropdownOpen(!form.isPlaceDropdownOpen);
                            form.setPlaceSearchQuery("");
                        }}
                        onCloseDropdown={() => form.setIsPlaceDropdownOpen(false)}
                        onSelectPlace={form.handleSelectPlace}
                    />

                    {/* 數量、雙幣別單價與免稅試算區塊 */}
                    <ShoppingPriceSection
                        currency={form.currency}
                        targetQuantity={form.targetQuantity}
                        initialPriceInput={form.initialPriceInput}
                        isTaxFree={form.isTaxFree}
                        tripLocalCurrency={form.tripLocalCurrency}
                        homeCurrency={form.homeCurrency}
                        exchangeRate={form.exchangeRate}
                        onQuantityChange={form.setTargetQuantity}
                        onPriceChange={form.setInitialPriceInput}
                        onTaxFreeToggle={form.setIsTaxFree}
                        onCurrencyToggle={form.handleCurrencyToggle}
                    />

                    {/* 受贈人分配 */}
                    <ShoppingRecipientsSection
                        recipients={form.recipients}
                        recipientAllocations={form.recipientAllocations}
                        customTagList={form.customTagList}
                        newRecipientInput={form.newRecipientInput}
                        tripMemberOptions={form.tripMemberOptions}
                        onNewRecipientInputChange={form.setNewRecipientInput}
                        onAddRecipientSafely={form.addRecipientSafely}
                        onToggleRecipient={form.handleToggleRecipient}
                        onDeleteCustomTag={form.handleDeleteCustomTag}
                        onRemoveRecipient={form.handleRemoveRecipient}
                        onUpdateRecipientQty={form.handleUpdateRecipientQty}
                    />

                    {/* 備註與替代品 */}
                    <div className="space-y-1">
                        <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                            備註與替代品
                        </label>
                        <textarea
                            rows={2}
                            placeholder="例: 若 03 缺貨可買 05；每人限購 2 支"
                            value={form.note}
                            onChange={(e) => form.setNote(e.target.value)}
                            className="w-full px-3 py-2 bg-white/70 dark:bg-neutral-900/60 border border-white/30 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </form>
            </GlassModal.Body>
        </GlassModal>
    );
};

export default ShoppingItemModal;
