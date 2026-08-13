import {
    ChangeEventHandler,
    FormEventHandler,
    MouseEventHandler,
    useState,
    useEffect,
    ChangeEvent,
} from "react";
import {
    Clock,
    Copy,
    ImageIcon,
    MapIcon,
    MapPin,
    Tag,
    X,
    Search,
    Loader2,
} from "lucide-react";
import { OSMService, OSMPlace, WikiData } from "../../services/api/OSMService";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import FormModal from "../common/FormModal";
import { TripThemeConf } from "../../models/types/TripTypes";

type PlaceModalProps = {
    formData: PlaceVM;
    mode: string;
    placeCategory: PlaceCategory[];
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    >;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const PlaceModal = ({
    formData,
    mode,
    placeCategory,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: PlaceModalProps) => {
    const [copiedId, setCopiedId] = useState(false);

    // Auto-fill state
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<OSMPlace[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<{
        osm: OSMPlace;
        wiki: WikiData | null;
    } | null>(null);
    const [importFields, setImportFields] = useState({
        eng_name: true,
        image_url: true,
        open: true,
        loc: true,
        map_url: true,
        description: true,
    });

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                setIsSearching(true);
                const results = await OSMService.searchPlaces(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
                setShowSuggestions(true);
            } else {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectResult = async (place: OSMPlace) => {
        setShowSuggestions(false);
        setSearchTerm("");

        let wikiData: WikiData | null = null;
        if (place.extratags?.wikipedia) {
            wikiData = await OSMService.getWikiData(place.extratags.wikipedia);
        }

        // Always check "name" in case english name isn't there
        setSelectedPlace({ osm: place, wiki: wikiData });
    };

    const handleApplyImport = () => {
        if (!selectedPlace) return;

        const createEvent = (name: string, value: string) =>
            ({
                target: { name, value },
                currentTarget: { name, value },
            }) as unknown as ChangeEvent<HTMLInputElement>;

        const { osm, wiki } = selectedPlace;

        if (osm.name) {
            onFormInputChange(createEvent("name", osm.name));
        }

        if (importFields.eng_name && wiki?.title) {
            onFormInputChange(createEvent("eng_name", wiki.title));
        } else if (importFields.eng_name && osm.extratags?.["name:en"]) {
            onFormInputChange(
                createEvent("eng_name", osm.extratags["name:en"]),
            );
        }

        if (importFields.image_url && wiki?.thumbnailUrl) {
            onFormInputChange(createEvent("image_url", wiki.thumbnailUrl));
        }

        if (importFields.open && osm.extratags?.opening_hours) {
            onFormInputChange(
                createEvent("info.open", osm.extratags.opening_hours),
            );
        }

        if (importFields.loc && osm.display_name) {
            onFormInputChange(createEvent("info.loc", osm.display_name));
        }

        if (importFields.map_url && osm.lat && osm.lon) {
            const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(osm.name || "")}&ll=${osm.lat},${osm.lon}`;
            onFormInputChange(createEvent("map_url", mapUrl));
        }

        if (importFields.description && wiki?.extract) {
            onFormInputChange(createEvent("description", wiki.extract));
        }

        setSelectedPlace(null);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formData.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 1500);
        } catch (err) {
            console.error("複製失敗", err);
        }
    };

    return (
        <FormModal
            formId={"place-form"}
            modalTitle={
                mode === "create" ? "新增地點" : `編輯地點 ${formData.name}`
            }
            modalSaveTitle={mode === "create" ? "創建地點" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {mode === "create" && (
                <div className="mb-6 border-b border-border pb-6 relative">
                    <label className="block font-bold uppercase mb-2 flex items-center text-muted-foreground text-xs">
                        <Search size={12} className="mr-1" /> 快速搜尋與自動帶入
                        (OpenStreetMap)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") e.preventDefault();
                            }}
                            placeholder="輸入地點名稱搜尋..."
                            className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-3 pr-10 outline-none focus:border-primary text-base"
                        />
                        <div className="absolute right-3 top-2.5 text-muted-foreground">
                            {isSearching ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Search size={16} />
                            )}
                        </div>
                    </div>

                    {showSuggestions && searchResults.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-card shadow-lg rounded-md border border-border max-h-60 overflow-y-auto">
                            <ul>
                                {searchResults.map((place) => (
                                    <li
                                        key={place.place_id}
                                        onClick={() =>
                                            handleSelectResult(place)
                                        }
                                        className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-0 flex flex-col items-start transition-colors"
                                    >
                                        <span className="text-sm font-medium text-foreground">
                                            {place.name ||
                                                place.display_name.split(
                                                    ",",
                                                )[0]}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-0.5 w-full truncate block">
                                            {place.display_name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedPlace && (
                        <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-sm text-foreground">
                                    找到資料，請勾選要帶入的欄位：
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlace(null)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-2 text-sm text-foreground">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.eng_name}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                eng_name: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>英文名稱:</strong>{" "}
                                        {selectedPlace.wiki?.title ||
                                            selectedPlace.osm.extratags?.[
                                                "name:en"
                                            ] ||
                                            "(無)"}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.image_url}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                image_url: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>圖片:</strong>{" "}
                                        {selectedPlace.wiki?.thumbnailUrl ? (
                                            <img
                                                src={
                                                    selectedPlace.wiki
                                                        .thumbnailUrl
                                                }
                                                className="h-8 inline-block ml-2 rounded"
                                                alt="預覽"
                                            />
                                        ) : (
                                            "(無)"
                                        )}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.open}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                open: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>營業時間:</strong>{" "}
                                        {selectedPlace.osm.extratags
                                            ?.opening_hours || "(無)"}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.loc}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                loc: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span className="truncate flex-1 block">
                                        <strong>地址:</strong>{" "}
                                        {selectedPlace.osm.display_name}
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.map_url}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                map_url: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span>
                                        <strong>地圖網址:</strong> Apple Maps
                                        連結
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={importFields.description}
                                        onChange={(e) =>
                                            setImportFields({
                                                ...importFields,
                                                description: e.target.checked,
                                            })
                                        }
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span className="line-clamp-2 flex-1 block">
                                        <strong>簡介:</strong>{" "}
                                        {selectedPlace.wiki?.extract || "(無)"}
                                    </span>
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={handleApplyImport}
                                className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                套用已勾選資料
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* Type Selection */}
            <CategoryCustomSelect
                value={formData.type || "sight"}
                onChange={(newTypeId) => {
                    const event = {
                        target: { name: "type", value: newTypeId },
                        currentTarget: { name: "type", value: newTypeId },
                    } as unknown as ChangeEvent<HTMLInputElement>;
                    onFormInputChange(event);
                }}
            />
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-6">
                {mode !== "create" && (
                    <div>
                        <label
                            htmlFor="id"
                            className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                        >
                            ID
                        </label>
                        <div className="flex items-center gap-2 w-full">
                            <input
                                name="id"
                                value={formData.id}
                                className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-muted-foreground disabled:opacity-50"
                                disabled
                                placeholder="id"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                                title="複製"
                            >
                                <Copy
                                    size={20}
                                    className={
                                        copiedId
                                            ? "text-green-500"
                                            : "text-muted-foreground"
                                    }
                                />
                            </button>
                        </div>
                    </div>
                )}
                <div>
                    <label
                        htmlFor="name"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        名稱 *
                    </label>
                    <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={onFormInputChange}
                        placeholder="例如：清水寺"
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="eng_name"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        英文名稱
                    </label>
                    <input
                        name="eng_name"
                        value={formData.eng_name || ""}
                        onChange={onFormInputChange}
                        placeholder="e.g. Kiyomizu-dera"
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
            </div>
            {/* Image URL */}
            <div className="mt-6">
                <label
                    htmlFor="image_url"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    <ImageIcon size={12} className="mr-1" /> 圖片網址
                </label>
                <input
                    name="image_url"
                    value={formData.image_url || ""}
                    onChange={onFormInputChange}
                    placeholder="https://..."
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                />
            </div>
            {/* Map Url */}
            <div className="mt-6">
                <label
                    htmlFor="map_url"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    <MapIcon size={12} className="mr-1" /> 地圖網址
                </label>
                <input
                    name="map_url"
                    value={formData.map_url || ""}
                    onChange={onFormInputChange}
                    placeholder="https://..."
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                />
            </div>
            {/* Description */}
            <div className="mt-6">
                <label
                    htmlFor="description"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    介紹
                </label>
                <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={onFormInputChange}
                    rows={2}
                    placeholder="關於這個地點的簡短介紹..."
                    className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors resize-none no-scrollbar"
                />
            </div>
            {/* Details */}
            <div className="mt-6 grid grid-cols-1 gap-6">
                <div>
                    <label
                        htmlFor="info.open"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <Clock size={12} className="mr-1" /> 營業時間
                    </label>
                    <input
                        name="info.open"
                        value={formData?.info?.open || ""}
                        onChange={onFormInputChange}
                        placeholder="例如:09:00 - 18:00"
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-mono text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="info.loc"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <MapPin size={12} className="mr-1" /> 地址 / 位置
                    </label>
                    <input
                        name="info.loc"
                        value={formData?.info?.loc || ""}
                        onChange={onFormInputChange}
                        placeholder="例如：京都市東山區..."
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
                <div>
                    <label
                        htmlFor="tags"
                        className="block font-bold uppercase mb-1.5 flex items-center text-muted-foreground text-xs"
                    >
                        <Tag size={12} className="mr-1" /> 標籤 (按 Enter 新增)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-transparent border-b border-border focus-within:border-primary transition-colors">
                        {(formData.tags
                            ? formData.tags
                                  .split(",")
                                  .filter((t) => t.trim() !== "")
                            : []
                        ).map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 animate-in fade-in zoom-in-95"
                            >
                                #{tag.trim()}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentTags = formData.tags
                                            ? formData.tags
                                                  .split(",")
                                                  .map((t) => t.trim())
                                                  .filter((t) => t !== "")
                                            : [];
                                        const newTags = currentTags
                                            .filter((_, i) => i !== index)
                                            .join(",");
                                        const event = {
                                            target: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                            currentTarget: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                        } as unknown as ChangeEvent<HTMLInputElement>;
                                        onFormInputChange(event);
                                    }}
                                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                    title="移除標籤"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            placeholder={
                                (formData.tags
                                    ? formData.tags
                                          .split(",")
                                          .filter((t) => t.trim() !== "").length
                                    : 0) === 0
                                    ? "例如：世界遺產, 必去 (按 Enter 新增)"
                                    : "新增標籤..."
                            }
                            className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground outline-none py-1"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    const val = e.currentTarget.value
                                        .trim()
                                        .replace(/^#/, "");
                                    if (val) {
                                        const currentTags = formData.tags
                                            ? formData.tags
                                                  .split(",")
                                                  .map((t) => t.trim())
                                                  .filter((t) => t !== "")
                                            : [];
                                        if (!currentTags.includes(val)) {
                                            const newTags = [
                                                ...currentTags,
                                                val,
                                            ].join(",");
                                            const event = {
                                                target: {
                                                    name: "tags",
                                                    value: newTags,
                                                },
                                                currentTarget: {
                                                    name: "tags",
                                                    value: newTags,
                                                },
                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                            onFormInputChange(event);
                                        }
                                        e.currentTarget.value = "";
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const val = e.currentTarget.value
                                    .trim()
                                    .replace(/^#/, "");
                                if (val) {
                                    const currentTags = formData.tags
                                        ? formData.tags
                                              .split(",")
                                              .map((t) => t.trim())
                                              .filter((t) => t !== "")
                                        : [];
                                    if (!currentTags.includes(val)) {
                                        const newTags = [
                                            ...currentTags,
                                            val,
                                        ].join(",");
                                        const event = {
                                            target: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                            currentTarget: {
                                                name: "tags",
                                                value: newTags,
                                            },
                                        } as unknown as ChangeEvent<HTMLInputElement>;
                                        onFormInputChange(event);
                                    }
                                    e.currentTarget.value = "";
                                }
                            }}
                        />
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="tips"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        Tips / 備註
                    </label>
                    <input
                        name="tips"
                        value={formData.tips || ""}
                        onChange={onFormInputChange}
                        placeholder="例如：建議早上去..."
                        className="w-full bg-transparent border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base text-foreground focus:border-primary transition-colors"
                    />
                </div>
            </div>
        </FormModal>
    );
};

export default PlaceModal;
