'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import JoinModal from '@/components/JoinModal';
import MemberList from '@/components/MemberList';
import ReadyButton from '@/components/ReadyButton';
import ProgressCounter from '@/components/ProgressCounter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Target, Users, Loader2 } from 'lucide-react';
import type { Group, Member } from '@/types/database';

export default function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [group, setGroup] = useState<Group | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [memberName, setMemberName] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [copied, setCopied] = useState(false);

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
                }
            )
            .subscribe();

        const fetchMemberStatus = async () => {
            const { data } = await supabase
                .from('members')
                .select('is_ready')
                .eq('id', memberId)
                .single();

            if (data) {
                setIsReady(data.is_ready);
            }
        };

        fetchMemberStatus();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [memberId]);

    const handleJoin = async (name: string) => {
        if (!group) return;

        const { data, error } = await supabase
            .from('members')
            .insert({ group_id: group.id, name })
            .select()
            .single();

        if (error) {
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

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
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

    return (
        <div className="min-h-screen">
            {!memberId && <JoinModal onJoin={handleJoin} groupName={group.name} />}

            <div className="max-w-2xl mx-auto p-6 space-y-6">
                {/* Header */}
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
                                {totalCount} {totalCount === 1 ? 'member' : 'members'}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        size="sm"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                            </>
                        )}
                    </Button>
                </div>

                {memberId && (
                    <>
                        {/* Your Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Your Status</CardTitle>
                                <CardDescription>{memberName}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ReadyButton memberId={memberId} isReady={isReady} />
                            </CardContent>
                        </Card>

                        {/* Group Status Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Progress</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ProgressCounter readyCount={readyCount} totalCount={totalCount} />
                            </CardContent>
                        </Card>

                        {/* Members Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Members</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <MemberList groupId={group.id} currentMemberId={memberId} />
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
