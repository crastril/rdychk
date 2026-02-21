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
        <Button
            onClick={toggleReady}
            variant={optimisticIsReady ? "default" : "outline"}
            size="lg"
            className={`
                w-full h-24 text-xl font-bold tracking-wide transition-all duration-500
                ${optimisticIsReady
                    ? 'bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] scale-[1.02] border-primary'
                    : isSoonReady || timeLeft
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/50 text-amber-500'
                        : 'bg-background hover:bg-accent hover:text-accent-foreground border-2'
                }
            `}
            aria-label={optimisticIsReady ? "Marquer comme pas prêt" : "Marquer comme prêt"}
            aria-pressed={optimisticIsReady}
        >
            {optimisticIsReady ? (
                <div className="flex items-center gap-3 animate-slide-up">
                    <div className="p-1 rounded-full bg-primary-foreground/20">
                        <Check className="w-6 h-6" />
                    </div>
                    JE SUIS PRÊT !
                </div>
            ) : isSoonReady ? (
                <div className="flex items-center gap-3 text-amber-500 animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                    <span>BIENTÔT PRÊT - CLIQUEZ POUR VALIDER</span>
                </div>
            ) : timeLeft ? (
                <div className="flex items-center gap-3 text-amber-500">
                    <Timer className="w-6 h-6 animate-pulse" />
                    <span className="tabular-nums">PRÊT DANS {timeLeft}</span>
                </div>
            ) : (
                <div className="flex items-center gap-3 text-muted-foreground group">
                    <Clock className="w-6 h-6 group-hover:text-foreground transition-colors" />
                    <span>PAS PRÊT</span>
                </div>
            )}
        </Button >
    );
}
