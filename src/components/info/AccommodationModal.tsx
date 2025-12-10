import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { X } from "lucide-react";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";
import type { TripThemeConf } from "../../models/types/TripsTypes";

type AccommodationModalProps = {
    formData: AccommodationRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const AccommodationModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onSubmit,
}: AccommodationModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        {mode === "create" ? `新增住宿` : "編輯住宿"}
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
                        id="accommodation-form"
                        onSubmit={onSubmit}
                        className="space-y-4"
                    >
                        {/* Hotel name */}
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    住宿名稱
                                </label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={onFormInputChange}
                                    placeholder="XXX飯店"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                />
                            </div>
                        </div>
                        {/* Checkin and Checkout date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    入住日期
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="check_in_date"
                                    value={formData.check_in_date || ""}
                                    placeholder="2025/12/12"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    退房日期
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="check_out_date"
                                    value={formData.check_out_date || ""}
                                    placeholder="2025/12/12"
                                    onChange={onFormInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                        {/* Address */}
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    地址
                                </label>
                                <input
                                    name="address"
                                    value={formData.address || ""}
                                    onChange={onFormInputChange}
                                    placeholder="XXX市XXX區"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
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
                        form="accommodation-form"
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme?.accent}`}
                    >
                        {mode === "create" ? "新增住宿" : "儲存變更"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccommodationModal;
