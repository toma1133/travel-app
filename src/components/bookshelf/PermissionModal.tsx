import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import type { ProfileRow } from "../../models/types/ProfileTypes";
import type { TripThemeConf, TripVM } from "../../models/types/TripTypes";
import FormModal from "../common/FormModal";

type PermissionModalProps = {
    formData: { [key: string]: boolean };
    profiles?: ProfileRow[];
    trip?: TripVM;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onSelectBtnClick: (profile: ProfileRow) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const PermissionModal = ({
    formData,
    profiles,
    theme,
    trip,
    onCloseBtnClick,
    onSelectBtnClick,
    onSubmit,
}: PermissionModalProps) => {
    return (
        <FormModal
            formId={"permission-form"}
            modalTitle={"編輯成員"}
            modalSaveTitle={"儲存"}
            theme={theme}
            onCloseBtnClick={onCloseBtnClick}
            onSubmit={onSubmit}
        >
            <div className="space-y-2">
                {Array.isArray(profiles) &&
                    profiles
                        .filter((profile) => profile.id !== trip?.user_id)
                        .map((profile, i) => {
                            const isSelected =
                                formData[profile.id] === undefined
                                    ? false
                                    : formData[profile.id];
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border border-indigo-100 ${
                                        isSelected
                                            ? "bg-indigo-600 text-white shadow-md border-indigo-600"
                                            : "bg-white text-indigo-400"
                                    }`}
                                    onClick={() => onSelectBtnClick(profile)}
                                >
                                    {profile.username}
                                </button>
                            );
                        })}
            </div>
        </FormModal>
    );
};

export default PermissionModal;
