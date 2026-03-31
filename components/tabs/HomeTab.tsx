'use client';

import { cn } from '@/lib/utils';
import type { Group, Member, LocationProposal } from '@/types/database';
import ReadyButton from '@/components/ReadyButton';
import ProgressCounter from '@/components/ProgressCounter';
import MemberList from '@/components/MemberList';
import { TimerPicker } from '@/components/TimerPicker';
import { TimeProposalModal } from '@/components/TimeProposalModal';
import { updateMemberAction } from '@/app/actions/member';
import { CalendarBlank, MapPin, CaretDown, Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { AddLocationProposalModal } from '@/components/AddLocationProposalModal';
import { updateLocationAction } from '@/app/actions/group';

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
    onOpenOptions?: () => void;
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
}: HomeTabProps) {
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const totalCount = members.length;
    const currentMember = members.find(m => m.id === memberId);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Format confirmed_date for display
    const confirmedDate = group.confirmed_date
        ? new Date(group.confirmed_date + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long'
        })
        : null;

    const formattedPopularDate = popularDate
        ? new Date(popularDate + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long'
        })
        : null;

    return (
        <div className="flex flex-col gap-6">
            {/* ── BRIEFING RAPIDE (pour les flemmards) ── */}
            {(confirmedDate || formattedPopularDate || topLocationProposal || group.location?.name || (isAdmin && !group.location_voting_enabled)) && (() => {
                const notReady = totalCount - readyCount;
                const flemmeRatio = totalCount > 0 ? notReady / totalCount : 0;
                const SEGMENTS = 10;
                const filledSegments = Math.round((1 - flemmeRatio) * SEGMENTS);
                const flemmeLabel =
                    flemmeRatio === 0   ? ['ZÉRO', '#4ade80', '🔥 ON EST TOUS CHAUDS'] :
                    flemmeRatio < 0.25  ? ['FAIBLE', '#86efac', '💪 PRESQUE LÀ'] :
                    flemmeRatio < 0.5   ? ['MODÉRÉ', '#fbbf24', '😐 MOUAIS...'] :
                    flemmeRatio < 0.75  ? ['ÉLEVÉ', '#f97316', '🥱 C\'EST CHAUD'] :
                    flemmeRatio < 1     ? ['CRITIQUE', '#ef4444', '💀 PERSONNE BOUGE'] :
                                         ['CATASTROPHIQUE', '#ff2e2e', '🪦 ILS SONT MORTS'];

                return (
                    <div
                        className="rounded-2xl overflow-hidden border-2 border-white/12"
                        style={{ background: '#0c0c0c', boxShadow: '4px 4px 0px #000' }}
                    >
                        {/* Header tape */}
                        <div
                            className="flex items-center gap-2.5 px-4 py-2.5 border-b-2 border-white/8"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                            <span className="w-2 h-2 rounded-full bg-[var(--v2-primary)] shrink-0" style={{ boxShadow: '0 0 6px var(--v2-primary)' }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                                FLEMMARD.EXE
                            </span>
                            <div className="flex-1" />
                            <span className="text-[9px] font-mono tracking-widest text-white/20 uppercase">BRIEFING RAPIDE</span>
                        </div>

                        {/* Info rows */}
                        <div className="p-4 space-y-3">
                            {/* Date */}
                            {(confirmedDate || formattedPopularDate) && (
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--v2-primary)]/30"
                                        style={{ background: 'rgba(255,46,46,0.08)', boxShadow: '2px 2px 0px rgba(0,0,0,0.6)' }}
                                    >
                                        <CalendarBlank className="w-4 h-4 text-[var(--v2-primary)]" weight="fill" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/30">QUAND</p>
                                        <p className="text-sm font-black text-white capitalize truncate">{confirmedDate || formattedPopularDate}</p>
                                    </div>
                                    {confirmedDate && (
                                        <span
                                            className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border-2 shrink-0"
                                            style={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.07)', boxShadow: '1px 1px 0px #000' }}
                                        >
                                            CONFIRMÉ
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Location */}
                            {(group.location?.name || topLocationProposal) ? (
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--v2-accent)]/30"
                                        style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '2px 2px 0px rgba(0,0,0,0.6)' }}
                                    >
                                        <MapPin className="w-4 h-4 text-[var(--v2-accent)]" weight="fill" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/30">OÙ</p>
                                        <p className="text-sm font-black text-white truncate">
                                            {group.location?.name || topLocationProposal?.name}
                                        </p>
                                    </div>
                                    {isAdmin && !group.location_voting_enabled && group.location?.name && (
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="text-[9px] font-black uppercase tracking-wider text-[var(--v2-primary)] border-2 border-[var(--v2-primary)]/40 px-2 py-1 rounded-lg hover:bg-[var(--v2-primary)]/10 transition-colors shrink-0"
                                            style={{ boxShadow: '1px 1px 0px #000' }}
                                        >
                                            Modifier
                                        </button>
                                    )}
                                </div>
                            ) : (
                                isAdmin && !group.location_voting_enabled && !group.location && (
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-white/10"
                                            style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '2px 2px 0px rgba(0,0,0,0.6)' }}
                                        >
                                            <MapPin className="w-4 h-4 text-white/25" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/30">OÙ</p>
                                            <p className="text-sm font-black text-white/30">Non défini</p>
                                        </div>
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--v2-primary)] border-2 border-[var(--v2-primary)]/40 px-2.5 py-1.5 rounded-lg hover:bg-[var(--v2-primary)]/10 transition-colors shrink-0"
                                            style={{ boxShadow: '2px 2px 0px #000' }}
                                        >
                                            <Plus className="w-3 h-3" />
                                            Ajouter
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

                        {/* ── FLEMME METER (wow element) ── */}
                        {totalCount > 1 && (
                            <div
                                className="px-4 py-3 border-t-2 border-white/8 flex items-center gap-3"
                                style={{ background: 'rgba(0,0,0,0.3)' }}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[8.5px] font-black uppercase tracking-[0.2em] text-white/30">NIVEAU DE FLEMME</span>
                                        <span
                                            className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border"
                                            style={{ color: flemmeLabel[1], borderColor: `${flemmeLabel[1]}44`, background: `${flemmeLabel[1]}11` }}
                                        >
                                            {flemmeLabel[0]}
                                        </span>
                                    </div>
                                    {/* segmented bar */}
                                    <div className="flex gap-0.5 items-center mb-1.5">
                                        {Array.from({ length: SEGMENTS }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 h-2 rounded-sm transition-all duration-300"
                                                style={{
                                                    background: i < filledSegments ? 'var(--v2-primary)' : 'rgba(255,255,255,0.08)',
                                                    boxShadow: i < filledSegments ? '0 0 4px var(--v2-primary)' : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-black text-white/50">{flemmeLabel[2]}</p>
                                </div>
                                <div
                                    className="shrink-0 text-center px-2.5 py-1.5 rounded-xl border-2"
                                    style={{
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.04)',
                                        boxShadow: '2px 2px 0px #000',
                                    }}
                                >
                                    <p className="text-xl font-black text-white leading-none">{notReady}</p>
                                    <p className="text-[8px] font-black uppercase tracking-wider text-white/30 leading-none mt-0.5">flemmard{notReady > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Progress Circle */}
            <div className="flex justify-center">
                <ProgressCounter readyCount={readyCount} totalCount={totalCount} />
            </div>

            {memberId && (
                <>
                    {/* Ready Button + Options */}
                    <div className="flex flex-col gap-3">
                        <ReadyButton
                            slug={slug}
                            memberId={memberId}
                            isReady={isReady}
                            timerEndTime={timerEndTime}
                            onOptimisticChange={onSetLocalOptimisticReady}
                        />

                        {/* Additional Options Collapsible */}
                        <div className="flex flex-col gap-2">
                            <div
                                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                                className="flex items-center gap-4 cursor-pointer group py-2"
                            >
                                <div className="h-[1px] flex-1 bg-white/5 group-hover:bg-white/10 transition-colors" />
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 group-hover:text-slate-400 transition-colors shrink-0">
                                    Plus d&apos;options
                                </h4>
                                <div className="h-[1px] w-8 bg-white/5 group-hover:bg-white/10 transition-colors" />
                                <CaretDown className={cn("w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-all duration-300", isOptionsOpen ? "rotate-180" : "")} />
                            </div>

                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                isOptionsOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
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
                    </div>

                    {/* Members List */}
                    <div className="flex flex-col items-end w-full mt-2">
                        {isAdmin && (
                            <button
                                onClick={onOpenManage}
                                className="text-xs font-semibold text-[var(--v2-primary)] hover:text-white transition-colors uppercase tracking-wider mb-2 pr-2"
                            >
                                Gérer le groupe
                            </button>
                        )}
                        <div className="w-full">
                            <MemberList members={members} loading={loadingMembers} currentMemberId={memberId} />
                        </div>
                    </div>
                </>
            )}

            {showLocationModal && (
                <AddLocationProposalModal
                    isOpen={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    city={group.city}
                    baseLat={group.base_lat}
                    baseLng={group.base_lng}
                    onSubmit={async (data) => {
                        if (!memberId || !group.id) return;
                        const newLocation = {
                            name: data.name,
                            address: '',
                            link: data.link,
                            image: data.image,
                            description: data.description,
                        };
                        await updateLocationAction(slug, memberId, group.id, newLocation);
                        setShowLocationModal(false);
                    }}
                />
            )}
        </div>
    );
}
