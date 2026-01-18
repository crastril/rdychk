'use client';

import { Icons } from './Icons';

interface ProgressCounterProps {
    readyCount: number;
    totalCount: number;
}

export default function ProgressCounter({ readyCount, totalCount }: ProgressCounterProps) {
    const percentage = totalCount > 0 ? (readyCount / totalCount) * 100 : 0;
    const allReady = readyCount === totalCount && totalCount > 0;

    return (
        <div className="w-full space-y-4 animate-scale-in">
            {/* Progress Bar */}
            <div className="relative" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progression du groupe">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${allReady
                                ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                                : 'bg-gradient-to-r from-violet-500 to-blue-500'
                            }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Counter */}
            <div className="text-center">
                <div className="text-6xl font-extrabold text-slate-50 mb-2" aria-label={`${readyCount} sur ${totalCount} membres prêts`}>
                    {readyCount}<span className="text-4xl text-slate-300">/{totalCount}</span>
                </div>
                <div className="text-lg font-medium text-slate-300">
                    {allReady ? (
                        <span className="flex items-center justify-center gap-2 animate-bounce-in">
                            <Icons.Party className="w-6 h-6 text-emerald-400" />
                            <span className="text-emerald-400">Tout le monde est prêt !</span>
                            <Icons.Party className="w-6 h-6 text-emerald-400" />
                        </span>
                    ) : (
                        `${totalCount - readyCount} personne${totalCount - readyCount > 1 ? 's' : ''} en attente`
                    )}
                </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2" role="status" aria-label="Indicateurs visuels des membres">
                {Array.from({ length: Math.min(totalCount, 10) }).map((_, index) => (
                    <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index < readyCount
                                ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                                : 'bg-slate-600'
                            }`}
                        aria-hidden="true"
                    />
                ))}
                {totalCount > 10 && (
                    <span className="text-xs text-slate-400 ml-2">+{totalCount - 10}</span>
                )}
            </div>
        </div>
    );
}
