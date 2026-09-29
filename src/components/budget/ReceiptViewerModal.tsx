import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Download, FileText, Loader2 } from "lucide-react";
import { ImageVaultDB } from "../../services/storage/ImageVaultDB";

export interface ReceiptViewerModalProps {
    imageId?: string;
    imageUrl?: string;
    title?: string;
    date?: string;
    amount?: number;
    currency?: string;
    onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
    imageId,
    imageUrl: directUrl,
    title,
    date,
    amount,
    currency,
    onClose,
}) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(directUrl || null);
    const [isLoading, setIsLoading] = useState<boolean>(!directUrl && !!imageId);
    const [scale, setScale] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);

    useEffect(() => {
        let active = true;
        let createdUrl: string | null = null;

        if (imageId && !directUrl) {
            setIsLoading(true);
            ImageVaultDB.getImageBlobUrl(imageId)
                .then((url) => {
                    if (active) {
                        createdUrl = url;
                        setBlobUrl(url);
                        setIsLoading(false);
                    }
                })
                .catch((err) => {
                    console.error("載入收據圖檔失敗:", err);
                    if (active) setIsLoading(false);
                });
        }

        return () => {
            active = false;
            if (createdUrl) {
                URL.revokeObjectURL(createdUrl);
            }
        };
    }, [imageId, directUrl]);

    const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
    const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
    const handleRotate = () => setRotation((r) => (r + 90) % 360);
    const handleReset = () => {
        setScale(1);
        setRotation(0);
    };

    const handleDownload = () => {
        if (!blobUrl) return;
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `receipt_${title || "image"}_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-card text-card-foreground rounded-3xl shadow-2xl border border-border/80 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 頂部標題列 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold truncate text-foreground">
                                {title || "收據影像檢視"}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                                {date && <span>{date}</span>}
                                {amount !== undefined && currency && (
                                    <>
                                        <span>•</span>
                                        <span className="font-bold text-foreground">
                                            {currency} {amount.toLocaleString()}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="縮小"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleZoomIn}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="放大"
                        >
                            <ZoomIn size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleRotate}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="順時針旋轉"
                        >
                            <RotateCw size={16} />
                        </button>
                        {blobUrl && (
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="下載原始照片"
                            >
                                <Download size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
                            title="關閉"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 圖片預覽區 */}
                <div className="flex-1 overflow-auto bg-black/40 flex items-center justify-center p-4 min-h-[350px] relative select-none">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <span className="text-xs">載入收據圖檔中...</span>
                        </div>
                    ) : blobUrl ? (
                        <div
                            className="transition-transform duration-200 flex items-center justify-center"
                            style={{
                                transform: `scale(${scale}) rotate(${rotation}deg)`,
                            }}
                        >
                            <img
                                src={blobUrl}
                                alt={title || "收據照片"}
                                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-xs py-12">
                            查無收據圖檔或圖檔已被清除
                        </div>
                    )}
                </div>

                {/* 底部控制列 */}
                <div className="px-5 py-2.5 bg-muted/20 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono text-[11px]">
                        縮放: {Math.round(scale * 100)}% | 旋轉: {rotation}°
                    </span>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-primary hover:underline font-medium text-[11px]"
                    >
                        重設視圖
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptViewerModal;
