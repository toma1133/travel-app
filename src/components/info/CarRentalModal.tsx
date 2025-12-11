import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { X } from "lucide-react";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type CarRentalModalProps = {
    formData: CarRentalRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const CarRentalModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onSubmit,
}: CarRentalModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        {mode === "create" ? `新增租車` : "編輯租車"}
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

                {/* Modal Body - Form */}
                <div className="p-6 overflow-y-auto">
                    <form
                        id="car-rental-form"
                        onSubmit={onSubmit}
                        className="space-y-4"
                    >
                        {/* Company name */}
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    租車公司
                                </label>
                                <input
                                    required
                                    name="company"
                                    value={formData.company || ""}
                                    onChange={onFormInputChange}
                                    placeholder="Toyota Rent a Car"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                />
                            </div>
                        </div>
                        {/* Insurance and model */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    保險方案
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="insurance_plan"
                                    value={formData.insurance_plan || ""}
                                    placeholder="全險"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    車型
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="model"
                                    value={formData.model || ""}
                                    placeholder="Toyota Yaris"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                        {/* Pickup and Dropoff location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    取車地點
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="pickup_loc"
                                    value={formData.pickup_loc || ""}
                                    placeholder="機場"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    還車地點
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="dropoff_loc"
                                    value={formData.dropoff_loc || ""}
                                    placeholder="機場"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                        {/* Dropoff date and location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    取車日期
                                </label>
                                <input
                                    required
                                    type="datetime-local"
                                    name="pickup_datetime"
                                    value={formData.pickup_datetime || ""}
                                    placeholder="2025/12/12 12:34"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    還車日期
                                </label>
                                <input
                                    required
                                    type="datetime-local"
                                    name="dropoff_datetime"
                                    value={formData.dropoff_datetime || ""}
                                    placeholder="2025/12/12 12:34"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
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
                        form="car-rental-form"
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme?.accent}`}
                    >
                        {mode === "create" ? "新增租車" : "儲存變更"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CarRentalModal;
