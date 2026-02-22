'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Timer, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerPickerProps {
    currentTimerEnd: string | null;
    onUpdate: (updates: { timer_end_time?: string | null; is_ready?: boolean }) => Promise<void>;
}

export function TimerPicker({ currentTimerEnd, onUpdate }: TimerPickerProps) {
    const [open, setOpen] = useState(false);
    const [minutes, setMinutes] = useState(5);
    const [loading, setLoading] = useState(false);

    const handleSetTimer = async () => {
        setLoading(true);
        const endTime = new Date();
        endTime.setMinutes(endTime.getMinutes() + minutes);

        try {
            await onUpdate({
                timer_end_time: endTime.toISOString(),
                is_ready: false // Ensure not ready when timer starts
            });
            setOpen(false);
        } catch (error) {
            console.error('Error setting timer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelTimer = async () => {
        setLoading(true);
        try {
            await onUpdate({ timer_end_time: null });
            setOpen(false);
        } catch (error) {
            console.error('Error cancelling timer:', error);
        } finally {
            setLoading(false);
        }
    };

    const isActive = !!currentTimerEnd && new Date(currentTimerEnd) > new Date();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex w-full items-center justify-center py-4 px-2 rounded-xl text-xs sm:text-sm font-medium transition-colors group",
                        isActive
                            ? "border-amber-500/50 text-amber-500 bg-amber-500/10 border-2"
                            : "bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 hover:text-white"
                    )}
                >
                    <Timer className={cn("w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 transition-transform shrink-0", isActive ? "animate-pulse" : "text-[var(--v2-primary)] group-hover:scale-110")} />
                    <span className="truncate">{isActive ? "Bientôt prêt" : "Lancer un minuteur"}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="center">
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium leading-none flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Minuteur
                            </h4>
                            <span className="text-sm text-muted-foreground">{minutes} min</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Indiquez aux autres participants dans combien de temps vous serez prêt.
                        </p>
                    </div>

                    <div className="py-2">
                        <Slider
                            defaultValue={[5]}
                            max={60}
                            min={1}
                            step={1}
                            value={[minutes]}
                            onValueChange={(vals) => setMinutes(vals[0])}
                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            className="flex-1"
                            onClick={handleSetTimer}
                            disabled={loading}
                        >
                            Lancer
                        </Button>
                        {isActive && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleCancelTimer}
                                disabled={loading}
                            >
                                <span className="sr-only">Annuler</span>
                                ×
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
