import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xs bg-white rounded-2xl shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-700 transition-colors z-10"
                >
                    <X size={20} />
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
