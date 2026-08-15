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
    maxWidthClass?: string;
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
    maxWidthClass = "sm:max-w-xl",
}: FormModalProps) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
                className={`bg-card text-card-foreground w-full ${maxWidthClass} rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border/80 flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 (Mobile drag indicator) */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* 📱 iOS 原生導航頂部列 (iOS Navigation Top Bar) */}
                <div className="px-4 py-3 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onCancelBtnClick || onCloseBtnClick}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1"
                    >
                        取消
                    </button>

                    <h3 className="text-sm font-black tracking-tight text-foreground truncate max-w-[60%] text-center">
                        {modalTitle}
                    </h3>

                    <div className="flex items-center gap-2">
                        {customAction}
                        <button
                            type="submit"
                            form={formId}
                            className="text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                            {modalSaveTitle}
                        </button>
                    </div>
                </div>

                {/* 主表單區域 (Scrollable Form Content) */}
                <form
                    id={formId}
                    onSubmit={onSubmit}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar"
                >
                    {children}
                </form>
            </div>
        </div>
    );
};

export default FormModal;
