import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
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

    const [placeCategories] = useState<PlaceCategory[]>([
        { id: "all", label: "全部" },
        { id: "sight", label: "觀光" },
        { id: "food", label: "美食" },
        { id: "shopping", label: "購物" },
    ]);
    const [filter, setFilter] = useState("all");
    const [filteredPlaces, setFilteredPlaces] = useState<PlaceVM[] | null>(
        null
    );

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
        const targetPlaces = Array.isArray(places)
            ? places.filter((p) => filter === "all" || p.type === filter)
            : [];
        setFilteredPlaces(targetPlaces);
    }, [places, filter]);

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
            const newFormPlace: PlaceVM = {
                ...formPlace,
                info: {
                    ...formPlace.info,
                    [field]: value,
                },
            };
            setFormPlace(newFormPlace);
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

    return (
        <div
            className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
                isPrinting
                    ? "p-0 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                    : `${
                          tripData?.theme_config?.bg || "bg-gray-100"
                      } pt-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="景點誌"
                    subtitle="探索與收藏的美好事物"
                    theme={tripData?.theme_config}
                />
            )}
            {!isPrinting && (
                <PlaceFilter
                    activeFilterId={filter}
                    placeCategories={placeCategories}
                    theme={tripData.theme_config}
                    onFilterBtnClick={handleFilterBtnClick}
                    onOpenCreateModal={handleOpenCreateModal}
                />
            )}
            <PlaceCardList
                isPrinting={isPrinting}
                places={filteredPlaces}
                theme={tripData.theme_config}
                onDeleteBtnClick={handleOpenDeleteModal}
                onEditBtnClick={handleOpenEditModal}
            />
            {isModalOpen && (
                <PlaceModal
                    formData={formPlace}
                    modalMode={modalMode}
                    placeCategory={placeCategories.filter(
                        (pc) => pc.id !== "all"
                    )}
                    theme={tripData?.theme_config}
                    onCloseClick={handleCloseEditModal}
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
