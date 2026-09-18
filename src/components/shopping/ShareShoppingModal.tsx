import React, { useState } from "react";
import { X, Share2, Copy, Check, Download, AlertCircle } from "lucide-react";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";
import {
    encodeShoppingListToUrl,
    decodeShoppingListFromUrl,
} from "../../utils/ShoppingShareUtil";

type ShareShoppingModalProps = {
    items: ShoppingItemVM[];
    tripTitle?: string;
    onImportItems: (items: ShoppingItemVM[]) => void;
    onClose: () => void;
};

const ShareShoppingModal = ({
    items,
    tripTitle,
    onImportItems,
    onClose,
}: ShareShoppingModalProps) => {
    const [copied, setCopied] = useState(false);
    const [importInput, setImportInput] = useState("");
    const [importError, setImportError] = useState("");
    const [importSuccess, setImportSuccess] = useState(false);

    // Generate current share URL
    const encodedData = encodeShoppingListToUrl(items);
    const currentUrl = window.location.href.split("#")[0];
    const shareUrl = `${currentUrl}#share=${encodedData}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        setImportError("");
        setImportSuccess(false);

        let dataString = importInput.trim();
        if (dataString.includes("#share=")) {
            dataString = dataString.split("#share=")[1];
        }

        const decoded = decodeShoppingListFromUrl(dataString);
        if (decoded.length === 0) {
            setImportError("無法解析分享清單，請確認連結或代碼是否正確。");
            return;
        }

        onImportItems(decoded);
        setImportSuccess(true);
        setImportInput("");
        setTimeout(() => {
            onClose();
        }, 1200);
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-sans"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground border border-border/80 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                                分享與匯入購物清單
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                純前端 URL 壓縮分享，免登入即可跨裝置同步
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar text-xs">
                    {/* Section 1: Share Link */}
                    <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/70">
                        <div className="font-bold text-foreground flex items-center justify-between">
                            <span>一鍵產生分享連結</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                共 {items.length} 項商品
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            點擊複製後將連結傳送至 LINE 或通訊軟體，旅伴只要點開網址就能即時瀏覽整份伴手禮願望清單，不需要註冊帳號或後端資料庫。
                        </p>
                        <div className="flex gap-2 pt-1">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 px-3 py-2 bg-background border border-input rounded-xl text-foreground font-mono text-[11px] select-all outline-none truncate"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                                    copied
                                        ? "bg-emerald-500 text-white"
                                        : "bg-primary text-primary-foreground hover:opacity-90"
                                }`}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copied ? "已複製" : "複製連結"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Import Link / Code */}
                    <form onSubmit={handleImport} className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/70">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Download size={14} className="text-primary" />
                            <span>匯入朋友分享的清單</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            如果收到朋友傳送的購物清單連結或代碼，貼在下方即可將商品合併至本行程中：
                        </p>
                        <div className="space-y-2 pt-1">
                            <textarea
                                rows={2}
                                placeholder="貼上完整分享連結 (如 https://...#share=...) 或編碼字串"
                                value={importInput}
                                onChange={(e) => setImportInput(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground outline-none font-mono text-[11px]"
                            />
                            {importError && (
                                <div className="text-destructive text-[11px] flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    <span>{importError}</span>
                                </div>
                            )}
                            {importSuccess && (
                                <div className="text-emerald-500 text-[11px] flex items-center gap-1 font-bold">
                                    <Check size={12} />
                                    <span>成功匯入商品！</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={!importInput.trim()}
                                className="w-full py-2 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                匯入並合併至此行程
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/70 bg-muted/10 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareShoppingModal;
