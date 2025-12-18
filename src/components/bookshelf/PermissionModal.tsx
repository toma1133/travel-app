import { ChangeEventHandler, FormEventHandler, MouseEventHandler } from "react";
import { X } from "lucide-react";
import type { ProfileRow } from "../../models/types/ProfileTypes";
import type { TripVM } from "../../models/types/TripTypes";

type PermissionModalProps = {
    formData: { [key: string]: boolean };
    profiles?: ProfileRow[];
    trip?: TripVM;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onFormChange: ChangeEventHandler<HTMLInputElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const PermissionModal = ({
    formData,
    profiles,
    trip,
    onCloseBtnClick,
    onFormChange,
    onSubmit,
}: PermissionModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">
                        編輯成員
                    </h3>
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Body - Scrollable Form */}
                <div className="p-6 overflow-y-auto">
                    <form id="trip-member-form" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            {Array.isArray(profiles) &&
                                profiles
                                    .filter(
                                        (profile) =>
                                            profile.id !== trip?.user_id
                                    )
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
                                                    formData[profile.id] ===
                                                    undefined
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
                    </form>
                </div>
                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCloseBtnClick}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                        title="取消"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        form="trip-member-form"
                        className="px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 bg-[#9F1239] hover:bg-opacity-90"
                        title="Submit"
                    >
                        送出
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;
