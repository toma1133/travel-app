import React, { MouseEventHandler } from "react";
import { Trash2 } from "lucide-react";
import { GlassModal } from "../ui/GlassModal";
import { GlassButton } from "../ui/GlassButton";

export type DeleteModalProps = {
    deleteKey?: string;
    title?: string;
    description?: string;
    confirmText?: string;
    onCloseClick: MouseEventHandler<HTMLButtonElement>;
    onConfirmClick: MouseEventHandler<HTMLButtonElement>;
};

const DeleteModal: React.FC<DeleteModalProps> = ({
    deleteKey,
    title = "確定要刪除？",
    description,
    confirmText = "確認刪除",
    onCloseClick,
    onConfirmClick,
}) => {
    const handleClose = () => {
        const fakeEvent = {
            stopPropagation: () => {},
            preventDefault: () => {},
        } as unknown as React.MouseEvent<HTMLButtonElement>;
        onCloseClick(fakeEvent);
    };

    return (
        <GlassModal
            isOpen={true}
            onClose={handleClose}
            maxWidth="sm"
            className="p-6 pt-7 pb-7 md:p-7 md:pb-8 text-center overflow-hidden !bg-white dark:!bg-neutral-900 border border-slate-200/90 dark:border-neutral-700/80 shadow-2xl md:!max-w-[340px] mx-auto"
        >
            {/* 🗑️ Liquid Glass Alert Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-500/25">
                <Trash2 size={24} className="animate-pulse" />
            </div>

            <h3 className="text-lg font-black text-neutral-950 dark:text-white tracking-tight mb-2">
                {title}
            </h3>

            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6 px-1">
                {description ? (
                    description
                ) : (
                    <>
                        您即將刪除{" "}
                        <span className="font-bold text-neutral-950 dark:text-white bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-neutral-700 inline-block my-0.5">{deleteKey}</span>
                        。此動作將無法復原。
                    </>
                )}
            </p>

            {/* 按鈕列 */}
            <div className="grid grid-cols-2 gap-3 pt-1">
                <GlassButton
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onCloseClick}
                    className="w-full font-bold !bg-slate-100 hover:!bg-slate-200/90 dark:!bg-neutral-800 dark:hover:!bg-neutral-700 text-slate-800 dark:text-neutral-100 border border-slate-300/80 dark:border-neutral-700 shadow-2xs cursor-pointer"
                >
                    取消
                </GlassButton>
                <GlassButton
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={onConfirmClick}
                    icon={<Trash2 size={15} />}
                    className="w-full font-bold shadow-sm cursor-pointer"
                >
                    {confirmText}
                </GlassButton>
            </div>
        </GlassModal>
    );
};

export default DeleteModal;
