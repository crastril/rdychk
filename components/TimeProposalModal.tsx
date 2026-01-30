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
import { supabase } from '@/lib/supabase';

interface TimeProposalModalProps {
    memberId: string;
    currentProposedTime: string | null;
}

export function TimeProposalModal({ memberId, currentProposedTime }: TimeProposalModalProps) {
    const [time, setTime] = useState(currentProposedTime || '');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            // If time is empty, we clear the proposed time
            const valueToSave = time.trim() === '' ? null : time;

            await supabase
                .from('members')
                .update({ proposed_time: valueToSave, is_ready: false, timer_end_time: null }) // Reset other statuses if proposing time
                .eq('id', memberId);

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
            await supabase
                .from('members')
                .update({ proposed_time: null })
                .eq('id', memberId);
        } catch (error) {
            console.error('Error clearing time:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div className="flex gap-2 w-full">
                <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 gap-2">
                        <Clock className="w-4 h-4" />
                        {currentProposedTime ? `Proposé : ${currentProposedTime}` : 'Proposer un horaire'}
                    </Button>
                </DialogTrigger>
                {currentProposedTime && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Proposer un horaire</DialogTitle>
                    <DialogDescription>
                        Indiquez à quelle heure vous pensez être prêt ou à quelle heure on se retrouve.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center py-4">
                    <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="text-2xl p-4 h-16 w-40 text-center"
                    />
                </div>
                <DialogFooter className="flex gap-2 sm:justify-between">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Annuler
                        </Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Valider'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
