'use client';

import { cn } from '@/lib/utils';
import type { Member } from '@/types/database';
import { Crown, CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';

interface MembersCompactProps {
    members: Member[];
    currentMemberId: string | null;
    loading?: boolean;
    onOpenManage?: () => void;
    isAdmin?: boolean;
}

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function MembersCompact({
    members,
    currentMemberId,
    loading,
    onOpenManage,
    isAdmin,
}: MembersCompactProps) {
    const [expanded, setExpanded] = useState(false);

    const readyCount = members.filter(m => m.is_ready).length;
    const MAX_VISIBLE = 6;

    if (loading && members.length === 0) {
        return (
            <div
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-white/8"
                style={{ background: '#0c0c0c' }}
            >
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                ))}
            </div>
        );
    }

    return (
        <div
            className="rounded-2xl border-2 border-white/8 overflow-hidden"
            style={{ background: '#0c0c0c', boxShadow: '3px 3px 0px #000' }}
        >
            {/* Compact row — always visible */}
            <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
                aria-label={`Membres du groupe, ${readyCount} sur ${members.length} prêts. ${expanded ? 'Réduire' : 'Développer'}`}
            >
                {/* Avatar row — no overlap */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {members.slice(0, MAX_VISIBLE).map(m => (
                        <div
                            key={m.id}
                            title={m.name}
                            className={cn(
                                'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                                'text-[11px] font-black shrink-0 overflow-hidden transition-all duration-200',
                                m.is_ready
                                    ? 'border-green-500 bg-green-500/15 text-green-300'
                                    : 'border-white/15 bg-white/8 text-white/50',
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
                        <div className="w-8 h-8 rounded-full border-2 border-white/15 bg-white/5 flex items-center justify-center text-[11px] font-black text-white/40 shrink-0">
                            +{members.length - MAX_VISIBLE}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                        {readyCount}/{members.length} prêts
                    </p>
                </div>

                <CaretDown
                    className={cn('w-3.5 h-3.5 text-white/30 transition-transform duration-200 shrink-0', expanded && 'rotate-180')}
                    weight="bold"
                />
            </button>

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
                                        'w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-black shrink-0 overflow-hidden',
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
                                        'flex-1 text-sm font-bold truncate flex items-center gap-1.5',
                                        m.is_ready ? 'text-white' : 'text-white/55'
                                    )}>
                                        {m.name}
                                        {isCurrentUser && (
                                            <span className="text-[11px] font-black text-white/30 uppercase tracking-wider">toi</span>
                                        )}
                                        {isAdminMember && (
                                            <Crown className="w-3 h-3 text-amber-400/70" weight="fill" />
                                        )}
                                    </span>

                                    {/* Status */}
                                    <span className={cn(
                                        'text-[11px] font-black uppercase tracking-[0.14em] shrink-0',
                                        m.is_ready ? 'text-green-400/90' : 'text-white/30'
                                    )}>
                                        {m.is_ready ? '✓ Prêt' : 'En attente'}
                                    </span>
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
