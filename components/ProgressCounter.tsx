'use client';

import { Progress } from '@/components/ui/progress';
import { PartyPopper } from 'lucide-react';

interface ProgressCounterProps {
    readyCount: number;
    totalCount: number;
}

export default function ProgressCounter({ readyCount, totalCount }: ProgressCounterProps) {
    const percentage = Math.round((readyCount / totalCount) * 100) || 0;
    const isComplete = percentage === 100;

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
                <span className={isComplete ? "text-primary font-bold" : "text-muted-foreground"}>
                    {isComplete ? "Tout le monde est prêt !" : "En attente..."}
                </span>
                <span className="text-muted-foreground">
                    {readyCount}/{totalCount} prêts
                </span>
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
