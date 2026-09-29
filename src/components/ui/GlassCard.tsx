import React, { forwardRef } from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'subtle' | 'standard' | 'elevated';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  children?: React.ReactNode;
}

const variantStyles = {
  subtle: 'liquid-glass-subtle',
  standard: 'liquid-glass',
  elevated: 'liquid-glass-elevated',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const roundedStyles = {
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
  '3xl': 'rounded-[2rem]',
  full: 'rounded-full',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'standard',
      interactive = false,
      padding = 'md',
      rounded = '2xl',
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          relative overflow-hidden
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${roundedStyles[rounded]}
          ${interactive ? 'liquid-glass-interactive cursor-pointer hover:border-white/80 dark:hover:border-white/20' : ''}
          ${className}
        `}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
