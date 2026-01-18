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
                <div className="text-6xl font-bold" aria-label={`${readyCount} sur ${totalCount} membres prêts`}>
                    <span className="text-foreground">{readyCount}</span>
                    <span className="text-muted-foreground">/{totalCount}</span>
                </div>
                {allReady && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600">
                        <PartyPopper className="w-5 h-5" />
                        <span className="text-sm font-medium">Everyone is ready!</span>
                        <PartyPopper className="w-5 h-5" />
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
