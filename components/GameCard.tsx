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
                className="relative w-full overflow-hidden"
                style={{
                    aspectRatio: '16/9',
                    border: '1px solid rgba(168,85,247,0.3)',
                    boxShadow: '0 0 24px rgba(168,85,247,0.12), 0 0 1px rgba(168,85,247,0.5)',
                    borderRadius: '4px',
                }}
            >
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                        style={{ filter: 'saturate(0.7) brightness(0.75)' }}
                    />
                ) : (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #080014 0%, #0e0030 50%, #080014 100%)' }}
                    >
                        <GameController className="w-16 h-16" style={{ color: 'rgba(168,85,247,0.12)' }} weight="fill" />
                    </div>
                )}

                {/* Gradient overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: image
                            ? 'linear-gradient(to top, rgba(8,0,20,0.97) 0%, rgba(8,0,20,0.55) 45%, rgba(8,0,20,0.2) 100%)'
                            : 'linear-gradient(to top, rgba(8,0,20,0.8) 0%, transparent 100%)',
                    }}
                />

                {/* CRT scanline overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                        backgroundSize: '100% 4px',
                    }}
                />

                {/* Neon corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none z-20"
                    style={{ borderTop: '2px solid rgba(168,85,247,0.6)', borderLeft: '2px solid rgba(168,85,247,0.6)' }} />
                <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none z-20"
                    style={{ borderTop: '2px solid rgba(168,85,247,0.6)', borderRight: '2px solid rgba(168,85,247,0.6)' }} />
                <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none z-20"
                    style={{ borderBottom: '2px solid rgba(168,85,247,0.6)', borderLeft: '2px solid rgba(168,85,247,0.6)' }} />
                <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none z-20"
                    style={{ borderBottom: '2px solid rgba(168,85,247,0.6)', borderRight: '2px solid rgba(168,85,247,0.6)' }} />

                {/* Top status bar */}
                <div
                    className="absolute top-0 left-0 right-0 px-3 py-1.5 flex items-center gap-2 z-20"
                    style={{ background: 'rgba(8,0,20,0.75)', borderBottom: '1px solid rgba(168,85,247,0.15)' }}
                >
                    <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                        style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#a78bfa' }}>
                        CURRENT_GAME
                    </span>
                    <span className="ml-auto font-mono text-[10px]" style={{ color: '#8b5cf6' }}>
                        SRC:RAWG
                    </span>
                </div>

                {/* Text overlay */}
                <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-8 flex flex-col gap-0.5 z-20">
                    {date && (
                        <span
                            className="font-mono text-[10px] uppercase tracking-[0.25em]"
                            style={{ color: '#a78bfa' }}
                        >
                            {`// ${date}`}
                        </span>
                    )}
                    {genres && (
                        <span
                            className="font-mono text-[10px] uppercase tracking-[0.15em]"
                            style={{ color: '#e879f9' }}
                        >
                            {`[${genres}]`}
                        </span>
                    )}
                    <h2
                        className="font-mono text-2xl uppercase leading-tight text-white"
                        style={{
                            letterSpacing: '0.04em',
                            textShadow: '0 0 20px rgba(168,85,247,0.4)',
                        }}
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
                        className="flex items-center gap-2 px-3 py-2 transition-all duration-200 active:opacity-70 group"
                        style={{
                            background: 'rgba(8,0,20,0.9)',
                            border: '1px solid rgba(168,85,247,0.3)',
                            borderRadius: '4px',
                            boxShadow: '0 0 10px rgba(168,85,247,0.06)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 16px rgba(168,85,247,0.25)';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(168,85,247,0.6)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 10px rgba(168,85,247,0.06)';
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(168,85,247,0.3)';
                        }}
                    >
                        <GameController className="w-3.5 h-3.5 shrink-0" style={{ color: '#a855f7' }} weight="fill" />
                        <span
                            className="font-mono text-[11px] uppercase tracking-[0.1em]"
                            style={{ color: '#c4b5fd' }}
                        >
                            VIEW_ON_RAWG
                        </span>
                        <ArrowSquareOut className="w-3 h-3 shrink-0 transition-colors" style={{ color: '#8b5cf6' }} />
                    </a>
                </div>
            )}
        </div>
    );
}
