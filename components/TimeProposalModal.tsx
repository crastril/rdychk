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
import { X } from '@phosphor-icons/react';

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
            const valueToSave = time.trim() === '' ? null : time;
            await onUpdate({ proposed_time: valueToSave, is_ready: false, timer_end_time: null });
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

    const displayTime = currentProposedTime ? currentProposedTime.slice(0, 5).replace(':', 'H') : null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div className="w-full relative">
                <DialogTrigger asChild>
                    <button
                        className={cn(
                            'w-full text-left transition-all duration-150 active:translate-y-[2px] active:translate-x-[2px]',
                            'rounded-2xl border-[3px] border-black overflow-hidden',
                            currentProposedTime ? 'pr-10' : '',
                        )}
                        style={{
                            background: '#0c0c0c',
                            boxShadow: '5px 5px 0px #000',
                        }}
                    >
                        <div className="flex items-center gap-3 px-4 py-3">
                            {/* Label */}
                            <span
                                className="text-[12px] font-black uppercase tracking-[0.22em] shrink-0"
                                style={{
                                    fontFamily: 'var(--font-barlow-condensed)',
                                    color: currentProposedTime ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
                                }}
                            >
                                Je serai prêt à…
                            </span>

                            {/* Time display */}
                            <span
                                className="ml-auto tabular-nums leading-none shrink-0"
                                style={{
                                    fontFamily: 'var(--font-barlow-condensed)',
                                    fontWeight: 900,
                                    fontSize: '1.75rem',
                                    letterSpacing: '-0.01em',
                                    color: displayTime ? '#7dd3fc' : 'rgba(255,255,255,0.12)',
                                }}
                            >
                                {displayTime || '--H--'}
                            </span>
                        </div>
                    </button>
                </DialogTrigger>

                {/* Clear button — outside trigger to avoid nested interactive */}
                {currentProposedTime && (
                    <button
                        className="absolute top-1/2 -translate-y-1/2 right-3 w-6 h-6 rounded-full bg-black border-2 border-white/10 flex items-center justify-center hover:border-red-500/50 hover:bg-red-500/15 transition-all z-20"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        <X className="w-2.5 h-2.5 text-white/35" />
                    </button>
                )}
            </div>

            <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]" />
                <div className="p-8">
                    <DialogHeader className="mb-4">
                        <DialogTitle
                            className="uppercase tracking-[0.2em]"
                            style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: '1.1rem' }}
                        >
                            Je serai prêt à…
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-slate-400 leading-relaxed">
                            Les autres membres du groupe verront l'heure que tu indiques.
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
