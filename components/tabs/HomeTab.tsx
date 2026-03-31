'use client';

import { cn } from '@/lib/utils';
import type { Group, Member, LocationProposal, DateVote } from '@/types/database';
import { HeroBlock } from '@/components/HeroBlock';
import { MembersCompact } from '@/components/MembersCompact';
import { CalendarTab } from '@/components/tabs/CalendarTab';
import { LocationTab } from '@/components/tabs/LocationTab';
import { TimerPicker } from '@/components/TimerPicker';
import { TimeProposalModal } from '@/components/TimeProposalModal';
import { updateMemberAction } from '@/app/actions/member';
import { updateLocationAction } from '@/app/actions/group';
import { CalendarBlank, MapPin, CaretDown, UserPlus } from '@phosphor-icons/react';
import { useState } from 'react';
import { AddLocationProposalModal } from '@/components/AddLocationProposalModal';
import { ShareMenu } from '@/components/ShareMenu';

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
    // Calendar data (passed inline)
    votes: DateVote[];
    onVotesChange: (votes: DateVote[]) => void;
    // Location data (passed inline)
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
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    const currentMember = members.find(m => m.id === memberId);

    // Formatted dates
    const confirmedDate = group.confirmed_date
        ? new Date(group.confirmed_date + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'short', day: 'numeric', month: 'short',
        })
        : null;
    const formattedPopularDate = popularDate
        ? new Date(popularDate + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'short', day: 'numeric', month: 'short',
        })
        : null;

    const displayDate = confirmedDate || formattedPopularDate;
    const displayLocation = group.location?.name || topLocationProposal?.name;

    const calendarEnabled = group.calendar_voting_enabled;
    const locationEnabled = group.location_voting_enabled;

    // Vote nudge indicators
    const myVoteCount = votes.filter(v => v.member_id === memberId).length;
    const uniqueVotedDates = new Set(votes.map(v => v.date)).size;
    const needsCalendarVote = calendarEnabled && myVoteCount === 0 && !!memberId;

    const hasProposedLocation = proposals.some(p => p.member_id === memberId);
    const hasVotedLocation = Object.keys(myLocationVotes).length > 0;
    const needsLocationAction = locationEnabled && proposals.length > 0 && !hasProposedLocation && !hasVotedLocation && !!memberId;

    // Grid: single column when a card is expanded (avoids cramped calendar)
    const bothEnabled = calendarEnabled && locationEnabled;
    const anyOpen = isCalendarOpen || isLocationOpen;
    const gridClass = bothEnabled && !anyOpen ? 'grid-cols-2' : 'grid-cols-1';

    // Invite nudge: group is small and no pending actions
    const showInviteNudge = members.length < 4 && !!memberId;

    return (
        <div className="flex flex-col gap-4">

            {/* ── STATUS STRIP ── */}
            {(displayDate || displayLocation || (isAdmin && !locationEnabled)) ? (
                <div className="flex items-center gap-2 flex-wrap px-0.5">
                    {displayDate && (
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                            <CalendarBlank className="w-3 h-3 text-[var(--v2-primary)] shrink-0" weight="fill" />
                            <span className="text-[11px] font-black text-white/65 capitalize">{displayDate}</span>
                            {confirmedDate && (
                                <span className="text-[8px] font-black text-green-400 ml-0.5">✓</span>
                            )}
                        </div>
                    )}
                    {displayLocation && (
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                            <MapPin className="w-3 h-3 text-[var(--v2-accent)] shrink-0" weight="fill" />
                            <span className="text-[11px] font-black text-white/65 truncate max-w-[130px]">{displayLocation}</span>
                        </div>
                    )}
                    {isAdmin && !locationEnabled && !group.location?.name && (
                        <button
                            onClick={() => setShowLocationModal(true)}
                            className="flex items-center gap-1.5 bg-[var(--v2-primary)]/8 border border-[var(--v2-primary)]/20 rounded-full px-3 py-1.5 hover:bg-[var(--v2-primary)]/15 transition-colors"
                        >
                            <MapPin className="w-3 h-3 text-[var(--v2-primary)] shrink-0" />
                            <span className="text-[11px] font-black text-[var(--v2-primary)]/80">+ Lieu</span>
                        </button>
                    )}
                    {isAdmin && !locationEnabled && group.location?.name && (
                        <button
                            onClick={() => setShowLocationModal(true)}
                            className="flex items-center gap-1.5 bg-white/4 border border-white/8 rounded-full px-3 py-1.5 hover:bg-white/8 transition-colors"
                        >
                            <span className="text-[11px] font-black text-white/30">Modifier →</span>
                        </button>
                    )}
                </div>
            ) : memberId && calendarEnabled && (
                /* Empty state nudge: nothing set yet → prompt to vote */
                <div className="flex items-center gap-2 px-0.5">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-primary)] animate-pulse shrink-0" />
                        <span className="text-[11px] font-black text-white/25">
                            Commence par voter une date ↓
                        </span>
                    </div>
                </div>
            )}

            {/* ── HERO BLOCK ── */}
            {memberId && (
                <HeroBlock
                    slug={slug}
                    memberId={memberId}
                    isReady={isReady}
                    timerEndTime={timerEndTime}
                    readyCount={readyCount}
                    totalCount={members.length}
                    localOptimisticReady={localOptimisticReady}
                    onOptimisticChange={onSetLocalOptimisticReady}
                />
            )}

            {/* ── INVITE NUDGE ── shown when group is small */}
            {showInviteNudge && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-dashed border-white/10 bg-white/2">
                    <UserPlus className="w-4 h-4 text-white/25 shrink-0" />
                    <span className="text-[11px] font-black text-white/25 flex-1">
                        Invite tes amis à rejoindre
                    </span>
                    <ShareMenu
                        groupName={group.name}
                        url={typeof window !== 'undefined' ? window.location.href : ''}
                        variant="button"
                    />
                </div>
            )}

            {/* ── MEMBERS COMPACT ── */}
            <MembersCompact
                members={members}
                currentMemberId={memberId}
                loading={loadingMembers}
                onOpenManage={onOpenManage}
                isAdmin={isAdmin}
            />

            {/* ── ACTION CARDS ── Calendar + Location */}
            {(calendarEnabled || locationEnabled || (isAdmin && !locationEnabled)) && (
                <div className={cn('grid gap-3 transition-all duration-300', gridClass)}>

                    {/* Calendar card */}
                    {calendarEnabled && (
                        <div
                            className="flex flex-col rounded-2xl border-2 border-white/8 overflow-hidden"
                            style={{ background: '#0c0c0c', boxShadow: '3px 3px 0px #000' }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCalendarOpen(v => !v);
                                    if (!isCalendarOpen) setIsLocationOpen(false); // close other
                                }}
                                className="flex flex-col gap-1 p-3.5 text-left hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarBlank className="w-3.5 h-3.5 text-[var(--v2-primary)]" weight="fill" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                            Calendrier
                                        </span>
                                        {/* Nudge dot: hasn't voted yet */}
                                        {needsCalendarVote && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-primary)] animate-pulse" />
                                        )}
                                    </div>
                                    <CaretDown
                                        className={cn('w-3 h-3 text-white/20 transition-transform duration-200', isCalendarOpen && 'rotate-180')}
                                        weight="bold"
                                    />
                                </div>
                                {displayDate ? (
                                    <p className="text-sm font-black text-white capitalize leading-tight mt-0.5">{displayDate}</p>
                                ) : (
                                    <p className="text-xs text-white/25 mt-0.5">
                                        {needsCalendarVote ? 'Vote ta dispo !' : 'Aucun vote'}
                                    </p>
                                )}
                                <p className="text-[9px] text-white/20 uppercase tracking-wider">
                                    {uniqueVotedDates} date{uniqueVotedDates !== 1 ? 's' : ''} · {myVoteCount} vote{myVoteCount !== 1 ? 's' : ''}
                                </p>
                            </button>

                            {/* Inline calendar */}
                            <div className={cn(
                                'grid transition-all duration-300 ease-in-out',
                                isCalendarOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            )}>
                                <div className="overflow-hidden">
                                    <div className="border-t-2 border-white/6 p-3">
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
                    )}

                    {/* Location card */}
                    {locationEnabled && (
                        <div
                            className="flex flex-col rounded-2xl border-2 border-white/8 overflow-hidden"
                            style={{ background: '#0c0c0c', boxShadow: '3px 3px 0px #000' }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLocationOpen(v => !v);
                                    if (!isLocationOpen) setIsCalendarOpen(false); // close other
                                }}
                                className="flex flex-col gap-1 p-3.5 text-left hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-[var(--v2-accent)]" weight="fill" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                            Lieux
                                        </span>
                                        {/* Nudge dot: has proposals but user hasn't participated */}
                                        {needsLocationAction && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        )}
                                    </div>
                                    <CaretDown
                                        className={cn('w-3 h-3 text-white/20 transition-transform duration-200', isLocationOpen && 'rotate-180')}
                                        weight="bold"
                                    />
                                </div>
                                {displayLocation ? (
                                    <p className="text-sm font-black text-white truncate leading-tight mt-0.5">{displayLocation}</p>
                                ) : (
                                    <p className="text-xs text-white/25 mt-0.5">Aucune prop.</p>
                                )}
                                <p className="text-[9px] text-white/20 uppercase tracking-wider">
                                    {proposals.length} proposition{proposals.length !== 1 ? 's' : ''}
                                </p>
                            </button>

                            {/* Inline location */}
                            <div className={cn(
                                'grid transition-all duration-300 ease-in-out',
                                isLocationOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            )}>
                                <div className="overflow-hidden">
                                    <div className="border-t-2 border-white/6 p-3">
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
                    )}
                </div>
            )}

            {/* ── POWER USER ZONE ── */}
            {memberId && (
                <div className="flex flex-col gap-2 mt-1">
                    <button
                        type="button"
                        onClick={() => setIsOptionsOpen(v => !v)}
                        className="flex items-center gap-3 py-1.5 group"
                    >
                        <div className="h-px flex-1 bg-white/5 group-hover:bg-white/8 transition-colors" />
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/18 group-hover:text-white/30 transition-colors flex items-center gap-1.5">
                            Options
                            <CaretDown className={cn('w-3 h-3 transition-transform duration-200', isOptionsOpen && 'rotate-180')} />
                        </span>
                        <div className="h-px flex-1 bg-white/5 group-hover:bg-white/8 transition-colors" />
                    </button>

                    <div className={cn(
                        'grid transition-all duration-200 ease-in-out',
                        isOptionsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    )}>
                        <div className="overflow-hidden">
                            <div className="flex gap-2 pb-1">
                                <div className="flex-1">
                                    <TimerPicker
                                        currentTimerEnd={timerEndTime}
                                        onUpdate={async (updates) => {
                                            if (!memberId) return;
                                            await updateMemberAction(slug, memberId, updates);
                                        }}
                                    />
                                </div>
                                {group.type === 'in_person' && (
                                    <div className="flex-1">
                                        <TimeProposalModal
                                            currentProposedTime={currentMember?.proposed_time ?? null}
                                            onUpdate={async (updates) => {
                                                if (!memberId) return;
                                                await updateMemberAction(slug, memberId, updates);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
