import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Clock, ImageIcon, MapPin, Tag, X } from "lucide-react";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type PlaceModalProps = {
    formData: PlaceVM;
    modalMode: string;
    placeCategory: PlaceCategory[];
    theme: TripThemeConf | null;
    onCloseClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    >;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const PlaceModal = ({
    formData,
    modalMode,
    placeCategory,
    theme,
    onCloseClick,
    onFormInputChange,
    onFormSubmit,
}: PlaceModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        {modalMode === "create" ? "新增地點" : "編輯地點"}
                    </h3>
                    <button
                        type="button"
                        title="Close"
                        onClick={onCloseClick}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Modal Body - Scrollable Form */}
                <div className="p-6 overflow-y-auto">
                    <form
                        id="add-place-form"
                        onSubmit={onFormSubmit}
                        className="space-y-4"
                    >
                        {/* Type Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                類型
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {placeCategory.map((type) => (
                                    <label
                                        key={type.id}
                                        className={`
                                                    cursor-pointer text-center py-2 rounded-lg border text-sm transition-all
                                                    ${
                                                        formData.type ===
                                                        type.id
                                                            ? `${theme?.accent} text-white border-transparent`
                                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    }
                                                `}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type.id}
                                            checked={formData.type === type.id}
                                            onChange={onFormInputChange}
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
                                    value={formData.id}
                                    className="w-full p-2 rounded-lg border border-gray-200 outline-none text-base disabled:opacity-50"
                                    disabled={true}
                                    placeholder="id"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    名稱 *
                                </label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={onFormInputChange}
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
                                    value={formData.eng_name || ""}
                                    onChange={onFormInputChange}
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
                                value={formData.image_url || ""}
                                onChange={onFormInputChange}
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
                                name="description"
                                value={formData.description || ""}
                                onChange={onFormInputChange}
                                rows={3}
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
                                    value={formData?.info?.open || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例如:09:00 - 18:00"
                                    className="w-full p-1.5 rounded border border-gray-200 text-base"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center mb-1">
                                    <MapPin size={12} className="mr-1" /> 地址 /
                                    位置
                                </label>
                                <input
                                    name="info.loc"
                                    value={formData?.info?.loc || ""}
                                    onChange={onFormInputChange}
                                    placeholder="例如：京都市東山區..."
                                    className="w-full p-1.5 rounded border border-gray-200 text-base"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center mb-1">
                                    <Tag size={12} className="mr-1" /> 標籤
                                    (用逗號分隔)
                                </label>
                                <input
                                    name="tags"
                                    value={formData.tags || ""}
                                    onChange={onFormInputChange}
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
                                    value={formData.tips || ""}
                                    onChange={onFormInputChange}
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
                        onClick={onCloseClick}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        form="add-place-form"
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme?.accent}`}
                    >
                        {modalMode === "create" ? "新增地點" : "儲存變更"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaceModal;
