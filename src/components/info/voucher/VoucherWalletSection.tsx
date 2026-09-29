import React, { useState, useMemo } from "react";
import {
    QrCode,
    Plus,
    ChevronUp,
    ChevronDown,
    Sparkles,
    Ticket,
} from "lucide-react";
import {
    VoucherItem,
    VoucherCategory,
    VOUCHER_CATEGORIES,
    VOUCHER_TEMPLATE_PRESETS,
} from "../../../models/types/VoucherTypes";
import { useVouchers } from "../../../hooks/voucher/useVouchers";
import { VoucherCard } from "./VoucherCard";
import { VoucherModal } from "./VoucherModal";
import { VoucherBarcodeViewerModal } from "./VoucherBarcodeViewerModal";
import DeleteModal from "../../common/DeleteModal";

interface VoucherWalletSectionProps {
    tripId: string;
    isEditing?: boolean;
    isPrinting?: boolean;
}

export const VoucherWalletSection: React.FC<VoucherWalletSectionProps> = ({
    tripId,
    isEditing,
    isPrinting,
}) => {
    const {
        vouchers,
        imageUrls,
        addVoucher,
        updateVoucher,
        deleteVoucher,
    } = useVouchers(tripId);

    const [isOpen, setIsOpen] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // 模態視窗狀態
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [voucherToEdit, setVoucherToEdit] = useState<VoucherItem | null>(null);
    const [viewingVoucher, setViewingVoucher] = useState<VoucherItem | null>(null);
    const [voucherToDelete, setVoucherToDelete] = useState<VoucherItem | null>(null);

    // 依分類過濾
    const filteredVouchers = useMemo(() => {
        if (selectedCategory === "all") return vouchers;
        return vouchers.filter((v) => v.category === selectedCategory);
    }, [vouchers, selectedCategory]);

    // 分類統計
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: vouchers.length };
        vouchers.forEach((v) => {
            counts[v.category] = (counts[v.category] || 0) + 1;
        });
        return counts;
    }, [vouchers]);

    // 處理新增或更新儲存
    const handleSaveVoucher = async (
        data: Omit<VoucherItem, "id" | "trip_id" | "created_at" | "updated_at">
    ) => {
        if (voucherToEdit) {
            await updateVoucher({
                ...voucherToEdit,
                ...data,
            });
        } else {
            await addVoucher(data);
        }
    };

    // 快速套用範本並開啟新增彈窗
    const handlePresetQuickAdd = (preset: (typeof VOUCHER_TEMPLATE_PRESETS)[0]) => {
        addVoucher({
            title: preset.title,
            category: preset.category,
            code: preset.placeholderCode,
            qr_content: preset.placeholderQR,
            notes: preset.notes,
        });
    };

    // 處理確認刪除
    const handleConfirmDelete = async () => {
        if (!voucherToDelete) return;
        await deleteVoucher(voucherToDelete.id);
        setVoucherToDelete(null);
    };

    return (
        <div
            className={
                isPrinting
                    ? "bg-transparent mb-8 font-[Noto_Sans_TC]"
                    : "liquid-glass-elevated rounded-3xl p-5 md:p-6 border border-white/40 dark:border-white/10 shadow-lg relative transition-all font-[Noto_Sans_TC]"
            }
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between select-none ${
                    isPrinting
                        ? "mb-6 border-b border-black pb-2"
                        : `${isOpen ? "mb-4" : "mb-0"} cursor-pointer group`
                }`}
                onClick={() => !isPrinting && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2.5">
                    {isPrinting ? (
                        <span className="text-3xl font-black text-gray-400 leading-none mr-2">
                            02
                        </span>
                    ) : (
                        <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <Ticket size={17} />
                        </div>
                    )}
                    <div>
                        <h3
                            className={`font-bold tracking-wider uppercase ${
                                isPrinting
                                    ? "text-xl text-black"
                                    : "text-sm text-foreground flex items-center gap-2"
                            }`}
                        >
                            <span>電子票夾 & 憑證保險箱</span>
                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                VOUCHER WALLET
                            </span>
                            {vouchers.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                    {vouchers.length}
                                </span>
                            )}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isPrinting && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setVoucherToEdit(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer shadow-xs"
                            title="新增票券"
                        >
                            <Plus size={13} />
                            <span>新增票券</span>
                        </button>
                    )}
                    {!isPrinting && (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-transform duration-200"
                        >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {(isOpen || isPrinting) && (
                <div className="space-y-4 pt-1">
                    {/* Category Filter Pills (展示過濾項目) */}
                    {!isPrinting && vouchers.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory("all")}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 active:scale-95 ${
                                    selectedCategory === "all"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "liquid-glass-subtle text-muted-foreground hover:text-foreground border border-border/50"
                                }`}
                            >
                                全部 ({categoryCounts.all || 0})
                            </button>

                            {Object.values(VOUCHER_CATEGORIES).map((cat) => {
                                const count = categoryCounts[cat.id] || 0;
                                if (count === 0 && selectedCategory !== cat.id) return null;

                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
                                            selectedCategory === cat.id
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "liquid-glass-subtle text-muted-foreground hover:text-foreground border border-border/50"
                                        }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                        <span className="font-mono text-[10px] opacity-75">
                                            ({count})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Vouchers Grid */}
                    {filteredVouchers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {filteredVouchers.map((voucher) => (
                                <VoucherCard
                                    key={voucher.id}
                                    voucher={voucher}
                                    imageUrl={voucher.image_id ? imageUrls[voucher.image_id] : undefined}
                                    isEditing={isEditing}
                                    isPrinting={isPrinting}
                                    onView={(v) => setViewingVoucher(v)}
                                    onEdit={(v) => {
                                        setVoucherToEdit(v);
                                        setIsCreateModalOpen(true);
                                    }}
                                    onDelete={(v) => setVoucherToDelete(v)}
                                />
                            ))}
                        </div>
                    ) : vouchers.length === 0 ? (
                        /* Empty State with Quick Preset Suggestions */
                        <div className="p-6 sm:p-8 rounded-3xl liquid-glass-subtle border border-border/60 text-center space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 mx-auto flex items-center justify-center shadow-xs">
                                <QrCode size={26} />
                            </div>

                            <div className="max-w-md mx-auto space-y-1">
                                <h4 className="text-sm sm:text-base font-bold text-foreground">
                                    尚未收納任何電子票券
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    將 Visit Japan Web、機票登機證、Klook 門票或 eSIM 截圖收進票夾，過海關與驗票口一秒展示，無需聯網或在相簿狂翻！
                                </p>
                            </div>

                            {/* Quick Add Presets */}
                            {!isPrinting && (
                                <div className="pt-2">
                                    <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-center gap-1 mb-2.5">
                                        <Sparkles size={12} className="text-amber-500" />
                                        <span>點擊立即建立常見票券範本：</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                                        {VOUCHER_TEMPLATE_PRESETS.slice(0, 4).map((preset, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handlePresetQuickAdd(preset)}
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-pill hover:bg-primary/10 hover:text-primary transition-all border border-border/60 active:scale-95 shadow-2xs"
                                            >
                                                + {preset.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* No items in selected filter */
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            此分類下暫無票券，
                            <button
                                type="button"
                                onClick={() => setSelectedCategory("all")}
                                className="text-primary font-bold hover:underline ml-1"
                            >
                                查看全部票券
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit Modal */}
            {isCreateModalOpen && (
                <VoucherModal
                    isOpen={isCreateModalOpen}
                    tripId={tripId}
                    voucherToEdit={voucherToEdit}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setVoucherToEdit(null);
                    }}
                    onSave={handleSaveVoucher}
                />
            )}

            {/* Scanner-Ready Fullscreen Modal */}
            {viewingVoucher && (
                <VoucherBarcodeViewerModal
                    voucher={viewingVoucher}
                    isOpen={Boolean(viewingVoucher)}
                    onClose={() => setViewingVoucher(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {voucherToDelete && (
                <DeleteModal
                    title="確定要刪除此票券？"
                    description={`您即將從票夾中移除「${voucherToDelete.title}」，若有關聯之本地圖檔亦將一併釋放。`}
                    confirmText="確認刪除"
                    onCloseClick={() => setVoucherToDelete(null)}
                    onConfirmClick={handleConfirmDelete}
                />
            )}
        </div>
    );
};
