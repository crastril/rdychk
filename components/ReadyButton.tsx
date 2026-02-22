'use client';

import { Button } from '@/components/ui/button';
import { toggleReadyAction } from '@/app/actions/member';
import { Check, Clock, Loader2, Timer, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useOptimistic, startTransition } from 'react';

interface ReadyButtonProps {
    slug: string; // Need slug for the secure cookie verification
    memberId: string;
    isReady: boolean;
    timerEndTime?: string | null;
}

export default function ReadyButton({ slug, memberId, isReady, timerEndTime }: ReadyButtonProps) {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isSoonReady, setIsSoonReady] = useState(false);

    const [optimisticIsReady, addOptimisticIsReady] = useOptimistic<boolean, boolean>(
        isReady,
        (state, newState) => newState
    );

    useEffect(() => {
        if (!timerEndTime || optimisticIsReady) {
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
    }, [timerEndTime, optimisticIsReady]);

    const toggleReady = async () => {
        const nextState = !optimisticIsReady;

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

        startTransition(() => {
            addOptimisticIsReady(nextState);
        });

        try {
            const result = await toggleReadyAction(slug, memberId, nextState);
            if (!result.success) {
                console.error("Action failed:", result.error);
                // Optionally revert the optimistic update here if needed
                // startTransition(() => addOptimisticIsReady(!nextState)); 
            }
        } catch (error) {
            console.error('Error updating status context:', error);
        }
    };

    return (
        <button
            onClick={toggleReady}
            aria-label={optimisticIsReady ? "Marquer comme pas prêt" : "Marquer comme prêt"}
            aria-pressed={optimisticIsReady}
            className={`
                group relative w-full h-16 flex items-center justify-center rounded-xl font-extrabold text-lg tracking-wide transition-all duration-300 active:scale-[0.98] overflow-hidden
                ${optimisticIsReady
                    ? 'bg-[var(--v2-secondary)] hover:bg-[#3bf183] text-black shadow-neon-secondary'
                    : isSoonReady || timeLeft
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 shadow-[0_0_15px_-5px_rgba(245,158,11,0.4)]'
                        : 'glass-panel text-slate-400 hover:bg-white/5 hover:text-white'
                }
            `}
        >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors"></div>

            {optimisticIsReady ? (
                <div className="flex items-center gap-2 relative z-10 animate-in slide-in-from-bottom-2 text-[14px] font-black uppercase tracking-[0.2em]">
                    <Check className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    JE SUIS PRÊT
                </div>
            ) : isSoonReady ? (
                <div className="flex items-center gap-2 relative z-10 animate-pulse text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <AlertTriangle className="w-4 h-4" />
                    BIENTÔT PRÊT !
                </div>
            ) : timeLeft ? (
                <div className="flex items-center gap-2 relative z-10 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Timer className="w-4 h-4 animate-pulse text-[var(--v2-primary)]" />
                    <span className="tabular-nums">PRÊT DANS {timeLeft}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 relative z-10 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Clock className="w-4 h-4 text-[var(--v2-primary)]" />
                    PAS PRÊT
                </div>
            )}
        </button>
    );
}
