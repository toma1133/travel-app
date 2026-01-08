import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { ListIcon, MapIcon, Plus } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import usePlaces from "../../hooks/place/UsePlaces";
import usePlaceMutations from "../../hooks/place/UsePlaceMutations";
import BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import LayoutContextType from "../../models/types/LayoutContextTypes";
import { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import PlaceModal from "../../components/place/PlaceModal";
import PlaceFilter from "../../components/place/PlaceFilter";
import PlaceCardList from "../../components/place/PlaceCardList";
import PlaceMapView from "../../components/place/PlaceMapView";

type CoverPageProps = {
    isPrinting?: boolean;
};

const GuidePage = ({ isPrinting }: CoverPageProps) => {
    const { session } = useAuth();
    const { id: tripId } = useParams<{ id: string }>();
    const { data: places, isLoading, error } = usePlaces(tripId);
    const { insert, update, remove, anyPending } = usePlaceMutations();
    const { tripData } = useOutletContext<BookLayoutContextType>();
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [placeCategories] = useState<PlaceCategory[]>([
        { id: "all", label: "全部" },
        { id: "sight", label: "觀光" },
        { id: "food", label: "美食" },
        { id: "shopping", label: "購物" },
        { id: "hotel", label: "住宿" },
    ]);
    const [filter, setFilter] = useState("all");
    const [filteredPlaces, setFilteredPlaces] = useState<PlaceVM[] | null>(
        null
    );
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Create & edit
    const initialPlaceState: PlaceVM = useMemo(
        () => ({
            created_at: null,
            description: "",
            eng_name: "",
            id: crypto.randomUUID(),
            image_url: "",
            info: { open: "", price: "", loc: "" },
            name: "",
            tags: "",
            tips: "",
            trip_id: tripId ?? "",
            type: "sight",
            user_id: session ? session.user.id : "",
            updated_at: "",
            lat: 23.973875,
            lng: 120.982025,
            map_url: "",
        }),
        [tripId, session]
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
    const [formPlace, setFormPlace] = useState(initialPlaceState);

    // Delete
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [placeToDelete, setPlaceToDelete] = useState<PlaceVM | null>(null);

    useEffect(() => {
        if (!Array.isArray(places)) {
            setFilteredPlaces([]);
            return;
        }

        const targetPlaces = places.filter((p) => {
            // 檢查類型
            const matchType = filter === "all" || p.type === filter;

            // 檢查標籤 (必須包含所有選取的標籤)
            const placeTags = p.tags
                ? p.tags.split(",").map((t) => t.trim())
                : [];
            const matchTags =
                selectedTags.length === 0 ||
                selectedTags.every((tag) => placeTags.includes(tag));

            return matchType && matchTags;
        });

        setFilteredPlaces(targetPlaces);
    }, [places, filter, selectedTags]);

    const mutatingCount = useIsMutating({ mutationKey: ["place"] });

    const parseUrl = (url: string) => {
        if (!url.trim()) return null;

        try {
            // 1. Apple Maps 解析
            if (url.includes("maps.apple.com")) {
                let urlObj;
                try {
                    urlObj = new URL(url);
                } catch (e) {
                    return null;
                }

                const params = new URLSearchParams(urlObj.search);
                // Apple Maps 通常使用 'coordinate' 或 'll'
                const coordinate = params.get("coordinate") || params.get("ll");

                if (coordinate) {
                    const [lat, lng] = coordinate.split(",");

                    if (lat && lng) {
                        return {
                            source: "Apple Maps",
                            lat: +lat.trim(),
                            lng: +lng.trim(),
                            originalUrl: url,
                        };
                    }
                }

                return null;
            }

            // 2. Google Maps 解析
            if (url.includes("google") && url.includes("maps")) {
                // 優先順序 A: 視窗中心點 (@lat,lng) - 使用者範例 1 的情況
                // Regex: 尋找 @ 之後的數字, 逗號, 數字
                const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
                const atMatch = url.match(atRegex);

                if (atMatch) {
                    return {
                        source: "Google Maps",
                        lat: +atMatch[1],
                        lng: +atMatch[2],
                        originalUrl: url,
                    };
                }

                // 優先順序 B: 圖釘資料 (!3d...!4d)
                // 有時候分享的連結沒有 @，但有 data 參數 (!3d瑋度!4d經度)
                const latPinRegex = /!3d(-?\d+\.\d+)/;
                const lngPinRegex = /!4d(-?\d+\.\d+)/;

                const latMatch = url.match(latPinRegex);
                const lngMatch = url.match(lngPinRegex);

                if (latMatch && lngMatch) {
                    return {
                        source: "Google Maps",
                        lat: +latMatch[1],
                        lng: +lngMatch[2],
                        originalUrl: url,
                    };
                }

                // 優先順序 C: 搜尋參數 (?q=lat,lng)
                const urlObj = new URL(url);
                const q = urlObj.searchParams.get("q");

                if (q && q.includes(",")) {
                    const [lat, lng] = q.split(",");

                    if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                        return {
                            source: "Google Maps",
                            lat: +lat.trim(),
                            lng: +lng.trim(),
                            originalUrl: url,
                        };
                    }
                }

                return null;
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let timer: number | undefined;
        const shouldShow = isLoading || anyPending || mutatingCount > 0;

        if (shouldShow) {
            // 延遲 150ms 再顯示，避免瞬間消失造成閃爍
            timer = window.setTimeout(() => setIsPageLoading(true), 150);
        } else {
            // 立即關閉
            setIsPageLoading(false);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            // 離開頁面時確保關閉
            setIsPageLoading(false);
        };
    }, [isLoading, anyPending, mutatingCount, setIsPageLoading]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name.startsWith("info.")) {
            const field = name.split(".")[1];
            const newFormPlace: PlaceVM = {
                ...formPlace,
                info: {
                    ...formPlace.info,
                    [field]: value,
                },
            };
            setFormPlace(newFormPlace);
        } else if (name === "map_url") {
            setFormPlace((prev) => ({ ...prev, [name]: value }));

            const parseResult = parseUrl(value);

            if (parseResult) {
                setFormPlace((prev) => ({
                    ...prev,
                    lat: parseResult.lat,
                    lng: parseResult.lng,
                }));
            }
        } else {
            setFormPlace((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setFormPlace(initialPlaceState);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (place: PlaceVM) => {
        setModalMode("edit");
        setFormPlace(place);
        setIsModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setModalMode("create");
        setFormPlace(initialPlaceState);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const placeData = {
            ...formPlace,
        };

        try {
            if (modalMode === "create") {
                await insert.mutateAsync({
                    ...placeData,
                    id: crypto.randomUUID(),
                });
            } else {
                await update.mutateAsync(placeData);
                console.info(placeData);
            }
            setFormPlace(initialPlaceState);
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDeleteModal = (place: PlaceVM) => {
        setPlaceToDelete(place);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setPlaceToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!placeToDelete) return;

        try {
            await remove.mutateAsync(placeToDelete.id);
            setIsDeleteModalOpen(false);
            setPlaceToDelete(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFilterBtnClick = (category: string) => {
        setFilter(category);
    };

    const handleTagClick = (tag: string) => {
        if (!selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleRemoveTag = (tag: string) => {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
    };

    return (
        <div
            className={`min-h-full font-[Noto_Sans_TC] text-gray-800 flex flex-col ${
                isPrinting
                    ? "p-0 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                    : `${
                          tripData?.theme_config?.bg || "bg-gray-100"
                      } pt-12 pb-6`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="景點誌"
                    subtitle="Scene・Food・Shopping"
                    theme={tripData?.theme_config}
                    rightAction={
                        <div className="flex justify-center items-center gap-4">
                            <button
                                onClick={() =>
                                    setViewMode(
                                        viewMode === "list" ? "map" : "list"
                                    )
                                }
                                className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                            >
                                {viewMode === "list" ? (
                                    <>
                                        <MapIcon size={18} /> 地圖
                                    </>
                                ) : (
                                    <>
                                        <ListIcon size={18} /> 列表
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenCreateModal}
                                className={`flex items-center text-sm font-medium text-white px-4 py-2 rounded-lg shadow-md ${tripData?.theme_config?.accent} hover:opacity-90 transition-opacity`}
                                title="新增"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    }
                />
            )}
            {!isPrinting && (
                <PlaceFilter
                    activeFilterId={filter}
                    placeCategories={placeCategories}
                    selectedTags={selectedTags}
                    theme={tripData.theme_config}
                    onFilterBtnClick={handleFilterBtnClick}
                    onRemoveTagBtnClick={handleRemoveTag}
                />
            )}
            <div className="flex-1 flex flex-col px-4 items-center justify-center">
                {viewMode === "list" ? (
                    <PlaceCardList
                        isPrinting={isPrinting}
                        places={filteredPlaces}
                        theme={tripData.theme_config}
                        onDeleteBtnClick={handleOpenDeleteModal}
                        onEditBtnClick={handleOpenEditModal}
                        onTagBtnClick={handleTagClick}
                    />
                ) : (
                    <PlaceMapView places={filteredPlaces} trip={tripData} />
                )}
            </div>
            {isModalOpen && (
                <PlaceModal
                    formData={formPlace}
                    mode={modalMode}
                    placeCategory={placeCategories.filter(
                        (pc) => pc.id !== "all"
                    )}
                    theme={tripData?.theme_config}
                    onCloseBtnClick={handleCloseEditModal}
                    onFormInputChange={handleInputChange}
                    onFormSubmit={handleSubmit}
                />
            )}
            {isDeleteModalOpen && (
                <DeleteModal
                    deleteKey={placeToDelete?.name}
                    onCloseClick={handleCloseDeleteModal}
                    onConfirmClick={handleConfirmDelete}
                />
            )}
        </div>
    );
};

export default GuidePage;
