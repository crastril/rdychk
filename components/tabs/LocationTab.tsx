'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LocationProposal, Member } from '@/types/database';
import { addLocationProposalAction, voteLocationProposalAction, deleteLocationProposalAction, updateLocationAction } from '@/app/actions/group';
import { MapPin, GameController, CaretUp, CaretDown, Plus, CircleNotch, Star, Trash, WarningOctagon, Check } from '@phosphor-icons/react';
import { AddLocationProposalModal } from '@/components/AddLocationProposalModal';
import { AddGameProposalModal } from '@/components/AddGameProposalModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const waterfallEmojisUp = ['💯', '👌', '🔥', '🥵', '😍', '❤️🔥'];
const waterfallEmojisDown = ['🤢', '😒', '💩', '🛌', '👎', '🙅', '🥶'];

function ProposalParticles({ score }: { score: number }) {
    const [particles, setParticles] = useState<{ id: number, emoji: string, left: string, delay: string, duration: string }[]>([]);
    const [particleScoreSign, setParticleScoreSign] = useState(0);

    useEffect(() => {
        const newSign = Math.sign(score);
        if (newSign !== particleScoreSign) {
            if (newSign !== 0) {
                const emojisToUse = newSign > 0 ? waterfallEmojisUp : waterfallEmojisDown;
                setParticles(
                    Array.from({ length: 15 }).map((_, i) => ({
                        id: i,
                        emoji: emojisToUse[Math.floor(Math.random() * emojisToUse.length)],
                        left: `${Math.random() * 90}%`,
                        delay: `${Math.random() * 5}s`,
                        duration: `${3 + Math.random() * 3}s`
                    }))
                );
            } else {
                setParticles([]);
            }
            setParticleScoreSign(newSign);
        }
    }, [score, particleScoreSign]);

    if (score === 0 || particles.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20 overflow-hidden" style={{ borderRadius: 'inherit' }}>
            {particles.map(p => (
                <div
                    key={p.id}
                    className={cn(
                        "absolute text-2xl duration-1000",
                        score > 0 ? "bottom-[-20%] animate-emoji-waterfall" : "top-[-20%] animate-emoji-waterfall-down"
                    )}
                    style={{
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration
                    }}
                >
                    {p.emoji}
                </div>
            ))}
        </div>
    );
}

interface LocationTabProps {
    group: {
        id: string;
        slug?: string;
        type?: 'remote' | 'in_person';
        location_voting_enabled: boolean;
        city: string | null;
        location?: { name: string; address?: string } | null;
        base_lat?: number | null;
        base_lng?: number | null;
    };
    slug: string;
    memberId: string | null;
    isAdmin: boolean;
    proposals: LocationProposal[];
    myVotes: Record<string, 1 | -1>;
    onProposalsChange: (proposals: LocationProposal[]) => void;
    members: Member[];
    onGroupChange?: () => void;
}

export function LocationTab({ group, slug, memberId, isAdmin, proposals, myVotes: initialMyVotes, onProposalsChange, members, onGroupChange }: LocationTabProps) {
    const isRemote = group.type === 'remote';
    const [myVotes, setMyVotes] = useState<Record<string, 1 | -1>>(initialMyVotes);
    const [localScores, setLocalScores] = useState<Record<string, number>>({});
    const [votingIds, setVotingIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [confirmingLocationId, setConfirmingLocationId] = useState<string | null>(null);

    useEffect(() => {
        setMyVotes(prev => {
            const next = { ...initialMyVotes };
            votingIds.forEach(id => {
                if (prev[id] !== undefined) next[id] = prev[id];
                else delete next[id];
            });
            return next;
        });
    }, [initialMyVotes]); // eslint-disable-line react-hooks/exhaustive-deps

    const mergedProposals = useMemo(() => {
        return proposals.map(p => ({
            ...p,
            score: localScores[p.id] !== undefined ? localScores[p.id] : p.score
        }));
    }, [proposals, localScores]);

    const { featured, rest } = useMemo(() => {
        const sorted = [...mergedProposals].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.name.localeCompare(b.name);
        });
        return { featured: sorted[0] || null, rest: sorted.slice(1) };
    }, [mergedProposals]);

    const hasProposed = memberId ? proposals.some(p => p.member_id === memberId) : false;

    const handleVote = async (proposalId: string, vote: 1 | -1) => {
        if (!memberId || votingIds.has(proposalId)) return;
        setVotingIds(prev => new Set(prev).add(proposalId));
        try {
            const result = await voteLocationProposalAction(slug, memberId, proposalId, vote);
            if (result.success) {
                if (result.score !== undefined) {
                    setLocalScores(prev => ({ ...prev, [proposalId]: result.score! }));
                }
                setMyVotes(prev => {
                    const next = { ...prev };
                    if (result.myVote === null || result.myVote === undefined) {
                        delete next[proposalId];
                    } else {
                        next[proposalId] = result.myVote;
                    }
                    return next;
                });
            }
        } catch (err) {
            console.error("Vote failed:", err);
        } finally {
            setVotingIds(prev => {
                const next = new Set(prev);
                next.delete(proposalId);
                return next;
            });
        }
    };

    const handleDelete = async (proposalId: string) => {
        if (!memberId || !confirm("Êtes-vous sûr de vouloir supprimer votre proposition ?")) return;
        setDeletingId(proposalId);
        onProposalsChange(proposals.filter(p => p.id !== proposalId));
        await deleteLocationProposalAction(slug, memberId, proposalId);
        setDeletingId(null);
    };

    const handleConfirmLocation = async (proposal: LocationProposal) => {
        if (!memberId || !isAdmin) return;
        setConfirmingLocationId(proposal.id);
        const newLocation = { name: proposal.name, address: proposal.description ?? undefined, id: proposal.id };
        const result = await updateLocationAction(slug, memberId, group.id, newLocation);
        if (result.success) onGroupChange?.();
        setConfirmingLocationId(null);
        setIsOverrideModalOpen(false);
    };

    if (!group.location_voting_enabled && !group.location) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                    {isRemote
                        ? <GameController className="w-7 h-7 text-slate-500" weight="fill" />
                        : <MapPin className="w-7 h-7 text-slate-500" />
                    }
                </div>
                <div>
                    <p className="text-white font-bold text-lg">Propositions désactivées</p>
                    <p className="text-slate-500 mt-1 text-sm">L'admin peut activer les propositions dans les paramètres.</p>
                </div>
            </div>
        );
    }

    // ── Vote controls — cyberpunk variant ────────────────────────────────────
    const renderVoteControlsRemote = (p: LocationProposal & { score: number }, size: 'lg' | 'sm') => {
        const isVoting = votingIds.has(p.id);
        const upActive = myVotes[p.id] === 1;
        const downActive = myVotes[p.id] === -1;
        const scoreColor = p.score > 0 ? '#4ade80' : p.score < 0 ? '#f87171' : '#a78bfa';

        const chevronSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
        const btnSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';

        return (
            <div
                className="flex flex-col items-center gap-1 shrink-0"
                style={{
                    border: '1px solid rgba(168,85,247,0.15)',
                    borderRadius: '3px',
                    background: 'rgba(168,85,247,0.03)',
                    padding: size === 'sm' ? '4px' : '6px',
                }}
            >
                <button
                    onClick={() => handleVote(p.id, 1)}
                    disabled={!memberId || isVoting}
                    className={`${btnSize} flex items-center justify-center transition-all`}
                    style={{
                        borderRadius: '2px',
                        border: `1px solid ${upActive ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.1)'}`,
                        background: upActive ? 'rgba(168,85,247,0.15)' : 'transparent',
                        color: upActive ? '#c4b5fd' : '#8b5cf6',
                        opacity: isVoting ? 0.5 : 1,
                        cursor: !memberId || isVoting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!upActive && memberId && !isVoting) { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; e.currentTarget.style.color = '#a78bfa'; } }}
                    onMouseLeave={e => { if (!upActive) { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.1)'; e.currentTarget.style.color = '#8b5cf6'; } }}
                >
                    {isVoting ? <CircleNotch className={`${chevronSize} animate-spin`} /> : <CaretUp className={chevronSize} />}
                </button>
                <span
                    className="font-mono tabular-nums"
                    style={{
                        fontSize: size === 'sm' ? '10px' : '12px',
                        color: isVoting ? 'transparent' : scoreColor,
                        fontWeight: 700,
                        minWidth: '20px',
                        textAlign: 'center',
                    }}
                >
                    {p.score > 0 ? `+${p.score}` : p.score}
                </span>
                <button
                    onClick={() => handleVote(p.id, -1)}
                    disabled={!memberId || isVoting}
                    className={`${btnSize} flex items-center justify-center transition-all`}
                    style={{
                        borderRadius: '2px',
                        border: `1px solid ${downActive ? 'rgba(248,113,113,0.4)' : 'rgba(168,85,247,0.1)'}`,
                        background: downActive ? 'rgba(248,113,113,0.1)' : 'transparent',
                        color: downActive ? '#f87171' : '#8b5cf6',
                        opacity: isVoting ? 0.5 : 1,
                        cursor: !memberId || isVoting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!downActive && memberId && !isVoting) { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'; e.currentTarget.style.color = '#f87171'; } }}
                    onMouseLeave={e => { if (!downActive) { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.1)'; e.currentTarget.style.color = '#8b5cf6'; } }}
                >
                    {isVoting ? <CircleNotch className={`${chevronSize} animate-spin`} /> : <CaretDown className={chevronSize} />}
                </button>
            </div>
        );
    };

    // ── Vote controls — neo-brutalist variant ────────────────────────────────
    const renderVoteControls = (p: LocationProposal & { score: number }, size: 'lg' | 'sm') => {
        if (isRemote) return renderVoteControlsRemote(p, size);

        const isVoting = votingIds.has(p.id);
        const upActive = myVotes[p.id] === 1;
        const downActive = myVotes[p.id] === -1;
        const btnSm = size === 'sm';
        const btnWH = btnSm ? 28 : 34;
        const chevronClass = btnSm ? 'w-3.5 h-3.5' : 'w-4 h-4';
        const loaderClass = btnSm ? 'w-3.5 h-3.5 animate-spin' : 'w-4 h-4 animate-spin';
        const scoreColor = p.score > 0 ? '#4ade80' : p.score < 0 ? '#ef4444' : 'white';

        return (
            <div
                className="flex flex-col items-center gap-1 shrink-0"
                style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: btnSm ? '4px' : '6px',
                    background: 'rgba(255,255,255,0.03)',
                }}
            >
                <button
                    onClick={() => handleVote(p.id, 1)}
                    disabled={!memberId || isVoting}
                    className="flex items-center justify-center transition-all"
                    style={{
                        width: btnWH,
                        height: btnWH,
                        borderRadius: '6px',
                        border: `2px solid ${upActive ? '#4ade80' : 'rgba(255,255,255,0.15)'}`,
                        background: upActive ? 'rgba(74,222,128,0.12)' : 'transparent',
                        color: upActive ? '#4ade80' : 'rgba(255,255,255,0.45)',
                        opacity: isVoting ? 0.5 : 1,
                        cursor: !memberId || isVoting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!upActive && memberId && !isVoting) { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; } }}
                    onMouseLeave={e => { if (!upActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; } }}
                >
                    {isVoting ? <CircleNotch className={loaderClass} /> : <CaretUp className={chevronClass} />}
                </button>
                <span
                    className="font-black tabular-nums"
                    style={{
                        fontSize: btnSm ? '10px' : '12px',
                        color: isVoting ? 'transparent' : scoreColor,
                        minWidth: '20px',
                        textAlign: 'center',
                    }}
                >
                    {p.score > 0 ? `+${p.score}` : p.score}
                </span>
                <button
                    onClick={() => handleVote(p.id, -1)}
                    disabled={!memberId || isVoting}
                    className="flex items-center justify-center transition-all"
                    style={{
                        width: btnWH,
                        height: btnWH,
                        borderRadius: '6px',
                        border: `2px solid ${downActive ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                        background: downActive ? 'rgba(239,68,68,0.12)' : 'transparent',
                        color: downActive ? '#ef4444' : 'rgba(255,255,255,0.45)',
                        opacity: isVoting ? 0.5 : 1,
                        cursor: !memberId || isVoting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!downActive && memberId && !isVoting) { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; } }}
                    onMouseLeave={e => { if (!downActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; } }}
                >
                    {isVoting ? <CircleNotch className={loaderClass} /> : <CaretDown className={chevronClass} />}
                </button>
            </div>
        );
    };

    // ── CYBERPUNK REMOTE RENDER ──────────────────────────────────────────────
    if (isRemote) {
        return (
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h3 className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: '#8b5cf6' }}>
                            GAME_PROPOSALS ({proposals.length})
                        </h3>
                        {isAdmin && (
                            <button
                                onClick={() => setIsOverrideModalOpen(true)}
                                className="font-mono text-[9px] uppercase tracking-[0.12em] flex items-center gap-1.5 px-2 py-1 transition-colors"
                                style={{ border: '1px solid rgba(232,121,249,0.2)', borderRadius: '2px', color: '#e879f9' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,121,249,0.5)'; e.currentTarget.style.background = 'rgba(232,121,249,0.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(232,121,249,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <WarningOctagon className="w-3 h-3" />
                                FORCE_CHOICE
                            </button>
                        )}
                    </div>
                </div>

                {/* Empty state */}
                {proposals.length === 0 && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5" style={{ border: '1px solid rgba(168,85,247,0.1)', borderRadius: '3px', background: 'rgba(168,85,247,0.03)' }}>
                        <span className="font-mono text-sm leading-none mt-0.5 shrink-0" style={{ color: '#8b5cf6' }}>{'>'}</span>
                        <p className="font-mono text-[11px] leading-relaxed" style={{ color: '#8b5cf6' }}>
                            {'// propose un jeu — le groupe votera pour le meilleur choix'}
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {/* Featured card */}
                        {featured && (
                            <motion.div
                                key={featured.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ layout: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.2 } }}
                                className="overflow-hidden relative"
                                style={{ border: '1px solid rgba(168,85,247,0.3)', borderRadius: '4px', background: 'rgba(8,0,20,0.7)' }}
                            >
                                <ProposalParticles score={featured.score} />

                                {/* Featured badge */}
                                <div className="px-3 pt-3 pb-0 flex items-center relative z-10">
                                    <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#e879f9' }}>
                                        <Star className="w-3 h-3" weight="fill" />
                                        FEATURED
                                    </div>
                                </div>

                                <div className="flex gap-3 p-3">
                                    <div className="flex-1 flex gap-3 items-start relative z-10 min-w-0">
                                        {featured.image && (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '3px' }}>
                                                <img src={featured.image} alt={featured.name} className="w-full h-full object-cover" style={{ filter: 'saturate(0.8)' }} referrerPolicy="no-referrer" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-mono text-sm line-clamp-1" style={{ color: '#c4b5fd' }}>{featured.name}</p>
                                            <p className="font-mono mt-0.5" style={{ fontSize: '10px', color: '#8b5cf6' }}>
                                                {'// by '}<span style={{ color: '#a78bfa' }}>{members.find(m => m.id === featured.member_id)?.name || '???'}</span>
                                            </p>
                                            {featured.description && (
                                                <p className="font-mono mt-1 line-clamp-2" style={{ fontSize: '11px', color: '#8b5cf6', letterSpacing: '0.03em' }}>
                                                    [{featured.description}]
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative z-10">{renderVoteControls(featured, 'lg')}</div>
                                </div>

                                {featured.member_id === memberId && (
                                    <div className="px-3 pb-3 relative z-10">
                                        <button
                                            onClick={() => handleDelete(featured.id)}
                                            disabled={!!deletingId}
                                            className="w-full flex items-center justify-center gap-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-all"
                                            style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: '2px', color: 'rgba(239,68,68,0.6)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = 'rgb(239,68,68)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                                        >
                                            {deletingId === featured.id ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-3.5 h-3.5" />}
                                            DELETE_PROPOSAL
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Propose button */}
                        {!hasProposed && memberId && (
                            <motion.div layout key="propose-btn" className="flex justify-center -mt-1 mb-2">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[11px] uppercase tracking-[0.15em] transition-all"
                                    style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '3px', color: '#a78bfa' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'; e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.background = 'rgba(168,85,247,0.06)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <Plus className="w-4 h-4" />
                                    PROPOSE_A_GAME
                                </button>
                            </motion.div>
                        )}

                        {/* Rest cards */}
                        {rest.map((p) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ layout: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.2 } }}
                                className="flex items-center gap-3 relative overflow-hidden"
                                style={{ border: '1px solid rgba(168,85,247,0.12)', borderRadius: '3px', background: 'rgba(168,85,247,0.02)', padding: '10px 12px' }}
                            >
                                <ProposalParticles score={p.score} />
                                <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                                    {p.image && (
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.15)', borderRadius: '2px' }}>
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" style={{ filter: 'saturate(0.8)' }} referrerPolicy="no-referrer" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-xs sm:text-sm truncate" style={{ color: '#c4b5fd' }}>{p.name}</p>
                                        <p className="font-mono truncate" style={{ fontSize: '9px', color: '#8b5cf6' }}>
                                            {'// '}<span style={{ color: '#a78bfa' }}>{members.find(m => m.id === p.member_id)?.name || '???'}</span>
                                        </p>
                                        {p.description && (
                                            <p className="font-mono line-clamp-1 mt-0.5" style={{ fontSize: '9px', color: '#8b5cf6', letterSpacing: '0.03em' }}>
                                                [{p.description}]
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 relative z-10">
                                    {p.member_id === memberId && (
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            disabled={!!deletingId}
                                            className="p-1.5 transition-all"
                                            style={{ color: 'rgba(239,68,68,0.4)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '2px' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'rgb(239,68,68)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.4)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
                                        >
                                            {deletingId === p.id ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                    {renderVoteControls(p, 'sm')}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Add modal */}
                {showAddModal && memberId && (
                    <AddGameProposalModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSubmit={async (data) => {
                            if (!memberId) return;
                            const res = await addLocationProposalAction(slug, memberId, { ...data, link: data.link ?? undefined, description: data.description ?? undefined });
                            if (res.success && res.proposal) onProposalsChange([...proposals, res.proposal]);
                            setShowAddModal(false);
                        }}
                    />
                )}

                {/* Override modal — cyberpunk */}
                <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                    <DialogContent
                        className="flex flex-col p-0 overflow-hidden"
                        style={{ maxWidth: '420px', width: 'calc(100% - 2rem)', background: 'rgba(8,0,20,0.99)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '4px', boxShadow: '0 0 40px rgba(168,85,247,0.12)' }}
                    >
                        <div className="w-full h-[2px] shrink-0" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />
                        <div className="p-5">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="font-mono text-[0.8rem] uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: '#c4b5fd' }}>
                                    <WarningOctagon className="w-3.5 h-3.5" style={{ color: '#e879f9' }} />
                                    {'> FORCE_GAME_CHOICE'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                                {proposals.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleConfirmLocation(p)}
                                        disabled={!!confirmingLocationId}
                                        className="flex items-center justify-between px-3 py-2.5 font-mono text-left transition-colors"
                                        style={{
                                            border: `1px solid ${group.location?.name === p.name ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.12)'}`,
                                            borderRadius: '3px',
                                            background: group.location?.name === p.name ? 'rgba(168,85,247,0.1)' : 'transparent',
                                            color: group.location?.name === p.name ? '#c4b5fd' : '#a78bfa',
                                        }}
                                        onMouseEnter={e => { if (group.location?.name !== p.name) { e.currentTarget.style.background = 'rgba(168,85,247,0.06)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; } }}
                                        onMouseLeave={e => { if (group.location?.name !== p.name) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)'; } }}
                                    >
                                        <span className="text-sm truncate pr-3">{p.name}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-mono text-[10px]" style={{ color: p.score > 0 ? '#4ade80' : p.score < 0 ? '#f87171' : '#8b5cf6' }}>
                                                {p.score > 0 ? '+' : ''}{p.score} pts
                                            </span>
                                            {confirmingLocationId === p.id
                                                ? <CircleNotch className="w-3.5 h-3.5 animate-spin" style={{ color: '#8b5cf6' }} />
                                                : group.location?.name === p.name
                                                ? <Check className="w-3.5 h-3.5" style={{ color: '#c4b5fd' }} />
                                                : null
                                            }
                                        </div>
                                    </button>
                                ))}
                                {group.location && (
                                    <button
                                        onClick={async () => {
                                            if (!memberId || !isAdmin) return;
                                            setConfirmingLocationId('clear');
                                            const result = await updateLocationAction(slug, memberId, group.id, null);
                                            if (result.success) onGroupChange?.();
                                            setConfirmingLocationId(null);
                                            setIsOverrideModalOpen(false);
                                        }}
                                        disabled={!!confirmingLocationId}
                                        className="mt-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors flex items-center justify-between"
                                        style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: '3px', color: 'rgba(239,68,68,0.65)' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = 'rgb(239,68,68)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.65)'; }}
                                    >
                                        <span>CLEAR_FORCED_GAME</span>
                                        {confirmingLocationId === 'clear' && <CircleNotch className="w-3.5 h-3.5 animate-spin" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ── NEO-BRUTALIST IN-PERSON RENDER ───────────────────────────────────────
    return (
        <div className="flex flex-col gap-5">

            {/* Header row */}
            <div className="flex items-center justify-between">
                <span
                    className="font-black uppercase tracking-widest text-xs"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    PROPOSITIONS ({proposals.length})
                </span>
                {isAdmin && (
                    <button
                        onClick={() => setIsOverrideModalOpen(true)}
                        className="rounded-lg border border-white/25 text-white/60 font-bold uppercase tracking-widest text-xs transition-colors"
                        style={{ padding: '4px 12px' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >
                        Imposer un choix
                    </button>
                )}
            </div>

            {/* Empty state */}
            {proposals.length === 0 && (
                <div
                    className="flex items-center gap-3 rounded-xl border border-white/10"
                    style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.02)',
                    }}
                >
                    <span className="text-base leading-none shrink-0">📍</span>
                    <p
                        className="text-xs font-medium italic"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                        Propose un lieu — le groupe votera pour le meilleur endroit.
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-5">
                <AnimatePresence mode="popLayout" initial={false}>

                    {/* Featured card */}
                    {featured && (
                        <motion.div
                            key={featured.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ layout: { type: 'spring', stiffness: 300, damping: 25 }, opacity: { duration: 0.2 } }}
                            className="overflow-hidden relative rounded-2xl border border-white/15"
                            style={{
                                background: '#111',
                                boxShadow: '4px 4px 0 #000',
                            }}
                        >
                            <ProposalParticles score={featured.score} />

                            {/* FAVORI badge */}
                            <div className="px-4 pt-3 pb-0 relative z-10">
                                <span
                                    className="rounded-md font-black uppercase text-xs tracking-widest text-white inline-block px-3 py-1"
                                    style={{ background: 'var(--v2-primary)' }}
                                >
                                    FAVORI
                                </span>
                            </div>

                            <div className="flex gap-3 p-4">
                                <div className="flex-1 flex gap-3 items-start relative z-10 min-w-0">
                                    {featured.image && (
                                        <div
                                            className="shrink-0 overflow-hidden rounded-lg border border-white/15"
                                            style={{ width: 80, height: 80 }}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={featured.image} alt={featured.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-base line-clamp-1" style={{ color: 'white' }}>{featured.name}</p>
                                        <p className="mt-0.5" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                                            Proposé par <span style={{ color: 'rgba(255,255,255,0.75)' }}>{members.find(m => m.id === featured.member_id)?.name || 'Inconnu'}</span>
                                        </p>
                                        {featured.description && (
                                            <p className="mt-1 line-clamp-2" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{featured.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="relative z-10 shrink-0">{renderVoteControls(featured, 'lg')}</div>
                            </div>

                            {featured.member_id === memberId && (
                                <div className="px-4 pb-4 relative z-10">
                                    <button
                                        onClick={() => handleDelete(featured.id)}
                                        disabled={!!deletingId}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/25 text-red-400/60 font-black uppercase tracking-widest text-xs transition-colors"
                                        style={{
                                            padding: '8px',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.65)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                                    >
                                        {deletingId === featured.id ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                                        Supprimer ma proposition
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Propose button */}
                    {!hasProposed && memberId && (
                        <motion.div layout key="propose-btn">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-full rounded-xl border border-white/20 bg-white/2 text-white/70 font-black uppercase tracking-widest flex items-center justify-center gap-3 py-4 transition-all"
                                style={{ background: 'rgba(255,255,255,0.02)' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                            >
                                <Plus className="w-5 h-5" />
                                Proposer un lieu
                            </button>
                        </motion.div>
                    )}

                    {/* Rest cards */}
                    {rest.map((p) => (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ layout: { type: 'spring', stiffness: 300, damping: 25 }, opacity: { duration: 0.2 } }}
                            className="flex items-center gap-3 relative overflow-hidden rounded-xl border border-white/10"
                            style={{ background: 'transparent', padding: '10px 12px' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            <ProposalParticles score={p.score} />
                            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                                {p.image && (
                                    <div
                                        className="shrink-0 overflow-hidden rounded-lg border border-white/12"
                                        style={{ width: 44, height: 44 }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate" style={{ color: 'white' }}>{p.name}</p>
                                    <p className="truncate" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                                        {members.find(m => m.id === p.member_id)?.name || 'Inconnu'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 relative z-10">
                                {p.member_id === memberId && (
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        disabled={!!deletingId}
                                        className="p-1.5 flex items-center justify-center transition-colors rounded-md border border-red-500/20 text-red-400/50"
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                                    >
                                        {deletingId === p.id ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                                {renderVoteControls(p, 'sm')}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add modal */}
            {showAddModal && memberId && (
                <AddLocationProposalModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    city={group.city}
                    baseLat={group.base_lat}
                    baseLng={group.base_lng}
                    onSubmit={async (data) => {
                        if (!memberId) return;
                        const res = await addLocationProposalAction(slug, memberId, data);
                        if (res.success && res.proposal) onProposalsChange([...proposals, res.proposal]);
                        setShowAddModal(false);
                    }}
                />
            )}

            {/* Override dialog — neo-brutalist */}
            <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                <DialogContent
                    className="flex flex-col p-0 overflow-hidden rounded-2xl border border-white/10"
                    style={{
                        maxWidth: 460,
                        width: 'calc(100% - 2rem)',
                        background: '#0f0f0f',
                        boxShadow: '5px 5px 0 #000',
                    }}
                >
                    <div className="p-5">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'white' }}>
                                <WarningOctagon className="w-4 h-4" style={{ color: 'var(--v2-primary)' }} />
                                Imposer un lieu
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                            {proposals.map((p) => {
                                const isSelected = group.location?.name === p.name;
                                const scoreColor = p.score > 0 ? '#4ade80' : p.score < 0 ? '#ef4444' : 'white';
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handleConfirmLocation(p)}
                                        disabled={!!confirmingLocationId}
                                        className="flex items-center justify-between px-3 py-2.5 text-left transition-colors rounded-xl"
                                        style={{
                                            border: isSelected ? '1px solid rgba(var(--v2-primary-rgb, 255,46,46),0.4)' : '1px solid rgba(255,255,255,0.1)',
                                            background: isSelected ? 'rgba(var(--v2-primary-rgb, 255,46,46),0.06)' : 'transparent',
                                            color: isSelected ? 'var(--v2-primary)' : 'rgba(255,255,255,0.8)',
                                        }}
                                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                                    >
                                        <span className="font-bold text-sm truncate pr-3">{p.name}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-bold text-xs" style={{ color: scoreColor }}>
                                                {p.score > 0 ? '+' : ''}{p.score} pts
                                            </span>
                                            {confirmingLocationId === p.id
                                                ? <CircleNotch className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--v2-primary)' }} />
                                                : isSelected
                                                ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--v2-primary)' }} />
                                                : null
                                            }
                                        </div>
                                    </button>
                                );
                            })}
                            {group.location && (
                                <button
                                    onClick={async () => {
                                        if (!memberId || !isAdmin) return;
                                        setConfirmingLocationId('clear');
                                        const result = await updateLocationAction(slug, memberId, group.id, null);
                                        if (result.success) onGroupChange?.();
                                        setConfirmingLocationId(null);
                                        setIsOverrideModalOpen(false);
                                    }}
                                    disabled={!!confirmingLocationId}
                                    className="mt-2 px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-between rounded-lg border border-red-500/25 text-red-400/65"
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#ef4444'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.65)'; }}
                                >
                                    <span>Annuler le lieu imposé</span>
                                    {confirmingLocationId === 'clear' && <CircleNotch className="w-3.5 h-3.5 animate-spin" />}
                                </button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
