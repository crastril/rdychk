'use client';

import { use, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { createMemberClient } from '@/lib/member-client';
import { useAuth } from '@/components/auth-provider';
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
import { ArrowLeft, LogOut, Settings, Users, Loader2 } from 'lucide-react';
import type { Group, Member } from '@/types/database';
import { LocationCard } from '@/components/LocationCard';
import { GroupSettingsModal } from '@/components/GroupSettingsModal';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [memberName, setMemberName] = useState<string | null>(null);
    const [memberSecret, setMemberSecret] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [timerEndTime, setTimerEndTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
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
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        if (!group?.id) return;
        const { data } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', group.id)
            .order('joined_at', { ascending: true });

        if (data) setMembers(data);
    };

    useEffect(() => {
        fetchGroup();
    }, [slug]);

    useEffect(() => {
        const storedMemberId = localStorage.getItem(`member_${slug}`);
        const storedMemberName = localStorage.getItem(`member_name_${slug}`);
        const storedMemberSecret = localStorage.getItem(`member_secret_${slug}`);

        if (storedMemberId) {
            setMemberId(storedMemberId);
            setMemberName(storedMemberName);
            if (storedMemberSecret) setMemberSecret(storedMemberSecret);
        }
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

    const getClient = () => {
        if (memberSecret) {
            return createMemberClient(memberSecret);
        }
        return supabase;
    };

    const updateMember = async (updates: Partial<Member>) => {
        if (!memberId) return;

        const client = getClient();
        const { error } = await client
            .from('members')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', memberId);

        if (error) {
            console.error("Error updating member:", error);
        }
    };

    useEffect(() => {
        const ensureAdmin = async () => {
            if (members.length > 0) {
                const hasAdmin = members.some(m => m.role === 'admin');

                if (!hasAdmin) {
                    // Promote the first member if it is ME
                    const candidate = members[0];
                    if (candidate && candidate.id === memberId) {
                        await updateMember({ role: 'admin' });
                        // Force local update to reflect change immediately (optimistic)
                        setMembers(prev => prev.map(m => m.id === candidate.id ? { ...m, role: 'admin' } : m));
                    }
                }
            }
        };

        ensureAdmin();
    }, [members, memberId]); // Added memberId dep

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
                (payload: any) => {
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
    }, [memberId]);

    const guestMembers = members.filter(m => {
        return m.user_id === null || m.user_id === undefined;
    });

    useEffect(() => {
        console.log('Members updated:', members.length);
        console.log('Guest members:', guestMembers.length, guestMembers);
    }, [members]);

    const { user } = useAuth();

    const handleJoin = async (name: string) => {
        if (!group) return;

        // If user is logged in, check if they are already a member
        if (user) {
            const { data: existingMember } = await supabase
                .from('members')
                .select('*')
                .eq('group_id', group.id)
                .eq('user_id', user.id)
                .single();

            if (existingMember) {
                setMemberName(existingMember.name);
                setIsReady(existingMember.is_ready);
                setTimerEndTime(existingMember.timer_end_time);
                localStorage.setItem(`member_${slug}`, existingMember.id);
                localStorage.setItem(`member_name_${slug}`, existingMember.name);
                // No secret needed for auth users
                return;
            } else {
                // Check if we have a local memberId but it's not linked to user yet
                if (memberId) {
                    const { data: currentMember } = await supabase
                        .from('members')
                        .select('*')
                        .eq('id', memberId)
                        .single();

                    if (currentMember && !currentMember.user_id) {
                        // Link it!
                        const client = getClient();
                        await client
                            .from('members')
                            .update({ user_id: user.id })
                            .eq('id', memberId);
                        return;
                    }
                }
            }
        }

        // RPC call to join group safely
        const { data, error } = await supabase.rpc('join_group', {
            p_group_id: group.id,
            p_name: name
        });

        if (error) {
            console.error('Error joining group:', error);
            // Retry logic removed for RPC as race condition handling is different
            return;
        }

        if (data) {
            const memberData = data as { id: string; name: string; secret: string };
            setMemberId(memberData.id);
            setMemberName(name);
            setIsReady(false);
            setMemberSecret(memberData.secret);

            localStorage.setItem(`member_${slug}`, memberData.id);
            localStorage.setItem(`member_name_${slug}`, name);
            if (memberData.secret) {
                localStorage.setItem(`member_secret_${slug}`, memberData.secret);
            }
        }
    };

    const handleLeaveGroup = async () => {
        if (!memberId) return;

        // Optimistic UI update
        const idToRemove = memberId;
        setMemberId(null);
        setMemberName(null);
        setMemberSecret(null);
        localStorage.removeItem(`member_${slug}`);
        localStorage.removeItem(`member_name_${slug}`);
        localStorage.removeItem(`member_secret_${slug}`);

        try {
            const client = getClient();
            await client.from('members').delete().eq('id', idToRemove);
            router.push('/');
        } catch (error) {
            console.error("Error leaving group:", error);
        }
    };

    const handleReclaim = async (id: string, name: string) => {
        // Double check it exists locally
        // Note: This only works if we already have the secret in storage.
        // If we reclaim, we assume the user is clicking on a button that might imply they are that user?
        // Wait, 'handleReclaim' in JoinModal is called when?
        // It's called when user clicks "I am X" in the list of existing guests.
        // But if they don't have the secret in localStorage, they CANNOT act as that user anymore.
        // So "Reclaim" without secret is impossible securely.
        // Unless they are just setting local state to *view* as that user, but they won't be able to update.
        // We should probably remove "Reclaim" feature for guests if secrets are lost.
        // But for now, let's keep it but they will get RLS error if they try to update.

        const member = members.find(m => m.id === id);
        if (member) {
            setMemberId(member.id);
            setMemberName(member.name);
            setIsReady(member.is_ready);
            setTimerEndTime(member.timer_end_time);
            localStorage.setItem(`member_${slug}`, member.id);
            localStorage.setItem(`member_name_${slug}`, member.name);
            // We cannot recover secret. If it's missing, they are effectively read-only.
        }
    };

    const handleToggleReady = async () => {
        await updateMember({ is_ready: !isReady, timer_end_time: null });
    };

    const handleTimerUpdate = async (updates: { timer_end_time?: string | null; is_ready?: boolean }) => {
        await updateMember(updates);
    };

    const handleProposalUpdate = async (updates: { proposed_time?: string | null; is_ready?: boolean; timer_end_time?: string | null }) => {
        await updateMember(updates);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

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
                                            isReady={isReady}
                                            timerEndTime={timerEndTime}
                                            onToggle={handleToggleReady}
                                        />
                                        <TimerPicker
                                            currentTimerEnd={timerEndTime}
                                            onUpdate={handleTimerUpdate}
                                        />
                                        <TimeProposalModal
                                            currentProposedTime={currentMember?.proposed_time ?? null}
                                            onUpdate={handleProposalUpdate}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Location Card (if In Person) */}
                            {group.type === 'in_person' && (
                                <LocationCard
                                    group={group}
                                    memberId={memberId}
                                    isAdmin={isAdmin}
                                    currentMemberName={memberName}
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
                                    <MemberList groupId={group.id} currentMemberId={memberId} />
                                </CardContent>
                            </Card>

                            <ManageGroupModal
                                isOpen={isManageModalOpen}
                                onOpenChange={setIsManageModalOpen}
                                groupId={group.id}
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
