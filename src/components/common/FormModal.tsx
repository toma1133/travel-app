import { FormEventHandler, JSX, MouseEventHandler, ReactNode, useState, useRef } from "react";
import { TripThemeConf } from "../../models/types/TripTypes";
import { hapticFeedback } from "../../utils/HapticUtil";

type FormModalProps = {
    children: ReactNode;
    customAction?: JSX.Element;
    formId: string;
    modalTitle: string;
    modalSaveTitle: string;
    theme: TripThemeConf | null;
    onCancelBtnClick: MouseEventHandler<HTMLButtonElement>;
    onCloseBtnClick: MouseEventHandler<HTMLButtonElement>;
    onSubmit?: FormEventHandler<HTMLFormElement>;
    maxWidthClass?: string;
};

const FormModal = ({
    children,
    customAction,
    formId,
    modalTitle,
    modalSaveTitle,
    theme,
    onCancelBtnClick,
    onCloseBtnClick,
    onSubmit,
    maxWidthClass = "sm:max-w-xl",
}: FormModalProps) => {
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef(0);
    const currentYRef = useRef(0);

    const handleDismiss = () => {
        hapticFeedback.light();
        const fakeEvent = {
            stopPropagation: () => {},
            preventDefault: () => {},
        } as unknown as React.MouseEvent<HTMLButtonElement>;
        if (onCloseBtnClick) {
            onCloseBtnClick(fakeEvent);
        } else if (onCancelBtnClick) {
            onCancelBtnClick(fakeEvent);
        }
    };

    // Touch gesture handlers for mobile pull-down to dismiss
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        startYRef.current = touch.clientY;
        currentYRef.current = touch.clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        currentYRef.current = touch.clientY;
        const deltaY = currentYRef.current - startYRef.current;

        if (deltaY > 0) {
            const dampedDelta = Math.pow(deltaY, 0.92);
            setTranslateY(dampedDelta);
        } else {
            setTranslateY(0);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const deltaY = currentYRef.current - startYRef.current;
        const dismissThreshold = 80;

        if (deltaY > dismissThreshold) {
            handleDismiss();
        } else {
            setTranslateY(0);
        }
    };

    const backdropOpacity = Math.max(0.2, 1 - translateY / 320);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            style={{ opacity: backdropOpacity }}
            onClick={handleDismiss}
        >
            <div
                style={{
                    transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className={`bg-card text-card-foreground w-full max-w-full ${maxWidthClass} rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border/80 flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 📱 頂部行動把手 (Mobile drag indicator) */}
                <div
                    className="w-full pt-3 pb-1 sm:hidden flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-10 h-1.5 rounded-full bg-muted-foreground/35 hover:bg-muted-foreground/50 transition-colors" />
                </div>

                {/* 📱 iOS 原生導航頂部列 (iOS Navigation Top Bar) */}
                <div
                    className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between shrink-0 touch-none select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <button
                        type="button"
                        onClick={onCancelBtnClick || onCloseBtnClick}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 active:opacity-70 transition-opacity cursor-pointer px-1 py-1 shrink-0"
                    >
                        取消
                    </button>

                    <h3 className="text-sm font-black tracking-tight text-foreground truncate max-w-[60%] text-center">
                        {modalTitle}
                    </h3>

                    <div className="flex items-center gap-2">
                        {customAction}
                        <button
                            type="submit"
                            form={formId}
                            onClick={() => hapticFeedback.success()}
                            className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                            {modalSaveTitle}
                        </button>
                    </div>
                </div>

                {/* 主表單區域 (Scrollable Form Content) */}
                <form
                    id={formId}
                    onSubmit={onSubmit}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 pb-8 sm:pb-10 space-y-4 no-scrollbar"
                >
                    {children}
                    {/* 底部保留舒適空白緩衝區 (確保表單最後一項不貼底，支援 Safe Area) */}
                    <div className="h-6 sm:h-8 shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-hidden="true" />
                </form>
            </div>
        </div>
    );
};

export default FormModal;
