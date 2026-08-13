import {
    ChangeEventHandler,
    ChangeEvent,
    FormEventHandler,
    MouseEventHandler,
} from "react";
import { Clock, Tag, Hourglass, Navigation } from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";
import { CATEGORY_DEFINITIONS, TRANSIT_MODES } from "../../constants/Categories";
import { CategoryCustomSelect } from "../common/CategoryCustomSelect";
import FormModal from "../common/FormModal";
import PlaceLinkAutocomplete from "../common/PlaceLinkAutoComplete";

type ItineraryActivityModalProps = {
    formData: ItineraryActivitiy;
    itinerary: ItineraryVM | null;
    itineraryCategory: any[];
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const ItineraryActivityModal = ({
    formData,
    itinerary,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        htmlFor="duration"
                        className="block font-bold uppercase mb-1 flex items-center text-muted-foreground text-xs"
                    >
                        <Hourglass size={12} className="mr-1" /> 停留時間 (選填)
                    </label>
                    <input
                        name="duration"
                        value={formData.duration || ""}
                        onChange={onFormInputChange}
                        placeholder="例如：1.5小時, 45分鐘"
                        className="w-full bg-transparent text-foreground border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base"
                    />
                </div>
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
                    placeholder="例如：清水寺"
                    className="w-full bg-transparent text-foreground border-b border-border py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>

            {/* Category Type Selection with Custom Icons */}
            <CategoryCustomSelect
                label="活動類型 *"
                value={formData.type || "sight"}
                onChange={(newTypeId) => {
                    const event = {
                        target: { name: "type", value: newTypeId },
                        currentTarget: { name: "type", value: newTypeId },
                    } as unknown as ChangeEvent<HTMLInputElement>;
                    onFormInputChange(event);
                }}
            />

            {/* Transit Section (路程與交通) */}
            <div className="p-3 rounded-xl bg-accent/30 border border-border/50 space-y-3">
                <label className="block font-bold uppercase flex items-center text-muted-foreground text-xs">
                    <Navigation size={12} className="mr-1 text-primary" /> 前往下一站的交通與車程 (選填)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                            交通工具
                        </span>
                        <select
                            name="transitMode"
                            value={formData.transitMode || "none"}
                            onChange={onFormInputChange as any}
                            className="w-full bg-background border border-input rounded-lg py-1.5 px-2 text-xs text-foreground outline-none cursor-pointer"
                        >
                            {TRANSIT_MODES.map((mode) => (
                                <option key={mode.id} value={mode.id}>
                                    {mode.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                            預估路程時間
                        </span>
                        <input
                            name="transitDuration"
                            value={formData.transitDuration || ""}
                            onChange={onFormInputChange}
                            placeholder="例如：30分鐘"
                            className="w-full bg-background border border-input rounded-lg py-1.5 px-2 text-xs text-foreground outline-none"
                        />
                    </div>
                </div>
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
