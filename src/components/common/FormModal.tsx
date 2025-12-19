import { FormEventHandler, JSX, MouseEventHandler, ReactNode } from "react";
import { X } from "lucide-react";
import { TripThemeConf } from "../../models/types/TripTypes";

type FormModalProps = {
    children: ReactNode;
    customAction?: JSX.Element;
    formId: string;
    modalTitle: string;
    modalSaveTitle: string;
    theme: TripThemeConf | null;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onSubmit: FormEventHandler<HTMLFormElement>;
};

const FormModal = ({
    children,
    customAction,
    formId,
    modalTitle,
    modalSaveTitle,
    theme,
    onCloseBtnClick,
    onSubmit,
}: FormModalProps) => {
    return (
        <form id={formId} onSubmit={onSubmit}>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div
                    className={`${theme?.bg} w-full max-w-sm rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom border border-gray-600`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800">
                            {modalTitle}
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
                    <div className="overflow-y-auto no-scrollbar space-y-3 px-6 max-h-[50vh]">
                        {children}
                    </div>
                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCloseBtnClick}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                            title="取消"
                        >
                            取消
                        </button>
                        {customAction}
                        <button
                            type="submit"
                            form={formId}
                            className={`${theme?.accent} px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95 hover:bg-opacity-90`}
                            title="Submit"
                        >
                            {modalSaveTitle}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default FormModal;
