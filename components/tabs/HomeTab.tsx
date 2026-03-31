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
            {/* Summary block (when there's useful info) */}
            {(confirmedDate || formattedPopularDate || topLocationProposal || group.location?.name || (isAdmin && !group.location_voting_enabled)) && (
                <div className="glass-panel rounded-2xl border border-white/5 p-4 space-y-3">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Pour les flemmards :</h3>

                    {/* Date Section */}
                    {(confirmedDate || formattedPopularDate) ? (
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[var(--v2-primary)]/10 flex items-center justify-center shrink-0">
                                <CalendarBlank className="w-3.5 h-3.5 text-[var(--v2-primary)]" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Date</p>
                                <p className="text-sm font-bold text-white capitalize">{confirmedDate || formattedPopularDate}</p>
                            </div>
                        </div>
                    ) : null}

                    {/* Location Section */}
                    {(group.location?.name || topLocationProposal) ? (
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[var(--v2-accent)]/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-3.5 h-3.5 text-[var(--v2-accent)]" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Lieu</p>
                                <p className="text-sm font-bold text-white flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                    {group.location?.name || topLocationProposal?.name}
                                    {isAdmin && !group.location_voting_enabled && group.location?.name && (
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="text-[10px] text-[var(--v2-primary)] hover:underline mt-0.5 sm:mt-0"
                                        >
                                            Modifier
                                        </button>
                                    )}
                                </p>
                            </div>
                        </div>
                    ) : (
                        isAdmin && !group.location_voting_enabled && !group.location && (
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-500">Lieu</p>
                                        <p className="text-sm font-medium text-slate-400">Non défini</p>
                                    </div>
                                    <button
                                        onClick={() => setShowLocationModal(true)}
                                        className="text-xs font-bold text-[var(--v2-primary)] hover:bg-[var(--v2-primary)]/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

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
