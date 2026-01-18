'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Users as UsersIcon } from 'lucide-react';

interface MemberListProps {
    groupId: string;
    currentMemberId?: string;
}

export default function MemberList({ groupId, currentMemberId }: MemberListProps) {
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase
                .from('members')
                .select('*')
                .eq('group_id', groupId)
                .order('joined_at', { ascending: true });

            if (data) setMembers(data);
        };

        fetchMembers();

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

    if (members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UsersIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No members yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {members.map((member) => {
                const isCurrentUser = member.id === currentMemberId;

                return (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        role="listitem"
                    >
                        {/* Avatar */}
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${member.is_ready
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {getInitials(member.name)}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold truncate">
                                    {member.name}
                                </p>
                                {isCurrentUser && (
                                    <Badge variant="outline" className="text-xs">
                                        You
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <Badge
                            variant={member.is_ready ? "default" : "outline"}
                            className={member.is_ready ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        >
                            {member.is_ready ? (
                                <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Ready
                                </>
                            ) : (
                                <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Waiting
                                </>
                            )}
                        </Badge>
                    </div>
                );
            })}
        </div>
    );
}
