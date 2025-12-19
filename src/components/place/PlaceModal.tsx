import {
    ChangeEventHandler,
    FormEventHandler,
    MouseEventHandler,
    useState,
} from "react";
import { Clock, Copy, ImageIcon, MapPin, Tag, X } from "lucide-react";
import type { PlaceCategory, PlaceVM } from "../../models/types/PlaceTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

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
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Type Selection */}
            <div>
                <label
                    htmlFor="type"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    類型 *
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {placeCategory.map((type) => (
                        <label
                            key={type.id}
                            className={`
                                cursor-pointer text-center py-2 rounded-lg border text-sm transition-all
                                ${
                                    formData.type === type.id
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
                {mode !== "create" && (
                    <div>
                        <label
                            htmlFor="id"
                            className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                        >
                            ID
                        </label>
                        <div className="flex items-center gap-2 w-full">
                            <input
                                name="id"
                                value={formData.id}
                                className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base disabled:opacity-50"
                                disabled
                                placeholder="id"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                title="複製"
                            >
                                <Copy
                                    size={20}
                                    className={
                                        copiedId
                                            ? "text-green-500"
                                            : "text-gray-500"
                                    }
                                />
                            </button>
                        </div>
                    </div>
                )}
                <div>
                    <label
                        htmlFor="name"
                        className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                    >
                        名稱 *
                    </label>
                    <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={onFormInputChange}
                        placeholder="例如：清水寺"
                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                    />
                </div>
                <div>
                    <label
                        htmlFor="eng_name"
                        className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                    >
                        英文名稱
                    </label>
                    <input
                        name="eng_name"
                        value={formData.eng_name || ""}
                        onChange={onFormInputChange}
                        placeholder="e.g. Kiyomizu-dera"
                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                    />
                </div>
            </div>
            {/* Image URL */}
            <div>
                <label
                    htmlFor="eng_name"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    <ImageIcon size={12} className="mr-1" /> 圖片網址
                </label>
                <input
                    name="image_url"
                    value={formData.image_url || ""}
                    onChange={onFormInputChange}
                    placeholder="https://..."
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            {/* Description */}
            <div>
                <label
                    htmlFor="description"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    介紹
                </label>
                <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={onFormInputChange}
                    rows={2}
                    placeholder="關於這個地點的簡短介紹..."
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base resize-none"
                />
            </div>
            {/* Details */}
            <div>
                <label
                    htmlFor="info.open"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    <Clock size={12} className="mr-1" /> 營業時間
                </label>
                <input
                    name="info.open"
                    value={formData?.info?.open || ""}
                    onChange={onFormInputChange}
                    placeholder="例如:09:00 - 18:00"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="info.loc"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    <MapPin size={12} className="mr-1" /> 地址 / 位置
                </label>
                <input
                    name="info.loc"
                    value={formData?.info?.loc || ""}
                    onChange={onFormInputChange}
                    placeholder="例如：京都市東山區..."
                    className="w-full p1.5 bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="tags"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    <Tag size={12} className="mr-1" /> 標籤 (用逗號分隔)
                </label>
                <input
                    name="tags"
                    value={formData.tags || ""}
                    onChange={onFormInputChange}
                    placeholder="例如：世界遺產, 必去, 拍照"
                    className="w-full p1.5 bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="tips"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    Tips / 備註
                </label>
                <input
                    name="tips"
                    value={formData.tips || ""}
                    onChange={onFormInputChange}
                    placeholder="例如：建議早上去..."
                    className="w-full p-1.5 bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
        </FormModal>
    );
};

export default PlaceModal;
