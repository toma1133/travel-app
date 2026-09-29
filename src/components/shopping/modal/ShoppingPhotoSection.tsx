import React from "react";
import { Image as ImageIcon, AlertCircle } from "lucide-react";

export interface ShoppingPhotoSectionProps {
    imageUrl: string;
    imgPreviewFailed: boolean;
    onImageUrlChange: (url: string) => void;
    onImageError: () => void;
}

export const ShoppingPhotoSection: React.FC<ShoppingPhotoSectionProps> = ({
    imageUrl,
    imgPreviewFailed,
    onImageUrlChange,
    onImageError,
}) => {
    return (
        <div className="space-y-2">
            <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-primary" />
                    <span>商品圖片網址 (Image URL)</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-normal">
                    貼上直接載入預覽
                </span>
            </label>
            <div className="flex gap-2">
                <input
                    type="url"
                    placeholder="貼上網路圖片網址 (https://...)"
                    value={imageUrl}
                    onChange={(e) => onImageUrlChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/70 dark:bg-neutral-900/60 border border-white/30 dark:border-white/15 rounded-xl text-neutral-900 dark:text-neutral-100 outline-none text-xs focus:ring-2 focus:ring-primary/40"
                />
                {imageUrl && (
                    <button
                        type="button"
                        onClick={() => onImageUrlChange("")}
                        className="px-2.5 py-2 rounded-xl border border-white/30 dark:border-white/15 bg-white/50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs transition-colors cursor-pointer"
                    >
                        清除
                    </button>
                )}
            </div>

            {imageUrl && (
                <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/25 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center backdrop-blur-sm">
                    {!imgPreviewFailed ? (
                        <img
                            src={imageUrl}
                            alt="即時預覽"
                            className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-105"
                            onError={onImageError}
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 text-amber-500 text-xs p-3 text-center">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>圖片網址無效或無法存取，將自動以毛玻璃漸層替代</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
