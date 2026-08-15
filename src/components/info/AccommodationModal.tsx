import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { Building2, Calendar, MapPin, Tag } from "lucide-react";
import FormModal from "../common/FormModal";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import PlaceLinkAutocomplete from "../common/PlaceLinkAutoComplete";

type AccommodationModalProps = {
    formData: AccommodationRow;
    mode: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormInputChange: ChangeEventHandler<HTMLInputElement>;
    onFormSubmit: FormEventHandler<HTMLFormElement>;
};

const AccommodationModal = ({
    formData,
    mode,
    theme,
    onCloseBtnClick,
    onFormInputChange,
    onFormSubmit,
}: AccommodationModalProps) => {
    return (
        <FormModal
            formId="accommodation-form"
            modalTitle={mode === "create" ? "新增住宿" : "編輯住宿"}
            modalSaveTitle={mode === "create" ? "新增住宿" : "儲存變更"}
            theme={theme}
            onCancelBtnClick={onCloseBtnClick}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
            maxWidthClass="sm:max-w-lg"
        >
            <div className="space-y-4">
                {/* 🏨 Group 1: 飯店基本資訊 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        飯店與地點
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 住宿名稱 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <Building2 size={13} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                住宿名稱 <span className="text-rose-500">*</span>
                            </span>
                            <input
                                required
                                name="name"
                                value={formData.name || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：京都世紀酒店 / 星野度假村"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 地址 */}
                        <div className="p-3.5 bg-card/80 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                                <MapPin size={13} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-20 shrink-0">
                                飯店地址
                            </span>
                            <input
                                name="address"
                                value={formData.address || ""}
                                onChange={onFormInputChange}
                                placeholder="例如：京都市下京區東鹽小路町 680"
                                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none font-medium"
                            />
                        </div>

                        {/* 連結地點 */}
                        <div className="p-3.5 bg-card/80">
                            <label
                                htmlFor="link_id"
                                className="font-bold uppercase mb-1.5 flex items-center text-muted-foreground text-[11px]"
                            >
                                <Tag size={12} className="mr-1 text-primary" /> 連結地點清單 (可自動帶入導航與營業資訊)
                            </label>
                            <PlaceLinkAutocomplete
                                tripId={formData.trip_id}
                                name="link_id"
                                value={formData.link_id}
                                onChange={onFormInputChange}
                            />
                        </div>
                    </div>
                </div>

                {/* 📅 Group 2: 入住與退房日期 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        入住與退房期程
                    </span>
                    <div className="bg-muted/30 border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
                        {/* 入住日期 */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    入住日期 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                required
                                type="date"
                                name="check_in_date"
                                value={formData.check_in_date || ""}
                                onChange={onFormInputChange}
                                className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>

                        {/* 退房日期 */}
                        <div className="p-3.5 bg-card/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-purple-500 shrink-0" />
                                <span className="text-xs font-bold text-muted-foreground">
                                    退房日期 <span className="text-rose-500">*</span>
                                </span>
                            </div>
                            <input
                                required
                                type="date"
                                name="check_out_date"
                                value={formData.check_out_date || ""}
                                onChange={onFormInputChange}
                                className="bg-muted/40 border border-border/80 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </FormModal>
    );
};

export default AccommodationModal;
