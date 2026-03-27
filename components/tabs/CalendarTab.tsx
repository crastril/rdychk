'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Group, Member, DateVote } from '@/types/database';
import { voteDateAction, confirmDateAction } from '@/app/actions/calendar';
import { CaretLeft, CaretRight, Check, CircleNotch, CalendarCheck, WarningOctagon, User } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CalendarTabProps {
    group: Group;
    slug: string;
    memberId: string | null;
    members: Member[];
    isAdmin: boolean;
    onGroupChange?: () => void;
    votes: DateVote[];
    onVotesChange: (votes: DateVote[]) => void;
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function toDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function CalendarTab({ group, slug, memberId, members, isAdmin, onGroupChange, votes, onVotesChange }: CalendarTabProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
    const [confirmedDate, setConfirmedDate] = useState<string | null>(group.confirmed_date ?? null);
    const [votingDate, setVotingDate] = useState<string | null>(null);
    const [confirmingDate, setConfirmingDate] = useState<string | null>(null);
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

    const totalMembers = members.length;

    useEffect(() => {
        if (memberId) {
            setMyVotes(new Set(votes.filter((v: DateVote) => v.member_id === memberId).map((v: DateVote) => v.date)));
        }
    }, [votes, memberId]);

    const handleVote = async (dateStr: string) => {
        if (!memberId) return;
        const wasVoted = myVotes.has(dateStr);

        // Optimistic update for parent
        if (wasVoted) {
            onVotesChange(votes.filter(v => !(v.date === dateStr && v.member_id === memberId)));
        } else if (memberId) {
            onVotesChange([...votes, {
                id: 'temp-' + Date.now(),
                group_id: group.id,
                member_id: memberId,
                date: dateStr,
                created_at: new Date().toISOString()
            } as DateVote]);
        }

        await voteDateAction(slug, memberId, dateStr);
        setVotingDate(null);
    };

    const handleConfirmDate = async (dateStr: string) => {
        if (!memberId || !isAdmin) return;
        setConfirmingDate(dateStr);
        const toggledDate = dateStr === confirmedDate ? null : dateStr;
        const result = await confirmDateAction(slug, memberId, toggledDate);
        if (result.success) {
            setConfirmedDate(toggledDate);
            onGroupChange?.();
        }
        setConfirmingDate(null);
        setIsOverrideModalOpen(false);
    };

    // Build calendar grid for current viewDate month
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get vote counts per date for this month
    const votesByDate: Record<string, number> = {};
    votes.forEach(v => {
        votesByDate[v.date] = (votesByDate[v.date] || 0) + 1;
    });

    // Best match: date with most votes
    const allDatesWithVotes = Object.entries(votesByDate);
    const maxVotes = allDatesWithVotes.reduce((max, [, count]) => Math.max(max, count), 0);
    const bestMatchDates = new Set(
        allDatesWithVotes.filter(([, count]) => count === maxVotes && maxVotes > 0).map(([d]) => d)
    );

    const cells: (null | number)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    if (!group.calendar_voting_enabled) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                    <CalendarCheck className="w-7 h-7 text-slate-500" />
                </div>
                <div>
                    <p className="text-white font-bold text-lg">Vote de date désactivé</p>
                    {confirmedDate ? (
                        <p className="text-slate-400 mt-1 text-sm">
                            Date fixée :{' '}
                            <span className="text-[var(--v2-primary)] font-bold capitalize">
                                {new Date(confirmedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </p>
                    ) : (
                        <p className="text-slate-500 mt-1 text-sm">Aucune date fixée. L'admin peut activer le vote dans les paramètres.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Header / Admin Override */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewDate(new Date(year, month - 1, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-400"
                    >
                        <CaretLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-base font-bold text-white min-w-[120px] text-center">
                        {MONTHS_FR[month]} {year}
                    </h3>
                    <button
                        onClick={() => setViewDate(new Date(year, month + 1, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-400"
                    >
                        <CaretRight className="w-4 h-4" />
                    </button>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setIsOverrideModalOpen(true)}
                        className="text-xs font-bold text-amber-500 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-amber-500/20"
                    >
                        <WarningOctagon className="w-3.5 h-3.5" />
                        Imposer un choix
                    </button>
                )}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
                {DAYS_FR.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const voteCount = votesByDate[dateStr] || 0;
                    const isMine = myVotes.has(dateStr);
                    const isBestMatch = bestMatchDates.has(dateStr);
                    const isConfirmed = confirmedDate === dateStr;
                    const isPast = dateStr < toDateStr(today);
                    const isVoting = votingDate === dateStr;
                    const isConfirming = confirmingDate === dateStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => !isPast && handleVote(dateStr)}
                            disabled={isPast || isVoting || !memberId}
                            className={cn(
                                'relative flex flex-col items-center justify-center aspect-square rounded-xl text-sm font-bold transition-all duration-150 group',
                                isPast && 'opacity-25 cursor-not-allowed',
                                !isPast && 'active:scale-95',
                                isConfirmed && 'bg-[var(--v2-primary)]/20 border border-[var(--v2-primary)]/50 text-[var(--v2-primary)]',
                                isBestMatch && !isConfirmed && 'bg-amber-500/10 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]',
                                isMine && !isBestMatch && !isConfirmed && 'border-2 border-white/80 bg-white/5',
                                !isMine && !isBestMatch && !isConfirmed && 'border border-transparent hover:border-white/10 hover:bg-white/5',
                            )}
                        >
                            {isVoting ? (
                                <CircleNotch className="w-3.5 h-3.5 animate-spin text-slate-400" />
                            ) : (
                                <>
                                    <span className={cn(
                                        'text-sm',
                                        isConfirmed ? 'text-[var(--v2-primary)]' : isBestMatch ? 'text-amber-400' : isMine ? 'text-white' : 'text-slate-300',
                                    )}>
                                        {day}
                                    </span>
                                    {voteCount > 0 && (
                                        <div className={cn(
                                            'flex items-center gap-0.5 mt-0.5',
                                            isConfirmed ? 'text-[var(--v2-primary)]/70' :
                                                isBestMatch ? 'text-amber-500/80' : 'text-slate-500'
                                        )}>
                                            <User className="w-2.5 h-2.5" />
                                            {voteCount > 1 && (
                                                <span className="text-[9px] font-black tracking-tighter">
                                                    +{voteCount - 1}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-slate-500 justify-center">
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-500/20 shadow-[0_0_5px_rgba(251,191,36,0.4)]" />
                    Meilleur créneau
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-white/80 bg-white/5" />
                    Ma dispo
                </span>
            </div>



            {allDatesWithVotes.length === 0 && (
                <p className="text-center text-slate-600 text-sm py-4">
                    Aucun vote pour ce mois. Cliquez sur une date pour indiquer votre disponibilité.
                </p>
            )}

            {/* Participant Choices List */}
            <div className="border-t border-white/5 pt-4 mt-2">
                <h3 className="text-sm font-bold text-white mb-3">Choix des participants</h3>
                <div className="flex flex-col gap-2">
                    {members.map(m => {
                        const memberVotes = votes.filter(v => v.member_id === m.id).map(v => v.date).sort();
                        return (
                            <div key={m.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-white/10 shrink-0">
                                        {m.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-white truncate">
                                        {m.name} {m.id === memberId && <span className="text-slate-500 text-xs font-normal">(Moi)</span>}
                                    </span>
                                </div>
                                {memberVotes.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mt-1 sm:ml-8">
                                        {memberVotes.map(dateStr => (
                                            <span key={dateStr} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--v2-primary)]/10 text-[var(--v2-primary)] border border-[var(--v2-primary)]/20 capitalize">
                                                {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 sm:ml-8 italic">Aucun choix pour le moment</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Admin Override Modal */}
            <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <WarningOctagon className="w-5 h-5 text-amber-500" />
                            Imposer une date
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">
                            Sélectionnez une date parmi les propositions pour l'imposer comme choix officiel du groupe.
                        </p>

                        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {allDatesWithVotes.length > 0 ? (
                                [...allDatesWithVotes]
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([dateStr, count]) => (
                                        <button
                                            key={dateStr}
                                            onClick={() => handleConfirmDate(dateStr)}
                                            disabled={!!confirmingDate}
                                            className={cn(
                                                'flex items-center justify-between p-3 rounded-xl border transition-all text-sm',
                                                confirmedDate === dateStr
                                                    ? 'bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/30 text-[var(--v2-primary)]'
                                                    : 'border-white/10 hover:border-[var(--v2-primary)]/30 hover:bg-[var(--v2-primary)]/5 text-white'
                                            )}
                                        >
                                            <span className="font-medium capitalize">
                                                {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">{count}/{totalMembers} votes</span>
                                                {confirmingDate === dateStr ? (
                                                    <CircleNotch className="w-4 h-4 animate-spin" />
                                                ) : confirmedDate === dateStr ? (
                                                    <Check className="w-4 h-4" />
                                                ) : null}
                                            </div>
                                        </button>
                                    ))
                            ) : (
                                <div className="p-4 text-center text-slate-500 bg-white/5 rounded-xl border border-white/5">
                                    Aucune date n'a encore reçu de vote. Les membres doivent d'abord indiquer leurs disponibilités.
                                </div>
                            )}

                            {confirmedDate && (
                                <button
                                    onClick={() => handleConfirmDate(confirmedDate)}
                                    disabled={!!confirmingDate}
                                    className="mt-4 p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium w-full"
                                >
                                    Annuler la date imposée ({new Date(confirmedDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})
                                </button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
