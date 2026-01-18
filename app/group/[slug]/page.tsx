'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import JoinModal from '@/components/JoinModal';
import MemberList from '@/components/MemberList';
import ReadyButton from '@/components/ReadyButton';
import type { Group } from '@/types/database';

export default function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [group, setGroup] = useState<Group | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [memberName, setMemberName] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);

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

        // Charger le membre depuis localStorage
        const storedMemberId = localStorage.getItem(`member_${slug}`);
        const storedMemberName = localStorage.getItem(`member_name_${slug}`);

        if (storedMemberId) {
            setMemberId(storedMemberId);
            setMemberName(storedMemberName);
        }
    }, [slug]);

    // Écouter les changements de statut du membre
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

        // Charger le statut initial
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

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <p className="text-xl text-gray-600">Chargement...</p>
            </div>
        );
    }

    if (!group) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            {!memberId && <JoinModal onJoin={handleJoin} />}

            <main className="flex flex-col items-center space-y-8 w-full">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900">{group.name}</h1>
                    {memberName && (
                        <p className="text-gray-600">
                            Connecté en tant que <span className="font-semibold">{memberName}</span>
                        </p>
                    )}
                </div>

                {memberId && (
                    <>
                        <ReadyButton memberId={memberId} isReady={isReady} />
                        <MemberList groupId={group.id} />
                    </>
                )}

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 mb-2">Partager ce lien :</p>
                    <code className="px-4 py-2 bg-white rounded-lg text-sm text-gray-800 font-mono">
                        {window.location.href}
                    </code>
                </div>
            </main>
        </div>
    );
}
