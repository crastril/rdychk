'use client';

import { GameController, ArrowSquareOut } from '@phosphor-icons/react';

interface GameCardProps {
    name: string;
    image?: string | null;
    link?: string | null;
    genres?: string | null;
    date?: string | null;
}

export function GameCard({ name, image, link, genres, date }: GameCardProps) {
    return (
        <div className="flex flex-col gap-2">
            {/* ── CARD ── */}
            <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{ aspectRatio: '16/9', boxShadow: '4px 4px 0px #000' }}
            >
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d1117 100%)' }}
                    >
                        <GameController className="w-16 h-16 text-white/8" weight="fill" />
                    </div>
                )}

                {/* Gradient overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: image
                            ? 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.08) 100%)'
                            : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                    }}
                />

                {/* Text overlay */}
                <div className="absolute inset-x-0 bottom-0 px-4 pb-4 flex flex-col gap-0.5">
                    {date && (
                        <span
                            className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55"
                            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                        >
                            {date}
                        </span>
                    )}
                    {genres && (
                        <span
                            className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--v2-primary)]/70"
                            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                        >
                            {genres}
                        </span>
                    )}
                    <h2
                        className="text-2xl font-black uppercase leading-none text-white"
                        style={{ fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.02em' }}
                    >
                        {name}
                    </h2>
                </div>
            </div>

            {/* ── ACTION LINKS ── */}
            {link && (
                <div className="flex flex-wrap gap-2">
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border-[2.5px] border-black transition-all duration-150 active:translate-y-[2px] active:translate-x-[2px] group"
                        style={{ background: '#0c0c0c', boxShadow: '3px 3px 0px #8b5cf6' }}
                    >
                        <GameController className="w-3.5 h-3.5 text-violet-400 shrink-0" weight="fill" />
                        <span
                            className="text-[12px] font-black uppercase tracking-[0.06em] text-white/70 group-hover:text-white transition-colors"
                            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                        >
                            Voir sur RAWG
                        </span>
                        <ArrowSquareOut className="w-3 h-3 text-white/30 group-hover:text-violet-400 shrink-0 transition-colors" />
                    </a>
                </div>
            )}
        </div>
    );
}
