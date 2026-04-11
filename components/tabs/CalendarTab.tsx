'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
    onVotesChange: (updater: DateVote[] | ((prev: DateVote[]) => DateVote[])) => void;
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

type ViewMode = 'week' | 'month';

function getWeekStart(date: Date, todayRef: Date): Date {
    // Week always starts from todayRef when navigating forward/back by 7 days
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function CalendarTab({ group, slug, memberId, members, isAdmin, onGroupChange, votes, onVotesChange }: CalendarTabProps) {
    const today = new Date();
    const todayStr = toDateStr(today);
    const isRemote = group.type === 'remote';

    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [viewDate, setViewDate] = useState(today);
    const [confirmedDate, setConfirmedDate] = useState<string | null>(group.confirmed_date ?? null);
    const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());
    const [confirmingDate, setConfirmingDate] = useState<string | null>(null);
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [isAllSlotsOpen, setIsAllSlotsOpen] = useState(false);

    const totalMembers = members.length;
    const membersMap = useMemo(() => {
        const acc: Record<string, Member> = {};
        for (const m of members) {
            acc[m.id] = m;
        }
        return acc;
    }, [members]);


    // Local set for MY votes — updates instantly, not derived from parent prop.
    const [myVotes, setMyVotes] = useState<Set<string>>(
        () => new Set(votes.filter(v => v.member_id === memberId).map(v => v.date))
    );
    const pendingCountRef = useRef(0);

    // Sync from server only when no ops are in flight
    useEffect(() => {
        if (pendingCountRef.current === 0) {
            setMyVotes(new Set(votes.filter(v => v.member_id === memberId).map(v => v.date)));
        }
    }, [votes, memberId]);

    const handleVote = async (dateStr: string) => {
        if (!memberId || pendingDates.has(dateStr)) return;
        const wasVoted = myVotes.has(dateStr);

        setMyVotes(prev => {
            const next = new Set(prev);
            if (wasVoted) next.delete(dateStr); else next.add(dateStr);
            return next;
        });

        onVotesChange(prev => wasVoted
            ? prev.filter(v => !(v.date === dateStr && v.member_id === memberId))
            : [...prev, { id: 'temp-' + Date.now(), group_id: group.id, member_id: memberId, date: dateStr, created_at: new Date().toISOString() } as DateVote]
        );

        pendingCountRef.current++;
        setPendingDates(prev => new Set(prev).add(dateStr));
        await voteDateAction(slug, memberId, dateStr);
        pendingCountRef.current--;
        setPendingDates(prev => { const next = new Set(prev); next.delete(dateStr); return next; });
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

    const weekStart = (() => { const d = new Date(viewDate); d.setHours(0,0,0,0); return d; })();
    const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    // Month view
    const jsFirstDay = new Date(year, month, 1).getDay();
    const firstDay = (jsFirstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const isCurrentPeriod = viewMode === 'week'
        ? toDateStr(weekStart) === todayStr
        : (viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear());

    const navPrev = () => {
        if (viewMode === 'week') {
            const d = new Date(weekStart);
            d.setDate(d.getDate() - 7);
            setViewDate(d);
        } else {
            setViewDate(new Date(year, month - 1, 1));
        }
    };

    const navNext = () => {
        if (viewMode === 'week') {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + 7);
            setViewDate(d);
        } else {
            setViewDate(new Date(year, month + 1, 1));
        }
    };

    const navToday = () => setViewDate(today);

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

    const bestMatchDates = useMemo(() => new Set(
        maxVotes >= 2
            ? allDatesWithVotes.filter(([, c]) => c === maxVotes).map(([d]) => d)
            : [],
    ), [allDatesWithVotes, maxVotes]);

    // Cellules vides + jours du mois
    const cells: (null | number)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // ── Synthèse créneaux ────────────────────────────────────────────────────
    const sortedDates = allDatesWithVotes
        .filter(([d]) => d >= todayStr)
        .sort(([da, a], [db, b]) => b - a || da.localeCompare(db));

    const topDates = sortedDates.slice(0, 2);
    const hasMoreDates = sortedDates.length > 2;

    // Week label
    const weekLabel = (() => {
        const end = weekDays[6];
        const startDay = weekStart.getDate();
        const endDay = end.getDate();
        const startMonth = MONTHS_FR[weekStart.getMonth()].slice(0, 4);
        const endMonth = MONTHS_FR[end.getMonth()].slice(0, 4);
        return weekStart.getMonth() === end.getMonth()
            ? `${startDay} – ${endDay} ${endMonth}`
            : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
    })();

    // ── Calendrier désactivé ─────────────────────────────────────────────────
    if (!group.calendar_voting_enabled) {
        if (isRemote) {
            return (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '3px', background: 'rgba(168,85,247,0.04)' }}>
                        <CalendarCheck className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.15em]" style={{ color: '#a78bfa' }}>CALENDAR_VOTING_DISABLED</p>
                        {confirmedDate ? (
                            <p className="font-mono text-[10px] uppercase tracking-[0.1em] mt-2" style={{ color: '#8b5cf6' }}>
                                {'// SESSION_DATE: '}
                                <span style={{ color: '#4ade80' }}>
                                    {new Date(confirmedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </p>
                        ) : (
                            <p className="font-mono text-[10px] mt-2" style={{ color: '#8b5cf6' }}>// NO_DATE_CONFIRMED</p>
                        )}
                    </div>
                </div>
            );
        }
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

    // ── Neo-brutalist day cell ───────────────────────────────────────────────
    const renderDayCell = (dateStr: string, day: number) => {
        const voteCount = votesByDate[dateStr] || 0;
        const isMine = myVotes.has(dateStr);
        const isBestMatch = bestMatchDates.has(dateStr);
        const isConfirmed = confirmedDate === dateStr;
        const isPast = dateStr < todayStr;
        const isToday = dateStr === todayStr;
        const isPending = pendingDates.has(dateStr);

        return (
            <button
                key={dateStr}
                onClick={() => !isPast && handleVote(dateStr)}
                disabled={isPast || isPending || !memberId}
                className={cn(
                    'relative flex flex-col items-center justify-center min-h-[44px] rounded-xl font-bold transition-all duration-150',
                    isPast ? 'opacity-20 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
                    isConfirmed && 'bg-green-500/15 border-2 border-green-500',
                    isBestMatch && !isConfirmed && 'bg-amber-500/10 border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
                    isMine && !isBestMatch && !isConfirmed && 'border-2 border-white/60 bg-white/5',
                    !isMine && !isBestMatch && !isConfirmed && !isPast && !isToday && 'border border-white/5 hover:border-white/15 hover:bg-white/[0.03]',
                    isToday && !isMine && !isBestMatch && !isConfirmed && !isPast && 'border border-[var(--v2-primary)]/40',
                    !isMine && !isBestMatch && !isConfirmed && isPast && 'border border-transparent',
                )}
            >
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
            </button>
        );
    };

    // ── Cyberpunk day cell ───────────────────────────────────────────────────
    const renderDayCellRemote = (dateStr: string, day: number) => {
        const voteCount = votesByDate[dateStr] || 0;
        const isMine = myVotes.has(dateStr);
        const isBestMatch = bestMatchDates.has(dateStr);
        const isConfirmed = confirmedDate === dateStr;
        const isPast = dateStr < todayStr;
        const isToday = dateStr === todayStr;
        const isPending = pendingDates.has(dateStr);

        let borderColor = 'rgba(168,85,247,0.1)';
        let bgColor = 'transparent';
        let textColor = '#8b5cf6';
        let countColor = 'rgba(139,92,246,0.5)';

        if (isConfirmed) {
            borderColor = 'rgba(74,222,128,0.5)';
            bgColor = 'rgba(74,222,128,0.06)';
            textColor = '#4ade80';
            countColor = 'rgba(74,222,128,0.6)';
        } else if (isBestMatch) {
            borderColor = 'rgba(232,121,249,0.55)';
            bgColor = 'rgba(232,121,249,0.06)';
            textColor = '#e879f9';
            countColor = 'rgba(232,121,249,0.6)';
        } else if (isMine) {
            borderColor = 'rgba(168,85,247,0.5)';
            bgColor = 'rgba(168,85,247,0.1)';
            textColor = '#c4b5fd';
            countColor = 'rgba(168,85,247,0.6)';
        } else if (isToday) {
            borderColor = 'rgba(168,85,247,0.3)';
            textColor = '#a78bfa';
        }

        return (
            <button
                key={dateStr}
                onClick={() => !isPast && handleVote(dateStr)}
                disabled={isPast || isPending || !memberId}
                className="relative flex flex-col items-center justify-center min-h-[40px] transition-all duration-150 active:scale-95"
                style={{
                    border: `1px solid ${borderColor}`,
                    borderRadius: '2px',
                    background: bgColor,
                    opacity: isPast ? 0.2 : 1,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => {
                    if (!isPast && !isMine && !isBestMatch && !isConfirmed) {
                        e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                        e.currentTarget.style.background = 'rgba(168,85,247,0.04)';
                    }
                }}
                onMouseLeave={e => {
                    if (!isPast && !isMine && !isBestMatch && !isConfirmed) {
                        e.currentTarget.style.borderColor = isToday ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.1)';
                        e.currentTarget.style.background = 'transparent';
                    }
                }}
            >
                <span className="font-mono text-[13px] leading-none" style={{ color: textColor }}>
                    {isPending ? '·' : day}
                </span>
                {voteCount > 0 && (
                    <span className="font-mono text-[8px] tabular-nums mt-0.5 leading-none" style={{ color: countColor }}>
                        {voteCount}/{totalMembers}
                    </span>
                )}
            </button>
        );
    };

    // ── CYBERPUNK REMOTE RENDER ──────────────────────────────────────────────
    if (isRemote) {
        return (
            <div className="flex flex-col gap-3">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={navPrev}
                            className="w-7 h-7 flex items-center justify-center transition-colors"
                            style={{ border: '1px solid rgba(168,85,247,0.15)', borderRadius: '2px', background: 'transparent', color: '#8b5cf6' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; e.currentTarget.style.color = '#c4b5fd'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.15)'; e.currentTarget.style.color = '#8b5cf6'; }}
                        >
                            <CaretLeft className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] min-w-[110px] text-center" style={{ color: '#a78bfa' }}>
                            {viewMode === 'week' ? weekLabel : `${MONTHS_FR[month].slice(0,3).toUpperCase()} ${year}`}
                        </span>
                        <button
                            onClick={navNext}
                            className="w-7 h-7 flex items-center justify-center transition-colors"
                            style={{ border: '1px solid rgba(168,85,247,0.15)', borderRadius: '2px', background: 'transparent', color: '#8b5cf6' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; e.currentTarget.style.color = '#c4b5fd'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.15)'; e.currentTarget.style.color = '#8b5cf6'; }}
                        >
                            <CaretRight className="w-3 h-3" />
                        </button>
                        {!isCurrentPeriod && (
                            <button
                                onClick={navToday}
                                className="font-mono text-[9px] uppercase tracking-[0.1em] px-1.5 py-1 transition-colors ml-0.5"
                                style={{ color: '#8b5cf6', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '2px' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#8b5cf6'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.15)'; }}
                            >
                                NOW
                            </button>
                        )}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-0.5" style={{ border: '1px solid rgba(168,85,247,0.15)', borderRadius: '3px', padding: '2px' }}>
                        <button
                            onClick={() => setViewMode('week')}
                            className="font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 transition-colors"
                            style={{ borderRadius: '2px', background: viewMode === 'week' ? 'rgba(168,85,247,0.15)' : 'transparent', color: viewMode === 'week' ? '#c4b5fd' : '#8b5cf6' }}
                        >
                            WEEK
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className="font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 transition-colors"
                            style={{ borderRadius: '2px', background: viewMode === 'month' ? 'rgba(168,85,247,0.15)' : 'transparent', color: viewMode === 'month' ? '#c4b5fd' : '#8b5cf6' }}
                        >
                            MONTH
                        </button>
                    </div>
                </div>

                {/* ── Day headers ────────────────────────────────────── */}
                <div className="grid grid-cols-7 gap-0.5">
                    {(viewMode === 'week' ? weekDays.map(d => DAYS_FR[(d.getDay() + 6) % 7]) : DAYS_FR).map((d, i) => (
                        <div key={i} className="text-center font-mono py-1" style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#8b5cf6' }}>
                            {d.toUpperCase()}
                        </div>
                    ))}
                </div>

                {/* ── Grid ───────────────────────────────────────────── */}
                {viewMode === 'week' ? (
                    <div className="grid grid-cols-7 gap-0.5">
                        {weekDays.map(d => renderDayCellRemote(toDateStr(d), d.getDate()))}
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-0.5">
                        {(() => {
                            const c: (null | number)[] = [];
                            for (let i = 0; i < firstDay; i++) c.push(null);
                            for (let d = 1; d <= daysInMonth; d++) c.push(d);
                            return c.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} />;
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                return renderDayCellRemote(dateStr, day);
                            });
                        })()}
                    </div>
                )}

                {/* ── Legend ─────────────────────────────────────────── */}
                <div className="flex items-center gap-3 justify-center">
                    {bestMatchDates.size > 0 && (
                        <span className="flex items-center gap-1 font-mono" style={{ fontSize: '9px', color: '#8b5cf6', letterSpacing: '0.1em' }}>
                            <span className="w-2 h-2 inline-block" style={{ border: '1px solid #e879f9', background: 'rgba(232,121,249,0.1)', borderRadius: '1px' }} />
                            BEST_SLOT
                        </span>
                    )}
                    <span className="flex items-center gap-1 font-mono" style={{ fontSize: '9px', color: '#8b5cf6', letterSpacing: '0.1em' }}>
                        <span className="w-2 h-2 inline-block" style={{ border: '1px solid rgba(168,85,247,0.5)', background: 'rgba(168,85,247,0.1)', borderRadius: '1px' }} />
                        MY_DISPO
                    </span>
                    {confirmedDate && (
                        <span className="flex items-center gap-1 font-mono" style={{ fontSize: '9px', color: '#8b5cf6', letterSpacing: '0.1em' }}>
                            <span className="w-2 h-2 inline-block" style={{ border: '1px solid rgba(74,222,128,0.6)', background: 'rgba(74,222,128,0.08)', borderRadius: '1px' }} />
                            CONFIRMED
                        </span>
                    )}
                </div>

                {/* ── Empty state ─────────────────────────────────────── */}
                {myVotes.size === 0 && allDatesWithVotes.length === 0 && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5" style={{ border: '1px solid rgba(168,85,247,0.1)', borderRadius: '3px', background: 'rgba(168,85,247,0.03)' }}>
                        <span className="font-mono text-sm leading-none mt-0.5 shrink-0" style={{ color: '#8b5cf6' }}>{'>'}</span>
                        <p className="font-mono text-[11px] leading-relaxed" style={{ color: '#8b5cf6' }}>
                            {'// clique sur les jours où tu es dispo — le système trouve le meilleur créneau commun'}
                        </p>
                    </div>
                )}

                {/* ── Available slots summary ─────────────────────────── */}
                <AnimatePresence initial={false}>
                {topDates.length > 0 && (
                <motion.div
                    key="top-dates"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                >
                <div className="pt-3 flex flex-col gap-1.5" style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }}>
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: '9px', color: '#8b5cf6' }}>
                            AVAILABLE_SLOTS
                        </p>
                        {hasMoreDates && (
                            <button
                                onClick={() => setIsAllSlotsOpen(true)}
                                className="font-mono transition-colors"
                                style={{ fontSize: '9px', color: '#8b5cf6' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#8b5cf6')}
                            >
                                MORE →
                            </button>
                        )}
                    </div>
                    {topDates.map(([dateStr, count]) => {
                        const dateMembers = membersByDate[dateStr] || [];
                        const isConf = confirmedDate === dateStr;
                        const pct = Math.round((count / totalMembers) * 100);
                        return (
                            <div
                                key={dateStr}
                                className="flex items-center gap-2.5 px-3 py-2"
                                style={{
                                    border: `1px solid ${isConf ? 'rgba(74,222,128,0.25)' : 'rgba(168,85,247,0.12)'}`,
                                    borderRadius: '3px',
                                    background: isConf ? 'rgba(74,222,128,0.04)' : 'rgba(168,85,247,0.02)',
                                }}
                            >
                                <div className="flex flex-col shrink-0 w-14">
                                    <span className="font-mono capitalize leading-tight" style={{ fontSize: '11px', color: isConf ? '#4ade80' : '#c4b5fd' }}>
                                        {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="font-mono capitalize leading-tight" style={{ fontSize: '9px', color: '#8b5cf6' }}>
                                        {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col gap-0.5">
                                    <div className="h-1 overflow-hidden" style={{ background: 'rgba(168,85,247,0.08)', borderRadius: '1px' }}>
                                        <div
                                            className="h-full transition-all duration-500"
                                            style={{ width: `${pct}%`, background: isConf ? '#4ade80' : pct === 100 ? '#e879f9' : '#a855f7', borderRadius: '1px' }}
                                        />
                                    </div>
                                    <span className="font-mono tabular-nums" style={{ fontSize: '8px', color: isConf ? 'rgba(74,222,128,0.7)' : '#8b5cf6' }}>
                                        {count}/{totalMembers} dispo
                                    </span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                    {dateMembers.slice(0, 4).map(mid => {
                                        const m = members.find(x => x.id === mid);
                                        if (!m) return null;
                                        return (
                                            <div
                                                key={mid}
                                                title={m.name}
                                                className="w-5 h-5 flex items-center justify-center font-mono shrink-0"
                                                style={{
                                                    fontSize: '7px',
                                                    border: `1px solid ${mid === memberId ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.15)'}`,
                                                    borderRadius: '2px',
                                                    background: mid === memberId ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.04)',
                                                    color: mid === memberId ? '#a78bfa' : '#8b5cf6',
                                                }}
                                            >
                                                {getInitials(m.name)}
                                            </div>
                                        );
                                    })}
                                    {dateMembers.length > 4 && (
                                        <span className="font-mono ml-0.5" style={{ fontSize: '8px', color: '#8b5cf6' }}>
                                            +{dateMembers.length - 4}
                                        </span>
                                    )}
                                </div>
                                {isConf && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />}
                            </div>
                        );
                    })}
                </div>
                </motion.div>
                )}
                </AnimatePresence>

                {/* ── Admin confirm button ────────────────────────────── */}
                {isAdmin && allDatesWithVotes.length > 0 && (
                    <button
                        onClick={() => setIsOverrideModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 py-2 mt-1 font-mono uppercase tracking-[0.15em] transition-colors"
                        style={{ fontSize: '10px', color: '#8b5cf6', border: '1px solid rgba(168,85,247,0.1)', borderRadius: '3px' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#e879f9'; e.currentTarget.style.borderColor = 'rgba(232,121,249,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#8b5cf6'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.1)'; }}
                    >
                        <Crown className="w-3 h-3" />
                        CONFIRM_DATE
                    </button>
                )}

                {/* ── All slots dialog ────────────────────────────────── */}
                <Dialog open={isAllSlotsOpen} onOpenChange={setIsAllSlotsOpen}>
                    <DialogContent
                        className="flex flex-col p-0 overflow-hidden"
                        style={{ maxWidth: '400px', width: 'calc(100% - 2rem)', background: 'rgba(8,0,20,0.99)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '4px', boxShadow: '0 0 40px rgba(168,85,247,0.12)' }}
                    >
                        <div className="w-full h-[2px] shrink-0" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />
                        <div className="p-5">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="font-mono text-[0.8rem] uppercase tracking-[0.2em]" style={{ color: '#c4b5fd' }}>
                                    {'> ALL_SLOTS'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                                {sortedDates.map(([dateStr, count]) => {
                                    const dateMembers = membersByDate[dateStr] || [];
                                    const isConf = confirmedDate === dateStr;
                                    const pct = Math.round((count / totalMembers) * 100);
                                    return (
                                        <div
                                            key={dateStr}
                                            className="flex items-center gap-2.5 px-3 py-2"
                                            style={{ border: `1px solid ${isConf ? 'rgba(74,222,128,0.25)' : 'rgba(168,85,247,0.12)'}`, borderRadius: '3px', background: isConf ? 'rgba(74,222,128,0.04)' : 'rgba(168,85,247,0.02)' }}
                                        >
                                            <div className="flex flex-col shrink-0 w-14">
                                                <span className="font-mono capitalize leading-tight" style={{ fontSize: '11px', color: isConf ? '#4ade80' : '#c4b5fd' }}>
                                                    {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="font-mono capitalize leading-tight" style={{ fontSize: '9px', color: '#8b5cf6' }}>
                                                    {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-0.5">
                                                <div className="h-1 overflow-hidden" style={{ background: 'rgba(168,85,247,0.08)', borderRadius: '1px' }}>
                                                    <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: isConf ? '#4ade80' : pct === 100 ? '#e879f9' : '#a855f7', borderRadius: '1px' }} />
                                                </div>
                                                <span className="font-mono tabular-nums" style={{ fontSize: '8px', color: isConf ? 'rgba(74,222,128,0.7)' : '#8b5cf6' }}>
                                                    {count}/{totalMembers}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                {dateMembers.slice(0, 4).map(mid => {
                                                    const m = members.find(x => x.id === mid);
                                                    if (!m) return null;
                                                    return (
                                                        <div key={mid} title={m.name} className="w-5 h-5 flex items-center justify-center font-mono shrink-0" style={{ fontSize: '7px', border: `1px solid ${mid === memberId ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.15)'}`, borderRadius: '2px', background: mid === memberId ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.04)', color: mid === memberId ? '#a78bfa' : '#8b5cf6' }}>
                                                            {getInitials(m.name)}
                                                        </div>
                                                    );
                                                })}
                                                {dateMembers.length > 4 && <span className="font-mono ml-0.5" style={{ fontSize: '8px', color: '#8b5cf6' }}>+{dateMembers.length - 4}</span>}
                                            </div>
                                            {isConf && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ── Admin confirm dialog ────────────────────────────── */}
                <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                    <DialogContent
                        className="flex flex-col p-0 overflow-hidden"
                        style={{ maxWidth: '400px', width: 'calc(100% - 2rem)', background: 'rgba(8,0,20,0.99)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '4px', boxShadow: '0 0 40px rgba(168,85,247,0.12)' }}
                    >
                        <div className="w-full h-[2px] shrink-0" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />
                        <div className="p-5">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="font-mono text-[0.8rem] uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: '#c4b5fd' }}>
                                    <Crown className="w-3.5 h-3.5" style={{ color: '#e879f9' }} />
                                    {'> CONFIRM_DATE'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                                {[...allDatesWithVotes].sort(([, a], [, b]) => b - a).map(([dateStr, count]) => (
                                    <button
                                        key={dateStr}
                                        onClick={() => handleConfirmDate(dateStr)}
                                        disabled={!!confirmingDate}
                                        className="flex items-center justify-between px-3 py-2.5 font-mono transition-colors text-left"
                                        style={{
                                            border: `1px solid ${confirmedDate === dateStr ? 'rgba(74,222,128,0.3)' : 'rgba(168,85,247,0.12)'}`,
                                            borderRadius: '3px',
                                            background: confirmedDate === dateStr ? 'rgba(74,222,128,0.06)' : 'transparent',
                                            color: confirmedDate === dateStr ? '#4ade80' : '#c4b5fd',
                                        }}
                                        onMouseEnter={e => {
                                            if (confirmedDate !== dateStr) {
                                                e.currentTarget.style.background = 'rgba(168,85,247,0.06)';
                                                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (confirmedDate !== dateStr) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)';
                                            }
                                        }}
                                    >
                                        <span className="capitalize text-sm">
                                            {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono tabular-nums" style={{ fontSize: '10px', color: '#8b5cf6' }}>{count}/{totalMembers}</span>
                                            {confirmingDate === dateStr ? (
                                                <CircleNotch className="w-3.5 h-3.5 animate-spin" style={{ color: '#8b5cf6' }} />
                                            ) : confirmedDate === dateStr ? (
                                                <Check className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                                            ) : null}
                                        </div>
                                    </button>
                                ))}
                                {confirmedDate && (
                                    <button
                                        onClick={() => handleConfirmDate(confirmedDate)}
                                        disabled={!!confirmingDate}
                                        className="mt-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors flex items-center justify-between"
                                        style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: '3px', color: 'rgba(239,68,68,0.65)' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = 'rgb(239,68,68)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.65)'; }}
                                    >
                                        <span>CANCEL_CONFIRMED_DATE</span>
                                        {confirmingDate === confirmedDate && <CircleNotch className="w-3.5 h-3.5 animate-spin" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        );
    }

    // ── NEO-BRUTALIST IN-PERSON RENDER ───────────────────────────────────────
    return (
        <div className="flex flex-col gap-3">

            {/* ── Header : navigation + vue toggle ───────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={navPrev}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60"
                    >
                        <CaretLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-black text-white min-w-[110px] text-center">
                        {viewMode === 'week' ? weekLabel : `${MONTHS_FR[month]} ${year}`}
                    </span>
                    <button
                        onClick={navNext}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60"
                    >
                        <CaretRight className="w-3.5 h-3.5" />
                    </button>
                    {!isCurrentPeriod && (
                        <button
                            onClick={navToday}
                            className="text-[10px] font-black text-[var(--v2-primary)] hover:bg-[var(--v2-primary)]/10 px-2 py-1 rounded-lg transition-colors ml-0.5"
                        >
                            Auj.
                        </button>
                    )}
                </div>

                {/* Vue toggle */}
                <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('week')}
                        className={cn(
                            'text-[10px] font-black px-2 py-1 rounded-md transition-colors',
                            viewMode === 'week' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'
                        )}
                    >
                        Sem.
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={cn(
                            'text-[10px] font-black px-2 py-1 rounded-md transition-colors',
                            viewMode === 'month' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'
                        )}
                    >
                        Mois
                    </button>
                </div>
            </div>

            {/* ── En-têtes jours ─────────────────────────────────────────── */}
            <div className="grid grid-cols-7 gap-0.5">
                {(viewMode === 'week' ? weekDays.map(d => DAYS_FR[(d.getDay() + 6) % 7]) : DAYS_FR).map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-black uppercase tracking-wide text-white/20 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* ── Grille ──────────────────────────────────────────────────── */}
            {viewMode === 'week' ? (
                <div className="grid grid-cols-7 gap-0.5">
                    {weekDays.map(d => {
                        const dateStr = toDateStr(d);
                        return renderDayCell(dateStr, d.getDate());
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-0.5">
                    {(() => {
                        const cells: (null | number)[] = [];
                        for (let i = 0; i < firstDay; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                        return cells.map((day, i) => {
                            if (!day) return <div key={`empty-${i}`} />;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            return renderDayCell(dateStr, day);
                        });
                    })()}
                </div>
            )}

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

            {/* ── Fix #5 : synthèse créneaux ───────────────────────────────── */}
            <AnimatePresence initial={false}>
            {topDates.length > 0 && (
            <motion.div
                key="top-dates"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
            >
            <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">
                        Créneaux disponibles
                    </p>
                    {hasMoreDates && (
                        <button
                            onClick={() => setIsAllSlotsOpen(true)}
                            className="text-[10px] font-black text-[var(--v2-primary)]/60 hover:text-[var(--v2-primary)] transition-colors"
                        >
                            Voir plus →
                        </button>
                    )}
                </div>
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
                                        const m = membersMap[mid];
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
            </motion.div>
            )}
            </AnimatePresence>

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

            {/* ── Modal tous les créneaux ──────────────────────────────────── */}
            <Dialog open={isAllSlotsOpen} onOpenChange={setIsAllSlotsOpen}>
                <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-sm font-black uppercase tracking-[0.15em] text-white">
                            Tous les créneaux
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                        {sortedDates.map(([dateStr, count]) => {
                            const dateMembers = membersByDate[dateStr] || [];
                            const isConf = confirmedDate === dateStr;
                            const pct = Math.round((count / totalMembers) * 100);
                            return (
                                <div
                                    key={dateStr}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border',
                                        isConf ? 'bg-green-500/8 border-green-500/25' : 'bg-white/[0.02] border-white/5',
                                    )}
                                >
                                    <div className="flex flex-col shrink-0 w-14">
                                        <span className={cn('text-[11px] font-black capitalize leading-tight', isConf ? 'text-green-400' : 'text-white/70')}>
                                            {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-[9px] text-white/25 capitalize leading-tight">
                                            {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-0.5">
                                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full transition-all duration-500', isConf ? 'bg-green-500' : pct === 100 ? 'bg-amber-400' : 'bg-white/20')}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className={cn('text-[8px] font-black tabular-nums', isConf ? 'text-green-400/60' : 'text-white/20')}>
                                            {count}/{totalMembers} dispo
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        {dateMembers.slice(0, 4).map(mid => {
                                            const m = membersMap[mid];
                                            if (!m) return null;
                                            return (
                                                <div key={mid} title={m.name} className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black border shrink-0', mid === memberId ? 'bg-[var(--v2-primary)]/15 text-[var(--v2-primary)] border-[var(--v2-primary)]/40' : 'bg-white/8 text-white/50 border-white/10')}>
                                                    {getInitials(m.name)}
                                                </div>
                                            );
                                        })}
                                        {dateMembers.length > 4 && <span className="text-[8px] text-white/20 font-bold ml-0.5">+{dateMembers.length - 4}</span>}
                                    </div>
                                    {isConf && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

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
