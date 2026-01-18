'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import JoinModal from '@/components/JoinModal';
import MemberList from '@/components/MemberList';
import ReadyButton from '@/components/ReadyButton';
import ProgressCounter from '@/components/ProgressCounter';
import type { Group, Member } from '@/types/database';

export default function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [group, setGroup] = useState<Group | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [memberName, setMemberName] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);

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

    // Charger les membres pour le compteur
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
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">⏳</div>
                    <p className="text-xl text-white/80">Chargement...</p>
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
        <div className="min-h-screen p-4 md:p-6">
            {!memberId && <JoinModal onJoin={handleJoin} groupName={group.name} />}

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header - Sticky */}
                <div className="sticky top-4 z-10 glass-strong rounded-2xl px-6 py-4 shadow-lg animate-slide-up">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white text-center truncate">
                        {group.name}
                    </h1>
                </div>

                {memberId && (
                    <>
                        {/* SECTION 1: Zone Utilisateur */}
                        <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-scale-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                                    👤
                                </div>
                                <div>
                                    <p className="text-sm text-white/70">Connecté en tant que</p>
                                    <p className="text-xl font-bold text-white">{memberName}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-center text-white/80 font-medium">
                                    Mon statut
                                </p>
                                <ReadyButton memberId={memberId} isReady={isReady} />
                            </div>
                        </div>

                        {/* Séparateur Visuel */}
                        <div className="flex items-center gap-4 px-4">
                            <div className="flex-1 h-px bg-white/20"></div>
                            <span className="text-white/50 text-sm font-medium">État du groupe</span>
                            <div className="flex-1 h-px bg-white/20"></div>
                        </div>

                        {/* SECTION 2: État du Groupe */}
                        <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-scale-in" style={{ animationDelay: '100ms' }}>
                            {/* Progression */}
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span>🎯</span>
                                    Progression
                                </h2>
                                <ProgressCounter readyCount={readyCount} totalCount={totalCount} />
                            </div>

                            {/* Liste des Membres */}
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span>👥</span>
                                    Membres ({totalCount})
                                </h2>
                                <MemberList groupId={group.id} currentMemberId={memberId} />
                            </div>
                        </div>

                        {/* Share Link Section */}
                        <div className="glass rounded-2xl p-6 text-center space-y-3 animate-fade-in">
                            <p className="text-sm text-white/70 font-medium">Partager ce groupe</p>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Lien copié ! 📋');
                                }}
                                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl 
                         text-white font-mono text-sm transition-all
                         border border-white/20 hover:border-white/40
                         truncate"
                            >
                                {window.location.href}
                            </button>
                            <p className="text-xs text-white/50">
                                Cliquez pour copier le lien
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
