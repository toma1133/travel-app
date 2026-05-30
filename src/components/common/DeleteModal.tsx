import { MouseEventHandler } from "react";
import { AlertTriangle } from "lucide-react";

type DeleteModalProps = {
    deleteKey: string | undefined;
    onCloseClick: MouseEventHandler<HTMLButtonElement>;
    onConfirmClick: MouseEventHandler<HTMLButtonElement>;
};

const DeleteModal = ({
    deleteKey,
    onCloseClick,
    onConfirmClick,
}: DeleteModalProps) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-destructive/10 rounded-full text-destructive">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                        確定要刪除？
                    </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                    您即將刪除{" "}
                    <span className="font-bold text-foreground">{deleteKey}</span>
                    。此動作無法復原。
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCloseClick}
                        className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirmClick}
                        className="px-4 py-2 text-sm font-bold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg shadow-sm transition-colors"
                    >
                        確認刪除
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
