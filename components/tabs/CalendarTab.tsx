'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Group, Member, DateVote } from '@/types/database';
import { voteDateAction, confirmDateAction } from '@/app/actions/calendar';
import { CaretLeft, CaretRight, Check, CircleNotch, CalendarCheck, Crown } from '@phosphor-icons/react';
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

// ── Fix #1 : semaine commence le lundi ──────────────────────────────────────
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function toDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function CalendarTab({ group, slug, memberId, members, isAdmin, onGroupChange, votes, onVotesChange }: CalendarTabProps) {
    const today = new Date();
    const todayStr = toDateStr(today);

    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [confirmedDate, setConfirmedDate] = useState<string | null>(group.confirmed_date ?? null);
    const [votingDate, setVotingDate] = useState<string | null>(null);
    const [confirmingDate, setConfirmingDate] = useState<string | null>(null);
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

    const totalMembers = members.length;

    // ── Fix #11 : dériver myVotes directement (pas de useState+useEffect) ───
    const myVotes = useMemo(
        () => new Set(votes.filter(v => v.member_id === memberId).map(v => v.date)),
        [votes, memberId],
    );

    const handleVote = async (dateStr: string) => {
        if (!memberId) return;
        const wasVoted = myVotes.has(dateStr);
        setVotingDate(dateStr);

        if (wasVoted) {
            onVotesChange(votes.filter(v => !(v.date === dateStr && v.member_id === memberId)));
        } else {
            onVotesChange([...votes, {
                id: 'temp-' + Date.now(),
                group_id: group.id,
                member_id: memberId,
                date: dateStr,
                created_at: new Date().toISOString(),
            } as DateVote]);
        }

        await voteDateAction(slug, memberId, dateStr);
        setVotingDate(null);
    };

    const handleConfirmDate = async (dateStr: string) => {
        if (!memberId || !isAdmin) return;
        setConfirmingDate(dateStr);
        const next = dateStr === confirmedDate ? null : dateStr;
        const result = await confirmDateAction(slug, memberId, next);
        if (result.success) {
            setConfirmedDate(next);
            onGroupChange?.();
        }
        setConfirmingDate(null);
        setIsOverrideModalOpen(false);
    };

    // ── Grille calendrier ────────────────────────────────────────────────────
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // ── Fix #1 : JS getDay() → 0=Dim ; (n+6)%7 → 0=Lun ────────────────────
    const jsFirstDay = new Date(year, month, 1).getDay();
    const firstDay = (jsFirstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const isCurrentMonth =
        viewDate.getMonth() === today.getMonth() &&
        viewDate.getFullYear() === today.getFullYear();

    // ── Comptages ────────────────────────────────────────────────────────────
    const votesByDate = useMemo(() => {
        const acc: Record<string, number> = {};
        votes.forEach(v => { acc[v.date] = (acc[v.date] || 0) + 1; });
        return acc;
    }, [votes]);

    const membersByDate = useMemo(() => {
        const acc: Record<string, string[]> = {};
        votes.forEach(v => {
            if (!acc[v.date]) acc[v.date] = [];
            acc[v.date].push(v.member_id);
        });
        return acc;
    }, [votes]);

    const allDatesWithVotes = Object.entries(votesByDate);
    const maxVotes = allDatesWithVotes.reduce((max, [, c]) => Math.max(max, c), 0);

    // ── Fix #6 : "meilleur créneau" seulement si ≥2 votes ───────────────────
    const bestMatchDates = useMemo(() => new Set(
        maxVotes >= 2
            ? allDatesWithVotes.filter(([, c]) => c === maxVotes).map(([d]) => d)
            : [],
    ), [allDatesWithVotes, maxVotes]);

    // Cellules vides + jours du mois
    const cells: (null | number)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // ── Fix #5 : synthèse créneaux (remplace liste participants) ─────────────
    const topDates = allDatesWithVotes
        .filter(([d]) => d >= todayStr)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);

    // ── Calendrier désactivé ─────────────────────────────────────────────────
    if (!group.calendar_voting_enabled) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <CalendarCheck className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                    <p className="text-white font-bold">Vote de date désactivé</p>
                    {confirmedDate ? (
                        <p className="text-slate-400 mt-1 text-sm">
                            Date fixée :{' '}
                            {/* Fix #7 : confirmed = vert */}
                            <span className="text-green-400 font-bold capitalize">
                                {new Date(confirmedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </p>
                    ) : (
                        <p className="text-slate-500 mt-1 text-sm">Aucune date fixée.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">

            {/* ── Header : navigation + hint ─────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => setViewDate(new Date(year, month - 1, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60"
                    >
                        <CaretLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-black text-white min-w-[110px] text-center">
                        {MONTHS_FR[month]} {year}
                    </span>
                    <button
                        onClick={() => setViewDate(new Date(year, month + 1, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60"
                    >
                        <CaretRight className="w-3.5 h-3.5" />
                    </button>
                    {/* ── Fix #8 : raccourci "Auj." ──────────────────────── */}
                    {!isCurrentMonth && (
                        <button
                            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
                            className="text-[10px] font-black text-[var(--v2-primary)] hover:bg-[var(--v2-primary)]/10 px-2 py-1 rounded-lg transition-colors ml-0.5"
                        >
                            Auj.
                        </button>
                    )}
                </div>

                {/* ── Fix #11 : micro-hint contextuel ────────────────────── */}
                <span className="text-[10px] font-medium text-white/25 shrink-0">
                    {myVotes.size > 0
                        ? `${myVotes.size} dispo sélectionnée${myVotes.size > 1 ? 's' : ''}`
                        : 'Tap = je suis dispo'}
                </span>
            </div>

            {/* ── En-têtes jours (Lun → Dim) ─────────────────────────────── */}
            <div className="grid grid-cols-7 gap-0.5">
                {DAYS_FR.map(d => (
                    <div key={d} className="text-center text-[9px] font-black uppercase tracking-wide text-white/20 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* ── Grille des jours ────────────────────────────────────────── */}
            {/* Fix #2 : min-h-[44px] au lieu de aspect-square + gap-0.5 */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const voteCount = votesByDate[dateStr] || 0;
                    const isMine = myVotes.has(dateStr);
                    const isBestMatch = bestMatchDates.has(dateStr);
                    const isConfirmed = confirmedDate === dateStr;
                    const isPast = dateStr < todayStr;
                    const isToday = dateStr === todayStr;
                    const isVoting = votingDate === dateStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => !isPast && handleVote(dateStr)}
                            disabled={isPast || isVoting || !memberId}
                            className={cn(
                                'relative flex flex-col items-center justify-center min-h-[44px] rounded-xl font-bold transition-all duration-150',
                                // Fix #9 : passé = discret, cursor-not-allowed sans aucun feedback
                                isPast ? 'opacity-20 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
                                // Fix #7 : confirmed = vert
                                isConfirmed && 'bg-green-500/15 border-2 border-green-500',
                                isBestMatch && !isConfirmed && 'bg-amber-500/10 border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
                                isMine && !isBestMatch && !isConfirmed && 'border-2 border-white/60 bg-white/5',
                                !isMine && !isBestMatch && !isConfirmed && !isPast && !isToday && 'border border-white/5 hover:border-white/15 hover:bg-white/[0.03]',
                                isToday && !isMine && !isBestMatch && !isConfirmed && !isPast && 'border border-[var(--v2-primary)]/40',
                                !isMine && !isBestMatch && !isConfirmed && isPast && 'border border-transparent',
                            )}
                        >
                            {isVoting ? (
                                <CircleNotch className="w-3.5 h-3.5 animate-spin text-white/30" />
                            ) : (
                                <>
                                    <span className={cn(
                                        'text-[13px] leading-none',
                                        isConfirmed ? 'text-green-400' :
                                            isBestMatch ? 'text-amber-300' :
                                                isMine ? 'text-white' :
                                                    isToday ? 'text-[var(--v2-primary)]' :
                                                        isPast ? 'text-white/30' : 'text-white/55',
                                    )}>
                                        {day}
                                    </span>
                                    {/* Fix #3 : compteur X/Y au lieu de User+"+N" */}
                                    {voteCount > 0 && (
                                        <span className={cn(
                                            'text-[8px] font-black tabular-nums mt-0.5 leading-none',
                                            isConfirmed ? 'text-green-400/60' :
                                                isBestMatch ? 'text-amber-400/70' :
                                                    'text-white/25',
                                        )}>
                                            {voteCount}/{totalMembers}
                                        </span>
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Légende ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 text-[10px] text-white/20 justify-center">
                {bestMatchDates.size > 0 && (
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded border border-amber-400 bg-amber-500/20 inline-block" />
                        Meilleur créneau
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded border border-white/60 bg-white/5 inline-block" />
                    Ma dispo
                </span>
                {confirmedDate && (
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded border border-green-500 bg-green-500/15 inline-block" />
                        Confirmé
                    </span>
                )}
            </div>

            {/* ── Fix #4 : état vide actionnable ──────────────────────────── */}
            {myVotes.size === 0 && allDatesWithVotes.length === 0 && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-base leading-none mt-0.5">👆</span>
                    <p className="text-[11px] text-white/35 font-medium leading-relaxed">
                        Appuie sur les jours où tu es disponible — le groupe trouvera le meilleur créneau commun automatiquement.
                    </p>
                </div>
            )}

            {/* ── Fix #5 : synthèse créneaux (remplace liste participants) ── */}
            {topDates.length > 0 && (
                <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20 mb-1">
                        Créneaux disponibles
                    </p>
                    {topDates.map(([dateStr, count]) => {
                        const dateMembers = membersByDate[dateStr] || [];
                        const isConf = confirmedDate === dateStr;
                        const pct = Math.round((count / totalMembers) * 100);

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    'flex items-center gap-2.5 px-3 py-2 rounded-xl border',
                                    isConf
                                        ? 'bg-green-500/8 border-green-500/25'
                                        : 'bg-white/[0.02] border-white/5',
                                )}
                            >
                                {/* Date */}
                                <div className="flex flex-col shrink-0 w-14">
                                    <span className={cn(
                                        'text-[11px] font-black capitalize leading-tight',
                                        isConf ? 'text-green-400' : 'text-white/70',
                                    )}>
                                        {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-[9px] text-white/25 capitalize leading-tight">
                                        {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                                    </span>
                                </div>

                                {/* Barre de quorum */}
                                <div className="flex-1 flex flex-col gap-0.5">
                                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-500',
                                                isConf ? 'bg-green-500' :
                                                    pct === 100 ? 'bg-amber-400' :
                                                        'bg-white/20',
                                            )}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className={cn(
                                        'text-[8px] font-black tabular-nums',
                                        isConf ? 'text-green-400/60' : 'text-white/20',
                                    )}>
                                        {count}/{totalMembers} dispo
                                    </span>
                                </div>

                                {/* Avatars membres dispo */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                    {dateMembers.slice(0, 4).map(mid => {
                                        const m = members.find(x => x.id === mid);
                                        if (!m) return null;
                                        return (
                                            <div
                                                key={mid}
                                                title={m.name}
                                                className={cn(
                                                    'w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black border shrink-0',
                                                    mid === memberId
                                                        ? 'bg-[var(--v2-primary)]/15 text-[var(--v2-primary)] border-[var(--v2-primary)]/40'
                                                        : 'bg-white/8 text-white/50 border-white/10',
                                                )}
                                            >
                                                {getInitials(m.name)}
                                            </div>
                                        );
                                    })}
                                    {dateMembers.length > 4 && (
                                        <span className="text-[8px] text-white/20 font-bold ml-0.5">
                                            +{dateMembers.length - 4}
                                        </span>
                                    )}
                                </div>

                                {isConf && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Fix #10 : bouton admin discret en bas ────────────────────── */}
            {isAdmin && allDatesWithVotes.length > 0 && (
                <button
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white/20 hover:text-amber-400 transition-colors py-2 mt-1"
                >
                    <Crown className="w-3 h-3" />
                    Confirmer une date
                </button>
            )}

            {/* ── Modal admin ──────────────────────────────────────────────── */}
            <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-sm font-black uppercase tracking-[0.15em] flex items-center gap-2 text-white">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            Confirmer une date
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                        {[...allDatesWithVotes]
                            .sort(([, a], [, b]) => b - a)
                            .map(([dateStr, count]) => (
                                <button
                                    key={dateStr}
                                    onClick={() => handleConfirmDate(dateStr)}
                                    disabled={!!confirmingDate}
                                    className={cn(
                                        'flex items-center justify-between p-3 rounded-xl border transition-all',
                                        confirmedDate === dateStr
                                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                            : 'border-white/8 hover:border-white/20 hover:bg-white/5 text-white',
                                    )}
                                >
                                    <span className="font-bold capitalize text-sm">
                                        {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-white/30 tabular-nums">{count}/{totalMembers}</span>
                                        {confirmingDate === dateStr ? (
                                            <CircleNotch className="w-3.5 h-3.5 animate-spin text-white/40" />
                                        ) : confirmedDate === dateStr ? (
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                        ) : null}
                                    </div>
                                </button>
                            ))}
                        {confirmedDate && (
                            <button
                                onClick={() => handleConfirmDate(confirmedDate)}
                                disabled={!!confirmingDate}
                                className="mt-2 p-2.5 rounded-xl border border-red-500/20 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-black"
                            >
                                Annuler la date confirmée
                            </button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
