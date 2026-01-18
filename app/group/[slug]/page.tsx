'use client';

import { use, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
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
import { ArrowLeft, Copy, Check, Target, Users, Loader2, LogOut } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { AuthButton } from '@/components/auth-button';
import type { Group, Member } from '@/types/database';

export default function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [memberName, setMemberName] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [timerEndTime, setTimerEndTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            const { data } = await supabase
                .from('groups')
                .select('*')
                .eq('slug', slug)
                .single();

            if (!data) {
                notFound();
            }

            setGroup(data);
            setLoading(false);
        };

        fetchGroup();

    }, [slug]);

    useEffect(() => {
        const storedMemberId = localStorage.getItem(`member_${slug}`);
        const storedMemberName = localStorage.getItem(`member_name_${slug}`);

        if (storedMemberId) {
            setMemberId(storedMemberId);
            setMemberName(storedMemberName);
        }
    }, [slug]);

    useEffect(() => {
        if (!group) return;

        const fetchMembers = async () => {
            const { data } = await supabase
                .from('members')
                .select('*')
                .eq('group_id', group.id)
                .order('joined_at', { ascending: true });

            if (data) setMembers(data);
        };

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
    }, [group]);

    useEffect(() => {
        const ensureAdmin = async () => {
            if (members.length > 0) {
                const hasAdmin = members.some(m => m.role === 'admin');

                if (!hasAdmin) {
                    // Promote the first member (effectively the creator/oldest)
                    const candidate = members[0];
                    if (candidate) {

                        // Persist to DB
                        const { error } = await supabase
                            .from('members')
                            .update({ role: 'admin' })
                            .eq('id', candidate.id);

                        if (!error) {
                            // Force local update to reflect change immediately
                            setMembers(prev => prev.map(m => m.id === candidate.id ? { ...m, role: 'admin' } : m));
                        }
                    }
                }
            }
        };

        ensureAdmin();
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
                        await supabase
                            .from('members')
                            .update({ user_id: user.id })
                            .eq('id', memberId);
                        return;
                    }
                }
            }
        }
        let role = 'member';

        // Check if group has no members yet (first joiner becomes admin if created_by matches or just first)
        // OR if current user is the creator
        if (group) {
            if (user?.id && group.created_by === user.id) {
                role = 'admin';
            } else {
                const { count } = await supabase
                    .from('members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id);

                if (count === 0) {
                    role = 'admin';
                }
            }
        }

        const { data, error } = await supabase
            .from('members')
            .insert({
                group_id: group.id,
                name,
                user_id: user?.id || null, // Link the member to the user if logged in
                role
            })
            .select()
            .single();

        if (error) {
            // Handle unique constraint violation gracefully (race condition)
            if (error.code === '23505') {
                // Retry fetch without logging error
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
                        return;
                    }
                }
            }
            console.error('Error joining group:', error);
            return;
        }

        if (data) {
            setMemberId(data.id);
            setMemberName(name);
            setIsReady(false);
            localStorage.setItem(`member_${slug}`, data.id);
            localStorage.setItem(`member_name_${slug}`, name);
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
            await supabase.from('members').delete().eq('id', idToRemove);
            router.push('/');
        } catch (error) {
            console.error("Error leaving group:", error);
            // Revert state if needed? For now we assume success or user can reload.
        }
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
            {!memberId && <JoinModal onJoin={handleJoin} groupName={group.name} />}

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

                        <ShareMenu
                            groupName={group.name}
                            url={typeof window !== 'undefined' ? window.location.href : ''}
                        />
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
                                    <CardDescription>{memberName}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3">
                                        <ReadyButton
                                            memberId={memberId}
                                            isReady={isReady}
                                            timerEndTime={timerEndTime}
                                        />
                                        <TimerPicker
                                            memberId={memberId}
                                            currentTimerEnd={timerEndTime}
                                            isReady={isReady}
                                        />
                                        <TimeProposalModal
                                            memberId={memberId}
                                            currentProposedTime={currentMember?.proposed_time ?? null}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

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
                        </>
                    )
                }
            </div >
        </div >
    );
}
