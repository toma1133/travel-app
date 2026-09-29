import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    Copy,
    Check,
    Calendar,
    Edit3,
    Trash2,
    Maximize2,
    FileText,
} from "lucide-react";
import { VoucherItem, VOUCHER_CATEGORIES } from "../../../models/types/VoucherTypes";

interface VoucherCardProps {
    voucher: VoucherItem;
    imageUrl?: string;
    isEditing?: boolean;
    isPrinting?: boolean;
    onView: (voucher: VoucherItem) => void;
    onEdit?: (voucher: VoucherItem) => void;
    onDelete?: (voucher: VoucherItem) => void;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({
    voucher,
    imageUrl,
    isEditing,
    isPrinting,
    onView,
    onEdit,
    onDelete,
}) => {
    const [copied, setCopied] = useState(false);

    const categoryConfig = VOUCHER_CATEGORIES[voucher.category] || VOUCHER_CATEGORIES.other;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!voucher.code) return;
        navigator.clipboard.writeText(voucher.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            onClick={() => !isEditing && onView(voucher)}
            className={`group relative rounded-3xl overflow-hidden transition-all duration-300 ${
                isPrinting
                    ? "bg-white text-black border-2 border-neutral-300 p-4"
                    : "liquid-glass-elevated border border-white/40 dark:border-white/10 hover:border-primary/40 shadow-sm hover:shadow-xl hover:-translate-y-0.5 cursor-pointer bg-card/70"
            }`}
        >
            {/* Top Accent Line */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${categoryConfig.badgeBg}`} />

            <div className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
                {/* Header Row: Category Badge + Valid Date + Edit Actions */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{categoryConfig.icon}</span>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryConfig.badgeBg}`}
                        >
                            {categoryConfig.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {voucher.valid_date && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                <Calendar size={10} />
                                {voucher.valid_date}
                            </span>
                        )}

                        {isEditing && !isPrinting && (
                            <div
                                className="flex items-center gap-1 ml-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => onEdit?.(voucher)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                    title="編輯票券"
                                >
                                    <Edit3 size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete?.(voucher)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                    title="刪除票券"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title & Preview Row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-foreground tracking-tight line-clamp-2 leading-snug">
                            {voucher.title}
                        </h4>

                        {voucher.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1 flex items-center gap-1">
                                <FileText size={10} className="shrink-0 text-muted-foreground/60" />
                                <span>{voucher.notes}</span>
                            </p>
                        )}
                    </div>

                    {/* Mini Visual Preview (QR code or Image thumbnail) */}
                    <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-xs border border-neutral-200 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                        {voucher.qr_content ? (
                            <QRCodeSVG
                                value={voucher.qr_content}
                                size={52}
                                level="L"
                                marginSize={0}
                            />
                        ) : imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={voucher.title}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        ) : (
                            <span className="text-xl opacity-60">🎫</span>
                        )}
                    </div>
                </div>

                {/* Dashed Ticket Divider */}
                <div className="relative my-1">
                    <div className="border-t border-dashed border-border/70 w-full" />
                </div>

                {/* Footer: Code Snippet & Tap-to-Scan indicator */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                    {voucher.code ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] text-muted-foreground uppercase font-mono font-medium shrink-0">
                                CODE
                            </span>
                            <span className="font-mono text-xs font-bold text-foreground truncate px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                                {voucher.code}
                            </span>
                            {!isPrinting && (
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    title="複製代碼"
                                >
                                    {copied ? (
                                        <Check size={12} className="text-emerald-500" />
                                    ) : (
                                        <Copy size={12} />
                                    )}
                                </button>
                            )}
                        </div>
                    ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                            {voucher.qr_content ? "向量 QR 憑證" : "電子憑證"}
                        </span>
                    )}

                    {!isPrinting && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onView(voucher);
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 group-hover:translate-x-0.5 transition-all shrink-0"
                        >
                            <span>出示條碼</span>
                            <Maximize2 size={11} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
