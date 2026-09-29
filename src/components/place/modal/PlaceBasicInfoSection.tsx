import React, { ChangeEventHandler } from "react";
import {
    Phone,
    Globe,
    ImageIcon,
    Lightbulb,
    FileText,
    Tag,
    X,
    Plus,
    Copy,
    Check,
} from "lucide-react";
import type { PlaceVM } from "../../../models/types/PlaceTypes";

export interface PlaceBasicInfoSectionProps {
    formData: PlaceVM;
    mode: string;
    onFormInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    currentTags: string[];
    tagInput: string;
    onTagInputChange: (val: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
    copiedId: boolean;
    onCopyId: () => void;
}

export const PlaceBasicInfoSection: React.FC<PlaceBasicInfoSectionProps> = ({
    formData,
    mode,
    onFormInputChange,
    currentTags,
    tagInput,
    onTagInputChange,
    onAddTag,
    onRemoveTag,
    copiedId,
    onCopyId,
}) => {
    return (
        <div className="space-y-4">
            {/* 聯絡與社群連結 (CONTACT & WEB) */}
            <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    聯絡與網站 (CONTACT & WEB)
                </span>
                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                    {/* 聯絡電話 */}
                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                            <Phone size={13} className="text-emerald-500" />
                            <span>聯絡電話</span>
                        </span>
                        <input
                            type="text"
                            name="info.phone"
                            value={formData.info?.phone || ""}
                            onChange={onFormInputChange}
                            placeholder="例: +81 75-551-1171"
                            className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                        />
                    </div>

                    {/* 官方網站 / 社群 */}
                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                        <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                            <Globe size={13} className="text-purple-500" />
                            <span>官方網站</span>
                        </span>
                        <input
                            type="text"
                            name="info.website_url"
                            value={formData.info?.website_url || ""}
                            onChange={onFormInputChange}
                            placeholder="https://... 官網或 Instagram 連結"
                            className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                        />
                    </div>
                </div>
            </div>

            {/* 封面照片、備忘與標籤 (PHOTO & NOTES) */}
            <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    封面照片與筆記 (PHOTO & NOTES)
                </span>
                <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 text-xs shadow-2xs">
                    {/* 封面照片網址 + 即時預覽 */}
                    <div className="p-3 sm:p-3.5 space-y-2 bg-card">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground w-24 sm:w-28 shrink-0 font-medium flex items-center gap-1">
                                <ImageIcon size={13} className="text-blue-500" />
                                <span>封面照片</span>
                            </span>
                            <input
                                type="text"
                                name="image_url"
                                value={formData.image_url || ""}
                                onChange={onFormInputChange}
                                placeholder="https://... 照片網址"
                                className="min-w-0 flex-1 text-left font-mono font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                            />
                        </div>
                        {formData.image_url && (
                            <div className="relative aspect-square max-h-64 sm:max-h-72 w-full max-w-xs mx-auto rounded-2xl overflow-hidden border border-border/60 bg-muted/20 group shadow-2xs flex items-center justify-center">
                                <img
                                    src={formData.image_url}
                                    alt={formData.name || "預覽"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                    }}
                                />
                                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white font-bold tracking-wide shadow-xs">
                                    即時預覽 (1:1)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 旅遊備忘 / Tips 便箋 */}
                    <div className="p-3 sm:p-3.5 space-y-1.5 bg-card">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                            <Lightbulb size={13} className="text-amber-500" />
                            <span>旅遊備忘 / 注意事項 (Tips)</span>
                        </span>
                        <textarea
                            name="tips"
                            value={formData.tips || ""}
                            onChange={onFormInputChange}
                            placeholder="例：建議早上 08:30 前抵達避開人潮，門票僅收現金 600 JPY，可自備水壺裝音羽之水。"
                            className="w-full bg-muted/20 border border-border/60 rounded-xl p-2.5 text-xs text-foreground outline-none focus:border-blue-500 min-h-[60px] resize-y placeholder:text-muted-foreground/40 leading-relaxed"
                        />
                    </div>

                    {/* 景點簡介說明 */}
                    <div className="p-3 sm:p-3.5 space-y-1.5 bg-card">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                            <FileText size={13} className="text-indigo-500" />
                            <span>景點詳細簡介 (Description)</span>
                        </span>
                        <textarea
                            name="description"
                            value={formData.description || ""}
                            onChange={onFormInputChange}
                            placeholder="可記錄歷史背景、特色看點或網友推薦精華..."
                            className="w-full bg-muted/20 border border-border/60 rounded-xl p-2.5 text-xs text-foreground outline-none focus:border-blue-500 min-h-[60px] resize-y placeholder:text-muted-foreground/40 leading-relaxed"
                        />
                    </div>

                    {/* 自訂標籤管理 */}
                    <div className="p-3 sm:p-3.5 space-y-2 bg-card">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                            <Tag size={13} className="text-emerald-500" />
                            <span>自訂標籤 (Tags)</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {currentTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20 text-xs shadow-2xs"
                                >
                                    <span>#{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveTag(tag)}
                                        className="hover:text-rose-500 transition-colors cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <div className="inline-flex items-center gap-1 bg-muted/30 border border-border/60 rounded-xl px-2.5 py-1 text-xs">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => onTagInputChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            onAddTag();
                                        }
                                    }}
                                    placeholder="輸入標籤按 Enter"
                                    className="bg-transparent outline-none text-xs w-28 text-foreground placeholder:text-muted-foreground/40"
                                />
                                <button
                                    type="button"
                                    onClick={onAddTag}
                                    className="text-blue-500 hover:text-blue-600 cursor-pointer font-bold"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 地點 ID 複製 (編輯模式) */}
                    {mode === "edit" && formData.id && (
                        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-muted/5">
                            <span className="text-muted-foreground text-[11px] font-medium font-mono">
                                ID: {formData.id}
                            </span>
                            <button
                                type="button"
                                onClick={onCopyId}
                                className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-semibold cursor-pointer"
                            >
                                {copiedId ? (
                                    <>
                                        <Check size={12} className="text-emerald-500" />
                                        <span>已複製</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={12} />
                                        <span>複製 ID</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
