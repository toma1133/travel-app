import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import type { CarRentalRow } from "../../models/types/CarRentalTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type CarRentalModalProps = {
    formData: CarRentalRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const CarRentalModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: CarRentalModalProps) => {
    return (
        <FormModal
            formId={"car-rental-form"}
            modalTitle={mode === "create" ? `新增租車` : "編輯租車"}
            modalSaveTitle={mode === "create" ? "新增租車" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Company name */}
            <div>
                <label
                    htmlFor="company"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    租車公司 *
                </label>
                <input
                    required
                    name="company"
                    value={formData.company || ""}
                    onChange={onFormInputChange}
                    placeholder="Toyota Rent a Car"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            {/* Insurance and model */}
            <div>
                <label
                    htmlFor="insurance_plan"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    保險方案 *
                </label>
                <input
                    required
                    type="text"
                    name="insurance_plan"
                    value={formData.insurance_plan || ""}
                    placeholder="全險"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="model"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    車型 *
                </label>
                <input
                    required
                    type="text"
                    name="model"
                    value={formData.model || ""}
                    placeholder="Toyota Yaris"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            {/* Pickup and Dropoff location */}
            <div>
                <label
                    htmlFor="pickup_loc"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    取車地點 *
                </label>
                <input
                    required
                    type="text"
                    name="pickup_loc"
                    value={formData.pickup_loc || ""}
                    placeholder="機場"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="dropoff_loc"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    還車地點 *
                </label>
                <input
                    required
                    type="text"
                    name="dropoff_loc"
                    value={formData.dropoff_loc || ""}
                    placeholder="機場"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            {/* Dropoff date and location */}
            <div>
                <label
                    htmlFor="pickup_datetime"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    取車日期 *
                </label>
                <input
                    required
                    type="datetime-local"
                    name="pickup_datetime"
                    value={formData.pickup_datetime || ""}
                    placeholder="2025/12/12 12:34"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="dropoff_datetime"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    還車日期 *
                </label>
                <input
                    required
                    type="datetime-local"
                    name="dropoff_datetime"
                    value={formData.dropoff_datetime || ""}
                    placeholder="2025/12/12 12:34"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
        </FormModal>
    );
};

export default CarRentalModal;
