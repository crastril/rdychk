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
                        className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-300 animate-slide-up"
                        role="listitem"
                    >
                        {/* Avatar */}
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shadow-sm transition-colors ${member.is_ready
                                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]'
                                : 'bg-secondary text-secondary-foreground'
                                }`}
                        >
                            {getInitials(member.name)}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-lg truncate">
                                    {member.name}
                                </p>
                                {isCurrentUser && (
                                    <Badge variant="secondary" className="text-xs font-normal">
                                        Vous
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <Badge
                            variant={member.is_ready ? "default" : "outline"}
                            className={`px-3 py-1 text-sm font-medium transition-colors ${member.is_ready
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "text-muted-foreground"
                                }`}
                        >
                            {member.is_ready ? (
                                <div className="flex items-center gap-1.5">
                                    <Check className="w-4 h-4" />
                                    <span>Ready</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Waiting</span>
                                </div>
                            )}
                        </Badge>
                    </div>
                );
            })}
        </div>
    );
}
