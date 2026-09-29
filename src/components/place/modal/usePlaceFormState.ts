import { useState, useEffect, useMemo, ChangeEvent, ChangeEventHandler } from "react";
import { OSMService, OSMPlace, WikiData } from "../../../services/api/OSMService";
import { KakaoLocalService } from "../../../services/api/KakaoLocalService";
import { parseMapUrl } from "../../../utils/MapUrlParserUtil";
import { ImportedPlacePayload } from "../PlaceSearchMapPickerModal";
import type { PlaceVM } from "../../../models/types/PlaceTypes";
import { detectLanguage, playPronunciation } from "../../../utils/SpeechLanguageUtil";

export interface UsePlaceFormStateOptions {
    formData: PlaceVM;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    localCurrency?: string;
}

export type PlaceModalTab = "basic" | "hours" | "items" | "details";

export function usePlaceFormState({
    formData,
    onFormInputChange,
    localCurrency = "JPY",
}: UsePlaceFormStateOptions) {
    const [activeTab, setActiveTab] = useState<PlaceModalTab>("basic");
    const [copiedId, setCopiedId] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
    const [tagInput, setTagInput] = useState("");

    // 語言自動偵測
    const detectedNativeLang = useMemo(() => {
        return detectLanguage(formData?.info?.native_name, {
            address: formData?.info?.loc,
            currency: formData?.info?.price || localCurrency,
        });
    }, [formData?.info?.native_name, formData?.info?.loc, formData?.info?.price, localCurrency]);

    const handleSpeakNative = () => {
        if (!formData?.info?.native_name) return;
        playPronunciation(formData.info.native_name, {
            context: {
                address: formData?.info?.loc,
                mapUrl: formData.map_url,
                currency: formData?.info?.price || localCurrency,
            },
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: () => setSpeaking(false),
        });
    };

    // OpenStreetMap & Kakao & Wikipedia 自動搜尋
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<OSMPlace[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<{
        osm: OSMPlace;
        wiki: WikiData | null;
    } | null>(null);
    const [importFields, setImportFields] = useState({
        name: true,
        eng_name: true,
        image_url: true,
        open: true,
        loc: true,
        map_url: true,
        description: true,
    });
    const [preserveExistingTop, setPreserveExistingTop] = useState(true);

    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeMsg, setGeocodeMsg] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const createSyntheticEvent = (name: string, value: string | number) =>
        ({
            target: { name, value: String(value) },
            currentTarget: { name, value: String(value) },
        }) as unknown as ChangeEvent<HTMLInputElement>;

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                setIsSearching(true);
                let results: OSMPlace[] = [];

                if (KakaoLocalService.isConfigured()) {
                    try {
                        const [kakaoPlaces, kakaoAddrs] = await Promise.all([
                            KakaoLocalService.searchKeyword(searchTerm),
                            KakaoLocalService.searchAddress(searchTerm),
                        ]);

                        const mappedKakao: OSMPlace[] = [
                            ...kakaoPlaces.map((kp) => ({
                                place_id: `kakao-${kp.id}`,
                                name: kp.place_name,
                                lat: kp.y,
                                lon: kp.x,
                                display_name: `${kp.place_name}, ${kp.road_address_name || kp.address_name}`,
                                type: kp.category_group_name || "place",
                                class: "amenity",
                                extratags: {
                                    phone: kp.phone,
                                    category: kp.category_name,
                                },
                            })),
                            ...kakaoAddrs.map((ka, idx) => ({
                                place_id: `kakao-addr-${idx}`,
                                name: ka.road_address?.building_name || ka.address_name,
                                lat: ka.y,
                                lon: ka.x,
                                display_name: ka.road_address?.address_name || ka.address_name,
                                type: "address",
                                class: "place",
                            })),
                        ];

                        if (mappedKakao.length > 0) {
                            results = mappedKakao;
                        }
                    } catch (e) {
                        console.error("Kakao top search error:", e);
                    }
                }

                if (results.length === 0) {
                    results = await OSMService.searchPlaces(searchTerm);
                }

                setSearchResults(results);
                setIsSearching(false);
                setShowSuggestions(true);
            } else {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectResult = async (place: OSMPlace) => {
        setShowSuggestions(false);
        setSearchTerm("");

        let wikiData: WikiData | null = null;
        if (place.extratags?.wikipedia) {
            wikiData = await OSMService.getWikiData(place.extratags.wikipedia);
        }
        setSelectedPlace({ osm: place, wiki: wikiData });
    };

    const handleApplyImport = () => {
        if (!selectedPlace) return;

        const { osm, wiki } = selectedPlace;
        const placeName = osm.name || "";

        // 1. 名稱智慧處理：若使用者已經有輸入名稱且開啟保護，保留使用者中文名，將外文原名存入 native_name
        if (importFields.name && placeName) {
            if (preserveExistingTop && formData.name && formData.name.trim() !== "") {
                onFormInputChange(createSyntheticEvent("info.native_name", placeName));
            } else {
                onFormInputChange(createSyntheticEvent("name", placeName));
            }
        }

        if (importFields.eng_name && wiki?.title) {
            onFormInputChange(createSyntheticEvent("eng_name", wiki.title));
        } else if (importFields.eng_name && osm.extratags?.["name:en"]) {
            onFormInputChange(createSyntheticEvent("eng_name", osm.extratags["name:en"]));
        }

        if (importFields.image_url && wiki?.thumbnailUrl && (!preserveExistingTop || !formData.image_url)) {
            onFormInputChange(createSyntheticEvent("image_url", wiki.thumbnailUrl));
        }

        if (importFields.open && osm.extratags?.opening_hours && (!preserveExistingTop || !formData.info?.open)) {
            onFormInputChange(createSyntheticEvent("info.open", osm.extratags.opening_hours));
        }

        if (importFields.loc && osm.display_name) {
            onFormInputChange(createSyntheticEvent("info.loc", osm.display_name));
        }

        if (osm.lat && osm.lon) {
            onFormInputChange(createSyntheticEvent("lat", osm.lat));
            onFormInputChange(createSyntheticEvent("lng", osm.lon));
        }

        if (osm.extratags?.phone) {
            onFormInputChange(createSyntheticEvent("info.phone", osm.extratags.phone));
        }

        // 2. 地圖網址智慧處理：若使用者已經貼上自訂網址且開啟保護，則不覆蓋
        if (
            importFields.map_url &&
            (!preserveExistingTop || !formData.map_url || formData.map_url.trim() === "") &&
            osm.lat &&
            osm.lon
        ) {
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                osm.name || ""
            )}&query_place_id=${osm.place_id}&center=${osm.lat},${osm.lon}`;
            onFormInputChange(createSyntheticEvent("map_url", mapUrl));
        }

        if (importFields.description && wiki?.extract && (!preserveExistingTop || !formData.description)) {
            onFormInputChange(createSyntheticEvent("description", wiki.extract));
        }

        setGeocodeMsg({
            type: "success",
            text: `已成功帶入地點資料：${placeName}`,
        });

        // 清空上方景點搜尋輸入框與候選提示
        setSearchTerm("");
        setShowSuggestions(false);
        setSelectedPlace(null);
    };

    const parsedMapInfo = useMemo(() => {
        return parseMapUrl(formData.map_url || "");
    }, [formData.map_url]);

    const handleAutoGeocode = async () => {
        // 優先嘗試地址 (地址在韓國地理搜尋中準確率最高)，其次嘗試韓文名稱與地標名稱
        const candidateQueries = [
            formData.info?.loc,
            formData.info?.native_name,
            formData.name,
            parsedMapInfo?.placeName,
        ].filter(Boolean) as string[];

        if (candidateQueries.length === 0) {
            setGeocodeMsg({
                type: "error",
                text: "請先填寫詳細地址（例如: 부산 광복로 83-1）或景點韓文/中文名稱",
            });
            return;
        }

        setIsGeocoding(true);
        setGeocodeMsg(null);
        try {
            // 1. 優先使用 Kakao Local API (若已在 .env 設定 VITE_KAKAO_REST_API_KEY)
            if (KakaoLocalService.isConfigured()) {
                for (const q of candidateQueries) {
                    const kakaoRes = await KakaoLocalService.geocode(q);
                    if (kakaoRes) {
                        onFormInputChange(createSyntheticEvent("lat", kakaoRes.lat));
                        onFormInputChange(createSyntheticEvent("lng", kakaoRes.lng));

                        if (!formData.info?.loc && kakaoRes.roadAddress) {
                            onFormInputChange(createSyntheticEvent("info.loc", kakaoRes.roadAddress));
                        }
                        if (!formData.info?.phone && kakaoRes.phone) {
                            onFormInputChange(createSyntheticEvent("info.phone", kakaoRes.phone));
                        }

                        setGeocodeMsg({
                            type: "success",
                            text: `已透過 🇰🇷 Kakao Local API 成功定位 GPS (${kakaoRes.lat.toFixed(4)}, ${kakaoRes.lng.toFixed(4)})`,
                        });
                        return;
                    }
                }
            }

            // 2. 備援使用 OSM & Photon 多重圖資引擎
            let foundResult: OSMPlace | null = null;
            let matchedQuery = "";

            for (const q of candidateQueries) {
                const results = await OSMService.searchPlaces(q);
                if (results && results.length > 0) {
                    foundResult = results[0];
                    matchedQuery = q;
                    break;
                }
            }

            if (foundResult) {
                onFormInputChange(createSyntheticEvent("lat", parseFloat(foundResult.lat)));
                onFormInputChange(createSyntheticEvent("lng", parseFloat(foundResult.lon)));

                if (!formData.info?.loc && foundResult.display_name) {
                    onFormInputChange(createSyntheticEvent("info.loc", foundResult.display_name));
                }

                setGeocodeMsg({
                    type: "success",
                    text: `已依「${matchedQuery}」成功定位 GPS (${parseFloat(foundResult.lat).toFixed(4)}, ${parseFloat(foundResult.lon).toFixed(4)})`,
                });
            } else {
                setGeocodeMsg({
                    type: "error",
                    text: `未能透過名稱或地址定位，請檢查地址關鍵字或提供完整地名`,
                });
            }
        } catch (e) {
            setGeocodeMsg({ type: "error", text: "定位查詢失敗，請檢查網路連線" });
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleApplyMapPicker = (payload: ImportedPlacePayload) => {
        // 1. GPS 經緯度 (若使用者勾選套用)
        if (
            typeof payload.lat === "number" &&
            typeof payload.lng === "number" &&
            payload.lat !== 0 &&
            payload.lng !== 0
        ) {
            onFormInputChange(createSyntheticEvent("lat", payload.lat));
            onFormInputChange(createSyntheticEvent("lng", payload.lng));
        }

        // 2. 更新地圖網址 (僅在使用者有勾選並傳入 map_url 時更新)
        if (payload.map_url) {
            onFormInputChange(createSyntheticEvent("map_url", payload.map_url));
        }

        // 3. 景點名稱：若使用者有勾選帶入名稱才更新
        if (payload.name) {
            if (!formData.name || formData.name.trim() === "") {
                onFormInputChange(createSyntheticEvent("name", payload.name));
            } else if (payload.native_name && payload.native_name !== formData.name) {
                onFormInputChange(createSyntheticEvent("info.native_name", payload.native_name));
            }
        }
        if (payload.eng_name && !formData.eng_name) {
            onFormInputChange(createSyntheticEvent("eng_name", payload.eng_name));
        }
        if (payload.loc) {
            onFormInputChange(createSyntheticEvent("info.loc", payload.loc));
        }
        if (payload.phone) {
            onFormInputChange(createSyntheticEvent("info.phone", payload.phone));
        }
        if (payload.image_url && (!formData.image_url || formData.image_url.trim() === "")) {
            onFormInputChange(createSyntheticEvent("image_url", payload.image_url));
        }
        if (payload.description && (!formData.description || formData.description.trim() === "")) {
            onFormInputChange(createSyntheticEvent("description", payload.description));
        }

        // 清空上方景點搜尋輸入框與候選提示
        setSearchTerm("");
        setShowSuggestions(false);
        setSelectedPlace(null);

        const displayName = payload.name || formData.name || "自訂地標位置";
        const gpsInfo = payload.lat && payload.lng ? ` (${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)})` : "";
        setGeocodeMsg({
            type: "success",
            text: `已成功套用${payload.lat && payload.lng ? " GPS 座標" : ""}${payload.name ? `與地點資料：${displayName}` : ""} ${gpsInfo}`.trim(),
        });
    };

    // 標籤解析與新增/刪除
    const currentTags = useMemo(() => {
        return Array.isArray(formData.tags)
            ? formData.tags
            : typeof formData.tags === "string"
            ? (formData.tags as string)
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
            : [];
    }, [formData.tags]);

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        const newTag = tagInput.trim().replace(/^#/, "");
        if (!currentTags.includes(newTag)) {
            const updated = [...currentTags, newTag];
            onFormInputChange({
                target: { name: "tags", value: updated.join(",") },
            } as any);
        }
        setTagInput("");
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const updated = currentTags.filter((t) => t !== tagToRemove);
        onFormInputChange({
            target: { name: "tags", value: updated.join(",") },
        } as any);
    };

    const handleCopyId = () => {
        if (formData.id) {
            navigator.clipboard.writeText(formData.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    return {
        activeTab,
        setActiveTab,
        copiedId,
        handleCopyId,
        speaking,
        detectedNativeLang,
        handleSpeakNative,
        // Search & suggestions
        searchTerm,
        setSearchTerm,
        isSearching,
        searchResults,
        showSuggestions,
        setShowSuggestions,
        selectedPlace,
        setSelectedPlace,
        importFields,
        setImportFields,
        preserveExistingTop,
        setPreserveExistingTop,
        handleSelectResult,
        handleApplyImport,
        // Map & geocode
        parsedMapInfo,
        isGeocoding,
        geocodeMsg,
        handleAutoGeocode,
        isMapPickerOpen,
        setIsMapPickerOpen,
        handleApplyMapPicker,
        // Tags
        currentTags,
        tagInput,
        setTagInput,
        handleAddTag,
        handleRemoveTag,
    };
}
