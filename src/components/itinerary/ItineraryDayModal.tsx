import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Calendar } from "lucide-react";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

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
        <FormModal
            formId={"itinerary-day-form"}
            modalTitle={
                mode === "create"
                    ? "新增日程"
                    : `編輯日程 Day ${formData.day_number}`
            }
            modalSaveTitle={mode === "create" ? "新增日程" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            <div>
                <label
                    htmlFor="date"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    <Calendar size={12} className="mr-1" /> 日期 *
                </label>
                <input
                    required
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                    placeholder="2025/12/12"
                />
            </div>
            <div>
                <label
                    htmlFor="day_number"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    旅遊第幾天 *
                </label>
                <input
                    required
                    type="number"
                    name="day_number"
                    min="1"
                    value={formData.day_number}
                    onChange={onFormInputChange}
                    placeholder="0"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="title"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    當日主題
                </label>
                <input
                    name="title"
                    value={formData.title || ""}
                    onChange={onFormInputChange}
                    placeholder="例如：清水寺周邊散步"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
        </FormModal>
    );
};

export default ItineraryDayModal;
