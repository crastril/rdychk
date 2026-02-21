'use client';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Check, Clock, Loader2, Timer, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ReadyButtonProps {
    memberId: string;
    isReady: boolean;
    timerEndTime?: string | null;
}

export default function ReadyButton({ memberId, isReady, timerEndTime }: ReadyButtonProps) {
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isSoonReady, setIsSoonReady] = useState(false);

    useEffect(() => {
        if (!timerEndTime || isReady) {
            setTimeLeft(null);
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
    }, [timerEndTime, isReady]);

    const toggleReady = async () => {
        // Haptic feedback
        if (typeof window !== 'undefined' && navigator.vibrate) {
            if (!isReady) {
                // Confident single vibration when becoming ready
                navigator.vibrate(50);
            } else {
                // Double light vibration when canceling
                navigator.vibrate([30, 50, 30]);
            }
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('members')
                .update({
                    is_ready: !isReady,
                    updated_at: new Date().toISOString(),
                    timer_end_time: null // Clear timer when manually toggling
                })
                .eq('id', memberId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={toggleReady}
            disabled={loading}
            variant={isReady ? "default" : "outline"}
            size="lg"
            className={`
                w-full h-24 text-xl font-bold tracking-wide transition-all duration-500
                ${isReady
                    ? 'bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] scale-[1.02] border-primary'
                    : isSoonReady || timeLeft
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/50 text-amber-500'
                        : 'bg-background hover:bg-accent hover:text-accent-foreground border-2'
                }
            `}
            aria-label={isReady ? "Marquer comme pas prêt" : "Marquer comme prêt"}
            aria-pressed={isReady}
        >
            {loading ? (
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Mise à jour...</span>
                </div>
            ) : isReady ? (
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
