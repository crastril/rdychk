'use client';

import { useState } from 'react';
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
import { Clock, X } from 'lucide-react';

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
                    <button className="flex w-full items-center justify-center py-4 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 text-xs sm:text-sm font-medium transition-colors hover:text-white group">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-[var(--v2-primary)] group-hover:scale-110 transition-transform shrink-0" />
                        <span className="truncate">{currentProposedTime ? `Proposé : ${currentProposedTime}` : 'Proposer un horaire'}</span>
                    </button>
                </DialogTrigger>
                {currentProposedTime && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-black/60 border border-white/10 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 transition-all z-20"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
            <DialogContent className="sm:max-w-md glass-panel border-white/10 text-white rounded-3xl p-6">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-bold">Proposer un horaire</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Indiquez à quelle heure vous pensez être prêt ou à quelle heure on se retrouve.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center py-4">
                    <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="text-3xl font-bold p-4 h-20 w-48 text-center bg-black/20 border-white/10 text-white focus-visible:ring-[var(--v2-primary)] rounded-2xl"
                    />
                </div>
                <DialogFooter className="flex gap-2 sm:justify-between">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white">
                            Annuler
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full sm:w-auto bg-[var(--v2-primary)] text-white hover:bg-[var(--v2-primary)]/80 font-bold h-12 rounded-xl transition-all shadow-neon-primary px-8"
                    >
                        {loading ? 'Enregistrement...' : 'Valider'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
