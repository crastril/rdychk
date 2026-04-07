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
    isRemote?: boolean;
}

export function TimeProposalModal({ currentProposedTime, onUpdate, isRemote }: TimeProposalModalProps) {
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

    // ── REMOTE / CYBERPUNK VARIANT ──
    if (isRemote) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <div className="w-full relative">
                    <DialogTrigger asChild>
                        <button
                            className={cn('w-full text-left transition-all duration-150 active:opacity-70', currentProposedTime ? 'pr-10' : '')}
                            style={{
                                borderRadius: '4px',
                                border: currentProposedTime ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(168,85,247,0.2)',
                                background: 'rgba(8,0,20,0.95)',
                                boxShadow: currentProposedTime ? '0 0 12px rgba(56,189,248,0.06)' : '0 0 12px rgba(168,85,247,0.05)',
                            }}
                        >
                            <div className="flex items-center gap-3 px-4 py-3">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] shrink-0" style={{ color: '#a78bfa' }}>
                                    {'// SET_ETA'}
                                </span>
                                <span
                                    className="ml-auto font-mono tabular-nums leading-none shrink-0 text-[1.5rem] font-bold"
                                    style={{
                                        letterSpacing: '-0.01em',
                                        color: displayTime ? '#38bdf8' : '#8b5cf6',
                                    }}
                                >
                                    {displayTime ? displayTime.replace('H', ':') : '--:--'}
                                </span>
                            </div>
                        </button>
                    </DialogTrigger>

                    {currentProposedTime && (
                        <button
                            className="absolute top-1/2 -translate-y-1/2 right-3 w-5 h-5 flex items-center justify-center transition-all z-20"
                            style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '2px', background: 'rgba(8,0,20,0.9)' }}
                            onClick={handleClear}
                            disabled={loading}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)')}
                        >
                            <X className="w-2.5 h-2.5" style={{ color: '#8b5cf6' }} />
                        </button>
                    )}
                </div>

                <DialogContent
                    className="w-[calc(100%-2rem)] max-w-md mx-auto text-white p-0 overflow-hidden"
                    style={{
                        background: 'rgba(8,0,20,0.98)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: '4px',
                        boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                    }}
                >
                    {/* Top neon bar */}
                    <div className="w-full h-[2px]" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />
                    <div className="p-6">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="font-mono text-[0.85rem] uppercase tracking-[0.2em]" style={{ color: '#c4b5fd' }}>
                                {'> SET_ETA'}
                            </DialogTitle>
                            <DialogDescription className="font-mono text-[11px] tracking-wide" style={{ color: '#8b5cf6' }}>
                                {'// heure estimée de connexion — visible par le groupe'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-center justify-center py-6">
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="text-3xl font-mono font-bold p-4 h-20 w-48 text-center transition-all"
                                style={{
                                    background: 'rgba(168,85,247,0.04)',
                                    border: '1px solid rgba(168,85,247,0.3)',
                                    borderRadius: '4px',
                                    color: '#38bdf8',
                                    outline: 'none',
                                    boxShadow: 'none',
                                }}
                            />
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto h-10 font-mono text-[11px] uppercase tracking-[0.15em] transition-all"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(168,85,247,0.2)',
                                        borderRadius: '3px',
                                        color: '#8b5cf6',
                                    }}
                                >
                                    CANCEL
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full sm:w-auto h-10 font-mono text-[11px] uppercase tracking-[0.15em] transition-all"
                                style={{
                                    background: loading ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.15)',
                                    border: '1px solid rgba(168,85,247,0.5)',
                                    borderRadius: '3px',
                                    color: '#c4b5fd',
                                    boxShadow: '0 0 12px rgba(168,85,247,0.1)',
                                }}
                            >
                                {loading ? 'SAVING...' : '[ CONFIRM_ETA ]'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ──
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
                                Je pense arriver à…
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

            <DialogContent
                className="w-[calc(100%-2rem)] max-w-md mx-auto text-white p-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f]"
                style={{ boxShadow: '5px 5px 0 #000' }}
            >
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle
                            className="font-black uppercase tracking-widest text-white"
                            style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900 }}
                        >
                            Je pense arriver à…
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-white/45">
                            Les autres membres du groupe verront l'heure que tu indiques.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-6">
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="rounded-xl border border-white/20 bg-white/5 text-white text-3xl font-bold p-4 h-20 w-48 text-center focus:border-[var(--v2-primary)] transition-all"
                        />
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl border border-white/20 bg-white/5 text-white/60 font-bold hover:bg-white/10 hover:text-white h-12 w-full sm:w-auto transition-all"
                            >
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="rounded-xl bg-[var(--v2-primary)] text-white border-[3px] border-black font-black uppercase tracking-widest h-12 w-full sm:w-auto px-8 disabled:opacity-50"
                            style={{ boxShadow: '3px 3px 0 #000' }}
                        >
                            {loading ? 'Enregistrement...' : 'Valider'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
