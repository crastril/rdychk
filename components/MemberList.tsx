'use client';

import type { Member } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, Users as UsersIcon } from 'lucide-react';
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
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm animate-pulse">
                        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
                    </div>
                ))}
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
        <div className="space-y-3 relative w-full mb-8">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2 mb-4">
                Membres ({members.length})
            </h2>
            {members.map((member) => {
                const isCurrentUser = member.id === currentMemberId;
                const isAdmin = member.role === 'admin';

                return (
                    <div
                        key={member.id}
                        className="glass-panel p-3 rounded-2xl flex items-center gap-4 relative overflow-hidden group transition-transform hover:scale-[1.01] duration-300"
                        role="listitem"
                    >
                        {/* Background gradient indicator for state */}
                        <div className={cn(
                            "absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
                            member.is_ready ? "from-[var(--v2-secondary)]/20" : "from-white/5"
                        )}></div>

                        {/* Avatar */}
                        <div
                            className={cn(
                                "relative w-12 h-12 rounded-xl flex items-center justify-center font-black shrink-0 transition-colors z-10",
                                member.is_ready
                                    ? 'bg-[var(--v2-secondary)] text-[#121212] shadow-neon-secondary'
                                    : 'bg-white/5 border border-white/10 text-slate-400'
                            )}
                        >
                            {getInitials(member.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-grow z-10 min-w-0">
                            <h3 className={cn(
                                "font-bold text-lg flex items-center gap-2 truncate",
                                isAdmin ? "liquid-glow-text" : "text-white"
                            )}>
                                {member.name}
                                {isCurrentUser && (
                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-medium shrink-0">
                                        Toi
                                    </span>
                                )}
                            </h3>

                            <MemberStatus member={member} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
