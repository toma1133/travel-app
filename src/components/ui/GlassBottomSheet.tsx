import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { hapticFeedback } from '../../utils/HapticUtil';

export interface GlassBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  maxWidth?: string;
  showDragHandle?: boolean;
  closeOnBackdropClick?: boolean;
  enableSwipeDownToDismiss?: boolean;
  className?: string;
}

export const GlassBottomSheet: React.FC<GlassBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = 'max-h-[88vh]',
  maxWidth = 'max-w-xl',
  showDragHandle = true,
  closeOnBackdropClick = true,
  enableSwipeDownToDismiss = true,
  className = '',
}) => {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      setTranslateY(0);
      setIsDragging(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Touch gesture handlers for swipe-down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeDownToDismiss) return;
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !enableSwipeDownToDismiss) return;
    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only allow pulling downwards
    if (deltaY > 0) {
      // Add resistance to dragging
      const dampedDelta = Math.pow(deltaY, 0.92);
      setTranslateY(dampedDelta);
    } else {
      setTranslateY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !enableSwipeDownToDismiss) return;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;
    const dismissThreshold = 80; // px threshold to dismiss

    if (deltaY > dismissThreshold) {
      hapticFeedback.light();
      onClose();
    } else {
      // Animate back to 0
      setTranslateY(0);
    }
  };

  if (!isOpen) return null;

  // Calculate backdrop opacity based on drag distance
  const backdropOpacity = Math.max(0.15, 1 - translateY / 300);

  const sheetContent = (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-md transition-opacity duration-200"
        style={{ opacity: backdropOpacity }}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`
          relative w-full ${maxWidth} ${maxHeight}
          liquid-glass-elevated
          rounded-t-[2rem] md:rounded-[2rem]
          shadow-2xl overflow-hidden
          flex flex-col
          z-10
          animate-in slide-in-from-bottom-8 duration-300
          ${className}
        `}
      >
        {/* Drag Handle Area (touchable to dismiss) */}
        {showDragHandle && (
          <div
            className="w-full pt-3 pb-1.5 flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500 transition-colors" />
          </div>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div
            className="px-5 py-3 md:px-6 md:py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between gap-4 bg-white/30 dark:bg-black/20 touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 bg-white/40 hover:bg-white/70 dark:bg-neutral-800/60 dark:hover:bg-neutral-700/80 transition-all duration-150 active:scale-95 cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5 text-neutral-800 dark:text-neutral-200 overscroll-contain">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-5 py-3 md:px-6 md:py-4 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/25 flex items-center justify-end gap-2.5 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(sheetContent, document.body)
    : sheetContent;
};

export default GlassBottomSheet;
