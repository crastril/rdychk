'use client';

import { cn } from '@/lib/utils';
import type { Member } from '@/types/database';
import { Crown, CaretDown } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';

interface MembersCompactProps {
    members: Member[];
    currentMemberId: string | null;
    loading?: boolean;
    onOpenManage?: () => void;
    isAdmin?: boolean;
    mode?: 'planning' | 'day-of';
    votedMemberIds?: Set<string>;
    isRemote?: boolean;
}

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `${r},${g},${bl}`;
}

export function MembersCompact({
    members,
    currentMemberId,
    loading,
    onOpenManage,
    isAdmin,
    mode = 'day-of',
    votedMemberIds,
    isRemote,
}: MembersCompactProps) {
    const [expanded, setExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (expanded) {
            setTimeout(() => {
                const el = containerRef.current;
                if (!el) return;
                const rect = el.getBoundingClientRect();
                if (rect.bottom > window.innerHeight) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 280);
        }
    }, [expanded]);

    const isPlanning = mode === 'planning';
    const total = members.length;

    const activeCount = isPlanning
        ? (votedMemberIds ? members.filter(m => votedMemberIds.has(m.id)).length : 0)
        : members.filter(m => m.is_ready).length;

    const ratio = total > 0 ? activeCount / total : 0;
    const isAllActive = ratio === 1 && total > 0;
    const MAX_VISIBLE = 5;

    // ── REMOTE / CYBERPUNK VARIANT ──
    if (isRemote) {
        const progressColor = isAllActive
            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
            : ratio >= 0.5
            ? 'linear-gradient(90deg, #a855f7, #d946ef)'
            : 'linear-gradient(90deg, rgba(168,85,247,0.4), rgba(168,85,247,0.7))';

        const borderColor = isAllActive
            ? 'rgba(34,197,94,0.3)'
            : ratio >= 0.5
            ? 'rgba(168,85,247,0.3)'
            : 'rgba(168,85,247,0.15)';

        const glowColor = isAllActive
            ? '0 0 16px rgba(34,197,94,0.1)'
            : ratio >= 0.5
            ? '0 0 16px rgba(168,85,247,0.1)'
            : 'none';

        return (
            <div
                ref={containerRef}
                className="overflow-hidden transition-all duration-500"
                style={{
                    background: 'rgba(8,0,20,0.95)',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    boxShadow: glowColor,
                }}
            >
                {/* Compact row */}
                <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{ background: 'transparent' }}
                    onClick={() => setExpanded(v => !v)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    aria-expanded={expanded}
                >
                    {/* Avatar row */}
                    <div className="flex items-center gap-1 shrink-0">
                        {members.slice(0, MAX_VISIBLE).map(m => {
                            const isActive = isPlanning
                                ? (votedMemberIds?.has(m.id) ?? false)
                                : m.is_ready;
                            return (
                                <div
                                    key={m.id}
                                    title={m.name}
                                    className="w-7 h-7 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 overflow-hidden transition-all duration-300"
                                    style={{
                                        borderRadius: '2px',
                                        border: isActive
                                            ? '1px solid rgba(34,197,94,0.5)'
                                            : '1px solid rgba(168,85,247,0.2)',
                                        background: isActive
                                            ? 'rgba(34,197,94,0.08)'
                                            : 'rgba(168,85,247,0.05)',
                                        color: isActive ? '#4ade80' : '#8b5cf6',
                                        outline: m.id === currentMemberId
                                            ? '1px solid rgba(168,85,247,0.5)'
                                            : 'none',
                                        outlineOffset: '2px',
                                    }}
                                >
                                    {m.avatar_url ? (
                                        <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        getInitials(m.name)
                                    )}
                                </div>
                            );
                        })}
                        {members.length > MAX_VISIBLE && (
                            <div
                                className="w-7 h-7 flex items-center justify-center text-[10px] font-mono shrink-0"
                                style={{
                                    borderRadius: '2px',
                                    border: '1px solid rgba(168,85,247,0.15)',
                                    background: 'rgba(168,85,247,0.04)',
                                    color: '#8b5cf6',
                                }}
                            >
                                +{members.length - MAX_VISIBLE}
                            </div>
                        )}
                    </div>

                    {/* Counter */}
                    <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
                        <span
                            className="font-mono leading-none transition-colors duration-500 tabular-nums"
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: isAllActive ? '#4ade80' : ratio >= 0.5 ? '#a855f7' : '#c4b5fd',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {isPlanning ? total : `${activeCount}/${total}`}
                        </span>
                        <span
                            className="font-mono text-[10px] uppercase tracking-[0.18em] pb-0.5"
                            style={{ color: '#a78bfa' }}
                        >
                            {isPlanning ? `PLAYER${total !== 1 ? 'S' : ''}` : 'ONLINE'}
                        </span>
                    </div>

                    <CaretDown
                        className={cn('w-3.5 h-3.5 transition-transform duration-200 shrink-0', expanded && 'rotate-180')}
                        style={{ color: 'rgba(168,85,247,0.3)' }}
                        weight="bold"
                    />
                </button>

                {/* Progress bar — day-of only */}
                {!isPlanning && (
                    <div className="h-[2px] relative overflow-hidden" style={{ background: 'rgba(168,85,247,0.07)' }}>
                        <div
                            className="absolute left-0 top-0 h-full transition-all duration-700 ease-out"
                            style={{
                                width: `${ratio * 100}%`,
                                background: progressColor,
                                boxShadow: ratio > 0.05
                                    ? isAllActive
                                        ? '0 0 8px rgba(34,197,94,0.6)'
                                        : '0 0 8px rgba(217,70,239,0.5)'
                                    : 'none',
                            }}
                        />
                    </div>
                )}

                {/* Expanded member list */}
                <div className={cn(
                    'grid transition-all duration-250 ease-in-out',
                    expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}>
                    <div className="overflow-hidden">
                        <div
                            className="px-4 py-3 space-y-1"
                            style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }}
                        >
                            {members.map(m => {
                                const isCurrentUser = m.id === currentMemberId;
                                const isAdminMember = m.role === 'admin';
                                const hasVoted = votedMemberIds?.has(m.id) ?? false;
                                const isActive = isPlanning ? hasVoted : m.is_ready;

                                return (
                                    <div key={m.id} className="flex items-center gap-3 py-0.5">
                                        <div
                                            className="w-7 h-7 flex items-center justify-center text-[11px] font-mono font-bold shrink-0 overflow-hidden transition-colors duration-300"
                                            style={{
                                                borderRadius: '2px',
                                                border: isActive
                                                    ? '1px solid rgba(34,197,94,0.4)'
                                                    : '1px solid rgba(168,85,247,0.15)',
                                                background: isActive
                                                    ? 'rgba(34,197,94,0.07)'
                                                    : 'rgba(168,85,247,0.04)',
                                                color: isActive ? '#4ade80' : 'rgba(168,85,247,0.35)',
                                            }}
                                        >
                                            {m.avatar_url
                                                ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                : getInitials(m.name)
                                            }
                                        </div>

                                        <span
                                            className="flex-1 font-mono text-sm truncate flex items-center gap-1.5 min-w-0"
                                            style={{ color: isActive ? 'rgba(255,255,255,0.9)' : '#8b5cf6' }}
                                        >
                                            <span className="truncate">{m.name}</span>
                                            {isCurrentUser && (
                                                <span className="font-mono text-[10px] uppercase tracking-wider shrink-0" style={{ color: '#8b5cf6' }}>
                                                    _YOU
                                                </span>
                                            )}
                                            {isAdminMember && (
                                                <Crown className="w-3 h-3 shrink-0" style={{ color: 'rgba(217,70,239,0.6)' }} weight="fill" />
                                            )}
                                        </span>

                                        {isPlanning ? (
                                            hasVoted ? (
                                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] shrink-0" style={{ color: '#4ade80' }}>
                                                    ✓ VOTED
                                                </span>
                                            ) : (
                                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] shrink-0" style={{ color: '#8b5cf6' }}>
                                                    IDLE
                                                </span>
                                            )
                                        ) : (
                                            (() => {
                                                if (m.is_ready) {
                                                    return (
                                                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] shrink-0" style={{ color: '#4ade80' }}>
                                                            ONLINE
                                                        </span>
                                                    );
                                                }
                                                if (m.proposed_time) {
                                                    return (
                                                        <span className="font-mono text-[10px] shrink-0 tabular-nums" style={{ color: '#38bdf8' }}>
                                                            ETA:{m.proposed_time.slice(0, 5)}
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] shrink-0" style={{ color: '#8b5cf6' }}>
                                                        AFK
                                                    </span>
                                                );
                                            })()
                                        )}
                                    </div>
                                );
                            })}

                            {isAdmin && onOpenManage && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onOpenManage(); }}
                                    className="mt-2 w-full text-center font-mono text-[10px] uppercase tracking-[0.18em] py-2 transition-colors"
                                    style={{
                                        borderTop: '1px solid rgba(168,85,247,0.1)',
                                        color: '#a78bfa',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}
                                >
                                    {'> MANAGE_SESSION →'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ──
    const neutral: [number, number, number] = [255, 255, 255];
    const amber: [number, number, number] = [251, 191, 36];
    const green: [number, number, number] = [34, 197, 94];

    const borderRgb = ratio < 0.5
        ? lerpColor(neutral, amber, ratio * 2)
        : lerpColor(amber, green, (ratio - 0.5) * 2);
    const borderAlpha = 0.08 + ratio * 0.42;
    const glowAlpha = ratio * 0.18;

    const borderStyle = {
        borderColor: `rgba(${borderRgb},${borderAlpha})`,
        boxShadow: ratio > 0.1
            ? `0 0 16px rgba(${borderRgb},${glowAlpha}), 3px 3px 0px #000`
            : '3px 3px 0px #000',
    };

    const progressRgb = ratio < 0.5
        ? lerpColor([255, 46, 46], amber, ratio * 2)
        : lerpColor(amber, green, (ratio - 0.5) * 2);

    return (
        <div
            ref={containerRef}
            className="rounded-2xl border-2 overflow-hidden transition-all duration-500"
            style={{ background: '#0c0c0c', ...borderStyle }}
        >
            <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
                aria-label={`Membres du groupe, ${activeCount} sur ${total} ${isPlanning ? 'ont voté' : 'prêts'}. ${expanded ? 'Réduire' : 'Développer'}`}
            >
                <div className="flex items-center gap-1 shrink-0">
                    {members.slice(0, MAX_VISIBLE).map(m => {
                        const isActive = isPlanning
                            ? (votedMemberIds?.has(m.id) ?? false)
                            : m.is_ready;
                        return (
                            <div
                                key={m.id}
                                title={m.name}
                                className={cn(
                                    'w-7 h-7 rounded-full border-2 flex items-center justify-center',
                                    'text-[10px] font-black shrink-0 overflow-hidden transition-all duration-300',
                                    isActive
                                        ? 'border-green-500 bg-green-500/15 text-green-300'
                                        : 'border-white/12 bg-white/6 text-white/45',
                                    m.id === currentMemberId && 'ring-2 ring-[var(--v2-primary)]/60 ring-offset-1 ring-offset-[#0c0c0c]'
                                )}
                            >
                                {m.avatar_url ? (
                                    <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    getInitials(m.name)
                                )}
                            </div>
                        );
                    })}
                    {members.length > MAX_VISIBLE && (
                        <div className="w-7 h-7 rounded-full border-2 border-white/12 bg-white/4 flex items-center justify-center text-[10px] font-black text-white/35 shrink-0">
                            +{members.length - MAX_VISIBLE}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
                    <span
                        className="leading-none transition-colors duration-500"
                        style={{
                            fontFamily: 'var(--font-barlow-condensed)',
                            fontWeight: 900,
                            fontSize: '1.75rem',
                            color: isAllActive ? '#22c55e' : ratio >= 0.5 ? '#fbbf24' : 'rgba(255,255,255,0.9)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {isPlanning ? total : `${activeCount}/${total}`}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40 pb-0.5">
                        {isPlanning ? `membre${total !== 1 ? 's' : ''}` : 'prêts'}
                    </span>
                </div>

                <CaretDown
                    className={cn('w-3.5 h-3.5 text-white/30 transition-transform duration-200 shrink-0', expanded && 'rotate-180')}
                    weight="bold"
                />
            </button>

            {!isPlanning && (
                <div className="h-[3px] bg-white/5 relative overflow-hidden">
                    <div
                        className="absolute left-0 top-0 h-full transition-all duration-700 ease-out"
                        style={{
                            width: `${ratio * 100}%`,
                            background: `rgba(${progressRgb},0.9)`,
                            boxShadow: ratio > 0.05 ? `0 0 8px rgba(${progressRgb},0.6)` : 'none',
                        }}
                    />
                </div>
            )}

            <div className={cn(
                'grid transition-all duration-250 ease-in-out',
                expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}>
                <div className="overflow-hidden">
                    <div className="border-t border-white/6 px-4 py-3 space-y-1.5">
                        {members.map(m => {
                            const isCurrentUser = m.id === currentMemberId;
                            const isAdminMember = m.role === 'admin';
                            const hasVoted = votedMemberIds?.has(m.id) ?? false;
                            return (
                                <div key={m.id} className="flex items-center gap-3 py-1">
                                    <div className={cn(
                                        'w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-black shrink-0 overflow-hidden transition-colors duration-300',
                                        isPlanning
                                            ? (hasVoted ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/15 bg-white/5 text-white/45')
                                            : (m.is_ready ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-white/15 bg-white/5 text-white/45')
                                    )}>
                                        {m.avatar_url
                                            ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            : getInitials(m.name)
                                        }
                                    </div>

                                    <span className={cn(
                                        'flex-1 text-sm font-bold truncate flex items-center gap-1.5 min-w-0',
                                        (isPlanning ? hasVoted : m.is_ready) ? 'text-white' : 'text-white/55'
                                    )}>
                                        <span className="truncate">{m.name}</span>
                                        {isCurrentUser && (
                                            <span className="text-[11px] font-black text-white/30 uppercase tracking-wider shrink-0">toi</span>
                                        )}
                                        {isAdminMember && (
                                            <Crown className="w-3 h-3 text-amber-400/70 shrink-0" weight="fill" />
                                        )}
                                    </span>

                                    {isPlanning ? (
                                        hasVoted ? (
                                            <span className="text-[11px] font-black uppercase tracking-[0.14em] shrink-0 text-green-400/90">✓ A voté</span>
                                        ) : (
                                            <span className="text-[11px] font-black uppercase tracking-[0.14em] shrink-0 text-white/30">En attente</span>
                                        )
                                    ) : (
                                        (() => {
                                            if (m.is_ready) return <span className="text-[11px] font-black uppercase tracking-[0.14em] shrink-0 text-green-400/90">✓ Prêt</span>;
                                            if (m.proposed_time) return <span className="text-[11px] font-black shrink-0 tabular-nums text-sky-400/80">→ {m.proposed_time.slice(0, 5)}</span>;
                                            return <span className="text-[11px] font-black uppercase tracking-[0.14em] shrink-0 text-white/30">En attente</span>;
                                        })()
                                    )}
                                </div>
                            );
                        })}

                        {isAdmin && onOpenManage && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onOpenManage(); }}
                                className="mt-2 w-full text-center text-[11px] font-black uppercase tracking-[0.18em] text-[var(--v2-primary)]/60 hover:text-[var(--v2-primary)] transition-colors py-2 border-t border-white/5"
                            >
                                Gérer le groupe →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
