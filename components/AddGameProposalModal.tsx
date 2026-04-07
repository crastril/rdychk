'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameController, MagnifyingGlass, CircleNotch, X } from '@phosphor-icons/react';

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
            <DialogContent
                className="flex flex-col p-0 overflow-hidden"
                style={{
                    position: 'fixed',
                    top: '5vh',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxHeight: '85dvh',
                    width: 'calc(100% - 2rem)',
                    maxWidth: '448px',
                    background: 'rgba(8,0,20,0.98)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: '4px',
                    boxShadow: '0 0 40px rgba(168,85,247,0.15), 0 0 80px rgba(168,85,247,0.05)',
                }}
            >
                {/* Top neon bar */}
                <div className="w-full h-[2px] shrink-0" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />

                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle
                            className="font-mono text-[0.85rem] uppercase tracking-[0.2em] flex items-center gap-2"
                            style={{ color: '#c4b5fd' }}
                        >
                            <GameController className="w-4 h-4 shrink-0" style={{ color: '#a855f7' }} weight="fill" />
                            {'> ADD_GAME_PROPOSAL'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search field */}
                    <div>
                        <div
                            className="flex items-center gap-2 px-3 py-2.5 transition-all"
                            style={{
                                background: 'rgba(168,85,247,0.04)',
                                border: '1px solid rgba(168,85,247,0.2)',
                                borderRadius: '3px',
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)')}
                        >
                            {searching
                                ? <CircleNotch className="w-4 h-4 shrink-0 animate-spin" style={{ color: '#a855f7' }} />
                                : <MagnifyingGlass className="w-4 h-4 shrink-0" style={{ color: '#8b5cf6' }} />
                            }
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                                placeholder="SEARCH_GAME..."
                                className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-[#8b5cf6]/50"
                                style={{ color: '#c4b5fd' }}
                            />
                            {query && (
                                <button
                                    onClick={() => { setQuery(''); setSelected(null); setResults([]); }}
                                    className="transition-colors"
                                    style={{ color: '#8b5cf6' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#8b5cf6')}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Results */}
                        {results.length > 0 && (
                            <div
                                className="mt-1 overflow-hidden"
                                style={{
                                    border: '1px solid rgba(168,85,247,0.15)',
                                    borderRadius: '3px',
                                    background: 'rgba(8,0,20,0.99)',
                                }}
                            >
                                {results.map((game, i) => (
                                    <button
                                        key={game.slug}
                                        onClick={() => handleSelect(game)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                                        style={{
                                            borderBottom: i < results.length - 1 ? '1px solid rgba(168,85,247,0.08)' : 'none',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.06)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div
                                            className="w-9 h-9 shrink-0 overflow-hidden"
                                            style={{ borderRadius: '2px', border: '1px solid rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.04)' }}
                                        >
                                            {game.image
                                                ? <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                                                : <GameController className="w-4 h-4 m-auto mt-2.5" style={{ color: '#8b5cf6' }} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-mono text-sm truncate" style={{ color: '#c4b5fd' }}>{game.name}</p>
                                            <p className="font-mono text-[10px] truncate" style={{ color: '#8b5cf6' }}>
                                                {game.genres.join(' · ') || 'GAME'}
                                                {game.metacritic ? <span className="ml-2" style={{ color: '#e879f9' }}>★ {game.metacritic}</span> : null}
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
                            className="overflow-hidden"
                            style={{
                                borderRadius: '4px',
                                border: '1px solid rgba(168,85,247,0.3)',
                                boxShadow: '0 0 20px rgba(168,85,247,0.08)',
                            }}
                        >
                            {selected.image && (
                                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
                                    <img
                                        src={selected.image}
                                        alt={selected.name}
                                        className="w-full h-full object-cover"
                                        style={{ filter: 'saturate(0.7) brightness(0.75)' }}
                                    />
                                    {/* CRT overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
                                        }}
                                    />
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,0,20,0.95) 0%, transparent 60%)' }} />
                                    <div className="absolute bottom-0 left-0 px-3 pb-2">
                                        <p className="font-mono text-white leading-tight uppercase" style={{ fontSize: '1.1rem', letterSpacing: '0.04em' }}>
                                            {selected.name}
                                        </p>
                                        {selected.genres.length > 0 && (
                                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] mt-0.5" style={{ color: '#e879f9' }}>
                                                [{selected.genres.join(' · ')}]
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {!selected.image && (
                                <div className="px-4 py-3">
                                    <p className="font-mono uppercase" style={{ color: '#c4b5fd', fontSize: '1rem' }}>{selected.name}</p>
                                    {selected.genres.length > 0 && (
                                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] mt-0.5" style={{ color: '#e879f9' }}>
                                            [{selected.genres.join(' · ')}]
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 font-mono text-[11px] uppercase tracking-[0.15em] transition-all"
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(168,85,247,0.2)',
                                borderRadius: '3px',
                                color: '#8b5cf6',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)')}
                        >
                            CANCEL
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selected || submitting}
                            className="flex-1 h-10 font-mono text-[11px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2"
                            style={{
                                background: selected && !submitting ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.05)',
                                border: `1px solid ${selected && !submitting ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.1)'}`,
                                borderRadius: '3px',
                                color: selected && !submitting ? '#c4b5fd' : '#8b5cf6',
                                boxShadow: selected && !submitting ? '0 0 12px rgba(168,85,247,0.1)' : 'none',
                                cursor: !selected || submitting ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {submitting
                                ? <><CircleNotch className="w-3.5 h-3.5 animate-spin" /> SUBMITTING...</>
                                : '[ PROPOSE_GAME ]'
                            }
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
