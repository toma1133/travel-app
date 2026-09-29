import React, { useRef, useState, useCallback } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { hapticFeedback } from '../../utils/HapticUtil';

export interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  rightLabel?: string;
  rightIcon?: React.ReactNode;
  onSwipeLeft?: () => void;
  leftLabel?: string;
  leftIcon?: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onSwipeRight,
  rightLabel = '完成 / 已購',
  rightIcon = <Check className="w-5 h-5 text-white stroke-[2.5]" />,
  onSwipeLeft,
  leftLabel = '刪除',
  leftIcon = <Trash2 className="w-5 h-5 text-white" />,
  threshold = 76,
  disabled = false,
  className = '',
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [direction, setDirection] = useState<'right' | 'left' | null>(null);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isScrollLockedRef = useRef(false);
  const hasTriggeredThresholdHapticRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    isScrollLockedRef.current = false;
    hasTriggeredThresholdHapticRef.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;
    const touch = e.touches[0];
    currentXRef.current = touch.clientX;

    const deltaX = currentXRef.current - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    // Detect if user is scrolling vertically
    if (!isScrollLockedRef.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        // Vertical scroll dominant, abort horizontal swipe
        setIsSwiping(false);
        setTranslateX(0);
        return;
      }
      if (Math.abs(deltaX) > 10) {
        isScrollLockedRef.current = true;
      }
    }

    if (!isScrollLockedRef.current) return;

    // Constrain swipe based on enabled actions
    if (deltaX > 0 && !onSwipeRight) {
      setTranslateX(0);
      return;
    }
    if (deltaX < 0 && !onSwipeLeft) {
      setTranslateX(0);
      return;
    }

    // Apply soft damping
    const dampedDelta =
      Math.sign(deltaX) * Math.min(130, Math.pow(Math.abs(deltaX), 0.88) * 2.2);
    setTranslateX(dampedDelta);
    setDirection(deltaX > 0 ? 'right' : 'left');

    // Threshold haptic trigger
    const absDamped = Math.abs(dampedDelta);
    if (absDamped >= threshold && !hasTriggeredThresholdHapticRef.current) {
      hapticFeedback.selection();
      hasTriggeredThresholdHapticRef.current = true;
    } else if (absDamped < threshold && hasTriggeredThresholdHapticRef.current) {
      hasTriggeredThresholdHapticRef.current = false;
    }
  };

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping || disabled) return;
    setIsSwiping(false);
    isScrollLockedRef.current = false;

    const absTranslate = Math.abs(translateX);

    if (absTranslate >= threshold) {
      if (translateX > 0 && onSwipeRight) {
        hapticFeedback.success();
        onSwipeRight();
      } else if (translateX < 0 && onSwipeLeft) {
        hapticFeedback.warning();
        onSwipeLeft();
      }
    }

    // Spring back
    setTranslateX(0);
    setDirection(null);
    hasTriggeredThresholdHapticRef.current = false;
  }, [isSwiping, disabled, translateX, threshold, onSwipeRight, onSwipeLeft]);

  const progress = Math.min(1, Math.abs(translateX) / threshold);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl select-none touch-pan-y ${className}`}
    >
      {/* Background action reveal (Right swipe: Emerald / Complete) */}
      {onSwipeRight && direction === 'right' && translateX > 0 && (
        <div
          className="absolute inset-0 bg-emerald-600 dark:bg-emerald-500 rounded-3xl flex items-center justify-start pl-6 gap-2.5 text-white transition-opacity"
          style={{ opacity: Math.max(0.4, progress) }}
        >
          <div
            className="flex items-center justify-center p-2 rounded-2xl bg-white/20 backdrop-blur-xs transition-transform"
            style={{
              transform: `scale(${0.75 + progress * 0.45})`,
            }}
          >
            {rightIcon}
          </div>
          <span
            className="text-xs font-bold tracking-wider uppercase transition-opacity"
            style={{ opacity: progress }}
          >
            {rightLabel}
          </span>
        </div>
      )}

      {/* Background action reveal (Left swipe: Rose / Delete) */}
      {onSwipeLeft && direction === 'left' && translateX < 0 && (
        <div
          className="absolute inset-0 bg-rose-600 dark:bg-rose-500 rounded-3xl flex items-center justify-end pr-6 gap-2.5 text-white transition-opacity"
          style={{ opacity: Math.max(0.4, progress) }}
        >
          <span
            className="text-xs font-bold tracking-wider uppercase transition-opacity"
            style={{ opacity: progress }}
          >
            {leftLabel}
          </span>
          <div
            className="flex items-center justify-center p-2 rounded-2xl bg-white/20 backdrop-blur-xs transition-transform"
            style={{
              transform: `scale(${0.75 + progress * 0.45})`,
            }}
          >
            {leftIcon}
          </div>
        </div>
      )}

      {/* Foreground Content Card */}
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableRow;
