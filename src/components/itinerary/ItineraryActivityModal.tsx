import {
    ChangeEventHandler,
    CSSProperties,
    FormEventHandler,
    MouseEventHandler,
} from "react";
import { Clock, Tag, X } from "lucide-react";
import {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import { TripThemeConf } from "../../models/types/TripsTypes";

type ItineraryCategory = {
    id: string;
    label: string;
};

type ItineraryActivityModalProps = {
    formData: ItineraryActivitiy;
    itinerary: ItineraryVM | null;
    itineraryCategory: ItineraryCategory[];
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    >;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const ItineraryActivityModal = ({
    formData,
    itinerary,
    itineraryCategory,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: ItineraryActivityModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        {mode === "create"
                            ? `新增 Day ${itinerary?.day_number} 活動`
                            : "編輯活動"}
                    </h3>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Modal Body - Scrollable Form */}
                <div className="p-6 overflow-y-auto">
                    <form
                        id="activity-form"
                        onSubmit={onFormSubmit}
                        className="space-y-4"
                    >
                        {/* Time and Title */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    <Clock size={12} className="mr-1" /> 時間 *
                                </label>
                                <input
                                    type="time"
                                    required
                                    name="time"
                                    value={formData.time}
                                    onChange={onFormInputChange}
                                    placeholder="例如: 09:30"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    標題 *
                                </label>
                                <input
                                    required
                                    name="title"
                                    value={formData.title}
                                    onChange={onFormInputChange}
                                    placeholder="例如：從飯店出發"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                        {/* Type Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                類型
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {itineraryCategory.map((category) => (
                                    <label
                                        key={category.id}
                                        className={`
                                                    cursor-pointer text-center py-2 rounded-lg border text-sm transition-all
                                                    ${
                                                        formData.type ===
                                                        category.id
                                                            ? `text-white border-transparent`
                                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    }
                                                `}
                                        style={
                                            {
                                                backgroundColor:
                                                    formData.type ===
                                                    category.id
                                                        ? theme?.categoryColor[
                                                              category.id
                                                          ] ||
                                                          theme?.accentColor
                                                        : "",
                                                borderColor:
                                                    formData.type ===
                                                    category.id
                                                        ? theme?.categoryColor[
                                                              category.id
                                                          ] ||
                                                          theme?.accentColor
                                                        : "",
                                            } as CSSProperties
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={category.id}
                                            checked={
                                                formData.type === category.id
                                            }
                                            onChange={onFormInputChange}
                                            className="hidden"
                                        />
                                        {category.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                詳細說明
                            </label>
                            <textarea
                                name="desc"
                                value={formData.desc}
                                onChange={onFormInputChange}
                                rows={2}
                                placeholder="活動的細節或備註..."
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                            />
                        </div>
                        {/* Link ID */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                <Tag size={12} className="mr-1" /> 連結地點 ID
                                (可選)
                            </label>
                            <input
                                name="linkId"
                                value={formData.linkId}
                                onChange={onFormInputChange}
                                placeholder="例如: new-1701234567890"
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs text-gray-600 font-mono"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                請輸入景點誌中地點卡片的 ID, 用於快速導航。
                            </p>
                        </div>
                    </form>
                </div>
                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        form="activity-form"
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme?.accent}`}
                    >
                        {mode === "create" ? "新增活動" : "儲存變更"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItineraryActivityModal;
