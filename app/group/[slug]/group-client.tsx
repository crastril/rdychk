'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { joinGroupAction, reclaimSessionAction, leaveGroupAction, promoteToAdminAction, linkGuestToUserAction } from '@/app/actions/member';
import JoinModal from '@/components/JoinModal';
import { ShareMenu } from '@/components/ShareMenu';
import { NotificationManager } from '@/components/NotificationManager';
import { ManageGroupModal } from '@/components/ManageGroupModal';
import { Button } from '@/components/ui/button';
import { Gear } from '@phosphor-icons/react';
import { AuthButton } from '@/components/auth-button';
import { GroupSettingsModal } from '@/components/GroupSettingsModal';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { HomeTab } from '@/components/tabs/HomeTab';
import type { Group, Member, DateVote, LocationProposal } from '@/types/database';

const LiquidWaves = () => {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.10] mix-blend-overlay z-0 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 2000 1000">
                <g fill="none">
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="2000 0" dur="30s" repeatCount="indefinite" />
                    {Array.from({ length: 70 }).map((_, i) => {
                        const baseY = i * 35 - 500;
                        const thickness = 14 + Math.sin(i * 0.4) * 8;
                        let d = "";
                        for (let x = -2000; x <= 4000; x += 25) {
                            const dy = i * 0.15;
                            const w = (2 * Math.PI) / 2000;
                            const yDisp = Math.sin(x * w * 1 + dy * 1.5) * 120 + Math.sin(x * w * 2 - dy * 0.8) * 50 + Math.sin(x * w * 3 + dy * 2.1) * 25;
                            const currentY = baseY + yDisp;
                            if (x === -2000) d += `M ${x},${currentY}`;
                            else d += ` L ${x},${currentY}`;
                        }
                        return <path key={i} stroke="#000" strokeWidth={thickness} strokeLinecap="round" strokeLinejoin="round" d={d} />;
                    })}
                </g>
            </svg>
        </div>
    );
};

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
    const [localOptimisticReady, setLocalOptimisticReady] = useState<boolean | null>(null);
    const [votes, setVotes] = useState<DateVote[]>([]);
    const [proposals, setProposals] = useState<LocationProposal[]>([]);
    const [myLocationVotes, setMyLocationVotes] = useState<Record<string, 1 | -1>>({});

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

    const fetchVotes = async () => {
        if (!group?.id) return;
        const { data, error } = await supabase
            .from('date_votes')
            .select('*')
            .eq('group_id', group.id);

        if (error) console.error("Error fetching votes:", error);
        if (data) setVotes(data as DateVote[]);
    };

    const fetchProposals = async () => {
        if (!group?.id) return;
        const { data, error } = await supabase
            .from('location_proposals')
            .select('*')
            .eq('group_id', group.id);

        if (error) console.error("Error fetching proposals:", error);
        if (data) setProposals(data as LocationProposal[]);

        if (memberId) {
            const { data: voteData } = await supabase
                .from('location_proposal_votes')
                .select('proposal_id, vote')
                .eq('member_id', memberId);

            if (voteData) {
                const voteMap: Record<string, 1 | -1> = {};
                voteData.forEach(v => {
                    voteMap[v.proposal_id] = v.vote as 1 | -1;
                });
                setMyLocationVotes(voteMap);
            }
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
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setMembers(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
                    } else {
                        fetchMembers();
                    }
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

    useEffect(() => {
        if (!group?.id) return;

        fetchVotes();
        fetchProposals();

        const votesChannel = supabase
            .channel(`votes_updates:${group.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'date_votes', filter: `group_id=eq.${group.id}` }, () => fetchVotes())
            .subscribe();

        const proposalsChannel = supabase
            .channel(`proposals_updates:${group.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'location_proposals', filter: `group_id=eq.${group.id}` }, () => fetchProposals())
            .subscribe();

        const lpVotesChannel = supabase
            .channel(`lp_votes_updates:${group.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'location_proposal_votes' }, () => fetchProposals())
            .subscribe();

        return () => {
            supabase.removeChannel(votesChannel);
            supabase.removeChannel(proposalsChannel);
            supabase.removeChannel(lpVotesChannel);
        };
    }, [group?.id, memberId]);

    const handleRefresh = async () => {
        // Refresh server components
        router.refresh();

        // Refresh client data
        await Promise.all([
            fetchGroup(),
            fetchMembers(),
            fetchVotes(),
            fetchProposals()
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
                    // Crucial: patch members array instantly to avoid race condition stutter
                    // between this channel and the members_updates channel
                    setMembers(prev => prev.map(m => m.id === memberId
                        ? { ...m, is_ready: payload.new.is_ready, timer_end_time: payload.new.timer_end_time }
                        : m
                    ));
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

    // Derived data for tabs
    const topLocationProposal = proposals.length > 0
        ? [...proposals].sort((a, b) => b.score - a.score)[0]
        : null;

    const votesByDate: Record<string, number> = {};
    votes.forEach(v => {
        votesByDate[v.date] = (votesByDate[v.date] || 0) + 1;
    });
    const popularDate = Object.entries(votesByDate).length > 0
        ? Object.entries(votesByDate).sort(([, a], [, b]) => b - a)[0][0]
        : null;

    // Adjust readyCount manually to sync instantaneously with the ReadyButton's local click
    let adjustedReadyCount = readyCount;
    if (memberId && localOptimisticReady !== null && currentMember) {
        if (currentMember.is_ready !== localOptimisticReady) {
            if (localOptimisticReady) adjustedReadyCount++;
            else adjustedReadyCount--;
        }
    }


    return (
        <div className="text-slate-100 min-h-screen flex flex-col items-center selection:bg-[var(--v2-primary)]/30 relative">
            <style>{`
                @keyframes neon-flicker-border {
                  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { 
                    box-shadow: inset 0 0 20px rgba(217, 70, 239, 0.2), inset 0 0 40px rgba(168, 85, 247, 0.1); 
                    border-left: 2px solid rgba(217, 70, 239, 0.4);
                    border-right: 2px solid rgba(217, 70, 239, 0.4);
                  }
                  20%, 24%, 55% { 
                    box-shadow: none; 
                    border-left: 2px solid rgba(217, 70, 239, 0.05);
                    border-right: 2px solid rgba(217, 70, 239, 0.05);
                  }
                }
                .cyberpunk-border {
                  animation: neon-flicker-border 4s infinite;
                }
            `}</style>

            {/* Dynamic Backgrounds */}
            {group.type === 'remote' ? (
                <div style={{ background: '#0a030f' }} className="fixed inset-0 z-[-1] crt-overlay">
                    <div className="absolute inset-0 pointer-events-none cyberpunk-border z-10 mix-blend-screen opacity-40"></div>
                    <div className="scan-line opacity-50"></div>
                    <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-[0.15] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>
                </div>
            ) : (
                <div style={{ background: 'radial-gradient(ellipse at 50% 40%, #3a0a0a 0%, #180303 45%, #060000 100%)' }} className="fixed inset-0 z-[-1]">
                    {/* Grain — heavier opacity for texture */}
                    <div className="absolute inset-0 bg-noise opacity-35 pointer-events-none mix-blend-overlay z-0"></div>
                    {/* Liquid wave animation */}
                    <LiquidWaves />
                    {/* Main center glow — more intense */}
                    <div className="absolute top-[-5%] left-[15%] w-[700px] h-[700px] bg-red-600/20 rounded-full blur-[140px] pointer-events-none mix-blend-screen animate-pulse z-0"></div>
                    {/* Secondary off-center glow */}
                    <div className="absolute top-[30%] right-[5%] w-[500px] h-[500px] bg-red-900/25 rounded-full blur-[110px] pointer-events-none mix-blend-screen z-0"></div>
                    {/* Deep accent — warm ember at the bottom */}
                    <div className="absolute bottom-[-10%] left-[35%] w-[600px] h-[400px] bg-orange-950/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen z-0"></div>
                    {/* Vignette — dark edges, open center */}
                    <div
                        className="absolute inset-0 pointer-events-none z-1"
                        style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 25%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)' }}
                    />
                </div>
            )}

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
                readyCount={adjustedReadyCount}
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
                                <Gear className="w-5 h-5" />
                            </Button>
                        )}
                        <AuthButton view="icon" className="text-slate-400 hover:text-white" />
                    </div>
                </div>
            </nav>

            <div className="w-full max-w-xl mx-auto flex flex-col gap-4 relative z-10 p-4 mt-2 pb-12">
                {/* Group header — compact */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <h1
                            className="text-white leading-none truncate uppercase"
                            style={{
                                fontFamily: 'var(--font-barlow-condensed)',
                                fontWeight: 900,
                                fontSize: '1.85rem',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {group.name}
                        </h1>
                    </div>
                    <ShareMenu
                        groupName={group.name}
                        url={typeof window !== 'undefined' ? window.location.href : ''}
                        variant="icon"
                    />
                </div>

                {/* Single-scroll home view */}
                {memberId && (
                    <HomeTab
                        group={group}
                        slug={slug}
                        memberId={memberId}
                        memberName={memberName}
                        members={members}
                        loadingMembers={loadingMembers}
                        isAdmin={isAdmin}
                        isReady={isReady}
                        timerEndTime={timerEndTime}
                        readyCount={adjustedReadyCount}
                        localOptimisticReady={localOptimisticReady}
                        onSetLocalOptimisticReady={setLocalOptimisticReady}
                        topLocationProposal={topLocationProposal}
                        popularDate={popularDate}
                        onOpenManage={() => setIsManageModalOpen(true)}
                        votes={votes}
                        onVotesChange={setVotes}
                        proposals={proposals}
                        myLocationVotes={myLocationVotes}
                        onProposalsChange={setProposals}
                        onGroupChange={fetchGroup}
                    />
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
                        slug={slug}
                        memberId={memberId}
                        isAdmin={isAdmin}
                        onLeaveGroup={handleLeaveGroup}
                    />
                </>
            )}
        </div>
    );
}
