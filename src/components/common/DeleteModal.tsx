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
            className="p-6 text-center overflow-hidden bg-card/95 border border-white/20 dark:border-white/10 shadow-2xl"
        >
            {/* 🗑️ Liquid Glass Alert Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-500/25">
                <Trash2 size={24} className="animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">
                {title}
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 px-1">
                {description ? (
                    description
                ) : (
                    <>
                        您即將刪除{" "}
                        <span className="font-bold text-foreground">{deleteKey}</span>
                        。此動作將無法復原。
                    </>
                )}
            </p>

            {/* 按鈕列 */}
            <div className="grid grid-cols-2 gap-3">
                <GlassButton
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onCloseClick}
                    className="w-full font-bold"
                >
                    取消
                </GlassButton>
                <GlassButton
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={onConfirmClick}
                    icon={<Trash2 size={15} />}
                    className="w-full font-bold"
                >
                    {confirmText}
                </GlassButton>
            </div>
        </GlassModal>
    );
};

export default DeleteModal;
