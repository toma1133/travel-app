import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { X } from "lucide-react";
import type { AccommodationRow } from "../../models/types/AccommodationTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

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
            formId={"accommodation-form"}
            modalTitle={mode === "create" ? `新增住宿` : "編輯住宿"}
            modalSaveTitle={mode === "create" ? "新增住宿" : "儲存變更"}
            theme={theme}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onFormSubmit}
        >
            {/* Hotel name */}
            <div>
                <label
                    htmlFor="name"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    住宿名稱
                </label>
                <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={onFormInputChange}
                    placeholder="XXX飯店"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
            {/* Checkin and Checkout date */}
            <div>
                <label
                    htmlFor="check_in_date"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    入住日期
                </label>
                <input
                    required
                    type="date"
                    name="check_in_date"
                    value={formData.check_in_date || ""}
                    placeholder="2025/12/12"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            <div>
                <label
                    htmlFor="check_out_date"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    退房日期
                </label>
                <input
                    required
                    type="date"
                    name="check_out_date"
                    value={formData.check_out_date || ""}
                    placeholder="2025/12/12"
                    onChange={onFormInputChange}
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-mono text-base"
                />
            </div>
            {/* Address */}
            <div>
                <label
                    htmlFor="address"
                    className="block font-bold uppercase mb-1 flex items-center text-gray-500 text-xs"
                >
                    地址
                </label>
                <input
                    name="address"
                    value={formData.address || ""}
                    onChange={onFormInputChange}
                    placeholder="XXX市XXX區"
                    className="w-full bg-transparent border-b border-gray-300 py-2 outline-none font-[Noto_Sans_TC] text-base"
                />
            </div>
        </FormModal>
    );
};

export default AccommodationModal;
