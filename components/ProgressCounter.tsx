'use client';

interface ProgressCounterProps {
    readyCount: number;
    totalCount: number;
}

export default function ProgressCounter({ readyCount, totalCount }: ProgressCounterProps) {
    const percentage = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

    // SVG circle properties
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    // Calculate the offset based on percentage
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
        <div className="relative w-48 h-48 flex items-center justify-center -my-2 group">
            {/* The main SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90 transition-all duration-500 ease-in-out" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                    className="text-white/5 stroke-current"
                    cx="50" cy="50" r={radius}
                    fill="none" strokeWidth="8"
                />

                {/* Foreground Progress */}
                <circle
                    // Using tailwind's drop-shadow allows us to hook into the neon variables seamlessly
                    className="text-[var(--v2-primary)] stroke-current drop-shadow-[0_0_8px_var(--v2-primary)] transition-all duration-1000 ease-out fill-none"
                    cx="50" cy="50" r={radius}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>

            {/* Inner Text contents */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white tracking-tighter">
                    {readyCount}<span className="text-2xl text-slate-500">/{totalCount}</span>
                </span>
                <span className="text-xs font-bold text-[var(--v2-primary)] uppercase tracking-widest mt-1 shadow-neon-primary transition-colors">
                    PRÊTS
                </span>
            </div>

            {/* Optional glow effect that expands slightly when completed */}
            {percentage === 100 && (
                <div className="absolute inset-0 bg-[var(--v2-primary)]/10 rounded-full blur-2xl z-[-1] animate-pulse"></div>
            )}
        </div>
    );
}
