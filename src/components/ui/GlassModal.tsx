import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnBackdropClick?: boolean;
  className?: string;
}

export interface GlassModalHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
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
  full: 'max-w-[calc(100vw-2rem)] md:max-w-4xl',
};

export const GlassModalRoot: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'lg',
  closeOnBackdropClick = true,
  className = '',
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    // 防止背景滾動穿透
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-md transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`
          relative w-full ${maxWidthMap[maxWidth]}
          liquid-glass-elevated
          rounded-3xl sm:rounded-[2rem]
          shadow-2xl overflow-hidden
          flex flex-col max-h-[90vh]
          animate-glass-modal-in
          z-10
          ${className}
        `}
      >
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
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        px-5 py-4 sm:px-6 sm:py-5
        border-b border-white/20 dark:border-white/10
        flex items-center justify-between gap-4
        bg-white/30 dark:bg-black/20
        ${className}
      `}
    >
      {children ? (
        children
      ) : (
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="
            p-1.5 sm:p-2 rounded-full text-neutral-500 hover:text-neutral-900
            dark:text-neutral-400 dark:hover:text-neutral-100
            bg-white/40 hover:bg-white/70 dark:bg-neutral-800/60 dark:hover:bg-neutral-700/80
            transition-all duration-150 active:scale-95
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
        px-5 py-3.5 sm:px-6 sm:py-4
        border-t border-white/20 dark:border-white/10
        bg-white/30 dark:bg-black/25
        flex items-center justify-end gap-2.5 sm:gap-3
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
