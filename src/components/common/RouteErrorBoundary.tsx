import React, { useState } from "react";
import {
    useRouteError,
    isRouteErrorResponse,
    useNavigate,
    useLocation,
} from "react-router-dom";
import {
    AlertTriangle,
    RefreshCw,
    Home,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Compass,
    ShieldAlert,
    Copy,
    Check,
} from "lucide-react";

export const RouteErrorBoundary: React.FC = () => {
    const error = useRouteError();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDetails, setShowDetails] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    let title = "發生未預期的錯誤";
    let message = "系統在處理此頁面時遇到了問題，請嘗試重新整理或返回上一頁。";
    let statusCode: number | string = "Error";
    let errorDetails = "";

    if (isRouteErrorResponse(error)) {
        statusCode = error.status;
        if (error.status === 404) {
            title = "找不到此頁面";
            message = "您所造訪的頁面不存在或已被移除。";
        } else if (error.status === 401) {
            title = "尚未登入或授權已過期";
            message = "請重新登入後再試。";
        } else if (error.status === 503) {
            title = "伺服器暫時無法使用";
            message = "後端服務正在維護或暫時無法連線，請稍後再試。";
        } else {
            title = `連線異常 (${error.status})`;
            message = error.statusText || message;
        }
        errorDetails = typeof error.data === "string" ? error.data : JSON.stringify(error.data, null, 2);
    } else if (error instanceof Error) {
        title = "頁面執行發生錯誤";
        message = error.message || message;
        errorDetails = `${error.name}: ${error.message}\n\nStack:\n${error.stack || "(無堆疊資訊)"}`;
    } else if (typeof error === "string") {
        message = error;
        errorDetails = error;
    } else {
        errorDetails = JSON.stringify(error, null, 2);
    }

    const handleCopyDetails = () => {
        const fullLog = `Path: ${location.pathname}\nStatus: ${statusCode}\nError: ${message}\n\nDetails:\n${errorDetails}`;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(fullLog).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
            <div className="max-w-lg w-full bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                {/* Visual Icon */}
                <div className="relative mx-auto w-20 h-20 rounded-3xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-sm">
                    {statusCode === 404 ? (
                        <Compass size={38} className="animate-pulse" />
                    ) : (
                        <AlertTriangle size={38} />
                    )}
                    <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {statusCode}
                    </div>
                </div>

                {/* Text Description */}
                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold font-[Noto_Sans_TC] text-foreground tracking-tight">
                        {title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                        <RefreshCw size={15} />
                        <span>重新載入</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl hover:bg-secondary/80 transition-colors border border-border/60 cursor-pointer"
                    >
                        <ArrowLeft size={15} />
                        <span>返回上一頁</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/trip")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-background text-muted-foreground hover:text-foreground font-medium text-sm rounded-xl hover:bg-muted transition-colors border border-border/60 cursor-pointer"
                    >
                        <Home size={15} />
                        <span>旅程列表</span>
                    </button>
                </div>

                {/* Collapsible Error Debug Details */}
                {errorDetails && (
                    <div className="pt-2 border-t border-border/50 text-left">
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground py-1 font-medium transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <ShieldAlert size={13} className="text-rose-500" />
                                <span>技術診斷資訊 (除錯用)</span>
                            </span>
                            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showDetails && (
                            <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono bg-muted/40 px-3 py-1.5 rounded-lg">
                                    <span className="truncate">路徑: {location.pathname}</span>
                                    <button
                                        type="button"
                                        onClick={handleCopyDetails}
                                        className="inline-flex items-center gap-1 text-primary hover:underline ml-2 shrink-0 cursor-pointer"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check size={11} className="text-emerald-500" />
                                                <span className="text-emerald-500 font-semibold">已複製</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={11} />
                                                <span>複製錯誤紀錄</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <pre className="p-3 bg-muted/80 text-muted-foreground rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all leading-relaxed border border-border/60">
                                    {errorDetails}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RouteErrorBoundary;
