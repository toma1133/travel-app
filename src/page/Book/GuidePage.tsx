import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import useAuth from "../../hooks/UseAuth";
import usePlaces from "../../hooks/place/UsePlaces";
import usePlaceMutations from "../../hooks/place/UsePlaceMutations";
import SectionHeader from "../../components/common/SectionHeader";
import DeleteModal from "../../components/common/DeleteModal";
import PlaceModal from "../../components/place/PlaceModal";
import PlaceFilter from "../../components/place/PlaceFilter";
import PlaceCardList from "../../components/place/PlaceCardList";
import BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import LayoutContextType from "../../models/types/LayoutContextTypes";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import type { TripVM } from "../../models/types/TripTypes";

import { PLACE_CATEGORIES } from "../../constants/Categories";
import { parseMapUrl } from "../../utils/MapUrlParserUtil";

type CoverPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const GuidePage = ({
    isPrinting,
    tripDataOverride,
    tripIdOverride,
}: CoverPageProps) => {
    const { session } = useAuth();
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const { data: places, isLoading, error } = usePlaces(tripId);
    const { insert, update, remove, anyPending } = usePlaceMutations();
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;
    const currentTheme = tripData?.theme_config || null;
    const { setIsPageLoading } = useOutletContext<LayoutContextType>();

    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [placeCategories] = useState<PlaceCategory[]>(PLACE_CATEGORIES);
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
            lat: null,
            lng: null,
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
                ? p.tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [];
            const matchTags =
                selectedTags.length === 0 ||
                selectedTags.every((tag) => placeTags.includes(tag));

            return matchType && matchTags;
        });

        setFilteredPlaces(targetPlaces);
    }, [places, filter, selectedTags]);

    // 計算所有地點包含的標籤與其出現次數
    const availableTags = useMemo(() => {
        if (!Array.isArray(places)) return [];
        const tagMap: Record<string, number> = {};
        places.forEach((p) => {
            if (p.tags) {
                p.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .forEach((tag) => {
                        tagMap[tag] = (tagMap[tag] || 0) + 1;
                    });
            }
        });
        return Object.entries(tagMap)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({ tag, count }));
    }, [places]);

    const mutatingCount = useIsMutating({ mutationKey: ["place"] });

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
            setFormPlace((prev) => ({
                ...prev,
                info: {
                    ...prev.info,
                    [field]: value,
                },
            }));
        } else if (name === "map_url") {
            setFormPlace((prev) => {
                const updated = { ...prev, [name]: value };
                const parseResult = parseMapUrl(value);

                if (parseResult) {
                    updated.lat = parseResult.lat;
                    updated.lng = parseResult.lng;
                    if (!updated.name && parseResult.placeName) {
                        updated.name = parseResult.placeName;
                    }
                }
                return updated;
            });
        } else if (name === "lat" || name === "lng") {
            const num = parseFloat(value);
            setFormPlace((prev) => ({
                ...prev,
                [name]: isNaN(num) ? null : num,
            }));
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

        const isHotel = formPlace.type === "hotel" || formPlace.type === "stay";
        const placeData = {
            ...formPlace,
            info: {
                ...formPlace.info,
                ...(isHotel
                    ? {
                          check_in: formPlace.info?.check_in || "15:00",
                          check_out: formPlace.info?.check_out || "11:00",
                      }
                    : {}),
            },
        };

        try {
            if (modalMode === "create") {
                await insert.mutateAsync({
                    ...placeData,
                    id: crypto.randomUUID(),
                });
            } else {
                await update.mutateAsync(placeData);
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
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleRemoveTag = (tag: string) => {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
    };

    const handleClearAllFilters = () => {
        setFilter("all");
        setSelectedTags([]);
    };

    return (
        <div
            className={`font-[Noto_Sans_TC] text-foreground flex flex-col ${
                isPrinting
                    ? "p-0 h-auto min-h-0 overflow-visible bg-white text-black"
                    : `min-h-full ${
                          tripData?.theme_config?.bg || "bg-background"
                      } dark:bg-background pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="景點誌"
                    subtitle="Scene • Food • Shopping"
                    theme={tripData?.theme_config!}
                    hasBackBtn={true}
                    rightAction={
                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                onClick={handleOpenCreateModal}
                                className={`flex items-center text-sm font-medium text-white px-3 py-1.5 rounded-lg shadow-md ${tripData?.theme_config?.accent} hover:opacity-90 transition-opacity`}
                                title="新增"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    }
                />
            )}
            <div
                className={`flex-1 flex flex-col ${
                    isPrinting ? "space-y-4 px-0" : "px-4 mt-6 space-y-6"
                }`}
            >
                {!isPrinting && (
                    <PlaceFilter
                        activeFilterId={filter}
                        placeCategories={placeCategories}
                        availableTags={availableTags}
                        selectedTags={selectedTags}
                        filteredPlacesCount={filteredPlaces?.length ?? 0}
                        theme={tripData?.theme_config!}
                        onFilterBtnClick={handleFilterBtnClick}
                        onTagBtnClick={handleTagClick}
                        onRemoveTagBtnClick={handleRemoveTag}
                        onClearAllFilters={handleClearAllFilters}
                    />
                )}
                <PlaceCardList
                    isPrinting={isPrinting}
                    places={filteredPlaces}
                    theme={tripData?.theme_config!}
                    selectedTags={selectedTags}
                    onDeleteBtnClick={handleOpenDeleteModal}
                    onEditBtnClick={handleOpenEditModal}
                    onTagBtnClick={handleTagClick}
                />
            </div>
            {isModalOpen && (
                <PlaceModal
                    formData={formPlace}
                    mode={modalMode}
                    placeCategory={placeCategories.filter(
                        (pc) => pc.id !== "all"
                    )}
                    theme={tripData?.theme_config!}
                    localCurrency={tripData?.settings_config?.localCurrency}
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
