import { MouseEventHandler } from "react";
import { Trash2 } from "lucide-react";

type DeleteModalProps = {
    deleteKey?: string;
    title?: string;
    description?: string;
    confirmText?: string;
    onCloseClick: MouseEventHandler<HTMLButtonElement>;
    onConfirmClick: MouseEventHandler<HTMLButtonElement>;
};

const DeleteModal = ({
    deleteKey,
    title = "確定要刪除？",
    description,
    confirmText = "確認刪除",
    onCloseClick,
    onConfirmClick,
}: DeleteModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card/95 backdrop-blur-xl text-card-foreground rounded-3xl shadow-2xl border border-border/80 w-full max-w-xs sm:max-w-sm p-6 text-center animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 🗑️ Apple HIG Alert Icon */}
                <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3.5 shadow-2xs border border-rose-500/20">
                    <Trash2 size={22} />
                </div>

                <h3 className="text-base font-black text-foreground tracking-tight mb-1.5">
                    {title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
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

                {/* 📱 iOS 對話框按鈕列 */}
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={onCloseClick}
                        className="py-2 px-3 text-xs font-bold text-foreground bg-muted/60 hover:bg-muted rounded-full transition-all cursor-pointer active:scale-95 border border-border/60"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmClick}
                        className="py-2 px-3 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-full shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
