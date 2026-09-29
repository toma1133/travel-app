import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { hapticFeedback } from '../../utils/HapticUtil';

export interface OfflineStatusBadgeProps {
  isOffline: boolean;
  className?: string;
  onRefreshStatus?: () => void;
}

export const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({
  isOffline,
  className = '',
  onRefreshStatus,
}) => {
  const [showRestored, setShowRestored] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [prevOffline, setPrevOffline] = useState(isOffline);

  useEffect(() => {
    if (prevOffline && !isOffline) {
      // Transition from offline to online
      setShowRestored(true);
      hapticFeedback.success();
      const timer = window.setTimeout(() => {
        setShowRestored(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
    setPrevOffline(isOffline);
  }, [isOffline, prevOffline]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    hapticFeedback.light();

    try {
      if (onRefreshStatus) {
        onRefreshStatus();
      }
      // Quick fetch ping check
      await fetch(window.location.origin + '/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      // If success, user is online
    } catch {
      // offline
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  if (!isOffline && !showRestored) {
    return null;
  }

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 w-[calc(100%-2rem)] max-w-md ${className}`}
    >
      {isOffline ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/15 dark:bg-amber-400/10 border border-amber-500/35 text-amber-900 dark:text-amber-100 backdrop-blur-xl shadow-xl shadow-amber-500/5 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse">
              <WifiOff size={15} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 font-bold tracking-tight">
                <span>離線瀏覽模式 (Offline)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                  IndexedDB
                </span>
              </div>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 truncate">
                票夾、離線手冊與記帳均可流暢查閱
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isChecking}
            className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 transition-colors shrink-0 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
            title="重新檢查網路連線"
          >
            <RefreshCw
              size={13}
              className={`shrink-0 ${isChecking ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 dark:bg-emerald-400/10 border border-emerald-500/35 text-emerald-900 dark:text-emerald-100 backdrop-blur-xl shadow-xl shadow-emerald-500/5 text-xs font-semibold">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Wifi size={15} />
          </div>
          <span className="truncate">網路已恢復連線 · 資料即時雙向同步中</span>
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
        </div>
      )}
    </div>
  );
};

export default OfflineStatusBadge;
