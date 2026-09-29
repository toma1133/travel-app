import React from 'react';

export type GlassBadgeColor =
  | 'slate'
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'indigo'
  | 'primary';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: GlassBadgeColor;
  size?: 'sm' | 'md';
  variant?: 'subtle' | 'solid' | 'outline';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const colorStyles: Record<
  GlassBadgeColor,
  { subtle: string; solid: string; outline: string }
> = {
  slate: {
    subtle: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    solid: 'bg-slate-600 text-white border-transparent',
    outline: 'border-slate-400/40 text-slate-700 dark:text-slate-300 bg-transparent',
  },
  emerald: {
    subtle: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    solid: 'bg-emerald-600 text-white border-transparent',
    outline: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-transparent',
  },
  sky: {
    subtle: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25',
    solid: 'bg-sky-600 text-white border-transparent',
    outline: 'border-sky-500/40 text-sky-600 dark:text-sky-400 bg-transparent',
  },
  amber: {
    subtle: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    solid: 'bg-amber-500 text-white border-transparent',
    outline: 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-transparent',
  },
  rose: {
    subtle: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25',
    solid: 'bg-rose-600 text-white border-transparent',
    outline: 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-transparent',
  },
  purple: {
    subtle: 'bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/25',
    solid: 'bg-purple-600 text-white border-transparent',
    outline: 'border-purple-500/40 text-purple-600 dark:text-purple-400 bg-transparent',
  },
  indigo: {
    subtle: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    solid: 'bg-indigo-600 text-white border-transparent',
    outline: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-transparent',
  },
  primary: {
    subtle: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    solid: 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-transparent',
    outline: 'border-sky-500/40 text-sky-600 dark:text-sky-400 bg-transparent',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[11px] font-medium gap-1 rounded-full',
  md: 'px-2.5 py-1 text-xs font-medium gap-1.5 rounded-full',
};

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  color = 'slate',
  size = 'md',
  variant = 'subtle',
  icon,
  children,
  className = '',
  ...rest
}) => {
  const chosenStyle = colorStyles[color]?.[variant] || colorStyles.slate[variant];

  return (
    <span
      className={`
        inline-flex items-center justify-center
        backdrop-blur-md -webkit-backdrop-blur-md
        border transition-all duration-150
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]
        dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
        ${chosenStyle}
        ${sizeStyles[size]}
        ${className}
      `}
      {...rest}
    >
      {icon && <span className="shrink-0 leading-none">{icon}</span>}
      <span className="leading-none">{children}</span>
    </span>
  );
};
