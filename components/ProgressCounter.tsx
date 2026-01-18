'use client';

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
            <div className="relative">
                <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${allReady
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-purple-400 to-blue-500'
                            }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Counter */}
            <div className="text-center">
                <div className="text-6xl font-extrabold text-white mb-2">
                    {readyCount}<span className="text-4xl text-white/70">/{totalCount}</span>
                </div>
                <div className="text-lg font-medium text-white/90">
                    {allReady ? (
                        <span className="flex items-center justify-center gap-2 animate-bounce-in">
                            <span className="text-2xl">🎉</span>
                            Tout le monde est prêt !
                            <span className="text-2xl">🎉</span>
                        </span>
                    ) : (
                        `${totalCount - readyCount} personne${totalCount - readyCount > 1 ? 's' : ''} en attente`
                    )}
                </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2">
                {Array.from({ length: totalCount }).map((_, index) => (
                    <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index < readyCount
                                ? 'bg-green-400 scale-110'
                                : 'bg-white/30'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
