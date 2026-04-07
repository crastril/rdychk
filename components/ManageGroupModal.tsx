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
            <DialogContent className="max-w-md sm:max-w-lg h-[80vh] flex flex-col p-0 glass-panel border-white/10 text-white rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)] z-50"></div>
                <DialogHeader className="p-6 pb-4 border-b border-white/10 bg-black/20 mt-1">
                    <DialogTitle className="text-xl font-bold">Gérer les membres</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Liste des membres du groupe.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 pt-4">
                    <div className="space-y-3 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {loading && members.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <CircleNotch className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Aucun membre trouvé.</p>
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--v2-primary)]/20 to-transparent border border-[var(--v2-primary)]/30 flex items-center justify-center text-sm font-bold shadow-neon-primary text-white">
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
                                                {member.name}
                                                <span className="flex items-center gap-1">
                                                    {member.id === currentMemberId && <Badge variant="secondary" className="text-[10px] h-4 bg-white/10 text-white hover:bg-white/20 border-white/20">Vous</Badge>}
                                                    {member.role === 'admin' && <Badge variant="outline" className="text-[10px] h-4 border-[var(--v2-primary)] text-[var(--v2-primary)] bg-[var(--v2-primary)]/10">Admin</Badge>}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {member.id !== currentMemberId ? (
                                        <button
                                            className="h-10 w-10 flex items-center justify-center rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                            onClick={() => handleDeleteMember(member.id)}
                                            disabled={deletingId === member.id}
                                        >
                                            {deletingId === member.id
                                                ? <CircleNotch className="w-4 h-4 animate-spin" />
                                                : <Trash className="w-5 h-5" />
                                            }
                                        </button>
                                    ) : (
                                        <div className="h-10 w-10 flex items-center justify-center">
                                            <WarningOctagon className="w-5 h-5 text-slate-600" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
