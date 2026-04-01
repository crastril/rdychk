'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Clock, X } from '@phosphor-icons/react';

interface TimeProposalModalProps {
    currentProposedTime: string | null;
    onUpdate: (updates: { proposed_time?: string | null; is_ready?: boolean; timer_end_time?: string | null }) => Promise<void>;
}

export function TimeProposalModal({ currentProposedTime, onUpdate }: TimeProposalModalProps) {
    const [time, setTime] = useState(currentProposedTime || '');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            // If time is empty, we clear the proposed time
            const valueToSave = time.trim() === '' ? null : time;

            await onUpdate({
                proposed_time: valueToSave,
                is_ready: false,
                timer_end_time: null
            });

            setOpen(false);
        } catch (error) {
            console.error('Error saving time:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        try {
            await onUpdate({ proposed_time: null });
        } catch (error) {
            console.error('Error clearing time:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div className="w-full relative group/modal">
                <DialogTrigger asChild>
                    <button
                        className={cn(
                            "flex w-full flex-col items-center justify-center gap-1 py-3 rounded-xl",
                            "border-[2px] font-black text-[11px] uppercase tracking-[0.18em]",
                            "transition-all duration-100 active:translate-y-[1px]",
                            currentProposedTime
                                ? "border-sky-500/50 bg-sky-500/10 text-sky-400 pr-8"
                                : "border-white/15 bg-[#161616] text-white/55 hover:text-white/80 hover:border-white/25 px-3"
                        )}
                        style={{ boxShadow: currentProposedTime ? '2px 2px 0px rgba(14,165,233,0.25)' : '2px 2px 0px rgba(0,0,0,0.5)' }}
                    >
                        <Clock className="w-4 h-4 shrink-0" />
                        {currentProposedTime ? (
                            <span className="truncate tabular-nums">{currentProposedTime.slice(0, 5)}h</span>
                        ) : (
                            <span className="truncate">Horaire</span>
                        )}
                    </button>
                </DialogTrigger>
                {currentProposedTime && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-2 -translate-y-1/2 h-5 w-5 rounded-full bg-black/60 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all z-20"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        <X className="h-2.5 w-2.5" />
                    </Button>
                )}
            </div>
            <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>
                <div className="p-8">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Indiquer un horaire</DialogTitle>
                        <DialogDescription className="text-[12px] text-slate-400 leading-relaxed">
                            Indique l'heure à laquelle tu penses arriver. Les autres membres du groupe le verront.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="bg-black/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-[var(--v2-primary)] focus-visible:border-[var(--v2-primary)] text-3xl font-bold p-4 h-20 w-48 text-center rounded-2xl transition-all"
                        />
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="w-full sm:w-auto h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full sm:w-auto btn-massive h-12 rounded-xl text-white font-bold px-8 shadow-neon-primary"
                        >
                            {loading ? 'Enregistrement...' : 'Valider'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
