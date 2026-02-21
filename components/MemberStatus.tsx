'use client';

import { useEffect, useState } from 'react';
import type { Member } from '@/types/database';
import { Check, Clock, Timer, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MemberStatus({ member }: { member: Member }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (!member.timer_end_time) return;

        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [member.timer_end_time]);

    return (
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
    );
}
