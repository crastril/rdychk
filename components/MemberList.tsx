'use client';

import type { Member } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Crown, Users as UsersIcon, Loader2, Clock } from 'lucide-react';
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
                <p className="text-sm">Personne n&apos;a encore rejoint</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {members.map((member) => {
                const isCurrentUser = member.id === currentMemberId;
                const isAdmin = member.role === 'admin';

                return (
                    <div
                        key={member.id}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-300 animate-slide-up",
                            isAdmin && "border-primary/50 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]"
                        )}
                        role="listitem"
                    >
                        {/* Avatar */}
                        <div
                            className={cn(
                                "relative w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shadow-sm transition-colors shrink-0",
                                member.is_ready
                                    ? 'bg-primary text-primary-foreground shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]'
                                    : 'bg-secondary text-secondary-foreground',
                                isAdmin && !member.is_ready && "ring-2 ring-primary/30"
                            )}
                        >
                            {getInitials(member.name)}
                            {/* Admin crown overlay */}
                            {isAdmin && (
                                <span className="absolute -top-1.5 -right-1.5 bg-background rounded-full p-0.5 shadow-sm">
                                    <Crown className="w-3 h-3 text-primary" />
                                </span>
                            )}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-base truncate">
                                    {member.name}
                                </p>
                                {isCurrentUser && (
                                    <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                        Vous
                                    </Badge>
                                )}
                                {isAdmin && (
                                    <Badge variant="outline" className="text-xs font-normal border-primary/60 text-primary shrink-0">
                                        Admin
                                    </Badge>
                                )}
                            </div>
                            {/* Proposed time sub-line */}
                            {member.proposed_time && !member.is_ready && (
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    Propose&nbsp;{member.proposed_time}
                                </p>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className="text-right shrink-0">
                            <MemberStatus member={member} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
