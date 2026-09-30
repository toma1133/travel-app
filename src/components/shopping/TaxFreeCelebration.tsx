import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { Sparkles, X, CheckCircle2, MessageSquare } from "lucide-react";
import { getCurrencySymbol } from "../../utils/CurrencyUtil";

export interface TaxFreeCelebrationProps {
    /** Currently evaluated store stats */
    allStores: Array<{
        name: string;
        amount: number;
        threshold: number;
    }>;
    currency?: string;
    onOpenClerkPhrases?: () => void;
}

export interface CelebrationInfo {
    storeName: string;
    amount: number;
    threshold: number;
}

const fireConfettiCannon = () => {
    // Left cannon
    confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#fbbf24", "#f43f5e", "#10b981", "#3b82f6", "#a855f7"],
    });
    // Right cannon
    confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#fbbf24", "#f43f5e", "#10b981", "#3b82f6", "#a855f7"],
    });
};

const TaxFreeCelebration: React.FC<TaxFreeCelebrationProps> = ({
    allStores,
    currency = "JPY",
    onOpenClerkPhrases,
}) => {
    const [celebrationInfo, setCelebrationInfo] = useState<CelebrationInfo | null>(null);

    // Keep track of which stores were already qualified in previous render
    const qualifiedStoresRef = useRef<Set<string>>(new Set());
    const isFirstMountRef = useRef<boolean>(true);

    const triggerCelebration = (info: CelebrationInfo) => {
        setCelebrationInfo(info);

        // Haptic feedback for mobile devices
        if (typeof window !== "undefined" && "vibrate" in navigator) {
            try {
                navigator.vibrate([100, 50, 100, 50, 200]);
            } catch {}
        }

        // Fireworks Confetti burst
        fireConfettiCannon();
        setTimeout(fireConfettiCannon, 300);

        // Auto dismiss after 6 seconds
        const timer = setTimeout(() => {
            setCelebrationInfo(null);
        }, 6000);

        return () => clearTimeout(timer);
    };

    useEffect(() => {
        const currentlyQualified = new Set<string>();

        allStores.forEach((store) => {
            if (store.threshold > 0 && store.amount >= store.threshold) {
                currentlyQualified.add(store.name);
            }
        });

        // Skip celebration on the very first mount so loading existing qualified items doesn't spam
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            qualifiedStoresRef.current = currentlyQualified;
            return;
        }

        // Find any store that newly crossed the threshold
        for (const store of allStores) {
            if (
                store.threshold > 0 &&
                store.amount >= store.threshold &&
                !qualifiedStoresRef.current.has(store.name)
            ) {
                // Newly achieved tax-free!
                triggerCelebration({
                    storeName: store.name,
                    amount: store.amount,
                    threshold: store.threshold,
                });
                break;
            }
        }

        qualifiedStoresRef.current = currentlyQualified;
    }, [allStores]);

    if (!celebrationInfo) return null;

    const currencySym = getCurrencySymbol(currency);

    return (
        <div className="fixed top-18 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="pointer-events-auto max-w-md w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 p-0.5 rounded-3xl shadow-2xl shadow-amber-500/25">
                <div className="bg-neutral-950/95 text-white rounded-[22px] p-4 backdrop-blur-xl relative overflow-hidden space-y-3">
                    {/* Breathing Golden Aura Glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

                    <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center text-xl font-black shadow-lg shrink-0 animate-bounce">
                                🎉
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                                    <Sparkles size={13} />
                                    <span>免稅門檻達成！(Tax-Free Unlocked)</span>
                                </div>
                                <h4 className="text-base font-black text-white leading-snug">
                                    【{celebrationInfo.storeName}】已滿免稅額度！
                                </h4>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setCelebrationInfo(null)}
                            className="p-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Progress Info */}
                    <div className="flex items-center justify-between text-xs bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                        <span className="text-white/80 font-medium">累計採購額</span>
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                            <span className="text-emerald-400">
                                {currencySym}
                                {celebrationInfo.amount.toLocaleString()}
                            </span>
                            <span className="text-white/40">/</span>
                            <span className="text-white/60">
                                門檻 {currencySym}
                                {celebrationInfo.threshold.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                        {onOpenClerkPhrases && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCelebrationInfo(null);
                                    onOpenClerkPhrases();
                                }}
                                className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                            >
                                <MessageSquare size={14} />
                                <span>開免稅對話小卡給店員看</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setCelebrationInfo(null)}
                            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                            知道了
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxFreeCelebration;
