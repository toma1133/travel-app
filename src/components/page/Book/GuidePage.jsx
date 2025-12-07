import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Clock,
    ImageIcon,
    MapPin,
    Plus,
    Tag,
    X,
} from "lucide-react";
import PlaceCard from "../../common/PlaceCard";
import SectionHeader from "../../common/SectionHeader";

const GuidePage = ({
    places,
    targetPlaceId,
    theme,
    isPrinting,
    onAddPlace,
    onUpdatePlace,
    onDeletePlace,
}) => {
    const [filter, setFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
    const initialPlaceState = {
        id: crypto.randomUUID(),
        type: "sight",
        name: "",
        engName: "",
        image: "",
        desc: "",
        tips: "",
        tags: "", // 輸入時用逗號分隔，儲存時轉陣列
        info: {
            open: "",
            price: "",
            loc: "",
        },
    };
    const [formPlace, setFormPlace] = useState(initialPlaceState);
    const filteredPlaces = Array.isArray(places)
        ? places.filter((p) => filter === "all" || p.type === filter)
        : [];

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [placeToDelete, setPlaceToDelete] = useState(null);

    useEffect(() => {
        if (targetPlaceId) {
            const element = document.getElementById(`place-${targetPlaceId}`);
            if (element)
                element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [targetPlaceId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("info.")) {
            const field = name.split(".")[1];
            const newFormPlace = {
                ...formPlace,
                info: { ...formPlace.info, [field]: value },
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

    const handleOpenEditModal = (place) => {
        setModalMode("edit");
        setFormPlace({
            ...place,
            tags: Array.isArray(place.tags) ? place.tags.join(", ") : "", // 陣列轉字串供編輯
            info: place.info || { open: "", price: "", loc: "" }, // 確保 info 物件存在
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const placeData = {
            ...formPlace,
            tags: formPlace.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t),
            image:
                formPlace.image ||
                "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
        };

        if (modalMode === "create") {
            const newPlaceData = { ...placeData, id: crypto.randomUUID() };
            if (onAddPlace) onAddPlace(newPlaceData);
        } else {
            // 編輯模式：保留原有 ID
            if (onUpdatePlace) onUpdatePlace(placeData);
        }

        setFormPlace(initialPlaceState);
        setIsModalOpen(false);
    };

    const handleDeleteRequest = (place) => {
        setPlaceToDelete(place);
        setIsDeleteModalOpen(true);
    };

    // 確認刪除
    const handleConfirmDelete = () => {
        if (onDeletePlace && placeToDelete) {
            onDeletePlace(placeToDelete.id);
        }
        setIsDeleteModalOpen(false);
        setPlaceToDelete(null);
    };

    return (
        <div
            className={`min-h-full font-[Noto_Sans_TC] text-gray-800 ${
                isPrinting
                    ? "p-0 h-auto min-h-[50vh] break-after-page overflow-visible print:bg-white"
                    : `${theme.bg || "bg-gray-100"} py-12 pb-24`
            }`}
        >
            {!isPrinting && (
                <SectionHeader
                    title="景點誌"
                    subtitle="探索與收藏的美好事物"
                    theme={theme}
                />
            )}
            {!isPrinting && (
                <div className="flex justify-between items-center px-4 mb-6">
                    <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                        {[
                            { id: "all", label: "全部" },
                            { id: "sight", label: "觀光" },
                            { id: "food", label: "美食" },
                            { id: "shopping", label: "購物" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-4 py-1.5 rounded-full text-xs transition-colors ${
                                    filter === f.id
                                        ? `${theme.accent} text-white`
                                        : "bg-white text-gray-500 border border-gray-200"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className={`ml-2 flex px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-sm ${theme.accent} hover:opacity-90 transition-opacity whitespace-nowrap`}
                    >
                        <Plus size={14} className="mr-1" />
                        新增
                    </button>
                </div>
            )}
            <div className="space-y-6 px-4 print:space-y-4">
                {filteredPlaces.length > 0 ? (
                    filteredPlaces.map((place) => (
                        <PlaceCard
                            key={place.id}
                            theme={theme}
                            place={place}
                            isHighlighted={targetPlaceId === place.id}
                            isPrinting={isPrinting}
                            isPreview={false}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDeleteRequest}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        此分類尚無地點，點擊右上角新增。
                    </div>
                )}
            </div>

            {/* Add Place Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">
                                {modalMode === "create"
                                    ? "新增地點"
                                    : "編輯地點"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable Form */}
                        <div className="p-6 overflow-y-auto">
                            <form
                                id="add-place-form"
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                {/* Type Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                        類型
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: "sight", label: "觀光" },
                                            { id: "food", label: "美食" },
                                            { id: "shopping", label: "購物" },
                                        ].map((type) => (
                                            <label
                                                key={type.id}
                                                className={`
                                                    cursor-pointer text-center py-2 rounded-lg border text-sm transition-all
                                                    ${
                                                        formPlace.type ===
                                                        type.id
                                                            ? `${theme.accent} text-white border-transparent`
                                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value={type.id}
                                                    checked={
                                                        formPlace.type ===
                                                        type.id
                                                    }
                                                    onChange={handleInputChange}
                                                    className="hidden"
                                                />
                                                {type.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            ID
                                        </label>
                                        <input
                                            name="id"
                                            value={formPlace.id}
                                            className="w-full p-2 rounded-lg border border-gray-200 outline-none text-base disabled:opacity-50"
                                            disabled={true}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            名稱 *
                                        </label>
                                        <input
                                            required
                                            name="name"
                                            value={formPlace.name}
                                            onChange={handleInputChange}
                                            placeholder="例如：清水寺"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            英文名稱
                                        </label>
                                        <input
                                            name="eng_name"
                                            value={formPlace.eng_name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Kiyomizu-dera"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                        <ImageIcon size={12} className="mr-1" />{" "}
                                        圖片網址
                                    </label>
                                    <input
                                        name="image_url"
                                        value={formPlace.image_url}
                                        onChange={handleInputChange}
                                        placeholder="https://..."
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-gray-600 font-mono"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        介紹
                                    </label>
                                    <textarea
                                        name="desc"
                                        value={formPlace.desc}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="關於這個地點的簡短介紹..."
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base resize-none"
                                    />
                                </div>

                                {/* Details */}
                                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center mb-1">
                                            <Clock size={12} className="mr-1" />{" "}
                                            營業時間
                                        </label>
                                        <input
                                            name="info.open"
                                            value={formPlace.info.open}
                                            onChange={handleInputChange}
                                            placeholder="例如:09:00 - 18:00"
                                            className="w-full p-1.5 rounded border border-gray-200 text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center mb-1">
                                            <MapPin
                                                size={12}
                                                className="mr-1"
                                            />{" "}
                                            地址 / 位置
                                        </label>
                                        <input
                                            name="info.loc"
                                            value={formPlace.info.loc}
                                            onChange={handleInputChange}
                                            placeholder="例如：京都市東山區..."
                                            className="w-full p-1.5 rounded border border-gray-200 text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center mb-1">
                                            <Tag size={12} className="mr-1" />{" "}
                                            標籤 (用逗號分隔)
                                        </label>
                                        <input
                                            name="tags"
                                            value={formPlace.tags}
                                            onChange={handleInputChange}
                                            placeholder="例如：世界遺產, 必去, 拍照"
                                            className="w-full p-1.5 rounded border border-gray-200 text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-1">
                                            Tips / 備註
                                        </label>
                                        <input
                                            name="tips"
                                            value={formPlace.tips}
                                            onChange={handleInputChange}
                                            placeholder="例如：建議早上去..."
                                            className="w-full p-1.5 rounded border border-gray-200 text-base"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                form="add-place-form"
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme.accent}`}
                            >
                                {modalMode === "create"
                                    ? "新增地點"
                                    : "儲存變更"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                確定要刪除？
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            您即將刪除{" "}
                            <span className="font-bold text-gray-800">
                                {placeToDelete?.name}
                            </span>
                            。此動作無法復原。
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuidePage;
