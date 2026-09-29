import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  destructive?: boolean;
}

const variantStyles = {
  primary: `
    bg-gradient-to-r from-sky-500 to-indigo-600
    hover:from-sky-400 hover:to-indigo-500
    text-white shadow-md shadow-sky-500/25
    border border-white/25
  `,
  secondary: `
    liquid-glass-subtle
    text-neutral-800 dark:text-neutral-100
    hover:bg-white/70 dark:hover:bg-white/15
    border border-white/50 dark:border-white/10
    shadow-sm
  `,
  ghost: `
    bg-transparent
    text-neutral-700 dark:text-neutral-300
    hover:bg-black/5 dark:hover:bg-white/10
    border border-transparent
  `,
  danger: `
    bg-gradient-to-r from-rose-500 to-red-600
    hover:from-rose-400 hover:to-red-500
    text-white shadow-md shadow-rose-500/25
    border border-white/20
  `,
  destructive: `
    bg-gradient-to-r from-rose-500 to-red-600
    hover:from-rose-400 hover:to-red-500
    text-white shadow-md shadow-rose-500/25
    border border-white/20
  `,
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-2xl gap-2',
  lg: 'px-6 py-2.5 text-base font-semibold rounded-2xl gap-2.5',
  icon: 'p-2 rounded-2xl justify-center',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const resolvedVariant = (variant as string) === 'destructive' ? 'danger' : variant;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center whitespace-nowrap
          transition-all duration-200 ease-out
          active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-sky-500/40
          disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
          cursor-pointer
          ${variantStyles[resolvedVariant as keyof typeof variantStyles] || variantStyles.secondary}
          ${sizeStyles[size]}
          ${className}
        `}
        {...rest}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
        )}

        {children && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>}

        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
