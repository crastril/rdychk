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
    // Local copies of votes & scores that we control; synced from parent but overridden locally after voting
    const [myVotes, setMyVotes] = useState<Record<string, 1 | -1>>(initialMyVotes);
    const [localScores, setLocalScores] = useState<Record<string, number>>({});

    // IDs currently being voted on — we block Realtime overwrites for these
    const [votingIds, setVotingIds] = useState<Set<string>>(new Set());

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [confirmingLocationId, setConfirmingLocationId] = useState<string | null>(null);

    // Sync parent votes into local state when they change (but not for active proposals)
    useEffect(() => {
        setMyVotes(prev => {
            const next = { ...initialMyVotes };
            // Keep locally-overridden votes for proposals currently being voted on
            votingIds.forEach(id => {
                if (prev[id] !== undefined) next[id] = prev[id];
                else delete next[id];
            });
            return next;
        });
    }, [initialMyVotes]); // eslint-disable-line react-hooks/exhaustive-deps

    // Merge parent proposals with local score overrides (for proposals where vote just completed)
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

        // Mark this proposal as "being voted on"
        setVotingIds(prev => new Set(prev).add(proposalId));

        try {
            const result = await voteLocationProposalAction(slug, memberId, proposalId, vote);

            if (result.success) {
                // Update local score with server-confirmed value
                if (result.score !== undefined) {
                    setLocalScores(prev => ({ ...prev, [proposalId]: result.score! }));
                }
                // Update local vote state with server-confirmed vote
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
            // Unblock this proposal — Realtime can now update it freely
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

    const renderVoteControls = (p: LocationProposal & { score: number }, size: 'lg' | 'sm') => {
        const isVoting = votingIds.has(p.id);
        const upActive = myVotes[p.id] === 1;
        const downActive = myVotes[p.id] === -1;

        const btnSm = size === 'sm';
        const btnClass = btnSm
            ? "w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
            : "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-90";
        const chevronClass = btnSm ? "w-4 h-4 stroke-[3]" : "w-5 h-5 sm:w-6 sm:h-6 stroke-[3]";
        const loaderClass = btnSm ? "w-3.5 h-3.5 animate-spin" : "w-4 h-4 animate-spin";
        const scoreClass = btnSm
            ? "font-bold text-[10px] sm:text-[11px]"
            : "font-bold text-xs sm:text-sm";
        const scoreColor = p.score > 0 ? "text-green-400" : p.score < 0 ? "text-red-400" : "text-white";
        const containerClass = btnSm
            ? "flex flex-col items-center gap-1 shrink-0 bg-white/5 rounded-xl p-1 border border-white/5"
            : "flex flex-col items-center gap-1 shrink-0 bg-white/5 rounded-2xl p-1.5 border border-white/5 self-start";

        return (
            <div className={containerClass}>
                <button
                    onClick={() => handleVote(p.id, 1)}
                    disabled={!memberId || isVoting}
                    className={cn(btnClass, upActive ? "text-green-400 bg-green-400/20 shadow-[0_0_15px_rgba(74,222,128,0.15)]" : "text-slate-400 hover:text-green-400 hover:bg-green-400/10", isVoting && "opacity-50 cursor-not-allowed")}
                >
                    {isVoting ? <CircleNotch className={loaderClass} /> : <CaretUp className={chevronClass} />}
                </button>
                <span className={cn(scoreClass, isVoting ? "opacity-0" : scoreColor)}>
                    {p.score > 0 ? `+${p.score}` : p.score}
                </span>
                <button
                    onClick={() => handleVote(p.id, -1)}
                    disabled={!memberId || isVoting}
                    className={cn(btnClass, downActive ? "text-red-400 bg-red-400/20 shadow-[0_0_15px_rgba(248,113,113,0.15)]" : "text-slate-400 hover:text-red-400 hover:bg-red-400/10", isVoting && "opacity-50 cursor-not-allowed")}
                >
                    {isVoting ? <CircleNotch className={loaderClass} /> : <CaretDown className={chevronClass} />}
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
                        {isRemote ? 'Jeux proposés' : 'Propositions'} ({proposals.length})
                    </h3>
                    {isAdmin && (
                        <button
                            onClick={() => setIsOverrideModalOpen(true)}
                            className="text-[10px] sm:text-xs font-bold text-amber-500 hover:bg-amber-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-amber-500/20 whitespace-nowrap"
                        >
                            <WarningOctagon className="w-3.5 h-3.5" />
                            Imposer un choix
                        </button>
                    )}
                </div>
            </div>

            {proposals.length === 0 && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-base leading-none mt-0.5">{isRemote ? '🎮' : '📍'}</span>
                    <p className="text-[11px] text-white/35 font-medium leading-relaxed">
                        {isRemote
                            ? 'Propose un jeu — le groupe votera pour le meilleur choix.'
                            : 'Propose un lieu — le groupe votera pour le meilleur endroit.'
                        }
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-5">
                <AnimatePresence mode="popLayout" initial={false}>
                    {featured && (
                        <motion.div
                            key={featured.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ layout: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.2 } }}
                            className="glass-panel rounded-2xl border border-white/10 overflow-hidden relative group/card"
                        >
                            <ProposalParticles score={featured.score} />
                            <div className="px-4 pt-4 pb-0 flex items-center relative z-10">
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                                    <Star className="w-3 h-3" />
                                    Favori
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 pb-4">
                                <div className="flex-1 flex gap-4 items-start relative z-10 min-w-0">
                                    {featured.image && (
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                                            <img src={featured.image} alt={featured.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm sm:text-base line-clamp-1">{featured.name}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Proposé par <span className="text-slate-300 font-medium">{members.find(m => m.id === featured.member_id)?.name || 'Inconnu'}</span></p>
                                        {featured.description && <p className="text-slate-400 text-[11px] sm:text-sm mt-1 leading-relaxed line-clamp-2">{featured.description}</p>}
                                    </div>
                                </div>
                                <div className="relative z-10">{renderVoteControls(featured, 'lg')}</div>
                            </div>

                            {featured.member_id === memberId && (
                                <div className="px-4 pb-4 relative z-10">
                                    <button
                                        onClick={() => handleDelete(featured.id)}
                                        disabled={!!deletingId}
                                        className="btn-massive bg-red-500/10 hover:bg-red-500 text-white border border-red-500/20 w-full rounded-xl py-2.5 sm:py-3 flex items-center justify-center gap-2 transition-all"
                                    >
                                        {deletingId === featured.id ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">Supprimer ma proposition</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {!hasProposed && memberId && (
                        <motion.div layout key="propose-btn" className="flex justify-center -mt-2 mb-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-massive w-full rounded-2xl py-3.5 sm:py-4 flex items-center justify-center gap-3 transition-all group"
                            >
                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-black uppercase tracking-widest">
                                    {isRemote ? 'Proposer un jeu' : 'Proposer un lieu'}
                                </span>
                            </button>
                        </motion.div>
                    )}

                    {rest.map((p) => (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ layout: { type: "spring", stiffness: 300, damping: 25 }, opacity: { duration: 0.2 } }}
                            className="glass-panel rounded-xl border border-white/5 p-3 flex items-center gap-3 relative overflow-hidden group/card"
                        >
                            <ProposalParticles score={p.score} />
                            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                                {p.image && (
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-white/5">
                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-white truncate">{p.name}</p>
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">Par {members.find(m => m.id === p.member_id)?.name || 'Inconnu'}</p>
                                    {p.description && <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-2">{p.description}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 relative z-10">
                                {p.member_id === memberId && (
                                    <button onClick={() => handleDelete(p.id)} disabled={!!deletingId} className="p-2 text-slate-500 hover:text-red-400 transition-all active:scale-90">
                                        {deletingId === p.id ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                                    </button>
                                )}
                                {renderVoteControls(p, 'sm')}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {showAddModal && memberId && (
                isRemote ? (
                    <AddGameProposalModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSubmit={async (data) => {
                            if (!memberId) return;
                            const res = await addLocationProposalAction(slug, memberId, { ...data, link: data.link ?? undefined });
                            if (res.success && res.proposal) onProposalsChange([...proposals, res.proposal]);
                            setShowAddModal(false);
                        }}
                    />
                ) : (
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
                )
            )}

            <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <WarningOctagon className="w-5 h-5 text-amber-500" />
                            Imposer un lieu
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">Sélectionnez un lieu à imposer.</p>
                        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {proposals.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleConfirmLocation(p)}
                                    disabled={!!confirmingLocationId}
                                    className={cn(
                                        'flex items-center justify-between p-3 rounded-xl border transition-all text-sm',
                                        group.location?.name === p.name ? 'bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/30 text-[var(--v2-primary)]' : 'border-white/10 hover:bg-white/5'
                                    )}
                                >
                                    <span className="font-bold truncate pr-3">{p.name}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn('text-xs font-bold', p.score > 0 ? 'text-green-500' : p.score < 0 ? 'text-red-500' : 'text-slate-500')}>
                                            {p.score > 0 ? '+' : ''}{p.score} pts
                                        </span>
                                        {confirmingLocationId === p.id ? <CircleNotch className="w-4 h-4 animate-spin" /> : group.location?.name === p.name ? <Check className="w-4 h-4" /> : null}
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
                                    className="mt-4 p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-between"
                                >
                                    <span>Annuler le lieu imposé</span>
                                    {confirmingLocationId === 'clear' ? <CircleNotch className="w-4 h-4 animate-spin" /> : null}
                                </button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
