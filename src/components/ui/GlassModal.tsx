import React, { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { hapticFeedback } from '../../utils/HapticUtil';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnBackdropClick?: boolean;
  asBottomSheetOnMobile?: boolean;
  className?: string;
}

export interface GlassModalHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export interface GlassModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface GlassModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full md:max-w-4xl',
};

export const GlassModalRoot: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'lg',
  closeOnBackdropClick = true,
  asBottomSheetOnMobile = true,
  className = '',
}) => {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

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

    // 防止背景滾動穿透
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Touch gesture handlers for mobile pull-down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!asBottomSheetOnMobile) return;
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !asBottomSheetOnMobile) return;
    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only allow downwards dragging
    if (deltaY > 0) {
      const dampedDelta = Math.pow(deltaY, 0.92);
      setTranslateY(dampedDelta);
    } else {
      setTranslateY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !asBottomSheetOnMobile) return;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;
    const dismissThreshold = 80;

    if (deltaY > dismissThreshold) {
      hapticFeedback.light();
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  if (!isOpen) return null;

  const backdropOpacity = Math.max(0.2, 1 - translateY / 320);

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-50 flex overflow-y-auto
        ${
          asBottomSheetOnMobile
            ? 'flex-col justify-end md:justify-center md:items-center p-0 md:p-4'
            : 'items-center justify-center p-3 sm:p-4 sm:p-6'
        }
      `}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-md transition-opacity duration-150"
        style={{ opacity: backdropOpacity }}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog / Bottom Sheet Card */}
      <div
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`
          relative w-full
          ${asBottomSheetOnMobile ? `max-w-full md:${maxWidthMap[maxWidth]}` : maxWidthMap[maxWidth]}
          bg-white/98 dark:bg-neutral-900/98 backdrop-blur-2xl
          border border-black/10 dark:border-white/10
          ${
            asBottomSheetOnMobile
              ? 'rounded-t-[2rem] md:rounded-3xl max-h-[88vh] md:max-h-[90vh] animate-in slide-in-from-bottom-6 md:animate-glass-modal-in duration-300'
              : 'rounded-3xl sm:rounded-[2rem] max-h-[90vh] animate-glass-modal-in'
          }
          shadow-2xl overflow-hidden
          flex flex-col
          z-10
          ${className}
        `}
      >
        {/* iOS Drag Handle on Mobile (when asBottomSheetOnMobile is true) */}
        {asBottomSheetOnMobile && (
          <div
            className="w-full pt-3 pb-1 md:hidden flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 transition-colors" />
          </div>
        )}

        {children}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

const GlassModalHeader: React.FC<GlassModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  leftAction,
  rightAction,
  children,
  className = '',
}) => {
  if (children) {
    return (
      <div
        className={`
          px-4 py-3 sm:px-5 sm:py-3.5
          border-b border-black/[0.08] dark:border-white/[0.08]
          flex items-center justify-between gap-3
          bg-white dark:bg-neutral-900 backdrop-blur-xl shrink-0
          ${className}
        `}
      >
        {children}
      </div>
    );
  }

  // Symmetrical iOS modal header layout when leftAction or rightAction is present
  if (leftAction || rightAction) {
    return (
      <div
        className={`
          px-4 py-3 sm:px-5 sm:py-3.5
          border-b border-black/[0.08] dark:border-white/[0.08]
          flex items-center justify-between gap-2 sm:gap-3
          bg-white dark:bg-neutral-900 backdrop-blur-xl shrink-0 select-none
          ${className}
        `}
      >
        <div className="min-w-[56px] flex items-center justify-start shrink-0">
          {leftAction || (onClose && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                onClose();
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 active:opacity-70 transition-opacity cursor-pointer px-1 py-1"
            >
              取消
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 text-center px-1">
          {title && (
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div className="min-w-[56px] flex items-center justify-end shrink-0">
          {rightAction}
        </div>
      </div>
    );
  }

  // Classic title + close X button layout
  return (
    <div
      className={`
        px-5 py-4 sm:px-6 sm:py-5
        border-b border-black/[0.08] dark:border-white/[0.08]
        flex items-center justify-between gap-4
        bg-white dark:bg-neutral-900 backdrop-blur-xl shrink-0
        ${className}
      `}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={() => {
            hapticFeedback.light();
            onClose();
          }}
          className="
            p-1.5 sm:p-2 rounded-full text-neutral-500 hover:text-neutral-900
            dark:text-neutral-400 dark:hover:text-neutral-100
            bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/60 dark:hover:bg-neutral-700/80
            transition-all duration-150 active:scale-95 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-neutral-400/50
          "
          aria-label="Close modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  );
};

const GlassModalBody: React.FC<GlassModalBodyProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        px-5 py-4 sm:px-6 sm:py-5
        overflow-y-auto flex-1
        text-neutral-800 dark:text-neutral-200
        overscroll-contain
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const GlassModalFooter: React.FC<GlassModalFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        px-5 py-4 sm:px-6 sm:py-4
        border-t border-black/[0.08] dark:border-white/[0.08]
        bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-xl
        flex items-center justify-end gap-2.5 sm:gap-3
        pb-safe
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const GlassModal = Object.assign(GlassModalRoot, {
  Header: GlassModalHeader,
  Body: GlassModalBody,
  Footer: GlassModalFooter,
});

export default GlassModal;
