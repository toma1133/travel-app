import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { X } from "lucide-react";
import type { FlightRow } from "../../models/types/FlightTypes";
import type { TripThemeConf } from "../../models/types/TripsTypes";

type FlightModalProps = {
    formData: FlightRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const FlightModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onSubmit,
}: FlightModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        {mode === "create" ? `新增航班` : "編輯航班"}
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
                        id="flight-form"
                        onSubmit={onSubmit}
                        className="space-y-4"
                    >
                        {/* Departure and arrive location */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    出發地
                                </label>
                                <input
                                    required
                                    name="departure_loc"
                                    value={formData.departure_loc || ""}
                                    onChange={onFormInputChange}
                                    placeholder="TPE"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    目的地
                                </label>
                                <input
                                    required
                                    name="arrival_loc"
                                    value={formData.arrival_loc || ""}
                                    onChange={onFormInputChange}
                                    placeholder="KIX"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                        {/* Code and flight date */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                    航班代號
                                </label>
                                <input
                                    required
                                    name="code"
                                    value={formData.code || ""}
                                    onChange={onFormInputChange}
                                    placeholder="JX800"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    目的地
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="flight_date"
                                    value={formData.flight_date || ""}
                                    onChange={onFormInputChange}
                                    placeholder="2023/10/10"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                        {/* Departure and arrive time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    起飛時間
                                </label>
                                <input
                                    required
                                    type="time"
                                    name="departure_time"
                                    value={formData.departure_time || ""}
                                    onChange={onFormInputChange}
                                    placeholder="08:30"
                                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    抵達時間
                                </label>
                                <input
                                    required
                                    type="time"
                                    name="arrival_time"
                                    value={formData.arrival_time || ""}
                                    onChange={onFormInputChange}
                                    placeholder="12:00"
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
                        form="flight-form"
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 ${theme?.accent}`}
                    >
                        {mode === "create" ? "新增航班" : "儲存變更"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlightModal;
