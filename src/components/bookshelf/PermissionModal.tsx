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
    onFormChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const PermissionModal = ({
    formData,
    profiles,
    theme,
    trip,
    onCloseBtnClick,
    onFormChange,
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
                        .map((profile, i) => (
                            <label
                                key={i}
                                className="flex items-center space-x-2 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    name="tripMember"
                                    value={profile.id}
                                    checked={
                                        formData[profile.id] === undefined
                                            ? false
                                            : formData[profile.id]
                                    }
                                    onChange={onFormChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">
                                    {profile.username}
                                </span>
                            </label>
                        ))}
            </div>
        </FormModal>
    );
};

export default PermissionModal;
