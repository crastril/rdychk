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
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-0.5">
                {mapsUrl ? (
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1.5 group w-fit"
                    >
                        <MapTrifold className="w-3.5 h-3.5 text-[var(--v2-accent)] shrink-0" weight="fill" />
                        <span className="text-xs font-black text-white/60 group-hover:text-white/90 underline underline-offset-2 decoration-white/20 group-hover:decoration-white/50 transition-colors">Afficher dans Google Maps</span>
                        <ArrowSquareOut className="w-3 h-3 text-white/25 group-hover:text-white/60 shrink-0 transition-colors" />
                    </a>
                ) : (
                    <div className="flex items-center gap-2 py-1.5 opacity-30 cursor-not-allowed w-fit">
                        <MapTrifold className="w-3.5 h-3.5 text-white/30 shrink-0" weight="fill" />
                        <span className="text-xs font-black text-white/30">Afficher dans Google Maps</span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onAddToCalendar}
                    className="flex items-center gap-2 py-1.5 group w-fit"
                >
                    <CalendarPlus className="w-3.5 h-3.5 text-[var(--v2-primary)] shrink-0" weight="fill" />
                    <span className="text-xs font-black text-white/60 group-hover:text-white/90 underline underline-offset-2 decoration-white/20 group-hover:decoration-white/50 transition-colors">Rajouter à mon calendrier</span>
                    <ArrowSquareOut className="w-3 h-3 text-white/25 group-hover:text-white/60 shrink-0 transition-colors" />
                </button>
            </div>
        </div>
    );
}
