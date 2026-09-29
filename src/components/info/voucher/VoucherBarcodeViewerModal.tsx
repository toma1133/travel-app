import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import {
    X,
    Copy,
    Check,
    SunMedium,
    Maximize2,
    Minimize2,
    Calendar,
    FileText,
    QrCode,
    ImageIcon,
} from "lucide-react";
import { VoucherItem, VOUCHER_CATEGORIES } from "../../../models/types/VoucherTypes";
import { ImageVaultDB } from "../../../services/storage/ImageVaultDB";

interface VoucherBarcodeViewerModalProps {
    voucher: VoucherItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export const VoucherBarcodeViewerModal: React.FC<VoucherBarcodeViewerModalProps> = ({
    voucher,
    isOpen,
    onClose,
}) => {
    const [copied, setCopied] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"qr" | "image">("qr");
    const [isUltraBrightMode, setIsUltraBrightMode] = useState(false);

    // 載入關聯的本地 IndexedDB 圖檔
    useEffect(() => {
        let isMounted = true;
        if (voucher?.image_id) {
            ImageVaultDB.getImageBlobUrl(voucher.image_id).then((url) => {
                if (isMounted) {
                    setImageUrl(url);
                    // 若無 QR 內容但有圖片，預設切換為圖片頁籤
                    if (!voucher.qr_content && url) {
                        setActiveTab("image");
                    }
                }
            });
        } else {
            setImageUrl(null);
            setActiveTab("qr");
        }

        return () => {
            isMounted = false;
        };
    }, [voucher]);

    // 鍵盤 Esc 監聽
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isUltraBrightMode) {
                    setIsUltraBrightMode(false);
                } else {
                    onClose();
                }
            }
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, isUltraBrightMode, onClose]);

    if (!isOpen || !voucher) return null;

    const categoryConfig = VOUCHER_CATEGORIES[voucher.category] || VOUCHER_CATEGORIES.other;

    const handleCopyCode = async () => {
        if (!voucher.code) return;
        try {
            await navigator.clipboard.writeText(voucher.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy code:", err);
        }
    };

    // 雙重模式內容判定
    const hasQr = Boolean(voucher.qr_content);
    const hasImage = Boolean(voucher.image_id && imageUrl);

    const modalContent = (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 transition-colors duration-300 overflow-y-auto ${
                isUltraBrightMode
                    ? "bg-white"
                    : "bg-black/80 backdrop-blur-md"
            }`}
            role="dialog"
            aria-modal="true"
            onClick={isUltraBrightMode ? undefined : onClose}
        >
            {/* Ultra Bright Fullscreen Mode View */}
            {isUltraBrightMode ? (
                <div
                    className="w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 bg-white text-black select-none overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{categoryConfig.icon}</span>
                            <span className="font-bold text-lg text-black">{voucher.title}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsUltraBrightMode(false)}
                            className="p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                        >
                            <Minimize2 size={16} />
                            <span>退出超亮模式</span>
                        </button>
                    </div>

                    {/* Centered High Contrast Code / Image */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-sm sm:max-w-md w-full my-auto">
                        {hasQr && activeTab === "qr" ? (
                            <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-neutral-900 flex flex-col items-center">
                                <QRCodeSVG
                                    value={voucher.qr_content || ""}
                                    size={280}
                                    level="M"
                                    marginSize={2}
                                />
                            </div>
                        ) : imageUrl ? (
                            <div className="max-h-[70vh] flex items-center justify-center">
                                <img
                                    src={imageUrl}
                                    alt={voucher.title}
                                    className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg border border-neutral-300"
                                />
                            </div>
                        ) : (
                            <div className="text-center text-neutral-500">
                                尚未設定條碼內容
                            </div>
                        )}

                        {voucher.code && (
                            <div className="mt-6 text-center">
                                <div className="text-xs text-neutral-500 uppercase tracking-widest font-mono">
                                    憑證代碼 / REFERENCE CODE
                                </div>
                                <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-black mt-1">
                                    {voucher.code}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-neutral-400 font-medium shrink-0 pt-2">
                        全螢幕純白刷碼模式 • 點擊右上角退出
                    </div>
                </div>
            ) : (
                /* Regular Scanner-Ready Card Modal */
                <div
                    className="relative w-full max-w-md liquid-glass-elevated rounded-3xl sm:rounded-[2rem] border border-white/50 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200 bg-card/95"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Fixed Card Header */}
                    <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between gap-3 bg-white/40 dark:bg-black/30 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl sm:text-2xl shrink-0">
                                {categoryConfig.icon}
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryConfig.badgeBg}`}
                                    >
                                        {categoryConfig.label}
                                    </span>
                                    {voucher.valid_date && (
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                            <Calendar size={10} />
                                            {voucher.valid_date}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-base sm:text-lg text-foreground truncate mt-0.5">
                                    {voucher.title}
                                </h3>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label="關閉"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Mode Tabs (when both vector QR and uploaded image exist) */}
                    {hasQr && hasImage && (
                        <div className="flex border-b border-border/50 bg-black/5 dark:bg-white/5 p-1 gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab("qr")}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    activeTab === "qr"
                                        ? "bg-card text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <QrCode size={14} />
                                <span>向量 QR 碼 (免流量)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("image")}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    activeTab === "image"
                                        ? "bg-card text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <ImageIcon size={14} />
                                <span>憑證截圖 (本地保險箱)</span>
                            </button>
                        </div>
                    )}

                    {/* Scrollable Modal Content Body */}
                    <div className="overflow-y-auto flex-1 overscroll-contain">
                        {/* Scanner Presentation Area (High Contrast White Box) */}
                        <div className="p-5 flex flex-col items-center justify-center bg-white text-black min-h-[260px] select-none">
                            {activeTab === "qr" && hasQr ? (
                                <div className="flex flex-col items-center">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-neutral-200">
                                        <QRCodeSVG
                                            value={voucher.qr_content || ""}
                                            size={220}
                                            level="M"
                                            marginSize={2}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-3 font-medium">
                                        <SunMedium size={13} className="text-amber-500" />
                                        <span>建議將螢幕調亮，對準掃描槍或自動閘門</span>
                                    </div>
                                </div>
                            ) : activeTab === "image" && imageUrl ? (
                                <div className="flex flex-col items-center w-full">
                                    <div className="max-h-[300px] w-full flex items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                                        <img
                                            src={imageUrl}
                                            alt={voucher.title}
                                            className="max-h-[280px] max-w-full object-contain rounded-lg shadow-xs"
                                        />
                                    </div>
                                </div>
                            ) : hasQr ? (
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-neutral-200">
                                    <QRCodeSVG
                                        value={voucher.qr_content || ""}
                                        size={220}
                                        level="M"
                                        marginSize={2}
                                    />
                                </div>
                            ) : (
                                <div className="py-10 text-center text-neutral-400">
                                    <QrCode size={36} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">此票券尚未設定 QR 碼或圖檔</p>
                                </div>
                            )}
                        </div>

                        {/* Voucher Details & Quick Copy */}
                        <div className="p-4 sm:p-5 bg-card/90 space-y-3.5">
                            {voucher.code && (
                                <div className="flex items-center justify-between p-3 rounded-2xl liquid-glass-subtle border border-border/60">
                                    <div className="min-w-0 pr-2">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                            憑證代碼 / REFERENCE CODE
                                        </div>
                                        <div className="font-mono text-base sm:text-lg font-black text-foreground tracking-wide truncate">
                                            {voucher.code}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyCode}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs ${
                                            copied
                                                ? "bg-emerald-500 text-white"
                                                : "liquid-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-foreground border border-border/60"
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={13} />
                                                <span>已複製</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={13} />
                                                <span>複製代碼</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {voucher.notes && (
                                <div className="flex items-start gap-2 p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-muted-foreground">
                                    <FileText size={14} className="shrink-0 mt-0.5 text-primary" />
                                    <span className="leading-relaxed">{voucher.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixed Actions Bottom Bar */}
                    <div className="p-3.5 sm:p-4 bg-card/95 backdrop-blur-md border-t border-border/50 flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsUltraBrightMode(true)}
                            className="flex-1 py-2.5 px-3 rounded-2xl liquid-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-foreground text-xs font-bold border border-border/60 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                            <Maximize2 size={14} />
                            <span>全螢幕純白刷碼</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2.5 px-6 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            完成關閉
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return typeof document !== "undefined"
        ? createPortal(modalContent, document.body)
        : modalContent;
};

export default VoucherBarcodeViewerModal;
