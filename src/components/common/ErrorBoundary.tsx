import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-3 m-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">
                            此區塊載入時發生錯誤
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {this.state.error?.message || "未預期的錯誤"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border text-xs font-medium rounded-lg hover:bg-muted transition-colors"
                    >
                        <RefreshCw size={12} /> 重試此區塊
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
