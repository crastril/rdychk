'use client';

import { cn } from '@/lib/utils';
import { Check, Alarm, Hourglass, Warning } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toggleReadyAction } from '@/app/actions/member';
import type { Member } from '@/types/database';

interface HeroBlockProps {
    slug: string;
    memberId: string;
    isReady: boolean;
    timerEndTime?: string | null;
    proposedTime?: string | null;
    readyCount: number;
    totalCount: number;
    members: Member[];
    localOptimisticReady: boolean | null;
    onOptimisticChange: (val: boolean | null) => void;
    isRemote?: boolean;
}

const ALL_READY_MSGS = [
    "LET'S GOOO 🔥",
    'OKLM 😎',
    'CARPE DIEM 🎯',
    "C'EST CHAUD 🌶️",
    'TOUT LE MONDE EST LÀ 💪',
    'YALLAH 🚀',
];

const ALL_READY_MSGS_REMOTE = [
    'ALL_PLAYERS_READY 🟢',
    'SESSION_START_NOW 🎮',
    'LOBBY_FULL ✅',
    'GO_GO_GO 🔥',
    'CONN_ESTABLISHED ⚡',
];

export function HeroBlock({
    slug,
    memberId,
    isReady,
    timerEndTime,
    proposedTime,
    readyCount,
    totalCount,
    members,
    localOptimisticReady,
    onOptimisticChange,
    isRemote,
}: HeroBlockProps) {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isSoonReady, setIsSoonReady] = useState(false);
    const [optimisticReady, setOptimisticReady] = useState<boolean | null>(null);
    const [isPending, setIsPending] = useState(false);
    const msgs = isRemote ? ALL_READY_MSGS_REMOTE : ALL_READY_MSGS;
    const [allReadyMsg] = useState(() => msgs[Math.floor(Math.random() * msgs.length)]);
    const prevAllReadyRef = useRef(false);

    const displayReady = optimisticReady !== null ? optimisticReady : isReady;
    const allReady = readyCount === totalCount && totalCount > 0;
    const progress = totalCount > 0 ? (readyCount / totalCount) * 100 : 0;
    const remaining = totalCount - readyCount;

    const readyOthers = members.filter(m => m.is_ready && m.id !== memberId);
    const socialPressureMsg = !displayReady && readyOthers.length > 0
        ? readyOthers.length === 1
            ? `${readyOthers[0].name.split(' ')[0]} t'attend 👀`
            : `${readyOthers.length} personnes t'attendent 👀`
        : null;

    const formattedProposedTime = proposedTime
        ? proposedTime.slice(0, 5).replace(':', 'H')
        : null;

    useEffect(() => {
        if (allReady && !prevAllReadyRef.current) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.8 },
                colors: isRemote
                    ? ['#a855f7', '#d946ef', '#6366f1', '#ffffff', '#22c55e']
                    : ['#22c55e', '#4ade80', '#ffffff', '#fbbf24', '#34d399'],
            });
        }
        prevAllReadyRef.current = allReady;
    }, [allReady, isRemote]);

    useEffect(() => {
        setOptimisticReady(null);
        onOptimisticChange(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady]);

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

    const isDefaultNotReady = !displayReady && !timeLeft && !isSoonReady && !formattedProposedTime;

    // ── REMOTE / CYBERPUNK VARIANT ──
    if (isRemote) {
        const headerBg = allReady ? 'rgba(5,46,22,0.9)' : 'rgba(8,0,20,0.95)';
        const headerColor = allReady ? '#4ade80' : socialPressureMsg ? '#fbbf24' : '#a78bfa';
        const headerLabel = allReady
            ? allReadyMsg
            : socialPressureMsg
            ? `// ${socialPressureMsg.toUpperCase()}`
            : `PLAYERS_READY: ${readyCount}/${totalCount}`;

        const btnBg = displayReady
            ? 'rgba(5,46,22,0.6)'
            : isSoonReady
            ? 'rgba(245,158,11,0.06)'
            : 'rgba(8,0,20,0.95)';
        const btnColor = displayReady
            ? '#4ade80'
            : isSoonReady
            ? '#fbbf24'
            : timeLeft
            ? '#c4b5fd'
            : formattedProposedTime
            ? '#38bdf8'
            : '#c4b5fd';

        return (
            <div
                className="flex flex-col w-full relative overflow-hidden"
                style={{
                    borderRadius: '4px',
                    border: '1px solid rgba(168,85,247,0.25)',
                    boxShadow: allReady
                        ? '0 0 24px rgba(34,197,94,0.15), 0 0 1px rgba(34,197,94,0.5)'
                        : '0 0 20px rgba(168,85,247,0.08), 0 0 1px rgba(168,85,247,0.4)',
                }}
            >
                {/* Scan line */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
                    }}
                />

                {/* Progress header */}
                <div
                    className="flex items-center gap-3 px-4 py-2.5 relative z-20"
                    style={{
                        background: headerBg,
                        borderBottom: '1px solid rgba(168,85,247,0.12)',
                    }}
                >
                    <span
                        className="font-mono text-[11px] uppercase tracking-[0.18em] shrink-0 tabular-nums transition-colors duration-300 truncate"
                        style={{ color: headerColor }}
                    >
                        {headerLabel}
                    </span>

                    <div className="flex-1 h-[2px] overflow-hidden" style={{ background: 'rgba(168,85,247,0.08)' }}>
                        <div
                            className="h-full transition-all duration-500 ease-out"
                            style={{
                                width: `${progress}%`,
                                background: allReady
                                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                    : 'linear-gradient(90deg, #a855f7, #d946ef)',
                                boxShadow: allReady
                                    ? '0 0 8px #22c55e90'
                                    : '0 0 8px rgba(217,70,239,0.7)',
                            }}
                        />
                    </div>

                    {!allReady && !socialPressureMsg && (
                        <span
                            className="font-mono text-[10px] shrink-0 tracking-widest"
                            style={{ color: '#8b5cf6' }}
                        >
                            {remaining === 1 ? `+${remaining}_WAIT` : 'PRÊTS'}
                        </span>
                    )}
                </div>

                {/* Main button */}
                <button
                    onClick={toggle}
                    disabled={isPending}
                    aria-label={displayReady ? 'Marquer comme pas prêt' : 'Indiquer que je suis prêt'}
                    aria-pressed={displayReady}
                    className={cn(
                        'relative w-full flex items-center justify-center z-20',
                        'font-mono text-[13px] uppercase tracking-[0.22em]',
                        'transition-all duration-150 select-none overflow-hidden',
                        'active:translate-y-[1px]',
                        isDefaultNotReady ? 'h-[4.75rem] pb-3' : 'h-20',
                        isPending && 'opacity-60 pointer-events-none'
                    )}
                    style={{
                        background: btnBg,
                        borderTop: '1px solid rgba(168,85,247,0.1)',
                        color: btnColor,
                    }}
                >
                    {/* Radial glow when ready */}
                    {displayReady && (
                        <div
                            className="absolute inset-0"
                            style={{ background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.07) 0%, transparent 70%)' }}
                        />
                    )}
                    {/* Subtle purple radial idle */}
                    {!displayReady && (
                        <div
                            className="absolute inset-0"
                            style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.04) 0%, transparent 70%)' }}
                        />
                    )}

                    <span className="relative z-10 flex flex-col items-center gap-1.5">
                        <span className="flex items-center gap-3">
                            {displayReady ? (
                                <>
                                    <Check className="w-4 h-4" weight="bold" />
                                    <span>{'[ STATUS: READY ]'}</span>
                                </>
                            ) : isSoonReady ? (
                                <>
                                    <Warning className="w-4 h-4" />
                                    <span>{'[ STANDBY... ]'}</span>
                                </>
                            ) : timeLeft ? (
                                <>
                                    <Hourglass className="w-4 h-4 animate-pulse" />
                                    <span>{'[ INIT... '}<span className="tabular-nums">{timeLeft}</span>{' ]'}</span>
                                </>
                            ) : formattedProposedTime ? (
                                <>
                                    <Alarm className="w-4 h-4" />
                                    <span>{`[ ETA: ${formattedProposedTime} ]`}</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ color: '#8b5cf6' }}>{'>'}</span>
                                    <span>CONFIRM_READY_STATUS</span>
                                    <span className="animate-cursor-blink" style={{ color: '#c4b5fd' }}>_</span>
                                </>
                            )}
                        </span>
                        {isDefaultNotReady && (
                            <span
                                className="font-mono text-[10px] normal-case tracking-normal"
                                style={{ color: '#8b5cf6' }}
                            >
                                {'// appuie quand tu es prêt à jouer'}
                            </span>
                        )}
                    </span>
                </button>
            </div>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ──
    return (
        <div className="flex flex-col w-full relative rounded-2xl" style={{ boxShadow: '5px 5px 0px #000' }}>
            {/* Progress header bar */}
            <div
                className="flex items-center gap-3 px-4 py-3 rounded-t-2xl border-x-[3px] border-t-[3px] border-black transition-colors duration-500"
                style={{ background: allReady ? '#052010' : '#0f0f0f' }}
            >
                <span className={cn(
                    'text-xs font-black uppercase tracking-[0.18em] shrink-0 tabular-nums transition-colors duration-300',
                    allReady ? 'text-green-400' : socialPressureMsg ? 'text-amber-400' : 'text-white/65'
                )}>
                    {allReady
                        ? allReadyMsg
                        : socialPressureMsg
                        ? socialPressureMsg
                        : remaining === 1
                        ? `encore 1 à attendre 👀`
                        : `${readyCount} / ${totalCount}`}
                </span>

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

                {!allReady && !socialPressureMsg && (
                    <span className="text-xs font-black text-white/50 tracking-tight shrink-0 tabular-nums">
                        PRÊTS
                    </span>
                )}
            </div>

            {/* Main ready button */}
            <button
                onClick={toggle}
                disabled={isPending}
                aria-label={displayReady ? 'Marquer comme pas prêt' : 'Indiquer que je suis prêt'}
                aria-pressed={displayReady}
                className={cn(
                    'relative w-full flex items-center justify-center',
                    'rounded-b-2xl border-x-[3px] border-b-[3px] border-black',
                    'font-black text-[15px] uppercase tracking-[0.22em]',
                    'transition-all duration-100 select-none overflow-hidden',
                    'active:translate-y-[2px]',
                    isDefaultNotReady ? 'h-[4.75rem] pb-3' : 'h-20',
                    displayReady
                        ? 'bg-green-500 text-black'
                        : isSoonReady
                        ? 'bg-amber-500/15 text-amber-400'
                        : timeLeft
                        ? 'bg-[#111] text-white'
                        : formattedProposedTime
                        ? 'bg-[#111] text-sky-400 hover:bg-[#161616]'
                        : 'bg-[#111] text-white/90 hover:bg-[#161616]',
                    isPending && 'opacity-70 pointer-events-none'
                )}
            >
                {allReady && displayReady && (
                    <div className="absolute inset-0 bg-green-400/10 animate-pulse" />
                )}

                <span className="relative z-10 flex flex-col items-center gap-1">
                    <span className="flex items-center gap-3">
                        {displayReady ? (
                            <><Check className="w-5 h-5" weight="bold" /> JE SUIS PRÊT</>
                        ) : isSoonReady ? (
                            <><Warning className="w-5 h-5" /> BIENTÔT PRÊT !</>
                        ) : timeLeft ? (
                            <><Hourglass className="w-5 h-5 text-[var(--v2-primary)]" /> PRÊT DANS <span className="tabular-nums">{timeLeft}</span></>
                        ) : formattedProposedTime ? (
                            <><Alarm className="w-5 h-5" /> ARRIVÉE PRÉVUE · {formattedProposedTime}</>
                        ) : (
                            <><Check className="w-5 h-5 text-[var(--v2-primary)]" weight="bold" /> INDIQUER QUE JE SUIS PRÊT</>
                        )}
                    </span>
                    {isDefaultNotReady && (
                        <span className="text-[11px] font-medium normal-case tracking-normal text-white/30">
                            Appuie quand tu es prêt à quitter la maison
                        </span>
                    )}
                </span>
            </button>
        </div>
    );
}
