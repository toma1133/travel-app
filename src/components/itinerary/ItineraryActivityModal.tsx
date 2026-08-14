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
import {
    CATEGORY_DEFINITIONS,
    TRANSIT_MODES,
} from "../../constants/Categories";
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
            }) as unknown as ChangeEvent<HTMLInputElement>;

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
            <div className="p-3.5 rounded-xl bg-accent/30 border border-border/50 space-y-3">
                <label className="block font-bold uppercase flex items-center text-muted-foreground text-xs">
                    <Navigation size={12} className="mr-1 text-primary" />{" "}
                    前往下一站的交通與車程 (選填)
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
                            placeholder="例如：30分鐘, 45分鐘"
                            className="w-full bg-background border border-input rounded-lg py-1.5 px-2 text-xs text-foreground outline-none"
                        />
                    </div>
                </div>

                {/* 動態交通詳細備註 (Transit Details) */}
                {formData.transitMode && formData.transitMode !== "none" && (
                    <div className="pt-2 border-t border-border/40 space-y-2.5">
                        {/* 1. 自駕 / 租車 */}
                        {formData.transitMode === "car" && (
                            <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            租車公司 (選填)
                                        </span>
                                        <input
                                            name="transitDetails.carRentalCompany"
                                            value={
                                                formData.transitDetails
                                                    ?.carRentalCompany || ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：Toyota Rent a Car / Times"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            取車/取件分店 (選填)
                                        </span>
                                        <input
                                            name="transitDetails.carRentalBranch"
                                            value={
                                                formData.transitDetails
                                                    ?.carRentalBranch || ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：那霸機場店 / 札幌站前店"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. 計程車 / 包車 / 接送 */}
                        {formData.transitMode === "taxi" && (
                            <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            預估車資 (選填)
                                        </span>
                                        <input
                                            name="transitDetails.fare"
                                            value={
                                                formData.transitDetails?.fare ||
                                                ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：NT$ 1,200 或 JPY 3,000"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                    <div className="flex items-end pb-1.5">
                                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground select-none">
                                            <input
                                                type="checkbox"
                                                name="transitDetails.isReservationRequired"
                                                checked={
                                                    formData.transitDetails
                                                        ?.isReservationRequired ||
                                                    false
                                                }
                                                onChange={(e) => {
                                                    const event = {
                                                        target: {
                                                            name: "transitDetails.isReservationRequired",
                                                            value: e.target
                                                                .checked,
                                                            type: "checkbox",
                                                            checked:
                                                                e.target
                                                                    .checked,
                                                        },
                                                        currentTarget: {
                                                            name: "transitDetails.isReservationRequired",
                                                            value: e.target
                                                                .checked,
                                                        },
                                                    } as unknown as ChangeEvent<HTMLInputElement>;
                                                    onFormInputChange(event);
                                                }}
                                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                            />
                                            <span>
                                                預約機場接送 / 需事先叫車
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. 電車 / 新幹線 / 公車 / 渡輪 */}
                        {(formData.transitMode === "train" ||
                            formData.transitMode === "bus" ||
                            formData.transitMode === "ferry") && (
                            <div className="space-y-2.5 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            票券 / Pass 種類
                                        </span>
                                        <input
                                            name="transitDetails.passName"
                                            value={
                                                formData.transitDetails
                                                    ?.passName || ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：關西廣域周遊券 5 Days / 船票"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            票價 / 車資
                                        </span>
                                        <input
                                            name="transitDetails.fare"
                                            value={
                                                formData.transitDetails?.fare ||
                                                ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：JPY 420 或 JPY 1,800"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            {formData.transitMode === "ferry"
                                                ? "船公司與航線名稱"
                                                : "鐵路/公車公司與路線"}
                                        </span>
                                        <input
                                            name="transitDetails.companyAndLine"
                                            value={
                                                formData.transitDetails
                                                    ?.companyAndLine || ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder={
                                                formData.transitMode === "ferry"
                                                    ? "例如：南海渡輪 德島航線"
                                                    : "例如：JR神戶京都琵琶湖線"
                                            }
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            {formData.transitMode === "ferry"
                                                ? "碼頭/棧橋"
                                                : "月台資訊"}
                                        </span>
                                        <input
                                            name="transitDetails.platform"
                                            value={
                                                formData.transitDetails
                                                    ?.platform || ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder={
                                                formData.transitMode === "ferry"
                                                    ? "例如：1號碼頭"
                                                    : "例如：5番ホーム / 4番月台"
                                            }
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            開往方向 / 目的地
                                        </span>
                                        <input
                                            name="transitDetails.destination"
                                            value={
                                                formData.transitDetails
                                                    ?.destination || ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：姬路 / 小豆島土庄港"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* 動態班次清單編輯器 (Schedule List Editor) */}
                                <div className="pt-2 border-t border-border/30">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="block text-[11px] font-bold text-foreground">
                                            選搭班次列表 (
                                            {formData.transitDetails
                                                ?.scheduleList?.length || 0}
                                            )
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentList =
                                                    formData.transitDetails
                                                        ?.scheduleList || [];
                                                const newList = [
                                                    ...currentList,
                                                    {
                                                        name: "",
                                                        departureTime: "",
                                                        arrivalTime: "",
                                                        platform: "",
                                                    },
                                                ];
                                                const event = {
                                                    target: {
                                                        name: "transitDetails.scheduleList",
                                                        value: newList,
                                                    },
                                                    currentTarget: {
                                                        name: "transitDetails.scheduleList",
                                                        value: newList,
                                                    },
                                                } as unknown as ChangeEvent<HTMLInputElement>;
                                                onFormInputChange(event);
                                            }}
                                            className="px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                                        >
                                            + 新增班次
                                        </button>
                                    </div>

                                    {/* 班次列表 */}
                                    {Array.isArray(
                                        formData.transitDetails?.scheduleList,
                                    ) &&
                                    formData.transitDetails.scheduleList
                                        .length > 0 ? (
                                        <div className="space-y-2">
                                            {formData.transitDetails.scheduleList.map(
                                                (item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-2 rounded-lg bg-background border border-border/60 space-y-1.5 relative group"
                                                    >
                                                        <div className="grid grid-cols-12 gap-1.5 items-center">
                                                            <div className="col-span-4">
                                                                <input
                                                                    placeholder="車次/班名 (如: Haruka 16号)"
                                                                    value={
                                                                        item.name
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const newList =
                                                                            [
                                                                                ...(formData
                                                                                    .transitDetails
                                                                                    ?.scheduleList ||
                                                                                    []),
                                                                            ];
                                                                        newList[
                                                                            idx
                                                                        ] = {
                                                                            ...newList[
                                                                                idx
                                                                            ],
                                                                            name: e
                                                                                .target
                                                                                .value,
                                                                        };
                                                                        const event =
                                                                            {
                                                                                target: {
                                                                                    name: "transitDetails.scheduleList",
                                                                                    value: newList,
                                                                                },
                                                                                currentTarget:
                                                                                    {
                                                                                        name: "transitDetails.scheduleList",
                                                                                        value: newList,
                                                                                    },
                                                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                                                        onFormInputChange(
                                                                            event,
                                                                        );
                                                                    }}
                                                                    className="w-full bg-transparent border border-input rounded py-1 px-1.5 text-[11px]"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input
                                                                    type="time"
                                                                    placeholder="發車"
                                                                    value={
                                                                        item.departureTime ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const newList =
                                                                            [
                                                                                ...(formData
                                                                                    .transitDetails
                                                                                    ?.scheduleList ||
                                                                                    []),
                                                                            ];
                                                                        newList[
                                                                            idx
                                                                        ] = {
                                                                            ...newList[
                                                                                idx
                                                                            ],
                                                                            departureTime:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        };
                                                                        const event =
                                                                            {
                                                                                target: {
                                                                                    name: "transitDetails.scheduleList",
                                                                                    value: newList,
                                                                                },
                                                                                currentTarget:
                                                                                    {
                                                                                        name: "transitDetails.scheduleList",
                                                                                        value: newList,
                                                                                    },
                                                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                                                        onFormInputChange(
                                                                            event,
                                                                        );
                                                                    }}
                                                                    className="w-full bg-transparent border border-input rounded py-1 px-1 text-[11px] font-mono"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input
                                                                    type="time"
                                                                    placeholder="到達"
                                                                    value={
                                                                        item.arrivalTime ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const newList =
                                                                            [
                                                                                ...(formData
                                                                                    .transitDetails
                                                                                    ?.scheduleList ||
                                                                                    []),
                                                                            ];
                                                                        newList[
                                                                            idx
                                                                        ] = {
                                                                            ...newList[
                                                                                idx
                                                                            ],
                                                                            arrivalTime:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        };
                                                                        const event =
                                                                            {
                                                                                target: {
                                                                                    name: "transitDetails.scheduleList",
                                                                                    value: newList,
                                                                                },
                                                                                currentTarget:
                                                                                    {
                                                                                        name: "transitDetails.scheduleList",
                                                                                        value: newList,
                                                                                    },
                                                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                                                        onFormInputChange(
                                                                            event,
                                                                        );
                                                                    }}
                                                                    className="w-full bg-transparent border border-input rounded py-1 px-1 text-[11px] font-mono"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 flex items-center gap-1">
                                                                <input
                                                                    placeholder="月台"
                                                                    value={
                                                                        item.platform ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const newList =
                                                                            [
                                                                                ...(formData
                                                                                    .transitDetails
                                                                                    ?.scheduleList ||
                                                                                    []),
                                                                            ];
                                                                        newList[
                                                                            idx
                                                                        ] = {
                                                                            ...newList[
                                                                                idx
                                                                            ],
                                                                            platform:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        };
                                                                        const event =
                                                                            {
                                                                                target: {
                                                                                    name: "transitDetails.scheduleList",
                                                                                    value: newList,
                                                                                },
                                                                                currentTarget:
                                                                                    {
                                                                                        name: "transitDetails.scheduleList",
                                                                                        value: newList,
                                                                                    },
                                                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                                                        onFormInputChange(
                                                                            event,
                                                                        );
                                                                    }}
                                                                    className="w-full bg-transparent border border-input rounded py-1 px-1 text-[11px]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newList =
                                                                            (
                                                                                formData
                                                                                    .transitDetails
                                                                                    ?.scheduleList ||
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    _,
                                                                                    i,
                                                                                ) =>
                                                                                    i !==
                                                                                    idx,
                                                                            );
                                                                        const event =
                                                                            {
                                                                                target: {
                                                                                    name: "transitDetails.scheduleList",
                                                                                    value: newList,
                                                                                },
                                                                                currentTarget:
                                                                                    {
                                                                                        name: "transitDetails.scheduleList",
                                                                                        value: newList,
                                                                                    },
                                                                            } as unknown as ChangeEvent<HTMLInputElement>;
                                                                        onFormInputChange(
                                                                            event,
                                                                        );
                                                                    }}
                                                                    className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors shrink-0"
                                                                    title="刪除班次"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground italic">
                                            尚未加入預選班次，點擊「+
                                            新增班次」建立動態時刻清單
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. 飛機 */}
                        {formData.transitMode === "flight" && (
                            <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            航班號碼
                                        </span>
                                        <input
                                            name="transitDetails.flightNumber"
                                            value={
                                                formData.transitDetails
                                                    ?.flightNumber || ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：JX820 / CI156"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-muted-foreground mb-0.5">
                                            航廈 / 登機門
                                        </span>
                                        <input
                                            name="transitDetails.gate"
                                            value={
                                                formData.transitDetails?.gate ||
                                                ""
                                            }
                                            onChange={onFormInputChange}
                                            placeholder="例如：T1 B5登機門"
                                            className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-muted-foreground mb-0.5">
                                        機票/費用/行李等備註
                                    </span>
                                    <input
                                        name="transitDetails.fare"
                                        value={
                                            formData.transitDetails?.fare || ""
                                        }
                                        onChange={onFormInputChange}
                                        placeholder="例如：含20kg託運行李, 請提早2.5小時報到"
                                        className="w-full bg-background border border-input rounded py-1 px-2 text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
