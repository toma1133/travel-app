import { X } from "lucide-react";
import { JSX, MouseEventHandler } from "react";

type PreviewPlaceModalProps = {
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    children: JSX.Element;
};

const PreviewPlaceModal = ({
    onCloseBtnClick,
    children,
}: PreviewPlaceModalProps) => {
    return (
        <div className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="w-full max-w-xs bg-white rounded-2xl shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onCloseBtnClick}
                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-700 transition-colors z-10"
                    title="Close"
                >
                    <X size={20} />
                </button>
                {children}
            </div>
        </div>
    );
};

export default PreviewPlaceModal;
