'use client';

import { Button } from '@/components/ui/button';
import { toggleReadyAction } from '@/app/actions/member';
import { Check, Clock, Loader2, Timer, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ReadyButtonProps {
    slug: string; // Need slug for the secure cookie verification
    memberId: string;
    isReady: boolean;
    timerEndTime?: string | null;
    onOptimisticChange?: (optimisticReady: boolean | null) => void;
}

export default function ReadyButton({ slug, memberId, isReady, timerEndTime, onOptimisticChange }: ReadyButtonProps) {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isSoonReady, setIsSoonReady] = useState(false);

    // Manual optimistic state for instantaneous UI updates without startTransition lag
    const [optimisticReady, setOptimisticReady] = useState<boolean | null>(null);
    const [isPending, setIsPending] = useState(false);

    // The currently displayed state is the optimistic state if set, otherwise the server state
    const displayReady = optimisticReady !== null ? optimisticReady : isReady;

    // Clear optimistic state when the server state actually changes
    useEffect(() => {
        setOptimisticReady(null);
        onOptimisticChange?.(null);
    }, [isReady]);

    useEffect(() => {
        if (!timerEndTime || displayReady) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTimeLeft(null);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSoonReady(false);
            return;
        }

        const tick = () => {
            const now = new Date();
            const end = new Date(timerEndTime);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft(null);
                setIsSoonReady(true);
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                setIsSoonReady(false);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [timerEndTime, displayReady]);

    const toggleReady = async () => {
        if (isPending) return; // Prevent spamming clicks

        const nextState = !displayReady;

        // Haptic feedback
        if (typeof window !== 'undefined' && navigator.vibrate) {
            if (nextState) {
                // Confident single vibration when becoming ready
                navigator.vibrate(50);
            } else {
                // Double light vibration when canceling
                navigator.vibrate([30, 50, 30]);
            }
        }

        setOptimisticReady(nextState);
        onOptimisticChange?.(nextState);
        setIsPending(true);

        try {
            const result = await toggleReadyAction(slug, memberId, nextState);
            if (!result.success) {
                console.error("Action failed:", result.error);
                setOptimisticReady(null); // Revert on failure
                onOptimisticChange?.(null);
            }
        } catch (error) {
            console.error('Error updating status context:', error);
            setOptimisticReady(null); // Revert on failure
            onOptimisticChange?.(null);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={toggleReady}
            disabled={isPending}
            aria-label={displayReady ? "Marquer comme pas prêt" : "Marquer comme prêt"}
            aria-pressed={displayReady}
            className={`
                group relative w-full h-16 flex items-center justify-center rounded-xl font-extrabold text-lg tracking-wide transition-all duration-300 active:scale-[0.98] overflow-hidden
                ${displayReady
                    ? 'btn-ready'
                    : isSoonReady || timeLeft
                        ? 'btn-soon-ready'
                        : 'btn-not-ready'
                }
                ${isPending ? 'opacity-90 pointer-events-none' : ''}
            `}
        >

            {displayReady ? (
                <div className="flex items-center gap-2 relative z-10 text-[14px] font-black uppercase tracking-[0.2em]">
                    <Check className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    JE SUIS PRÊT
                </div>
            ) : isSoonReady ? (
                <div className="flex items-center gap-2 relative z-10 animate-pulse text-amber-500 text-[14px] font-black uppercase tracking-[0.2em]">
                    <AlertTriangle className="w-5 h-5" />
                    BIENTÔT PRÊT !
                </div>
            ) : timeLeft ? (
                <div className="flex items-center gap-2 relative z-10 text-[14px] font-black uppercase tracking-[0.2em]">
                    <Timer className="w-5 h-5 animate-pulse text-[var(--v2-primary)]" />
                    <span className="tabular-nums">PRÊT DANS {timeLeft}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 relative z-10 text-[14px] font-black uppercase tracking-[0.2em]">
                    <Clock className="w-5 h-5 text-[var(--v2-primary)]" />
                    PAS PRÊT
                </div>
            )}
        </button>
    );
}
