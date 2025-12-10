import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Calendar, X } from "lucide-react";
import { ItineraryVM } from "../../models/types/ItineraryTypes";
import { TripThemeConf } from "../../models/types/TripsTypes";

type ItineraryDayModalProps = {
    formData: ItineraryVM;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const ItineraryDayModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: ItineraryDayModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        {mode === "create" ? `新增日程` : "編輯日程"}
                    </h3>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Modal Body - Form */}
                <div className="p-6 overflow-y-auto">
                    <form
                        id="day-form"
                        onSubmit={onFormSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                <Calendar size={12} className="mr-1" /> 日期 *
                            </label>
                            <input
                                required
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={onFormInputChange}
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                旅遊第幾天
                            </label>
                            <input
                                type="number"
                                name="day_number"
                                min="1"
                                value={formData.day_number}
                                onChange={onFormInputChange}
                                placeholder="0"
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                當日主題 (可選)
                            </label>
                            <input
                                name="title"
                                value={formData.title || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：清水寺周邊散步"
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            />
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
                        form="day-form"
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme?.accent}`}
                    >
                        {mode === "create" ? "新增日程" : "儲存變更"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItineraryDayModal;
