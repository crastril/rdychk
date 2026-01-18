'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/types/database';

interface MemberListProps {
    groupId: string;
    currentMemberId?: string;
}

export default function MemberList({ groupId, currentMemberId }: MemberListProps) {
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        // Charger les membres initiaux
        const fetchMembers = async () => {
            const { data } = await supabase
                .from('members')
                .select('*')
                .eq('group_id', groupId)
                .order('joined_at', { ascending: true });

            if (data) setMembers(data);
        };

        fetchMembers();

        // S'abonner aux changements en temps réel
        const channel = supabase
            .channel(`members:${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'members',
                    filter: `group_id=eq.${groupId}`,
                },
                () => {
                    fetchMembers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="w-full space-y-3">
            {members.map((member, index) => {
                const isCurrentUser = member.id === currentMemberId;

                return (
                    <div
                        key={member.id}
                        className="glass-strong rounded-2xl p-4 transition-all duration-300 hover:scale-102 animate-scale-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center gap-4">
                            {/* Avatar with Initials */}
                            <div
                                className={`
                  w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold
                  transition-all duration-300
                  ${member.is_ready
                                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg'
                                        : 'bg-white/30 text-white/70 border-2 border-white/40'
                                    }
                `}
                            >
                                {getInitials(member.name)}
                            </div>

                            {/* Name and Status */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-white">
                                        {member.name}
                                    </span>
                                    {isCurrentUser && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/50 text-white rounded-full">
                                            Vous
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-white/70">
                                    {member.is_ready ? 'Prêt' : 'En attente'}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div className="text-3xl">
                                {member.is_ready ? '✅' : '⏳'}
                            </div>
                        </div>
                    </div>
                );
            })}

            {members.length === 0 && (
                <div className="text-center py-8 text-white/60">
                    <p>Aucun membre pour le moment</p>
                </div>
            )}
        </div>
    );
}
