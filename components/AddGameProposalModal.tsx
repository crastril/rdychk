'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameController, MagnifyingGlass, CircleNotch, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface RawgGame {
    name: string;
    slug: string;
    image: string | null;
    metacritic: number | null;
    genres: string[];
    url: string;
}

interface AddGameProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; image?: string | null; link?: string | null; description?: string | null }) => Promise<void>;
}

export function AddGameProposalModal({ isOpen, onClose, onSubmit }: AddGameProposalModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<RawgGame[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<RawgGame | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
            setSelected(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.trim().length < 2) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/rawg/search?q=${encodeURIComponent(query.trim())}`);
                const data = await res.json();
                setResults(data.results ?? []);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);
    }, [query]);

    const handleSelect = (game: RawgGame) => {
        setSelected(game);
        setQuery(game.name);
        setResults([]);
    };

    const handleSubmit = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            await onSubmit({
                name: selected.name,
                image: selected.image,
                link: selected.url,
                description: selected.genres.join(', ') || null,
            });
            onClose();
        } catch {
            // keep modal open on error
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden flex flex-col" style={{ position: 'fixed', top: '5vh', left: '50%', transform: 'translateX(-50%)', maxHeight: '85dvh', width: 'calc(100% - 2rem)' }}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]" />
                <div className="p-6 overflow-y-auto flex-1">
                    <DialogHeader className="mb-4">
                        <DialogTitle
                            className="uppercase tracking-[0.15em] flex items-center gap-2"
                            style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: '1.1rem' }}
                        >
                            <GameController className="w-5 h-5 text-[var(--v2-primary)]" weight="fill" />
                            Propose un jeu
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search field */}
                    <div>
                        <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[var(--v2-primary)]/50 transition-colors">
                            {searching
                                ? <CircleNotch className="w-4 h-4 text-white/30 shrink-0 animate-spin" />
                                : <MagnifyingGlass className="w-4 h-4 text-white/30 shrink-0" />
                            }
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                                placeholder="Rechercher un jeu…"
                                className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm font-medium outline-none"
                            />
                            {query && (
                                <button onClick={() => { setQuery(''); setSelected(null); setResults([]); }} className="text-white/25 hover:text-white/60 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Results list (inline, expands modal) */}
                        {results.length > 0 && (
                            <div className="mt-2 bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                                {results.map(game => (
                                    <button
                                        key={game.slug}
                                        onClick={() => handleSelect(game)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/8">
                                            {game.image
                                                ? <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                                                : <GameController className="w-5 h-5 text-white/20 m-auto mt-2.5" />
                                            }
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{game.name}</p>
                                            <p className="text-[10px] text-white/35 truncate">
                                                {game.genres.join(' · ') || 'Jeu vidéo'}
                                                {game.metacritic && <span className="ml-2 text-amber-400/70">★ {game.metacritic}</span>}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected preview */}
                    {selected && (
                        <div
                            className="mt-4 rounded-2xl border-[3px] border-black overflow-hidden"
                            style={{ background: '#0c0c0c', boxShadow: '4px 4px 0px #000' }}
                        >
                            {selected.image && (
                                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
                                    <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
                                    <div className="absolute bottom-0 left-0 px-3 pb-2">
                                        <p
                                            className="text-white font-black uppercase leading-none"
                                            style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '1.25rem', letterSpacing: '0.02em' }}
                                        >
                                            {selected.name}
                                        </p>
                                        {selected.genres.length > 0 && (
                                            <p className="text-[11px] text-white/50 font-black uppercase tracking-wider mt-0.5">
                                                {selected.genres.join(' · ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {!selected.image && (
                                <div className="px-4 py-3">
                                    <p className="font-black text-white" style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '1.1rem' }}>{selected.name}</p>
                                    {selected.genres.length > 0 && <p className="text-[11px] text-white/40 uppercase tracking-wider mt-0.5">{selected.genres.join(' · ')}</p>}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selected || submitting}
                            className={cn(
                                'flex-1 h-11 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2',
                                selected && !submitting
                                    ? 'btn-massive shadow-neon-primary'
                                    : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                            )}
                        >
                            {submitting ? <CircleNotch className="w-4 h-4 animate-spin" /> : null}
                            Proposer
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
