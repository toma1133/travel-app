import React, { forwardRef } from 'react';

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName = '',
      className = '',
      disabled,
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? `glass-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`
              w-full text-base sm:text-sm
              bg-white/65 dark:bg-neutral-900/65
              backdrop-blur-md -webkit-backdrop-blur-md
              text-neutral-900 dark:text-neutral-100
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
              border rounded-2xl
              shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]
              transition-all duration-200
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : 'pl-3.5'}
              ${rightIcon ? 'pr-10' : 'pr-3.5'}
              py-2 sm:py-2.5
              ${
                error
                  ? 'border-rose-400/80 dark:border-rose-500/80 focus:ring-rose-500/30 focus:border-rose-500'
                  : 'border-white/70 dark:border-white/10 hover:border-white/90 dark:hover:border-white/20 focus:border-sky-500/70 focus:ring-sky-500/30'
              }
              ${className}
            `}
            {...rest}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export interface GlassTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  (
    {
      label,
      error,
      hint,
      containerClassName = '',
      className = '',
      disabled,
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? `glass-textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}

        <textarea
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={`
            w-full text-base sm:text-sm
            bg-white/65 dark:bg-neutral-900/65
            backdrop-blur-md -webkit-backdrop-blur-md
            text-neutral-900 dark:text-neutral-100
            placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            border rounded-2xl
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]
            transition-all duration-200
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            px-3.5 py-2.5 min-h-[90px]
            ${
              error
                ? 'border-rose-400/80 dark:border-rose-500/80 focus:ring-rose-500/30 focus:border-rose-500'
                : 'border-white/70 dark:border-white/10 hover:border-white/90 dark:hover:border-white/20 focus:border-sky-500/70 focus:ring-sky-500/30'
            }
            ${className}
          `}
          {...rest}
        />

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';

export interface GlassSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  (
    {
      label,
      error,
      hint,
      containerClassName = '',
      className = '',
      disabled,
      id,
      children,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? `glass-select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}

        <div className="relative w-full">
          <select
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`
              w-full text-base sm:text-sm appearance-none
              bg-white/65 dark:bg-neutral-900/65
              backdrop-blur-md -webkit-backdrop-blur-md
              text-neutral-900 dark:text-neutral-100
              border rounded-2xl
              shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]
              transition-all duration-200
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              pl-3.5 pr-10 py-2 sm:py-2.5 cursor-pointer
              ${
                error
                  ? 'border-rose-400/80 dark:border-rose-500/80 focus:ring-rose-500/30 focus:border-rose-500'
                  : 'border-white/70 dark:border-white/10 hover:border-white/90 dark:hover:border-white/20 focus:border-sky-500/70 focus:ring-sky-500/30'
              }
              ${className}
            `}
            {...rest}
          >
            {children}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-neutral-500">
            <svg
              className="w-4 h-4 fill-none stroke-current stroke-2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';
