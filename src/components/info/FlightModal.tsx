import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import type { FlightRow } from "../../models/types/FlightTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type FlightModalProps = {
    formData: FlightRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const FlightModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: FlightModalProps) => {
    return (
        <FormModal
            formId={"flight-form"}
            modalTitle={mode === "create" ? `新增航班` : "編輯航班"}
            modalSaveTitle={mode === "create" ? "新增航班" : "儲存變更"}
            theme={theme}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Departure and arrive location */}
            <div>
                <label
                    htmlFor="departure_loc"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    出發地
                </label>
                <input
                    required
                    name="departure_loc"
                    value={formData.departure_loc || ""}
                    onChange={onFormInputChange}
                    placeholder="TPE"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="arrival_loc"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    目的地
                </label>
                <input
                    required
                    name="arrival_loc"
                    value={formData.arrival_loc || ""}
                    onChange={onFormInputChange}
                    placeholder="KIX"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            {/* Code and flight date */}
            <div>
                <label
                    htmlFor="code"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    航班代號
                </label>
                <input
                    required
                    name="code"
                    value={formData.code || ""}
                    onChange={onFormInputChange}
                    placeholder="JX800"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="flight_date"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    出發日期
                </label>
                <input
                    required
                    type="date"
                    name="flight_date"
                    value={formData.flight_date || ""}
                    onChange={onFormInputChange}
                    placeholder="2023/10/10"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            {/* Departure and arrive time */}
            <div>
                <label
                    htmlFor="departure_time"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    起飛時間
                </label>
                <input
                    required
                    type="time"
                    name="departure_time"
                    value={formData.departure_time || ""}
                    onChange={onFormInputChange}
                    placeholder="08:30"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="arrival_time"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    抵達時間
                </label>
                <input
                    required
                    type="time"
                    name="arrival_time"
                    value={formData.arrival_time || ""}
                    onChange={onFormInputChange}
                    placeholder="12:00"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
        </FormModal>
    );
};

export default FlightModal;
