'use client';

import { MapTrifold, CalendarPlus, ArrowSquareOut } from '@phosphor-icons/react';

interface VenueCardProps {
    name: string;
    image?: string | null;
    date?: string | null;          // formatted string, e.g. "Dimanche 5 Avril"
    mapsUrl?: string | null;
    onAddToCalendar: () => void;
}

export function VenueCard({ name, image, date, mapsUrl, onAddToCalendar }: VenueCardProps) {
    return (
        <div className="flex flex-col gap-2">
            {/* ── CARD ── */}
            <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{ aspectRatio: '16/9', boxShadow: '4px 4px 0px #000' }}
            >
                {/* Background */}
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0c0c0c 100%)' }}
                    />
                )}

                {/* Gradient overlay — strong at bottom, subtle vignette top */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: image
                            ? 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.10) 100%)'
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
                    <h2
                        className="text-2xl font-black uppercase leading-none text-white"
                        style={{ fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.02em' }}
                    >
                        {name}
                    </h2>
                </div>
            </div>

            {/* ── ACTION LINKS ── */}
            <div className="flex flex-wrap gap-2">
                {mapsUrl ? (
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border-[2.5px] border-black transition-all duration-150 active:translate-y-[2px] active:translate-x-[2px] group"
                        style={{
                            background: '#0c0c0c',
                            boxShadow: '3px 3px 0px #f97316',
                        }}
                    >
                        <MapTrifold className="w-3.5 h-3.5 text-orange-400 shrink-0" weight="fill" />
                        <span
                            className="text-[11px] font-black uppercase tracking-[0.08em] text-white/70 group-hover:text-white transition-colors"
                            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                        >
                            Afficher dans Google Maps
                        </span>
                        <ArrowSquareOut className="w-3 h-3 text-white/30 group-hover:text-orange-400 shrink-0 transition-colors" />
                    </a>
                ) : (
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border-[2.5px] border-black opacity-30 cursor-not-allowed"
                        style={{ background: '#0c0c0c', boxShadow: '3px 3px 0px #333' }}
                    >
                        <MapTrifold className="w-3.5 h-3.5 text-white/30 shrink-0" weight="fill" />
                        <span
                            className="text-[11px] font-black uppercase tracking-[0.08em] text-white/30"
                            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                        >
                            Afficher dans Google Maps
                        </span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onAddToCalendar}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border-[2.5px] border-black transition-all duration-150 active:translate-y-[2px] active:translate-x-[2px] group"
                    style={{
                        background: '#0c0c0c',
                        boxShadow: '3px 3px 0px #0ea5e9',
                    }}
                >
                    <CalendarPlus className="w-3.5 h-3.5 text-sky-400 shrink-0" weight="fill" />
                    <span
                        className="text-[11px] font-black uppercase tracking-[0.08em] text-white/70 group-hover:text-white transition-colors"
                        style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                    >
                        Rajouter à mon calendrier
                    </span>
                    <ArrowSquareOut className="w-3 h-3 text-white/30 group-hover:text-sky-400 shrink-0 transition-colors" />
                </button>
            </div>
        </div>
    );
}
