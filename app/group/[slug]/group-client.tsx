'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { joinGroupAction, reclaimSessionAction, leaveGroupAction, updateMemberAction, promoteToAdminAction, linkGuestToUserAction } from '@/app/actions/member';
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
import { ArrowLeft, Copy, Check, Target, Users, Loader2, LogOut, Settings } from 'lucide-react';
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
        const { data } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', group.id)
            .order('joined_at', { ascending: true });

        if (data) setMembers(data);
        setLoadingMembers(false);
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

        const channel = supabase
            .channel(`members_count:${group.id}`)
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

        return () => {
            supabase.removeChannel(channel);
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
        <div className="min-h-screen">
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

            <div className="max-w-2xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                            >
                                <Link href="/">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {group.name}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {totalCount} {totalCount === 1 ? 'membre' : 'membres'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => setIsSettingsModalOpen(true)}
                                >
                                    <Settings className="w-4 h-4" />
                                    Paramètres
                                </Button>
                            )}
                            <ShareMenu
                                groupName={group.name}
                                url={typeof window !== 'undefined' ? window.location.href : ''}
                            />
                        </div>
                    </div>

                    {/* Progress Bar in Header */}
                    <div className="bg-card/50 rounded-xl border p-4 backdrop-blur-sm">
                        <ProgressCounter readyCount={readyCount} totalCount={totalCount} />
                    </div>

                </div>

                {
                    memberId && (
                        <>
                            {/* Your Status Card */}

                            {/* Your Status Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">Votre statut</CardTitle>
                                        <div className="flex gap-2">

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                                                onClick={() => {
                                                    if (confirm("Voulez-vous vraiment quitter ce groupe ?")) {
                                                        handleLeaveGroup();
                                                    }
                                                }}
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Quitter
                                            </Button>
                                        </div>
                                    </div>
                                    <CardDescription>{memberName}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3">
                                        <ReadyButton
                                            slug={slug}
                                            memberId={memberId}
                                            isReady={isReady}
                                            timerEndTime={timerEndTime}
                                        />
                                        <TimerPicker
                                            currentTimerEnd={timerEndTime}
                                            onUpdate={async (updates) => {
                                                if (!memberId) return;
                                                await updateMemberAction(slug, memberId, updates);
                                            }}
                                        />
                                        <TimeProposalModal
                                            currentProposedTime={currentMember?.proposed_time ?? null}
                                            onUpdate={async (updates) => {
                                                if (!memberId) return;
                                                await updateMemberAction(slug, memberId, updates);
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Location Card (if In Person) */}
                            {group.type === 'in_person' && (
                                <LocationCard
                                    group={group}
                                    slug={slug}
                                    memberId={memberId}
                                    isAdmin={isAdmin}
                                    currentMemberName={memberName}
                                    onLocationUpdate={(newLocation) => {
                                        setGroup(prev => prev ? { ...prev, location: { ...newLocation, name: newLocation.name || '' } as unknown as NonNullable<typeof prev.location> } : null);
                                        setTimeout(() => {
                                            router.refresh();
                                        }, 0);
                                    }}
                                />
                            )}

                            {/* Members Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-muted-foreground" />
                                            <CardTitle className="text-lg">Membres</CardTitle>
                                        </div>
                                        {isAdmin && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => setIsManageModalOpen(true)}
                                            >
                                                Gérer
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <MemberList members={members} loading={loadingMembers} currentMemberId={memberId} />
                                </CardContent>
                            </Card>

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
                            />
                        </>
                    )
                }
            </div >
        </div >
    );
}
