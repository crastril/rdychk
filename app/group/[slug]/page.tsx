'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import JoinModal from '@/components/JoinModal';
import MemberList from '@/components/MemberList';
import ReadyButton from '@/components/ReadyButton';
import ProgressCounter from '@/components/ProgressCounter';
import { Icons } from '@/components/Icons';
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

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            alert('Erreur lors de la copie du lien');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Icons.Loader className="w-16 h-16 text-violet-500 mx-auto mb-4" />
                    <p className="text-xl text-slate-300">Chargement...</p>
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
                <header className="sticky top-4 z-10 glass-strong rounded-2xl px-6 py-4 shadow-lg animate-slide-up border-2 border-slate-600/50">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-50 text-center truncate">
                        {group.name}
                    </h1>
                </header>

                {memberId && (
                    <>
                        {/* SECTION 1: Zone Utilisateur */}
                        <section
                            className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-scale-in border-2 border-slate-600/50"
                            aria-labelledby="user-section-title"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                                    <Icons.User className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Connecté en tant que</p>
                                    <p className="text-xl font-bold text-slate-50">{memberName}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 id="user-section-title" className="text-center text-slate-300 font-medium">
                                    Mon statut
                                </h2>
                                <ReadyButton memberId={memberId} isReady={isReady} />
                            </div>
                        </section>

                        {/* Séparateur Visuel */}
                        <div className="flex items-center gap-4 px-4">
                            <div className="flex-1 h-px bg-slate-700"></div>
                            <span className="text-slate-500 text-sm font-medium">État du groupe</span>
                            <div className="flex-1 h-px bg-slate-700"></div>
                        </div>

                        {/* SECTION 2: État du Groupe */}
                        <section
                            className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-scale-in border-2 border-slate-600/50"
                            style={{ animationDelay: '100ms' }}
                            aria-labelledby="group-section-title"
                        >
                            {/* Progression */}
                            <div>
                                <h2 id="group-section-title" className="text-xl font-bold text-slate-50 mb-4 flex items-center gap-2">
                                    <Icons.Target className="w-6 h-6 text-violet-400" />
                                    Progression
                                </h2>
                                <ProgressCounter readyCount={readyCount} totalCount={totalCount} />
                            </div>

                            {/* Liste des Membres */}
                            <div>
                                <h3 className="text-xl font-bold text-slate-50 mb-4 flex items-center gap-2">
                                    <Icons.Users className="w-6 h-6 text-blue-400" />
                                    Membres ({totalCount})
                                </h3>
                                <div role="list">
                                    <MemberList groupId={group.id} currentMemberId={memberId} />
                                </div>
                            </div>
                        </section>

                        {/* Share Link Section */}
                        <div className="glass rounded-2xl p-6 text-center space-y-3 animate-fade-in border border-slate-700/50">
                            <p className="text-sm text-slate-400 font-medium">Partager ce groupe</p>
                            <button
                                onClick={handleCopyLink}
                                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl 
                         text-slate-200 font-mono text-sm transition-all
                         border border-slate-600 hover:border-slate-500
                         truncate flex items-center justify-center gap-2"
                                aria-label="Copier le lien du groupe"
                            >
                                {copied ? (
                                    <>
                                        <Icons.Check className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-400">Lien copié !</span>
                                    </>
                                ) : (
                                    <>
                                        <Icons.Copy className="w-4 h-4" />
                                        Copier le lien
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
