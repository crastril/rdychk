'use client';

import { cn } from '@/lib/utils';
import { Check, Clock, Timer, Warning } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { toggleReadyAction } from '@/app/actions/member';

interface HeroBlockProps {
    slug: string;
    memberId: string;
    isReady: boolean;
    timerEndTime?: string | null;
    readyCount: number;
    totalCount: number;
    localOptimisticReady: boolean | null;
    onOptimisticChange: (val: boolean | null) => void;
}

const ALL_READY_MSGS = [
    "LET'S GOOO 🔥",
    'OKLM 😎',
    'CARPE DIEM 🎯',
    "C'EST CHAUD 🌶️",
    'TOUT LE MONDE EST LÀ 💪',
    'YALLAH 🚀',
];

const CELEBRATION_EMOJIS = ['🎉', '🔥', '💪', '🚀', '⚡', '💥', '🎯', '🥂', '🎊', '👊', '✅', '🤝'];

type Particle = { id: number; emoji: string; x: number; delay: number; dur: number };

export function HeroBlock({
    slug,
    memberId,
    isReady,
    timerEndTime,
    readyCount,
    totalCount,
    localOptimisticReady,
    onOptimisticChange,
}: HeroBlockProps) {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isSoonReady, setIsSoonReady] = useState(false);
    const [optimisticReady, setOptimisticReady] = useState<boolean | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [allReadyMsg] = useState(
        () => ALL_READY_MSGS[Math.floor(Math.random() * ALL_READY_MSGS.length)]
    );
    const prevAllReadyRef = useRef(false);

    const displayReady = optimisticReady !== null ? optimisticReady : isReady;
    const allReady = readyCount === totalCount && totalCount > 0;
    const progress = totalCount > 0 ? (readyCount / totalCount) * 100 : 0;
    const remaining = totalCount - readyCount;

    // Celebration burst when everyone becomes ready
    useEffect(() => {
        if (allReady && !prevAllReadyRef.current) {
            const burst: Particle[] = Array.from({ length: 16 }, (_, i) => ({
                id: i,
                emoji: CELEBRATION_EMOJIS[i % CELEBRATION_EMOJIS.length],
                x: 5 + (i * 6) % 90,
                delay: i * 0.07,
                dur: 1.2 + Math.random() * 0.6,
            }));
            setParticles(burst);
            const t = setTimeout(() => setParticles([]), 2800);
            return () => clearTimeout(t);
        }
        prevAllReadyRef.current = allReady;
    }, [allReady]);

    // Clear optimistic state when server confirms
    useEffect(() => {
        setOptimisticReady(null);
        onOptimisticChange(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady]);

    // Timer countdown
    useEffect(() => {
        if (!timerEndTime || displayReady) {
            setTimeLeft(null);
            setIsSoonReady(false);
            return;
        }
        const tick = () => {
            const diff = new Date(timerEndTime).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft(null);
                setIsSoonReady(true);
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
                setIsSoonReady(false);
            }
        };
        tick();
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, [timerEndTime, displayReady]);

    const toggle = async () => {
        if (isPending) return;
        const next = !displayReady;
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(next ? 50 : [30, 50, 30]);
        }
        setOptimisticReady(next);
        onOptimisticChange(next);
        setIsPending(true);
        try {
            const result = await toggleReadyAction(slug, memberId, next);
            if (!result.success) {
                setOptimisticReady(null);
                onOptimisticChange(null);
            }
        } catch {
            setOptimisticReady(null);
            onOptimisticChange(null);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="flex flex-col w-full relative" style={{ filter: 'drop-shadow(5px 5px 0px #000)' }}>
            {/* Celebration particles */}
            {particles.length > 0 && (
                <>
                    <style>{`
                        @keyframes celebrate-burst {
                            0%   { transform: translateY(0)    scale(1)   rotate(0deg);   opacity: 1; }
                            70%  { opacity: 1; }
                            100% { transform: translateY(-160px) scale(0.3) rotate(540deg); opacity: 0; }
                        }
                    `}</style>
                    <div className="absolute inset-0 pointer-events-none overflow-visible z-30">
                        {particles.map(p => (
                            <span
                                key={p.id}
                                className="absolute bottom-4 text-xl select-none"
                                style={{
                                    left: `${p.x}%`,
                                    animation: `celebrate-burst ${p.dur}s ease-out ${p.delay}s both`,
                                }}
                            >
                                {p.emoji}
                            </span>
                        ))}
                    </div>
                </>
            )}

            {/* Progress header bar */}
            <div
                className="flex items-center gap-3 px-4 py-3 rounded-t-2xl border-x-[3px] border-t-[3px] border-black transition-colors duration-500"
                style={{ background: allReady ? '#052010' : '#0f0f0f' }}
            >
                <span className={cn(
                    'text-xs font-black uppercase tracking-[0.18em] shrink-0 tabular-nums transition-colors duration-300',
                    allReady ? 'text-green-400' : 'text-white/50'
                )}>
                    {allReady
                        ? allReadyMsg
                        : remaining === 1
                        ? `encore 1 à convaincre 👀`
                        : `${readyCount} / ${totalCount}`}
                </span>

                {/* Progress bar track */}
                <div className="flex-1 h-[5px] rounded-full bg-white/8 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progress}%`,
                            background: allReady
                                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                : 'var(--v2-primary)',
                            boxShadow: allReady ? '0 0 10px #22c55e90' : '0 0 6px var(--v2-primary)',
                        }}
                    />
                </div>

                {!allReady && (
                    <span className="text-xs font-black text-white/35 tracking-tight shrink-0 tabular-nums">
                        PRÊTS
                    </span>
                )}
            </div>

            {/* Main ready button */}
            <button
                onClick={toggle}
                disabled={isPending}
                aria-label={displayReady ? 'Marquer comme pas prêt' : 'Marquer comme prêt'}
                aria-pressed={displayReady}
                className={cn(
                    'relative w-full h-20 flex items-center justify-center',
                    'rounded-b-2xl border-x-[3px] border-b-[3px] border-black',
                    'font-black text-[15px] uppercase tracking-[0.22em]',
                    'transition-all duration-100 select-none overflow-hidden',
                    'active:translate-y-[2px]',
                    displayReady
                        ? 'bg-green-500 text-black'
                        : isSoonReady
                        ? 'bg-amber-500/15 text-amber-400'
                        : timeLeft
                        ? 'bg-[#111] text-white'
                        : 'bg-[#111] text-white/80 hover:bg-[#161616]',
                    isPending && 'opacity-70 pointer-events-none'
                )}
            >
                {/* Pulse overlay when all ready */}
                {allReady && displayReady && (
                    <div className="absolute inset-0 bg-green-400/10 animate-pulse" />
                )}

                <span className="relative z-10 flex items-center gap-3">
                    {displayReady ? (
                        <><Check className="w-5 h-5" weight="bold" /> JE SUIS PRÊT</>
                    ) : isSoonReady ? (
                        <><Warning className="w-5 h-5" /> BIENTÔT PRÊT !</>
                    ) : timeLeft ? (
                        <><Timer className="w-5 h-5 text-[var(--v2-primary)]" /> PRÊT DANS <span className="tabular-nums">{timeLeft}</span></>
                    ) : (
                        <><Clock className="w-5 h-5 text-[var(--v2-primary)]" /> PAS ENCORE PRÊT</>
                    )}
                </span>
            </button>
        </div>
    );
}
