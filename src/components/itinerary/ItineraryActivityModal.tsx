import {
    ChangeEventHandler,
    CSSProperties,
    FormEventHandler,
    MouseEventHandler,
} from "react";
import { Clock, Tag, X } from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";
import PlaceLinkAutocomplete from "../common/PlaceLinkAutoComplete";

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
        <FormModal
            formId={"itinerary-activity-form"}
            modalTitle={
                mode === "create"
                    ? `新增 Day ${itinerary?.day_number} 活動`
                    : `編輯活動 ${formData.title}`
            }
            modalSaveTitle={mode === "create" ? "新增活動" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Time and Title */}
            <div>
                <label
                    htmlFor="time"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    <Clock size={12} className="mr-1" /> 時間 *
                </label>
                <input
                    required
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={onFormInputChange}
                    placeholder="例如: 09:30"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="title"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    標題 *
                </label>
                <input
                    required
                    name="title"
                    value={formData.title}
                    onChange={onFormInputChange}
                    placeholder="例如：從飯店出發"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            {/* Type Selection */}
            <div>
                <label
                    htmlFor="type"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    類型 *
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {itineraryCategory.map((category) => (
                        <label
                            key={category.id}
                            className={`
                                cursor-pointer text-center py-2 rounded-lg border text-sm transition-all
                                ${
                                    formData.type === category.id
                                        ? `text-white border-transparent`
                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                }
                            `}
                            style={
                                {
                                    backgroundColor:
                                        formData.type === category.id
                                            ? theme?.categoryColor[
                                                  category.id
                                              ] || theme?.accentColor
                                            : "",
                                    borderColor:
                                        formData.type === category.id
                                            ? theme?.categoryColor[
                                                  category.id
                                              ] || theme?.accentColor
                                            : "",
                                } as CSSProperties
                            }
                        >
                            <input
                                type="radio"
                                name="type"
                                value={category.id}
                                checked={formData.type === category.id}
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
                <label
                    htmlFor="desc"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    詳細說明
                </label>
                <textarea
                    name="desc"
                    value={formData.desc}
                    onChange={onFormInputChange}
                    rows={2}
                    placeholder="活動的細節或備註..."
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base resize-none"
                />
            </div>
            {/* Link ID */}
            <div>
                <label
                    htmlFor="linkId"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    <Tag size={12} className="mr-1" /> 連結地點 ID
                </label>
                <PlaceLinkAutocomplete
                    tripId={itinerary?.trip_id}
                    name="link_id"
                    value={formData.linkId}
                    onChange={onFormInputChange}
                />
            </div>
        </FormModal>
    );
};

export default ItineraryActivityModal;
