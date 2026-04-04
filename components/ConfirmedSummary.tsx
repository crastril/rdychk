'use client';

import { CalendarDots, MapTrifold, DownloadSimple } from '@phosphor-icons/react';

interface ConfirmedSummaryProps {
    date: string;
    location?: string | null;
    locationUrl?: string | null;
    onAddToCalendar: () => void;
}

export function ConfirmedSummary({ date, location, locationUrl, onAddToCalendar }: ConfirmedSummaryProps) {
    return (
        <div className="rounded-2xl border-2 border-green-500/25 overflow-hidden" style={{ background: '#0c0c0c', boxShadow: '0 0 24px rgba(34,197,94,0.08), 3px 3px 0px #000' }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400/80">C'est aujourd'hui</span>
            </div>
            <div className="px-4 py-3 space-y-2">
                <button
                    type="button"
                    onClick={onAddToCalendar}
                    className="flex items-center gap-2 group w-full text-left"
                    title="Ajouter au calendrier"
                >
                    <CalendarDots className="w-4 h-4 text-green-400 shrink-0" weight="fill" />
                    <span className="text-sm font-black text-white capitalize flex-1">{date}</span>
                    <DownloadSimple className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                </button>
                {location && (
                    locationUrl ? (
                        <a
                            href={locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 group"
                        >
                            <MapTrifold className="w-4 h-4 text-[var(--v2-accent)] shrink-0" weight="fill" />
                            <span className="text-sm font-black text-white/80 group-hover:text-white transition-colors truncate">{location}</span>
                        </a>
                    ) : (
                        <div className="flex items-center gap-2">
                            <MapTrifold className="w-4 h-4 text-[var(--v2-accent)] shrink-0" weight="fill" />
                            <span className="text-sm font-black text-white/80 truncate">{location}</span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
