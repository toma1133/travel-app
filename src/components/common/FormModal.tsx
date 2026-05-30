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
    onCancelBtnClick: MouseEventHandler<HTMLButtonElement>;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onSubmit?: FormEventHandler<HTMLFormElement>;
};

const FormModal = ({
    children,
    customAction,
    formId,
    modalTitle,
    modalSaveTitle,
    theme,
    onCancelBtnClick,
    onCloseBtnClick,
    onSubmit,
}: FormModalProps) => {
    return (
        <form id={formId} onSubmit={onSubmit}>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
                <div
                    className={`bg-card w-full max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom border border-border`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-border/50 p-6">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">
                            {modalTitle}
                        </h3>
                        <button
                            type="button"
                            onClick={onCloseBtnClick}
                            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {/* Body - Scrollable Form */}
                    <div className="overflow-y-auto no-scrollbar space-y-4 p-6 max-h-[75vh]">
                        {children}
                    </div>
                    {/* Footer */}
                    <div className="p-4 px-6 border-t border-border/50 flex justify-end items-center gap-3">
                        <button
                            type="button"
                            onClick={onCancelBtnClick}
                            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                            title="取消"
                        >
                            取消
                        </button>
                        {customAction}
                        <button
                            type="submit"
                            form={formId}
                            className={`bg-primary px-6 py-2 rounded-lg text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95`}
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
