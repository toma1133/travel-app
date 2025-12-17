import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { TripVM } from "../../models/types/TripTypes";
import { X } from "lucide-react";

type TripModalProps = {
    formData: TripVM;
    mode: string;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormChange: ChangeEventHandler<HTMLInputElement>;
    onSettingChange: (name: string, value: string | number) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const TripModal = ({
    formData,
    mode,
    onCloseBtnClick,
    onFormChange,
    onSettingChange,
    onSubmit,
}: TripModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        {mode === "create"
                            ? "創建新旅程"
                            : `編輯旅程：${formData.title}`}
                    </h3>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Body - Scrollable Form */}
                <div className="p-6 overflow-y-auto">
                    <form
                        id="trip-form"
                        onSubmit={onSubmit}
                        className="space-y-4"
                    >
                        {/* Title */}
                        <div>
                            <label className="block text-base font-bold text-gray-500 uppercase mb-1">
                                標題 *
                            </label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={onFormChange}
                                placeholder="例如：東京櫻花之旅"
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                            />
                        </div>
                        {/* Subtitle */}
                        <div>
                            <label className="block text-base font-bold text-gray-500 uppercase mb-1">
                                副標題 (可選)
                            </label>
                            <input
                                name="subtitle"
                                value={formData.subtitle || ""}
                                onChange={onFormChange}
                                placeholder="例如：美食、購物、文化探索"
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-gray-600"
                            />
                        </div>
                        {/* Start/End Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    開始日期 *
                                </label>
                                <input
                                    type="date"
                                    required
                                    name="start_date"
                                    value={formData.start_date || ""}
                                    onChange={onFormChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base font-mono"
                                    placeholder="2025/12/12"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    結束日期 *
                                </label>
                                <input
                                    type="date"
                                    required
                                    name="end_date"
                                    value={formData.end_date || ""}
                                    onChange={onFormChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base font-mono"
                                    placeholder="2025/12/16"
                                />
                            </div>
                        </div>
                        {/* Cover Image URL */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                封面圖片 URL (可選)
                            </label>
                            <input
                                name="cover_image"
                                value={formData.cover_image || ""}
                                onChange={onFormChange}
                                placeholder="輸入圖片連結..."
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-600 text-base font-mono"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                您可以提供一個圖片 URL 作為旅程封面。
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    本國幣 (Home)
                                </label>
                                <input
                                    name="setting_config.homeCurrency"
                                    value={
                                        formData.settings_config
                                            ?.homeCurrency || ""
                                    }
                                    onChange={(e) =>
                                        onSettingChange(
                                            "homeCurrency",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="NT$"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    當地幣 (Local)
                                </label>
                                <input
                                    name="setting_config.localCurrency"
                                    value={
                                        formData.settings_config
                                            ?.localCurrency || ""
                                    }
                                    onChange={(e) =>
                                        onSettingChange(
                                            "localCurrency",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="JPY¥"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-gray-600"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">
                                    匯率 (1{" "}
                                    {formData.settings_config?.localCurrency} =
                                    ? {formData.settings_config?.homeCurrency})
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    name="setting_config.exchangeRate"
                                    value={
                                        formData.settings_config?.exchangeRate
                                    }
                                    onChange={(e) =>
                                        onSettingChange(
                                            "exchangeRate",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-gray-600"
                                    placeholder="0.2"
                                />
                            </div>
                        </div>
                    </form>
                </div>
                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                        title="取消"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        form="trip-form"
                        className="px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 bg-[#9F1239] hover:bg-opacity-90"
                        title="Submit"
                    >
                        {mode === "create" ? "創建旅程" : "儲存變更"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripModal;
