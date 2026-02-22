'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { joinGroupAction, reclaimSessionAction, leaveGroupAction, updateMemberAction, promoteToAdminAction, linkGuestToUserAction } from '@/app/actions/member';
import { updateLocationAction } from '@/app/actions/group';
import JoinModal from '@/components/JoinModal';
import MemberList from '@/components/MemberList';
import ReadyButton from '@/components/ReadyButton';
import ProgressCounter from '@/components/ProgressCounter';
import { TimerPicker } from '@/components/TimerPicker';
import { ShareMenu } from '@/components/ShareMenu';
import { NotificationManager } from '@/components/NotificationManager';
import { ManageGroupModal } from '@/components/ManageGroupModal';
import { TimeProposalModal } from '@/components/TimeProposalModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Target, Users, Loader2, LogOut, Settings, ChevronDown, MapPin, X } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { AuthButton } from '@/components/auth-button';
import type { Group, Member } from '@/types/database';
import { LocationCard } from '@/components/LocationCard';
import { GroupSettingsModal } from '@/components/GroupSettingsModal';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function GroupClient({ initialGroup, slug }: { initialGroup: Group, slug: string }) {
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(initialGroup);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [memberName, setMemberName] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [timerEndTime, setTimerEndTime] = useState<string | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [showLocationProposal, setShowLocationProposal] = useState(false);

    const fetchGroup = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                throw error;
            }

            if (!data) {
                notFound();
            }

            setGroup(data);
        } catch (error) {
            console.error("Error fetching group:", error);
        }
    };

    const fetchMembers = async () => {
        if (!group?.id) return;
        setLoadingMembers(true);
        const { data, error } = await supabase
            .from('members')
            .select('*, profiles(avatar_url)')
            .eq('group_id', group.id)
            .order('joined_at', { ascending: true });

        if (error) {
            console.error("Error fetching members:", error);
        }

        if (data) {
            const membersWithAvatars = data.map((m: any) => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                return {
                    ...m,
                    avatar_url: profile?.avatar_url
                };
            });
            setMembers(membersWithAvatars);
        }
        setLoadingMembers(false);
    };

    const handleLocationDelete = async () => {
        if (!group?.id || !memberId) return;

        // If we are just in proposal mode but no location is saved in DB
        if (showLocationProposal && !group.location?.name) {
            setShowLocationProposal(false);
            return;
        }

        const { success } = await updateLocationAction(slug, memberId, group.id, null);
        if (success) {
            setGroup(prev => prev ? { ...prev, location: null } : null);
            setShowLocationProposal(false);
            router.refresh();
        }
    };

    useEffect(() => {
        fetchGroup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    useEffect(() => {
        const restoreSession = async () => {
            const storedMemberId = localStorage.getItem(`member_${slug}`);
            const storedMemberName = localStorage.getItem(`member_name_${slug}`);

            if (storedMemberId) {
                // Ensure the secure cookie is set for this local session
                await reclaimSessionAction(slug, storedMemberId);
                setMemberId(storedMemberId);
                setMemberName(storedMemberName);
            }
        };
        restoreSession();
    }, [slug]);

    useEffect(() => {
        if (!group?.id) return;

        fetchMembers();

        const membersChannel = supabase
            .channel(`members_updates:${group.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'members',
                    filter: `group_id=eq.${group.id}`,
                },
                () => {
                    fetchMembers();
                }
            )
            .subscribe();

        // Also subscribe to profiles changes to update avatars real-time
        const profilesChannel = supabase
            .channel(`profiles_updates:${group.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                },
                () => {
                    fetchMembers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(membersChannel);
            supabase.removeChannel(profilesChannel);
        };
    }, [group?.id]);

    useEffect(() => {
        if (!group) return;

        const channel = supabase
            .channel(`group:${group.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'groups',
                    filter: `id=eq.${group.id}`,
                },
                (payload) => {
                    setGroup(prev => (prev ? { ...prev, ...payload.new as Group } : payload.new as Group));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [group?.id]);

    const handleRefresh = async () => {
        // Refresh server components
        router.refresh();

        // Refresh client data
        await Promise.all([
            fetchGroup(),
            fetchMembers()
        ]);
    };

    useEffect(() => {
        const ensureAdmin = async () => {
            if (members.length > 0 && memberId) {
                const hasAdmin = members.some(m => m.role === 'admin');

                if (!hasAdmin) {
                    // Promote the oldest member via server action (verifies session)
                    const candidate = members[0];
                    if (candidate) {
                        const result = await promoteToAdminAction(slug, memberId, candidate.id);
                        if (result.success) {
                            setMembers(prev => prev.map(m => m.id === candidate.id ? { ...m, role: 'admin' } : m));
                        }
                    }
                }
            }
        };

        ensureAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members]);

    useEffect(() => {
        if (!memberId) return;

        const channel = supabase
            .channel(`member:${memberId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'members',
                    filter: `id=eq.${memberId}`,
                },
                (payload: { new: { is_ready: boolean; timer_end_time: string | null } }) => {
                    setIsReady(payload.new.is_ready);
                    setTimerEndTime(payload.new.timer_end_time);
                }
            )
            .subscribe();

        const fetchMemberStatus = async () => {
            const { data } = await supabase
                .from('members')
                .select('is_ready, timer_end_time')
                .eq('id', memberId)
                .single();

            if (data) {
                setIsReady(data.is_ready);
                setTimerEndTime(data.timer_end_time);
            }
        };

        fetchMemberStatus();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group?.id, memberId]);

    const guestMembers = members.filter(m => {
        // Explicit check for null/undefined to catch any weirdness
        return m.user_id === null || m.user_id === undefined;
    });


    const { user } = useAuth();

    // Auto-reconnect for logged-in users who navigate here (e.g. from history)
    useEffect(() => {
        const checkMembership = async () => {
            if (user && group?.id) {
                // If we have a local guest memberId, try to link it to the user_id if not done
                if (memberId) {
                    const currentMember = members.find(m => m.id === memberId);
                    if (currentMember && !currentMember.user_id) {
                        console.log('Linking guest session to user profile...');
                        await linkGuestToUserAction(slug, memberId, user.id);
                        // No need to setMemberId again, just update local list for UI consistency
                        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, user_id: user.id } : m));
                    }
                }

                // If no local memberId yet, or link just happened, ensure we sync state
                if (!memberId) {
                    const { data } = await supabase
                        .from('members')
                        .select('*')
                        .eq('group_id', group.id)
                        .eq('user_id', user.id)
                        .single();

                    if (data) {
                        await reclaimSessionAction(slug, data.id);
                        setMemberId(data.id);
                        setMemberName(data.name);
                        setIsReady(data.is_ready);
                        setTimerEndTime(data.timer_end_time);
                        localStorage.setItem(`member_${slug}`, data.id);
                        localStorage.setItem(`member_name_${slug}`, data.name);
                    }
                }
            }
        };
        checkMembership();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, group?.id, memberId, slug, members]);

    // Apply theme based on group type
    useEffect(() => {
        if (group?.type === 'remote') {
            document.body.classList.add('theme-online');
        } else {
            document.body.classList.remove('theme-online');
        }
        return () => {
            document.body.classList.remove('theme-online');
        };
    }, [group?.type]);

    const handleJoin = async (name: string) => {
        if (!group) return;

        // Note: With Server Actions doing the heavy lifting and security,
        // we mainly just call the action and handle the local state here.
        // We still check if logged-in user is already a member locally if possible to save a trip,
        // but the action itself is safe.

        const result = await joinGroupAction(group.id, slug, name, user?.id);

        if (result.success && result.member) {
            setMemberId(result.member.id);
            setMemberName(result.member.name);
            setIsReady(false);

            // Still keep local storage for UX convenience, but SECURITY relies on the httpOnly cookie
            // set by the server action.
            localStorage.setItem(`member_${slug}`, result.member.id);
            localStorage.setItem(`member_name_${slug}`, result.member.name);

            // Force aggressive sync with server and local state
            await fetchMembers();
            setTimeout(() => {
                router.refresh();
            }, 0);
        } else {
            console.error('Error joining group via action:', result.error);
            // Handle error (e.g., unique constraint on user_id if already joined)
            // If we hit the race condition where they exist, we could fetch them here or the action could handle returning them.
            if (user) {
                const { data: existingMember } = await supabase
                    .from('members')
                    .select('*')
                    .eq('group_id', group.id)
                    .eq('user_id', user.id)
                    .single();

                if (existingMember) {
                    setMemberId(existingMember.id);
                    setMemberName(existingMember.name);
                    setIsReady(existingMember.is_ready);
                    setTimerEndTime(existingMember.timer_end_time);
                    localStorage.setItem(`member_${slug}`, existingMember.id);
                    localStorage.setItem(`member_name_${slug}`, existingMember.name);
                }
            }
        }
    };



    const handleLeaveGroup = async () => {
        if (!memberId) return;

        // Optimistic UI update
        const idToRemove = memberId;
        setMemberId(null);
        setMemberName(null);
        localStorage.removeItem(`member_${slug}`);
        localStorage.removeItem(`member_name_${slug}`);

        try {
            const result = await leaveGroupAction(slug, idToRemove);
            if (result.success) {
                router.push('/');
            } else {
                console.error("Error leaving group server action:", result.error);
                // In a real app we might revert the optimistic UI if it failed, 
                // but usually leaving is final for the user's intent.
                router.push('/');
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            // Revert state if needed? For now we assume success or user can reload.
        }
    };

    const handleReclaim = async (id: string, name: string) => {
        // Double check it exists locally
        const member = members.find(m => m.id === id);
        if (member) {
            const result = await reclaimSessionAction(slug, member.id);
            if (result.success) {
                setMemberId(member.id);
                setMemberName(member.name);
                setIsReady(member.is_ready);
                setTimerEndTime(member.timer_end_time);
                localStorage.setItem(`member_${slug}`, member.id);
                localStorage.setItem(`member_name_${slug}`, member.name);
            } else {
                console.error("Failed to reclaim session securely");
            }
        }
    };



    if (!group) {
        return null;
    }

    const readyCount = members.filter((m) => m.is_ready).length;
    const totalCount = members.length;
    const currentMember = members.find(m => m.id === memberId);
    const isAdmin = currentMember?.role === 'admin';


    return (
        <div className="bg-background-dark text-slate-100 min-h-screen flex flex-col items-center selection:bg-[var(--v2-primary)]/30">
            <ConnectionStatus onRefresh={handleRefresh} />
            {!memberId && (
                <JoinModal
                    onJoin={handleJoin}
                    onReclaim={handleReclaim}
                    groupName={group.name}
                    existingGuests={guestMembers}
                />
            )}

            <NotificationManager
                readyCount={readyCount}
                totalCount={totalCount}
                groupName={group.name}
            />

            {/* Sticky Navigation */}
            <nav className="w-full border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-black tracking-tighter text-white">
                            rdychk<span className="text-[var(--v2-primary)]">.</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-1">
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white"
                                onClick={() => setIsSettingsModalOpen(true)}
                            >
                                <Settings className="w-5 h-5" />
                            </Button>
                        )}
                        <AuthButton view="icon" className="text-slate-400 hover:text-white" />
                    </div>
                </div>
            </nav>

            <div className="w-full max-w-xl mx-auto flex flex-col gap-6 relative z-10 p-4 mt-2">
                {/* Group Details & Share Button (Below Header) */}
                <div className="flex items-center justify-between -mb-2">
                    <div>
                        <h1 className="text-white font-bold text-2xl leading-tight truncate max-w-[200px] sm:max-w-[250px]">
                            {group.name}
                        </h1>
                        <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-primary)] animate-pulse shadow-neon-primary"></span>
                            {totalCount} {totalCount === 1 ? 'membre' : 'membres'}
                        </div>
                    </div>
                    <ShareMenu
                        groupName={group.name}
                        url={typeof window !== 'undefined' ? window.location.href : ''}
                        variant="button"
                    />
                </div>

                {/* Progress Circle */}
                <div className="flex justify-center mb-2">
                    <ProgressCounter readyCount={readyCount} totalCount={totalCount} />
                </div>

                {memberId && (
                    <>
                        {/* Actions / Status */}
                        <div className="flex flex-col gap-3">
                            <ReadyButton
                                slug={slug}
                                memberId={memberId}
                                isReady={isReady}
                                timerEndTime={timerEndTime}
                            />
                            {/* Additional Options Collapsible */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                                    className="flex items-center justify-between w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all text-sm font-medium group"
                                >
                                    <span>Plus d'options</span>
                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOptionsOpen ? "rotate-180" : "")} />
                                </button>

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

                                        {group.type === 'in_person' && (
                                            <div className="mt-2 border-t border-white/5 pt-3">
                                                {(!group.location?.name && !showLocationProposal) ? (
                                                    <button
                                                        onClick={() => {
                                                            setShowLocationProposal(true);
                                                            setIsOptionsOpen(false);
                                                        }}
                                                        className="flex items-center justify-center w-full py-4 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black transition-all group"
                                                    >
                                                        <MapPin className="w-4 h-4 mr-2 text-[var(--v2-primary)] group-hover:rotate-12 transition-transform" />
                                                        RAJOUTER UN LIEU
                                                    </button>
                                                ) : isAdmin && (
                                                    <button
                                                        onClick={() => {
                                                            handleLocationDelete();
                                                            setIsOptionsOpen(false);
                                                        }}
                                                        className="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 text-sm font-medium transition-all group"
                                                    >
                                                        <X className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                                        Retirer le lieu
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Card (if In Person and has location or user wants to propose) */}
                        {group.type === 'in_person' && (group.location?.name || showLocationProposal) && (
                            <LocationCard
                                group={group}
                                slug={slug}
                                memberId={memberId}
                                isAdmin={isAdmin}
                                currentMemberName={memberName}
                                initialEditMode={showLocationProposal && !group.location?.name ? 'edit' : null}
                                onRemove={handleLocationDelete}
                                onLocationUpdate={(newLocation) => {
                                    setGroup(prev => prev ? { ...prev, location: { ...newLocation, name: newLocation.name || '' } as unknown as NonNullable<typeof prev.location> } : null);
                                    setShowLocationProposal(false);
                                    setTimeout(() => {
                                        router.refresh();
                                    }, 0);
                                }}
                            />
                        )}

                        {/* Members List */}
                        <div className="flex flex-col items-end w-full mt-2">
                            {isAdmin && (
                                <button
                                    onClick={() => setIsManageModalOpen(true)}
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
            </div>

            {memberId && (
                <>
                    <ManageGroupModal
                        isOpen={isManageModalOpen}
                        onOpenChange={setIsManageModalOpen}
                        groupId={group.id}
                        slug={slug}
                        members={members}
                        loading={loadingMembers}
                        onRefresh={fetchMembers}
                        currentMemberId={memberId}
                    />

                    <GroupSettingsModal
                        isOpen={isSettingsModalOpen}
                        onOpenChange={setIsSettingsModalOpen}
                        groupId={group.id}
                        onLeaveGroup={handleLeaveGroup}
                    />
                </>
            )}

            {/* Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--v2-primary)] opacity-10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--v2-accent)] opacity-10 rounded-full blur-[100px]"></div>
            </div>
        </div>
    );
}
