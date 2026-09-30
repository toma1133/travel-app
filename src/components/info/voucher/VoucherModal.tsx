import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    QrCode,
    UploadCloud,
    Trash2,
    Calendar,
    FileText,
    Sparkles,
    CheckCircle2,
    Info,
} from "lucide-react";
import { GlassModal } from "../../ui/GlassModal";
import {
    VoucherItem,
    VoucherCategory,
    VOUCHER_CATEGORIES,
    VOUCHER_TEMPLATE_PRESETS,
} from "../../../models/types/VoucherTypes";
import { compressImage, formatBytes } from "../../../utils/ImageCompressor";
import { ImageVaultDB } from "../../../services/storage/ImageVaultDB";

interface VoucherModalProps {
    isOpen: boolean;
    tripId: string;
    voucherToEdit?: VoucherItem | null;
    onClose: () => void;
    onSave: (
        data: Omit<VoucherItem, "id" | "trip_id" | "created_at" | "updated_at">
    ) => Promise<void>;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
    isOpen,
    tripId,
    voucherToEdit,
    onClose,
    onSave,
}) => {
    const isEditMode = Boolean(voucherToEdit);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<VoucherCategory>("immigration");
    const [code, setCode] = useState("");
    const [qrContent, setQrContent] = useState("");
    const [validDate, setValidDate] = useState("");
    const [notes, setNotes] = useState("");

    // 圖片管理狀態
    const [imageId, setImageId] = useState<string | undefined>(undefined);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 初始化表單
    useEffect(() => {
        if (voucherToEdit) {
            setTitle(voucherToEdit.title || "");
            setCategory(voucherToEdit.category || "immigration");
            setCode(voucherToEdit.code || "");
            setQrContent(voucherToEdit.qr_content || "");
            setValidDate(voucherToEdit.valid_date || "");
            setNotes(voucherToEdit.notes || "");
            setImageId(voucherToEdit.image_id);

            if (voucherToEdit.image_id) {
                ImageVaultDB.getImageBlobUrl(voucherToEdit.image_id).then((url) => {
                    setImagePreviewUrl(url);
                });
            } else {
                setImagePreviewUrl(null);
            }
        } else {
            // 新增模式重置
            setTitle("");
            setCategory("immigration");
            setCode("");
            setQrContent("");
            setValidDate("");
            setNotes("");
            setImageId(undefined);
            setImagePreviewUrl(null);
            setCompressionInfo(null);
        }
    }, [voucherToEdit, isOpen]);

    // 套用快捷範本
    const applyPreset = (preset: (typeof VOUCHER_TEMPLATE_PRESETS)[0]) => {
        setTitle(preset.title);
        setCategory(preset.category);
        if (preset.placeholderCode) setCode(preset.placeholderCode);
        if (preset.placeholderQR) setQrContent(preset.placeholderQR);
        if (preset.notes) setNotes(preset.notes);
    };

    // 處理圖片上傳與 Phase 1 智慧壓縮
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            // 透過 Phase 1 壓縮引擎縮小至 1024px, 75% WebP (~80-120KB)
            const result = await compressImage(file, {
                maxDimension: 1024,
                quality: 0.75,
                preferredMimeType: "image/webp",
            });

            // 儲存至 IndexedDB
            const newImageId = crypto.randomUUID();
            await ImageVaultDB.saveImage({
                id: newImageId,
                trip_id: tripId,
                type: "voucher",
                name: file.name,
                blob: result.blob,
                mime_type: result.mimeType,
                size_bytes: result.compressedSizeBytes,
            });

            setImageId(newImageId);
            const preview = URL.createObjectURL(result.blob);
            setImagePreviewUrl(preview);

            // 顯示節省空間成就
            const savedPercent = Math.round((1 - result.compressionRatio) * 100);
            setCompressionInfo(
                `已壓縮至 ${formatBytes(result.compressedSizeBytes)}（省下 ${savedPercent}% 空間）`
            );
        } catch (err) {
            console.error("Image compression/save error:", err);
            alert("圖片壓縮失敗，請重新嘗試");
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // 移除當前圖片
    const handleRemoveImage = async () => {
        if (imageId) {
            try {
                await ImageVaultDB.deleteImage(imageId);
            } catch (err) {
                console.error("Failed to delete image:", err);
            }
        }
        setImageId(undefined);
        setImagePreviewUrl(null);
        setCompressionInfo(null);
    };

    // 提交儲存
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("請填寫票券名稱");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                title: title.trim(),
                category,
                code: code.trim() || undefined,
                qr_content: qrContent.trim() || undefined,
                image_id: imageId,
                valid_date: validDate || undefined,
                notes: notes.trim() || undefined,
            });
            onClose();
        } catch (err) {
            console.error("Save voucher failed:", err);
            alert("儲存失敗，請檢查資料後重試");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="lg"
            className="bg-card/95 md:!max-w-[540px]"
        >
            <GlassModal.Header
                title={
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="text-base shrink-0">🎟️</span>
                        <span className="truncate">{isEditMode ? "編輯電子票券" : "新增電子票券"}</span>
                    </div>
                }
                onClose={onClose}
                rightAction={
                    <button
                        type="submit"
                        form="voucher-form"
                        disabled={isSubmitting || isCompressing}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                        {isSubmitting ? "儲存中..." : "完成"}
                    </button>
                }
            />

            <form id="voucher-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <GlassModal.Body className="space-y-5">
                    {/* Quick Template Presets (新增模式展示) */}
                    {!isEditMode && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                <Sparkles size={12} className="text-amber-500" />
                                <span>出國常用票券快速帶入</span>
                            </label>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {VOUCHER_TEMPLATE_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className="shrink-0 px-2.5 py-1 rounded-xl text-xs font-medium liquid-glass-subtle hover:bg-primary/10 hover:text-primary transition-all border border-border/60 active:scale-95"
                                    >
                                        {preset.title.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category Selection Pills */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">
                            票券分類 <span className="text-destructive">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.values(VOUCHER_CATEGORIES).map((cat) => {
                                const isSelected = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                                            isSelected
                                                ? "bg-primary/10 border-primary text-primary shadow-xs"
                                                : "liquid-glass-subtle border-border/50 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span className="text-base">{cat.icon}</span>
                                        <span className="truncate">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">
                            票券名稱 <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="例如：Visit Japan Web 入境審查、HARUKA 特急車票..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full liquid-glass-subtle rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none border border-border/60 focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Dual Mode: Vector QR (0 KB) + Image Upload (IndexedDB) */}
                    <div className="p-4 rounded-2xl liquid-glass-subtle border border-border/60 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <QrCode size={14} className="text-primary" />
                                <span>條碼與憑證內容（雙重模式）</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                離線可用 • 0 雲端空間
                            </span>
                        </div>

                        {/* Mode A: Vector QR Code Input */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                                <span>向量 QR 內容 (URL 網址或文字，0 KB 輕量渲染)</span>
                                {qrContent && (
                                    <span className="text-[10px] text-primary font-mono">
                                        即時預覽中
                                    </span>
                                )}
                            </label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    placeholder="貼上網址或文字（例如 Visit Japan Web 連結）..."
                                    value={qrContent}
                                    onChange={(e) => setQrContent(e.target.value)}
                                    className="flex-1 liquid-glass-subtle rounded-xl px-3 py-2 text-xs text-foreground outline-none border border-border/60 focus:border-primary font-mono"
                                />
                                {qrContent ? (
                                    <div className="shrink-0 p-1 bg-white rounded-xl shadow-xs border border-neutral-300">
                                        <QRCodeSVG value={qrContent} size={42} level="L" />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Mode B: Screenshot Upload with Phase 1 Compressor */}
                        <div className="space-y-2 pt-2 border-t border-border/40">
                            <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                                <span>憑證圖檔 / 官方截圖（自動壓縮存入 IndexedDB）</span>
                                {compressionInfo && (
                                    <span className="text-[10px] text-emerald-500 font-mono">
                                        {compressionInfo}
                                    </span>
                                )}
                            </label>

                            {imagePreviewUrl ? (
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/40 dark:bg-black/20 border border-border/50">
                                    <img
                                        src={imagePreviewUrl}
                                        alt="Preview"
                                        className="w-14 h-14 object-cover rounded-lg shadow-xs border border-border/60"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">
                                            已存入本地圖片保險箱
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            離線無網路時亦可流暢檢視
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title="移除圖片"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        id="voucher-file-input"
                                    />
                                    <label
                                        htmlFor="voucher-file-input"
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/80 hover:border-primary/60 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors ${
                                            isCompressing ? "opacity-50 pointer-events-none" : ""
                                        }`}
                                    >
                                        <UploadCloud size={16} className="text-primary" />
                                        <span>
                                            {isCompressing
                                                ? "圖片壓縮中..."
                                                : "選擇手機照片 / 截圖 (自動微型化至 ~90KB)"}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reference Code & Valid Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">
                                憑證代碼 / 訂位代號 (選填)
                            </label>
                            <input
                                type="text"
                                placeholder="例如：BR198、KLK-994821"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full liquid-glass-subtle rounded-xl px-3.5 py-2 text-xs text-foreground outline-none border border-border/60 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                <Calendar size={12} />
                                <span>有效日期 / 使用期限 (選填)</span>
                            </label>
                            <input
                                type="date"
                                value={validDate}
                                onChange={(e) => setValidDate(e.target.value)}
                                className="w-full liquid-glass-subtle rounded-xl px-3.5 py-2 text-xs text-foreground outline-none border border-border/60"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <FileText size={12} />
                            <span>備註說明 (選填)</span>
                        </label>
                        <textarea
                            rows={2}
                            placeholder="例如：需至第2航廈綠色窗口出示護照兌換、同行 2 人使用..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full liquid-glass-subtle rounded-xl px-3.5 py-2 text-xs text-foreground outline-none border border-border/60 resize-none"
                        />
                    </div>

                    {/* Helpful reminder */}
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[11px] leading-relaxed">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <span>
                            票券資料與截圖皆保存在本地裝置，出國無訊號或飛航模式下也能一秒打開全螢幕掃碼。
                        </span>
                    </div>
                </GlassModal.Body>
            </form>
        </GlassModal>
    );
};
