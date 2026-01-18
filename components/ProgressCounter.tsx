'use client';

import { Progress } from '@/components/ui/progress';
import { PartyPopper } from 'lucide-react';

interface ProgressCounterProps {
    readyCount: number;
    totalCount: number;
}

export default function ProgressCounter({ readyCount, totalCount }: ProgressCounterProps) {
    const percentage = totalCount > 0 ? (readyCount / totalCount) * 100 : 0;
    const allReady = readyCount === totalCount && totalCount > 0;

    return (
        <div className="space-y-6">
            {/* Counter */}
            <div className="text-center">
                <div className="text-7xl font-bold tracking-tight" aria-label={`${readyCount} sur ${totalCount} membres prêts`}>
                    <span className="text-primary drop-shadow-[0_0_15px_hsl(var(--primary)/0.3)]">{readyCount}</span>
                    <span className="text-muted-foreground/50">/{totalCount}</span>
                </div>
                {allReady && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-primary font-bold animate-pulse">
                        <PartyPopper className="w-6 h-6" />
                        <span className="text-lg">Everyone is ready!</span>
                        <PartyPopper className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <Progress
                value={percentage}
                className="h-2"
                aria-label="Progression du groupe"
            />
        </div>
    );
}
