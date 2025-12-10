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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                        確定要刪除？
                    </h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                    您即將刪除{" "}
                    <span className="font-bold text-gray-800">{deleteKey}</span>
                    。此動作無法復原。
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCloseClick}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirmClick}
                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                    >
                        確認刪除
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
