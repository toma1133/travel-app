import React, {
    ChangeEventHandler,
    FormEventHandler,
    MouseEventHandler,
    useRef,
} from "react";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import { GlassModal } from "../ui/GlassModal";
import { GlassButton } from "../ui/GlassButton";
import { PlaceSearchMapPickerModal } from "./PlaceSearchMapPickerModal";
import {
    usePlaceFormState,
    PlaceModalHeader,
    PlaceBasicInfoSection,
    PlaceLocationSection,
    PlaceOpeningHoursSection,
    PlaceAmenitiesSection,
    PlaceSearchImportBar,
    PlaceModalTabs,
} from "./modal";

export type PlaceModalProps = {
    formData: PlaceVM;
    mode: string;
    placeCategory: PlaceCategory[];
    theme: TripThemeConf | null;
    localCurrency?: string;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const PlaceModal: React.FC<PlaceModalProps> = ({
    formData,
    mode,
    localCurrency = "JPY",
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}) => {
    const formRef = useRef<HTMLFormElement>(null);

    const {
        activeTab,
        setActiveTab,
        copiedId,
        handleCopyId,
        speaking,
        detectedNativeLang,
        handleSpeakNative,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchResults,
        showSuggestions,
        selectedPlace,
        setSelectedPlace,
        importFields,
        setImportFields,
        preserveExistingTop,
        setPreserveExistingTop,
        handleSelectResult,
        handleApplyImport,
        parsedMapInfo,
        isGeocoding,
        geocodeMsg,
        handleAutoGeocode,
        isMapPickerOpen,
        setIsMapPickerOpen,
        handleApplyMapPicker,
        currentTags,
        tagInput,
        setTagInput,
        handleAddTag,
        handleRemoveTag,
    } = usePlaceFormState({
        formData,
        onFormInputChange,
        localCurrency,
    });

    const recommendedCount = formData.info?.recommended_items?.length || 0;

    return (
        <>
            <GlassModal
                isOpen={true}
                onClose={() => {
                    const fakeEvent = {
                        stopPropagation: () => {},
                        preventDefault: () => {},
                    } as unknown as React.MouseEvent<HTMLButtonElement>;
                    onCloseBtnClick(fakeEvent);
                }}
                maxWidth="2xl"
                className="max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-0 shadow-2xl"
            >
                {/* 頂部導航標題列 */}
                <GlassModal.Header
                    title={mode === "create" ? "✨ 新增地點" : "📍 編輯地點"}
                    onClose={onCloseBtnClick as any}
                    rightAction={
                        <button
                            type="button"
                            onClick={() => formRef.current?.requestSubmit()}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            完成
                        </button>
                    }
                />

                {/* 智慧搜尋帶入列 (OpenStreetMap / Kakao / Wikipedia) */}
                <PlaceSearchImportBar
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    isSearching={isSearching}
                    searchResults={searchResults}
                    showSuggestions={showSuggestions}
                    selectedPlace={selectedPlace}
                    importFields={importFields}
                    preserveExistingTop={preserveExistingTop}
                    onSelectResult={handleSelectResult}
                    onClearSearch={() => {
                        setSearchTerm("");
                        setSelectedPlace(null);
                    }}
                    onCloseSelectedPlace={() => setSelectedPlace(null)}
                    onToggleImportField={(field, checked) =>
                        setImportFields((prev) => ({ ...prev, [field]: checked }))
                    }
                    onTogglePreserveExisting={setPreserveExistingTop}
                    onApplyImport={handleApplyImport}
                    onOpenMapPicker={() => setIsMapPickerOpen(true)}
                />

                {/* 頁籤切換列 */}
                <PlaceModalTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    recommendedCount={recommendedCount}
                />

                {/* 表單主體 (滾動區域) */}
                <GlassModal.Body className="p-4 no-scrollbar">
                    <form
                        ref={formRef}
                        id="place-form"
                        onSubmit={onFormSubmit}
                        className="space-y-4"
                    >
                        {/* TAB 1: 基本與地圖 */}
                        {activeTab === "basic" && (
                            <div className="space-y-4 animate-in fade-in duration-150">
                                <PlaceModalHeader
                                    formData={formData}
                                    onFormInputChange={onFormInputChange}
                                    speaking={speaking}
                                    detectedNativeLang={detectedNativeLang}
                                    onSpeakNative={handleSpeakNative}
                                />

                                <PlaceLocationSection
                                    formData={formData}
                                    onFormInputChange={onFormInputChange}
                                    parsedMapInfo={parsedMapInfo}
                                    isGeocoding={isGeocoding}
                                    geocodeMsg={geocodeMsg}
                                    onAutoGeocode={handleAutoGeocode}
                                    onOpenMapPicker={() => setIsMapPickerOpen(true)}
                                />

                                <PlaceBasicInfoSection
                                    formData={formData}
                                    mode={mode}
                                    onFormInputChange={onFormInputChange}
                                    currentTags={currentTags}
                                    tagInput={tagInput}
                                    onTagInputChange={setTagInput}
                                    onAddTag={handleAddTag}
                                    onRemoveTag={handleRemoveTag}
                                    copiedId={copiedId}
                                    onCopyId={handleCopyId}
                                />
                            </div>
                        )}

                        {/* TAB 2: 營業與時間 */}
                        {activeTab === "hours" && (
                            <div className="space-y-4 animate-in fade-in duration-150">
                                <PlaceOpeningHoursSection
                                    formData={formData}
                                    onFormInputChange={onFormInputChange}
                                />
                            </div>
                        )}

                        {/* TAB 3: 推薦品項 */}
                        {activeTab === "items" && (
                            <PlaceAmenitiesSection
                                formData={formData}
                                localCurrency={localCurrency}
                                onFormInputChange={onFormInputChange}
                                subTab="items"
                            />
                        )}

                        {/* TAB 4: 預算與細節 */}
                        {activeTab === "details" && (
                            <PlaceAmenitiesSection
                                formData={formData}
                                localCurrency={localCurrency}
                                onFormInputChange={onFormInputChange}
                                subTab="details"
                            />
                        )}
                    </form>
                </GlassModal.Body>
            </GlassModal>

            {/* 視覺化地圖搜尋與選點彈窗 */}
            <PlaceSearchMapPickerModal
                isOpen={isMapPickerOpen}
                onClose={() => setIsMapPickerOpen(false)}
                initialQuery={
                    searchTerm ||
                    formData.info?.loc ||
                    formData.info?.native_name ||
                    formData.name
                }
                initialCoords={{
                    lat: formData.lat,
                    lng: formData.lng,
                }}
                onSelectPlace={handleApplyMapPicker}
            />
        </>
    );
};

export default PlaceModal;
