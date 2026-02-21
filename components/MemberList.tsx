'use client';

import { useEffect, useState } from 'react';
import type { Member } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Users as UsersIcon, Timer, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface MemberListProps {
    currentMemberId?: string | null;
    members: Member[];
}

export default function MemberList({ currentMemberId, members }: MemberListProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

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
                            <span className={cn(
                                "inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border transition-colors",
                                member.is_ready
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : member.proposed_time
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        : member.timer_end_time
                                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                                {(() => {
                                    if (member.is_ready) {
                                        return (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Prêt</span>
                                            </>
                                        );
                                    }

                                    if (member.proposed_time) {
                                        return (
                                            <>
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>à {member.proposed_time}</span>
                                            </>
                                        );
                                    }

                                    if (member.timer_end_time) {
                                        const end = new Date(member.timer_end_time);
                                        const diff = end.getTime() - now.getTime();

                                        if (diff <= 0) {
                                            return (
                                                <>
                                                    <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                                                    <span>Bientôt prêt</span>
                                                </>
                                            );
                                        }

                                        const minutes = Math.floor(diff / 60000);
                                        const seconds = Math.floor((diff % 60000) / 1000);
                                        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                                        return (
                                            <>
                                                <Timer className="w-3.5 h-3.5 animate-pulse" />
                                                <span className="tabular-nums">{timeStr}</span>
                                            </>
                                        );
                                    }

                                    return (
                                        <>
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Pas prêt</span>
                                        </>
                                    );
                                })()}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
