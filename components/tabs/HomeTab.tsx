'use client';

import { cn } from '@/lib/utils';
import type { Group, Member, LocationProposal, DateVote } from '@/types/database';
import { HeroBlock } from '@/components/HeroBlock';
import { MembersCompact } from '@/components/MembersCompact';
import { CalendarTab } from '@/components/tabs/CalendarTab';
import { LocationTab } from '@/components/tabs/LocationTab';
import { TimeProposalModal } from '@/components/TimeProposalModal';
import { updateMemberAction } from '@/app/actions/member';
import { updateLocationAction } from '@/app/actions/group';
import { CalendarDots, MapTrifold, GameController, CaretDown } from '@phosphor-icons/react';
import { VenueCard } from '@/components/VenueCard';
import { GameCard } from '@/components/GameCard';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddLocationProposalModal } from '@/components/AddLocationProposalModal';
import { InviteBlock } from '@/components/InviteBlock';

interface HomeTabProps {
    group: Group;
    slug: string;
    memberId: string | null;
    memberName: string | null;
    members: Member[];
    loadingMembers: boolean;
    isAdmin: boolean;
    isReady: boolean;
    timerEndTime: string | null;
    readyCount: number;
    localOptimisticReady: boolean | null;
    onSetLocalOptimisticReady: (val: boolean | null) => void;
    topLocationProposal: LocationProposal | null;
    popularDate?: string | null;
    onOpenManage: () => void;
    votes: DateVote[];
    onVotesChange: (updater: DateVote[] | ((prev: DateVote[]) => DateVote[])) => void;
    proposals: LocationProposal[];
    myLocationVotes: Record<string, 1 | -1>;
    onProposalsChange: (proposals: LocationProposal[]) => void;
    onGroupChange: () => void;
}

export function HomeTab({
    group,
    slug,
    memberId,
    memberName,
    members,
    loadingMembers,
    isAdmin,
    isReady,
    timerEndTime,
    readyCount,
    localOptimisticReady,
    onSetLocalOptimisticReady,
    topLocationProposal,
    popularDate,
    onOpenManage,
    votes,
    onVotesChange,
    proposals,
    myLocationVotes,
    onProposalsChange,
    onGroupChange,
}: HomeTabProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [etaModalOpen, setEtaModalOpen] = useState(false);

    const optionsRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);

    const scrollIntoViewIfNeeded = (ref: React.RefObject<HTMLDivElement | null>, delay: number) => {
        setTimeout(() => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.bottom > window.innerHeight) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, delay);
    };


    useEffect(() => {
        if (isCalendarOpen) scrollIntoViewIfNeeded(calendarRef, 330);
    }, [isCalendarOpen]);

    useEffect(() => {
        if (isLocationOpen) scrollIntoViewIfNeeded(locationRef, 330);
    }, [isLocationOpen]);

    const currentMember = members.find(m => m.id === memberId);
    const effectiveReady = localOptimisticReady !== null ? localOptimisticReady : isReady;

    const isRemote = group.type === 'remote';
    const calendarEnabled = group.calendar_voting_enabled;
    const locationEnabled = group.location_voting_enabled;

    const today = new Date().toISOString().slice(0, 10);
    const isActualDay = !!group.confirmed_date && group.confirmed_date === today;
    const isPlanning = calendarEnabled || locationEnabled;

    // En mode planification, les membres qui ont voté
    const votedMemberIds = isPlanning ? new Set(votes.map(v => v.member_id)) : undefined;

    // Formatted dates
    const confirmedDate = group.confirmed_date
        ? new Date(group.confirmed_date + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
        })
        : null;
    const formattedPopularDate = popularDate
        ? new Date(popularDate + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
        })
        : null;

    const displayDate = confirmedDate || formattedPopularDate;
    const rawCalendarDate = group.confirmed_date || popularDate;

    const addToCalendar = () => {
        if (!rawCalendarDate) return;
        const dateStr = rawCalendarDate.replace(/-/g, '');
        const next = new Date(rawCalendarDate + 'T00:00:00');
        next.setDate(next.getDate() + 1);
        const nextStr = next.toISOString().slice(0, 10).replace(/-/g, '');
        const loc = displayLocation || '';
        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//rdychk//FR',
            'BEGIN:VEVENT',
            `DTSTART;VALUE=DATE:${dateStr}`,
            `DTEND;VALUE=DATE:${nextStr}`,
            `SUMMARY:${group.name}`,
            loc ? `LOCATION:${loc}` : '',
            'END:VEVENT',
            'END:VCALENDAR',
        ].filter(Boolean).join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${group.name}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const categoryFilter = isRemote ? 'game' : 'location';
    const filteredProposals = proposals.filter(p => (p as any).category === categoryFilter || ((p as any).category == null && !isRemote));
    const filteredTopProposal = filteredProposals.length > 0
        ? [...filteredProposals].sort((a, b) => b.score - a.score)[0]
        : null;

    const displayLocation = group.location?.name || filteredTopProposal?.name;
    const locationImage = group.location?.image || filteredTopProposal?.image;
    const locationMapsUrl = (() => {
        const link = group.location?.link || filteredTopProposal?.link;
        if (link) return link;
        const query = group.location?.address || group.location?.name || filteredTopProposal?.description || filteredTopProposal?.name;
        return query ? `https://maps.google.com/?q=${encodeURIComponent(query)}` : null;
    })();

    // Vote nudge indicators
    const myVoteCount = votes.filter(v => v.member_id === memberId).length;
    const uniqueVotedDates = new Set(votes.map(v => v.date)).size;
    const needsCalendarVote = calendarEnabled && myVoteCount === 0 && !!memberId;

    const hasProposedLocation = filteredProposals.some(p => p.member_id === memberId);
    const hasVotedLocation = Object.keys(myLocationVotes).length > 0;
    const needsLocationAction = locationEnabled && filteredProposals.length > 0 && !hasProposedLocation && !hasVotedLocation && !!memberId;

    const showInviteNudge = members.length < 3 && !!memberId;

    // ── SHARED: STATUS STRIP ──
    const statusStrip = (displayDate || displayLocation || (isAdmin && !locationEnabled)) ? (
        <div className="flex items-center gap-2 flex-wrap px-0.5">
            {displayDate && !isActualDay && (
                <button
                    type="button"
                    onClick={addToCalendar}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 min-w-0 max-w-full hover:bg-white/10 hover:border-white/15 active:scale-95 transition-all duration-150"
                >
                    <CalendarDots className="w-3 h-3 text-[var(--v2-primary)] shrink-0" weight="fill" />
                    <span className="text-xs font-black text-white/75 capitalize truncate">{displayDate}</span>
                    {confirmedDate && (
                        <span className="text-[11px] font-black text-green-400 ml-0.5 shrink-0">✓</span>
                    )}
                </button>
            )}
            {displayDate && isActualDay && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 min-w-0 max-w-full">
                    <CalendarDots className="w-3 h-3 text-green-400 shrink-0" weight="fill" />
                    <span className="text-xs font-black text-green-400 capitalize truncate">{displayDate}</span>
                    <span className="text-[11px] font-black text-green-400 ml-0.5 shrink-0">✓</span>
                </div>
            )}
            {displayLocation && (
                isRemote || !locationMapsUrl ? (
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 min-w-0 max-w-full">
                        {isRemote
                            ? <GameController className="w-3 h-3 text-[var(--v2-primary)] shrink-0" weight="fill" />
                            : <MapTrifold className="w-3 h-3 text-[var(--v2-accent)] shrink-0" weight="fill" />
                        }
                        <span className="text-xs font-black text-white/75 truncate">{displayLocation}</span>
                    </div>
                ) : (
                    <a
                        href={locationMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 min-w-0 max-w-full hover:bg-white/10 hover:border-white/15 active:scale-95 transition-all duration-150"
                    >
                        <MapTrifold className="w-3 h-3 text-[var(--v2-accent)] shrink-0" weight="fill" />
                        <span className="text-xs font-black text-white/75 truncate">{displayLocation}</span>
                    </a>
                )
            )}
            {isAdmin && !locationEnabled && !group.location?.name && (
                <button
                    onClick={() => setShowLocationModal(true)}
                    className="flex items-center gap-1.5 bg-[var(--v2-primary)]/8 border border-[var(--v2-primary)]/20 rounded-full px-3 py-1.5 hover:bg-[var(--v2-primary)]/15 transition-colors"
                >
                    {isRemote
                        ? <GameController className="w-3 h-3 text-[var(--v2-primary)] shrink-0" />
                        : <MapTrifold className="w-3 h-3 text-[var(--v2-primary)] shrink-0" />
                    }
                    <span className="text-xs font-black text-[var(--v2-primary)]/90">{isRemote ? '+ Jeu' : '+ Lieu'}</span>
                </button>
            )}
            {isAdmin && !locationEnabled && group.location?.name && (
                <button
                    onClick={() => setShowLocationModal(true)}
                    className="flex items-center gap-1.5 bg-white/4 border border-white/8 rounded-full px-3 py-1.5 hover:bg-white/8 transition-colors"
                >
                    <span className="text-xs font-black text-white/40">Modifier →</span>
                </button>
            )}
        </div>
    ) : null;

    // ── SHARED: ACTION CARDS ──
    const actionCards = (calendarEnabled || locationEnabled || (isAdmin && !locationEnabled)) && (
        <div className="flex flex-wrap gap-3">
            {(calendarEnabled || locationEnabled) && (
                <p
                    className="w-full text-[12px] font-black uppercase tracking-[0.28em] text-white/25 px-0.5"
                    style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                >
                    Choisi ce que tu préf
                </p>
            )}

            {calendarEnabled && (
                <motion.div
                    layout
                    key="calendar-card"
                    className="min-w-0"
                    style={{
                        width: calendarEnabled && locationEnabled && !isCalendarOpen && !isLocationOpen ? 'calc(50% - 6px)' : '100%',
                    }}
                    transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                >
                    <div
                        ref={calendarRef}
                        className={cn(
                            'flex flex-col overflow-hidden h-full transition-all duration-300',
                            !isRemote && 'rounded-2xl border-[3px] border-black',
                            !isRemote && (needsCalendarVote ? 'animate-vote-nudge' : ''),
                        )}
                        style={isRemote ? {
                            borderRadius: '4px',
                            border: needsCalendarVote ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(168,85,247,0.2)',
                            background: 'rgba(8,0,20,0.95)',
                            boxShadow: needsCalendarVote ? '0 0 20px rgba(168,85,247,0.15)' : '0 0 12px rgba(168,85,247,0.05)',
                        } : {
                            background: '#0c0c0c',
                            boxShadow: needsCalendarVote ? `5px 5px 0px var(--v2-primary)` : '5px 5px 0px #000',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setIsCalendarOpen(v => !v);
                                if (!isCalendarOpen) setIsLocationOpen(false);
                            }}
                            className={cn('flex flex-col gap-1.5 px-4 pt-3 pb-3 text-left transition-colors', !isRemote && 'hover:bg-white/[0.025]')}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarDots
                                        className="w-4 h-4 shrink-0"
                                        style={{ color: needsCalendarVote ? 'var(--v2-primary)' : isRemote ? '#8b5cf6' : 'rgba(255,255,255,0.4)' }}
                                        weight="fill"
                                    />
                                    {isRemote ? (
                                        <span className="font-mono text-[0.8rem] uppercase tracking-[0.18em]" style={{ color: needsCalendarVote ? '#a855f7' : '#c4b5fd' }}>
                                            DATE_SESSION {'>'}
                                        </span>
                                    ) : (
                                        <span
                                            className="uppercase leading-none"
                                            style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.12em', color: needsCalendarVote ? 'var(--v2-primary)' : 'rgba(255,255,255,0.75)' }}
                                        >
                                            Quand ?
                                        </span>
                                    )}
                                </div>
                                <CaretDown
                                    className={cn('w-3.5 h-3.5 transition-transform duration-200 shrink-0', isCalendarOpen && 'rotate-180')}
                                    style={{ color: isRemote ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.25)' }}
                                    weight="bold"
                                />
                            </div>
                            {displayDate ? (
                                isRemote ? (
                                    <p className="font-mono capitalize leading-tight text-white/80" style={{ fontSize: '1.05rem', letterSpacing: '0.02em' }}>{displayDate}</p>
                                ) : (
                                    <p className="capitalize leading-tight text-white" style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '0.01em' }}>{displayDate}</p>
                                )
                            ) : (
                                isRemote
                                    ? <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: '#8b5cf6' }}>TIMESTAMP_TBD</p>
                                    : <p className="text-xs text-white/25 font-black uppercase tracking-wider">À déterminer</p>
                            )}
                            {isRemote ? (
                                <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: '#a78bfa' }}>
                                    {uniqueVotedDates}_DATE{uniqueVotedDates !== 1 ? 'S' : ''} · {myVoteCount}_VOTE{myVoteCount !== 1 ? 'S' : ''}
                                </p>
                            ) : (
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                                    {uniqueVotedDates} date{uniqueVotedDates !== 1 ? 's' : ''} · {myVoteCount} vote{myVoteCount !== 1 ? 's' : ''}
                                </p>
                            )}
                            {needsCalendarVote && (
                                isRemote ? (
                                    <span className="self-start font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-0.5" style={{ border: '1px solid rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.08)', color: '#a855f7', borderRadius: '2px' }}>
                                        VOTE_REQUIRED {'>'}
                                    </span>
                                ) : (
                                    <span className="self-start text-[10px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-md border border-[var(--v2-primary)]/40 bg-[var(--v2-primary)]/10 text-[var(--v2-primary)]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                                        Ton vote →
                                    </span>
                                )
                            )}
                        </button>
                        <div className={cn(
                            'grid transition-all duration-300 ease-in-out',
                            isCalendarOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        )}>
                            <div className="overflow-hidden">
                                <div className={isRemote ? 'p-3' : 'border-t-[3px] border-black p-3'} style={isRemote ? { borderTop: '1px solid rgba(168,85,247,0.12)' } : {}}>
                                    <CalendarTab
                                        group={group}
                                        slug={slug}
                                        memberId={memberId}
                                        members={members}
                                        isAdmin={isAdmin}
                                        onGroupChange={onGroupChange}
                                        votes={votes}
                                        onVotesChange={onVotesChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {locationEnabled && (
                <motion.div
                    layout
                    key="location-card"
                    className="min-w-0"
                    style={{
                        width: calendarEnabled && locationEnabled && !isCalendarOpen && !isLocationOpen ? 'calc(50% - 6px)' : '100%',
                    }}
                    transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                >
                    <div
                        ref={locationRef}
                        className={cn(
                            'flex flex-col overflow-hidden h-full transition-all duration-300',
                            !isRemote && 'rounded-2xl border-[3px] border-black',
                            !isRemote && (needsLocationAction ? 'animate-vote-nudge' : ''),
                        )}
                        style={isRemote ? {
                            borderRadius: '4px',
                            border: needsLocationAction ? '1px solid rgba(217,70,239,0.5)' : '1px solid rgba(168,85,247,0.2)',
                            background: 'rgba(8,0,20,0.95)',
                            boxShadow: needsLocationAction ? '0 0 20px rgba(217,70,239,0.15)' : '0 0 12px rgba(168,85,247,0.05)',
                        } : {
                            background: '#0c0c0c',
                            boxShadow: needsLocationAction ? '5px 5px 0px #fbbf24' : '5px 5px 0px #000',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setIsLocationOpen(v => !v);
                                if (!isLocationOpen) setIsCalendarOpen(false);
                            }}
                            className={cn('flex flex-col gap-1.5 px-4 pt-3 pb-3 text-left transition-colors', !isRemote && 'hover:bg-white/[0.025]')}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isRemote
                                        ? <GameController className="w-4 h-4 shrink-0" style={{ color: needsLocationAction ? '#d946ef' : '#8b5cf6' }} weight="fill" />
                                        : <MapTrifold className="w-4 h-4 shrink-0" style={{ color: needsLocationAction ? '#fbbf24' : 'rgba(255,255,255,0.4)' }} weight="fill" />
                                    }
                                    {isRemote ? (
                                        <span className="font-mono text-[0.8rem] uppercase tracking-[0.18em]" style={{ color: needsLocationAction ? '#d946ef' : '#c4b5fd' }}>
                                            SESSION_GAME {'>'}
                                        </span>
                                    ) : (
                                        <span
                                            className="uppercase leading-none"
                                            style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.12em', color: needsLocationAction ? '#fbbf24' : 'rgba(255,255,255,0.75)' }}
                                        >
                                            {isRemote ? 'Jeu ?' : 'Où ?'}
                                        </span>
                                    )}
                                </div>
                                <CaretDown
                                    className={cn('w-3.5 h-3.5 transition-transform duration-200 shrink-0', isLocationOpen && 'rotate-180')}
                                    style={{ color: isRemote ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.25)' }}
                                    weight="bold"
                                />
                            </div>
                            {displayLocation ? (
                                isRemote ? (
                                    <p className="font-mono leading-tight text-white/80 truncate" style={{ fontSize: '1.05rem', letterSpacing: '0.02em' }}>{displayLocation}</p>
                                ) : (
                                    <p className="leading-tight text-white truncate" style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '0.01em' }}>{displayLocation}</p>
                                )
                            ) : (
                                isRemote ? (
                                    <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: '#8b5cf6' }}>
                                        {needsLocationAction ? 'GAME_VOTE_REQUIRED' : 'NO_PROPOSALS'}
                                    </p>
                                ) : (
                                    <p className="text-xs text-white/25 font-black uppercase tracking-wider">
                                        {needsLocationAction ? 'Vote pour un endroit !' : 'Aucune prop.'}
                                    </p>
                                )
                            )}
                            {isRemote ? (
                                <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: '#a78bfa' }}>
                                    {proposals.length}_PROP{proposals.length !== 1 ? 'S' : ''}
                                </p>
                            ) : (
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                                    {proposals.length} proposition{proposals.length !== 1 ? 's' : ''}
                                </p>
                            )}
                            {needsLocationAction && (
                                isRemote ? (
                                    <span className="self-start font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-0.5" style={{ border: '1px solid rgba(217,70,239,0.4)', background: 'rgba(217,70,239,0.08)', color: '#d946ef', borderRadius: '2px' }}>
                                        VOTE_REQUIRED {'>'}
                                    </span>
                                ) : (
                                    <span className="self-start text-[10px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-md border border-amber-400/40 bg-amber-400/10 text-amber-400" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                                        Ton vote →
                                    </span>
                                )
                            )}
                        </button>
                        <div className={cn(
                            'grid transition-all duration-300 ease-in-out',
                            isLocationOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        )}>
                            <div className="overflow-hidden">
                                <div className={isRemote ? 'p-3' : 'border-t-[3px] border-black p-3'} style={isRemote ? { borderTop: '1px solid rgba(168,85,247,0.12)' } : {}}>
                                    <LocationTab
                                        group={group}
                                        slug={slug}
                                        memberId={memberId}
                                        isAdmin={isAdmin}
                                        proposals={proposals}
                                        myVotes={myLocationVotes}
                                        onProposalsChange={onProposalsChange}
                                        members={members}
                                        onGroupChange={onGroupChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            {/* Venue/Game card or status strip */}
            {displayLocation ? (
                isRemote ? (
                    <GameCard
                        name={displayLocation}
                        image={locationImage}
                        link={group.location?.link ?? null}
                        genres={group.location?.description ?? null}
                        date={confirmedDate ?? formattedPopularDate}
                    />
                ) : (
                    <VenueCard
                        name={displayLocation}
                        image={locationImage}
                        date={confirmedDate ?? formattedPopularDate}
                        mapsUrl={locationMapsUrl}
                        onAddToCalendar={confirmedDate && !isActualDay ? addToCalendar : undefined}
                        showCalendar={!!confirmedDate && !isActualDay}
                    />
                )
            ) : statusStrip}

                {/* ── PLANNING : votes d'abord, membres ensuite ── */}
            {isPlanning && (
                <>
                    {actionCards}
                    <MembersCompact
                        members={members}
                        currentMemberId={memberId}
                        loading={loadingMembers}
                        onOpenManage={onOpenManage}
                        isAdmin={isAdmin}
                        mode="planning"
                        votedMemberIds={votedMemberIds}
                        isRemote={isRemote}
                    />
                </>
            )}

            {/* ── JOUR J / PRÉ-JOUR : hero + ETA + membres ── */}
            {!isPlanning && (
                <>
                    {memberId && (
                        <HeroBlock
                            slug={slug}
                            memberId={memberId}
                            isReady={isReady}
                            timerEndTime={timerEndTime}
                            proposedTime={currentMember?.proposed_time ?? null}
                            readyCount={readyCount}
                            totalCount={members.length}
                            members={members}
                            localOptimisticReady={localOptimisticReady}
                            onOptimisticChange={onSetLocalOptimisticReady}
                            isRemote={isRemote}
                            isActualDay={isActualDay}
                            isPlanning={false}
                            onOpenTimeModal={() => setEtaModalOpen(true)}
                        />
                    )}

                    {/* ETA inline — jour J uniquement, avant d'être prêt */}
                    {memberId && isActualDay && (
                        <AnimatePresence initial={false}>
                            {!effectiveReady && (
                                <motion.div
                                    key="depart-block"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div ref={optionsRef}>
                                        <TimeProposalModal
                                            currentProposedTime={currentMember?.proposed_time ?? null}
                                            onUpdate={async (updates) => {
                                                if (!memberId) return;
                                                await updateMemberAction(slug, memberId, updates);
                                            }}
                                            isRemote={isRemote}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* ETA modal contrôlé — pré-jour J */}
                    {memberId && !isActualDay && (
                        <TimeProposalModal
                            currentProposedTime={currentMember?.proposed_time ?? null}
                            onUpdate={async (updates) => {
                                if (!memberId) return;
                                await updateMemberAction(slug, memberId, updates);
                            }}
                            isRemote={isRemote}
                            open={etaModalOpen}
                            onOpenChange={setEtaModalOpen}
                        />
                    )}

                    <MembersCompact
                        members={members}
                        currentMemberId={memberId}
                        loading={loadingMembers}
                        onOpenManage={onOpenManage}
                        isAdmin={isAdmin}
                        mode="day-of"
                        isRemote={isRemote}
                    />
                </>
            )}

            {showInviteNudge && (
                <InviteBlock
                    groupName={group.name}
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    memberCount={members.length}
                    isRemote={isRemote}
                />
            )}

            {/* Add location modal (admin, non-voting mode) */}
            {showLocationModal && (
                <AddLocationProposalModal
                    isOpen={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    city={group.city}
                    baseLat={group.base_lat}
                    baseLng={group.base_lng}
                    onSubmit={async (data) => {
                        if (!memberId || !group.id) return;
                        await updateLocationAction(slug, memberId, group.id, {
                            name: data.name,
                            address: '',
                            link: data.link,
                            image: data.image,
                            description: data.description,
                        });
                        setShowLocationModal(false);
                    }}
                />
            )}
        </div>
    );
}
