import React, { useRef, useEffect, useState } from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface GlassSegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'p-1 rounded-xl gap-1 text-xs',
    button: 'px-2.5 py-1 rounded-lg gap-1.5',
  },
  md: {
    container: 'p-1.5 rounded-2xl gap-1.5 text-sm',
    button: 'px-3.5 py-1.5 rounded-xl gap-2',
  },
  lg: {
    container: 'p-2 rounded-2xl gap-2 text-base',
    button: 'px-5 py-2 rounded-xl gap-2.5',
  },
};

export function GlassSegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: GlassSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = options.findIndex((opt) => opt.value === value);
    if (activeIndex === -1) return;

    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-segment-item]');
    const activeButton = buttons[activeIndex];

    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
      setIsReady(true);
    }
  }, [value, options, size]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    }

    if (nextIndex !== -1 && !options[nextIndex].disabled) {
      e.preventDefault();
      onChange(options[nextIndex].value);
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button[data-segment-item]');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={`
        relative inline-flex items-center
        liquid-glass-subtle
        border border-white/50 dark:border-white/10
        shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]
        ${fullWidth ? 'w-full' : ''}
        ${sizeConfig[size].container}
        ${className}
      `}
    >
      {/* Sliding Active Indicator */}
      {isReady && indicatorStyle.width > 0 && (
        <div
          className="
            absolute top-1 bottom-1
            bg-white dark:bg-neutral-800/90
            shadow-sm
            border border-black/5 dark:border-white/15
            transition-all duration-250 ease-out
            pointer-events-none
          "
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            borderRadius: size === 'sm' ? '0.5rem' : '0.75rem',
          }}
        />
      )}

      {options.map((option, index) => {
        const isSelected = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            data-segment-item
            role="radio"
            aria-checked={isSelected}
            disabled={option.disabled}
            onClick={() => !option.disabled && onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative z-10 flex items-center justify-center font-medium
              transition-colors duration-150
              cursor-pointer select-none
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50
              ${fullWidth ? 'flex-1' : ''}
              ${sizeConfig[size].button}
              ${
                isSelected
                  ? 'text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }
            `}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
