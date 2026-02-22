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
            "flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider transition-colors",
            member.is_ready
                ? "text-[var(--v2-secondary)] shadow-neon-secondary-sm"
                : member.proposed_time
                    ? "text-[var(--v2-primary)]"
                    : member.timer_end_time
                        ? "text-amber-500"
                        : "text-slate-500"
        )}>
            {(() => {
                if (member.is_ready) {
                    return (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            <span>PRÊT</span>
                        </>
                    );
                }

                if (member.proposed_time) {
                    return (
                        <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>À {member.proposed_time}</span>
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
                                <span>BIENTÔT PRÊT</span>
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
                        <span>PAS PRÊT</span>
                    </>
                );
            })()}
        </span>
    );
}
