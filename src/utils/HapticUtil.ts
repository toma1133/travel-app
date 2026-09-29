/**
 * Haptic Feedback Utility (触覺震動微回饋庫)
 * 
 * Provides subtle, tactile feedback on supported mobile devices (iOS Safari via WebKit APIs / Android Chrome via navigator.vibrate).
 * Gracefully degrades to a no-op on desktop or unsupported environments.
 */

class HapticFeedbackService {
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('travel_app_haptics_enabled');
        if (stored !== null) {
          this.isEnabled = stored === 'true';
        }
      } catch {
        this.isEnabled = true;
      }
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('travel_app_haptics_enabled', String(enabled));
    } catch {
      // ignore
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Safe execution of vibration pattern
   */
  private vibrate(pattern: number | number[]): boolean {
    if (!this.isEnabled) return false;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    try {
      if (typeof navigator.vibrate === 'function') {
        return navigator.vibrate(pattern);
      }
    } catch {
      // In some browsers, vibrate might throw if called without prior user gesture
    }
    return false;
  }

  /**
   * Subtle tick for tab switches, segmented control clicks, or item drags
   */
  public light(): void {
    this.vibrate(10);
  }

  /**
   * Standard tactile feedback for action button taps
   */
  public medium(): void {
    this.vibrate(22);
  }

  /**
   * Heavy feedback for impactful actions (e.g. delete dialog opened)
   */
  public heavy(): void {
    this.vibrate(45);
  }

  /**
   * Crisp feedback when a swipe threshold is activated
   */
  public selection(): void {
    this.vibrate(12);
  }

  /**
   * Rhythmic double-tick for successful completions (e.g. item bought, expense saved)
   */
  public success(): void {
    this.vibrate([15, 45, 20]);
  }

  /**
   * Alert vibration for cautionary prompts or deletions
   */
  public warning(): void {
    this.vibrate([30, 50, 25]);
  }

  /**
   * Distinct buzz for failures, validation errors, or network drops
   */
  public error(): void {
    this.vibrate([40, 50, 40, 50, 60]);
  }

  /**
   * Tactile click when a swipe reaches trigger threshold
   */
  public swipeThreshold(): void {
    this.vibrate([12, 20]);
  }
}

export const hapticFeedback = new HapticFeedbackService();

export const hapticLight = () => hapticFeedback.light();
export const hapticMedium = () => hapticFeedback.medium();
export const hapticHeavy = () => hapticFeedback.heavy();
export const hapticSelection = () => hapticFeedback.selection();
export const hapticSuccess = () => hapticFeedback.success();
export const hapticWarning = () => hapticFeedback.warning();
export const hapticError = () => hapticFeedback.error();
export const hapticSwipeThreshold = () => hapticFeedback.swipeThreshold();

export default hapticFeedback;
