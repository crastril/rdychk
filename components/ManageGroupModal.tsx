'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { kickMemberAction } from '@/app/actions/member';
import { CircleNotch, Trash, WarningOctagon, Crown } from '@phosphor-icons/react';
import { Member } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface ManageGroupModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    slug: string;
    members: Member[];
    loading?: boolean;
    onRefresh?: () => Promise<void>;
    currentMemberId: string | null;
    isRemote?: boolean;
}

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function ManageGroupModal({ isOpen, onOpenChange, slug, members, loading, onRefresh, currentMemberId, isRemote }: ManageGroupModalProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteMember = async (targetId: string) => {
        if (!currentMemberId) return;
        if (!confirm('Voulez-vous vraiment exclure ce membre du groupe ?')) return;
        setDeletingId(targetId);
        try {
            const result = await kickMemberAction(slug, currentMemberId, targetId);
            if (!result.success) { console.error('Kick failed:', result.error); return; }
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Error kicking member:', error);
        } finally {
            setDeletingId(null);
        }
    };

    // ── REMOTE / CYBERPUNK VARIANT ──
    if (isRemote) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent
                    className="flex flex-col p-0 overflow-hidden"
                    style={{
                        maxWidth: '480px',
                        width: 'calc(100% - 2rem)',
                        height: '80vh',
                        background: 'rgba(8,0,20,0.99)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: '4px',
                        boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                    }}
                >
                    {/* Top neon bar */}
                    <div className="w-full h-[2px] shrink-0" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />

                    {/* Header */}
                    <div
                        className="px-5 py-4 shrink-0"
                        style={{ borderBottom: '1px solid rgba(168,85,247,0.12)' }}
                    >
                        <DialogTitle className="font-mono text-[0.85rem] uppercase tracking-[0.2em]" style={{ color: '#c4b5fd' }}>
                            {'> MANAGE_SESSION'}
                        </DialogTitle>
                        <DialogDescription className="font-mono text-[10px] uppercase tracking-[0.15em] mt-1" style={{ color: '#8b5cf6' }}>
                            {`// ${members.length}_PLAYER${members.length !== 1 ? 'S' : ''} · ADMIN_ACCESS`}
                        </DialogDescription>
                    </div>

                    {/* Member list */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                        {loading && members.length === 0 ? (
                            <div className="flex justify-center py-10">
                                <CircleNotch className="w-5 h-5 animate-spin" style={{ color: '#a855f7' }} />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="font-mono text-[11px] text-center py-10 uppercase tracking-[0.15em]" style={{ color: '#8b5cf6' }}>
                                NO_PLAYERS_FOUND
                            </p>
                        ) : (
                            members.map((member) => {
                                const isCurrentUser = member.id === currentMemberId;
                                const isAdmin = member.role === 'admin';
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between px-3 py-2.5 transition-colors"
                                        style={{
                                            border: '1px solid rgba(168,85,247,0.1)',
                                            borderRadius: '3px',
                                            background: 'rgba(168,85,247,0.03)',
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                                                style={{
                                                    borderRadius: '2px',
                                                    border: `1px solid ${isAdmin ? 'rgba(217,70,239,0.4)' : 'rgba(168,85,247,0.2)'}`,
                                                    background: isAdmin ? 'rgba(217,70,239,0.08)' : 'rgba(168,85,247,0.06)',
                                                    color: isAdmin ? '#e879f9' : '#a78bfa',
                                                }}
                                            >
                                                {getInitials(member.name)}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm" style={{ color: '#c4b5fd' }}>
                                                        {member.name}
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5" style={{ border: '1px solid rgba(168,85,247,0.3)', borderRadius: '2px', color: '#8b5cf6' }}>
                                                            YOU
                                                        </span>
                                                    )}
                                                    {isAdmin && (
                                                        <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-1" style={{ border: '1px solid rgba(217,70,239,0.3)', borderRadius: '2px', color: '#e879f9' }}>
                                                            <Crown className="w-2.5 h-2.5" weight="fill" />
                                                            ADMIN
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: member.is_ready ? '#4ade80' : '#8b5cf6' }}>
                                                    {member.is_ready ? 'ONLINE' : 'IDLE'}
                                                </span>
                                            </div>
                                        </div>

                                        {!isCurrentUser ? (
                                            <button
                                                className="w-8 h-8 flex items-center justify-center transition-all"
                                                style={{
                                                    border: '1px solid rgba(239,68,68,0.2)',
                                                    borderRadius: '2px',
                                                    background: 'transparent',
                                                    color: 'rgba(239,68,68,0.5)',
                                                }}
                                                onClick={() => handleDeleteMember(member.id)}
                                                disabled={deletingId === member.id}
                                                onMouseEnter={e => {
                                                    (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)');
                                                    (e.currentTarget.style.background = 'rgba(239,68,68,0.08)');
                                                    (e.currentTarget.style.color = 'rgb(239,68,68)');
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)');
                                                    (e.currentTarget.style.background = 'transparent');
                                                    (e.currentTarget.style.color = 'rgba(239,68,68,0.5)');
                                                }}
                                            >
                                                {deletingId === member.id
                                                    ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                                                    : <Trash className="w-3.5 h-3.5" />
                                                }
                                            </button>
                                        ) : (
                                            <div className="w-8 h-8" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ──
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col p-0 overflow-hidden"
                style={{
                    background: '#0d0d0d',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 0,
                    maxWidth: '480px',
                    width: 'calc(100% - 2rem)',
                    height: '80vh',
                }}
            >
                {/* Top amber bar */}
                <div className="w-full shrink-0" style={{ height: '4px', background: '#fbbf24' }} />

                {/* Header */}
                <div
                    className="shrink-0"
                    style={{
                        paddingLeft: 20,
                        paddingRight: 20,
                        paddingTop: 16,
                        paddingBottom: 16,
                        borderBottom: '2px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <DialogTitle
                        className="font-black uppercase tracking-widest"
                        style={{ fontSize: '1rem', color: '#ffffff' }}
                    >
                        Gérer les membres
                    </DialogTitle>
                    <DialogDescription
                        className="uppercase tracking-widest"
                        style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.4)',
                            fontWeight: 700,
                        }}
                    >
                        {members.length} MEMBRE{members.length !== 1 ? 'S' : ''} · ACCÈS ADMIN
                    </DialogDescription>
                </div>

                {/* Member list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {loading && members.length === 0 ? (
                        <div className="flex items-center justify-center py-10">
                            <span
                                className="font-black uppercase tracking-widest"
                                style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                            >
                                <CircleNotch className="w-5 h-5 animate-spin inline-block" />
                            </span>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="flex items-center justify-center py-10">
                            <span
                                className="font-black uppercase tracking-widest"
                                style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                            >
                                Aucun membre trouvé
                            </span>
                        </div>
                    ) : (
                        members.map((member) => {
                            const isCurrentUser = member.id === currentMemberId;
                            const isAdmin = member.role === 'admin';
                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between transition-colors"
                                    style={{
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        borderRadius: 0,
                                        padding: '10px 12px',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.25)';
                                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div
                                            className="flex items-center justify-center shrink-0 font-black text-sm"
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 0,
                                                border: isAdmin ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.3)',
                                                background: isAdmin ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.05)',
                                                color: isAdmin ? '#fbbf24' : '#ffffff',
                                            }}
                                        >
                                            {getInitials(member.name)}
                                        </div>

                                        {/* Name + badges */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-sm" style={{ color: '#ffffff' }}>
                                                {member.name}
                                            </span>
                                            {isCurrentUser && (
                                                <span
                                                    className="uppercase"
                                                    style={{
                                                        border: '1px solid rgba(255,255,255,0.35)',
                                                        fontSize: 9,
                                                        color: 'rgba(255,255,255,0.6)',
                                                        padding: '1px 5px',
                                                        fontFamily: 'inherit',
                                                    }}
                                                >
                                                    Vous
                                                </span>
                                            )}
                                            {isAdmin && (
                                                <span
                                                    className="flex items-center gap-1 uppercase"
                                                    style={{
                                                        border: '1px solid #fbbf24',
                                                        color: '#fbbf24',
                                                        fontSize: 9,
                                                        padding: '1px 5px',
                                                    }}
                                                >
                                                    <Crown className="w-2.5 h-2.5" weight="fill" />
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Kick button */}
                                    {!isCurrentUser ? (
                                        <button
                                            className="flex items-center justify-center transition-all shrink-0"
                                            style={{
                                                width: 40,
                                                height: 40,
                                                border: '2px solid rgba(239,68,68,0.25)',
                                                borderRadius: 0,
                                                color: 'rgba(239,68,68,0.55)',
                                                background: 'transparent',
                                            }}
                                            onClick={() => handleDeleteMember(member.id)}
                                            disabled={deletingId === member.id}
                                            onMouseEnter={e => {
                                                (e.currentTarget.style.borderColor = '#ef4444');
                                                (e.currentTarget.style.background = 'rgba(239,68,68,0.08)');
                                                (e.currentTarget.style.color = '#ef4444');
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)');
                                                (e.currentTarget.style.background = 'transparent');
                                                (e.currentTarget.style.color = 'rgba(239,68,68,0.55)');
                                            }}
                                        >
                                            {deletingId === member.id
                                                ? <CircleNotch className="w-4 h-4 animate-spin" />
                                                : <Trash className="w-4 h-4" />
                                            }
                                        </button>
                                    ) : (
                                        <div style={{ width: 40, height: 40 }} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
