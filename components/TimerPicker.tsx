'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Timer, Clock, Loader2 } from 'lucide-react';
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
                        "flex w-full items-center justify-center py-4 px-2 rounded-xl text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-300 group",
                        isActive
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-neon-secondary/20 border-2"
                            : "bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white"
                    )}
                >
                    <Timer className={cn("w-4 h-4 mr-2 transition-transform shrink-0", isActive ? "animate-pulse" : "text-[var(--v2-primary)] group-hover:rotate-12")} />
                    <span className="truncate">{isActive ? "⏱️ Arrivée imminente" : "Bientôt prêt"}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-6 glass-panel border-white/10 backdrop-blur-2xl shadow-2xl rounded-2xl"
                align="center"
                sideOffset={12}
            >
                <div className="space-y-6">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-[var(--v2-primary)]" />
                                Temps estimé
                            </h4>
                            <span className="text-xl font-black text-white tabular-nums">
                                {minutes}<span className="text-[10px] text-slate-500 ml-1">MIN</span>
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Dans combien de temps serez-vous présent ?
                        </p>
                    </div>

                    <div className="py-2 px-1">
                        <Slider
                            defaultValue={[5]}
                            max={60}
                            min={1}
                            step={1}
                            value={[minutes]}
                            onValueChange={(vals) => setMinutes(vals[0])}
                            className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-white [&_[role=slider]]:border-none [&_[role=slider]]:shadow-xl"
                        />
                        <div className="flex justify-between mt-3 px-1">
                            <span className="text-[9px] font-bold text-slate-600">1M</span>
                            <span className="text-[9px] font-bold text-slate-600">30M</span>
                            <span className="text-[9px] font-bold text-slate-600">60M</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1 h-12 rounded-xl bg-[var(--v2-primary)] hover:opacity-90 text-white font-bold transition-all active:scale-95 shadow-neon-primary/20"
                            onClick={handleSetTimer}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "VALIDER"}
                        </Button>
                        {isActive && (
                            <Button
                                variant="destructive"
                                className="w-12 h-12 p-0 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                onClick={handleCancelTimer}
                                disabled={loading}
                            >
                                <span className="text-lg leading-none">×</span>
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
