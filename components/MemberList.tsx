'use client';

import { useEffect, useState } from 'react';
import type { Member } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Users as UsersIcon, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { MemberStatus } from './MemberStatus';

interface MemberListProps {
    loading?: boolean;
    currentMemberId?: string | null;
    members: Member[];
}

export default function MemberList({ loading, currentMemberId, members }: MemberListProps) {

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading && members.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-300 animate-slide-up",
                            member.role === 'admin' && "border-primary/50 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]"
                        )}
                        role="listitem"
                    >
                        {/* Avatar */}
                        <div
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shadow-sm transition-colors",
                                member.is_ready
                                    ? 'bg-primary text-primary-foreground shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]'
                                    : 'bg-secondary text-secondary-foreground',
                                member.role === 'admin' && !member.is_ready && "ring-2 ring-primary/30"
                            )}
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
                        <div className="text-right">
                            <MemberStatus member={member} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
