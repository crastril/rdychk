'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/types/database';

interface MemberListProps {
    groupId: string;
}

export default function MemberList({ groupId }: MemberListProps) {
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

    const readyCount = members.filter((m) => m.is_ready).length;
    const totalCount = members.length;

    return (
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <p className="text-5xl font-bold text-gray-900">
                    {readyCount}/{totalCount}
                </p>
                <p className="text-gray-500 mt-2">
                    {readyCount === totalCount && totalCount > 0
                        ? '🎉 Tout le monde est prêt !'
                        : 'personnes prêtes'}
                </p>
            </div>

            <div className="space-y-3">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all ${member.is_ready
                                ? 'bg-green-100 border-2 border-green-500'
                                : 'bg-gray-100 border-2 border-gray-300'
                            }`}
                    >
                        <span
                            className={`text-lg font-medium ${member.is_ready ? 'text-green-900' : 'text-gray-600'
                                }`}
                        >
                            {member.name}
                        </span>
                        <span className="text-2xl">
                            {member.is_ready ? '✅' : '⏳'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
