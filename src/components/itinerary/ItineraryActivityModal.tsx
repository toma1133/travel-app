import {
    ChangeEventHandler,
    ChangeEvent,
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
import type { PlaceVM } from "../../models/types/PlaceTypes";
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
    const handlePlaceSelect = (place: PlaceVM) => {
        const createEvent = (name: string, value: string) =>
            ({
                target: { name, value },
                currentTarget: { name, value },
            } as unknown as ChangeEvent<HTMLInputElement>);

        if (place.name) {
            onFormInputChange(createEvent("title", place.name));
        }
        if (place.type) {
            onFormInputChange(createEvent("type", place.type));
        }
        if (place.eng_name) {
            onFormInputChange(createEvent("desc", place.eng_name));
        }
    };

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
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
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
                    className="w-full bg-transparent text-foreground border-b border-border py-2 outline-none font-mono text-base dark:[color-scheme:dark]"
                />
            </div>
            <div>
                <label
                    htmlFor="title"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    標題 *
                </label>
                <input
                    required
                    name="title"
                    value={formData.title}
                    onChange={onFormInputChange}
                    placeholder="例如：從飯店出發"
                    className="w-full bg-transparent text-foreground border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            {/* Type Selection */}
            <div>
                <label
                    htmlFor="type"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    類型 *
                </label>
                <select
                    required
                    name="type"
                    value={formData.type}
                    onChange={onFormInputChange as any}
                    className="w-full bg-transparent text-foreground border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base cursor-pointer"
                >
                    {itineraryCategory.map((category) => (
                        <option
                            key={category.id}
                            value={category.id}
                            className="bg-background text-foreground"
                        >
                            {category.label}
                        </option>
                    ))}
                </select>
            </div>
            {/* Description */}
            <div>
                <label
                    htmlFor="desc"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    詳細說明
                </label>
                <textarea
                    name="desc"
                    value={formData.desc}
                    onChange={onFormInputChange}
                    rows={2}
                    placeholder="活動的細節或備註..."
                    className="w-full bg-transparent text-foreground border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base resize-none no-scrollbar"
                />
            </div>
            {/* Link ID */}
            <div>
                <label
                    htmlFor="linkId"
                    className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                >
                    <Tag size={12} className="mr-1" /> 連結地點 ID
                </label>
                <PlaceLinkAutocomplete
                    tripId={itinerary?.trip_id}
                    name="linkId"
                    value={formData.linkId}
                    onChange={onFormInputChange}
                    onPlaceSelect={handlePlaceSelect}
                />
            </div>
        </FormModal>
    );
};

export default ItineraryActivityModal;
