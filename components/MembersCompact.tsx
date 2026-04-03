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
}

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/** Interpolates between two hex colors by ratio [0-1] */
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

    const readyCount = members.filter(m => m.is_ready).length;
    const total = members.length;
    const ratio = total > 0 ? readyCount / total : 0;
    const isAllReady = ratio === 1 && total > 0;
    const MAX_VISIBLE = 5;

    // Border & glow color: neutral → amber (50%) → green (100%)
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

    // Progress bar color
    const progressRgb = ratio < 0.5
        ? lerpColor([255, 46, 46], amber, ratio * 2)
        : lerpColor(amber, green, (ratio - 0.5) * 2);

    return (
        <div
            ref={containerRef}
            className="rounded-2xl border-2 overflow-hidden transition-all duration-500"
            style={{ background: '#0c0c0c', ...borderStyle }}
        >
            {/* Compact row — always visible */}
            <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
                aria-label={`Membres du groupe, ${readyCount} sur ${total} prêts. ${expanded ? 'Réduire' : 'Développer'}`}
            >
                {/* Avatar row */}
                <div className="flex items-center gap-1 shrink-0">
                    {members.slice(0, MAX_VISIBLE).map(m => (
                        <div
                            key={m.id}
                            title={m.name}
                            className={cn(
                                'w-7 h-7 rounded-full border-2 flex items-center justify-center',
                                'text-[10px] font-black shrink-0 overflow-hidden transition-all duration-300',
                                m.is_ready
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
                    ))}
                    {members.length > MAX_VISIBLE && (
                        <div className="w-7 h-7 rounded-full border-2 border-white/12 bg-white/4 flex items-center justify-center text-[10px] font-black text-white/35 shrink-0">
                            +{members.length - MAX_VISIBLE}
                        </div>
                    )}
                </div>

                {/* Big counter */}
                <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
                    <span
                        className="leading-none transition-colors duration-500"
                        style={{
                            fontFamily: 'var(--font-barlow-condensed)',
                            fontWeight: 900,
                            fontSize: '1.75rem',
                            color: isAllReady ? '#22c55e' : ratio >= 0.5 ? '#fbbf24' : 'rgba(255,255,255,0.9)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {readyCount}/{total}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40 pb-0.5">
                        prêts
                    </span>
                </div>

                <CaretDown
                    className={cn('w-3.5 h-3.5 text-white/30 transition-transform duration-200 shrink-0', expanded && 'rotate-180')}
                    weight="bold"
                />
            </button>

            {/* Progress bar */}
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

            {/* Expanded member list */}
            <div className={cn(
                'grid transition-all duration-250 ease-in-out',
                expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}>
                <div className="overflow-hidden">
                    <div className="border-t border-white/6 px-4 py-3 space-y-1.5">
                        {members.map(m => {
                            const isCurrentUser = m.id === currentMemberId;
                            const isAdminMember = m.role === 'admin';
                            return (
                                <div key={m.id} className="flex items-center gap-3 py-1">
                                    {/* Avatar */}
                                    <div className={cn(
                                        'w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-black shrink-0 overflow-hidden transition-colors duration-300',
                                        m.is_ready
                                            ? 'border-green-500/40 bg-green-500/10 text-green-400'
                                            : 'border-white/15 bg-white/5 text-white/45'
                                    )}>
                                        {m.avatar_url
                                            ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            : getInitials(m.name)
                                        }
                                    </div>

                                    {/* Name */}
                                    <span className={cn(
                                        'flex-1 text-sm font-bold truncate flex items-center gap-1.5 min-w-0',
                                        m.is_ready ? 'text-white' : 'text-white/55'
                                    )}>
                                        <span className="truncate">{m.name}</span>
                                        {isCurrentUser && (
                                            <span className="text-[11px] font-black text-white/30 uppercase tracking-wider shrink-0">toi</span>
                                        )}
                                        {isAdminMember && (
                                            <Crown className="w-3 h-3 text-amber-400/70 shrink-0" weight="fill" />
                                        )}
                                    </span>

                                    {/* Status */}
                                    {(() => {
                                        if (m.is_ready) {
                                            return (
                                                <span className="text-[11px] font-black uppercase tracking-[0.14em] shrink-0 text-green-400/90">
                                                    ✓ Prêt
                                                </span>
                                            );
                                        }
                                        const timerEnd = m.timer_end_time ? new Date(m.timer_end_time) : null;
                                        if (timerEnd && timerEnd > new Date()) {
                                            const hhmm = timerEnd.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                            return (
                                                <span className="text-[11px] font-black shrink-0 tabular-nums text-amber-400/80">
                                                    → {hhmm}h
                                                </span>
                                            );
                                        }
                                        if (m.proposed_time) {
                                            return (
                                                <span className="text-[11px] font-black shrink-0 tabular-nums text-sky-400/80">
                                                    → {m.proposed_time.slice(0, 5)}h
                                                </span>
                                            );
                                        }
                                        return (
                                            <span className="text-[11px] font-black uppercase tracking-[0.14em] shrink-0 text-white/30">
                                                En attente
                                            </span>
                                        );
                                    })()}
                                </div>
                            );
                        })}

                        {/* Admin action */}
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
