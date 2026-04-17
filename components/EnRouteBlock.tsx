'use client';

import { useState } from 'react';
import { NavigationArrow, CheckCircle, XCircle, WarningCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnRoute } from '@/hooks/useEnRoute';
import { computeEtaMinutes, formatDistance, formatEta, haversineMeters } from '@/lib/geo';
import { EnRoutePermissionModal } from './EnRoutePermissionModal';
import type { Member } from '@/types/database';

interface EnRouteBlockProps {
    slug: string;
    memberId: string;
    currentMember: Member | null;
    destination?: { lat: number; lng: number; name?: string } | null;
    /** If true, we know the location has no coordinates yet — block with a CTA. */
    destinationMissingCoords?: boolean;
}

/**
 * Jour-J live-location block for in-person groups.
 *
 * Three states:
 *  - Idle (not en route): big "Je pars maintenant" CTA.
 *  - Active (en route): live ETA + distance + stop button.
 *  - Arrived: green confirmation (stays briefly, auto-fades on next render).
 *
 * Only rendered when isActualDay && !isRemote && destination exists.
 */
export function EnRouteBlock({
    slug,
    memberId,
    currentMember,
    destination,
    destinationMissingCoords,
}: EnRouteBlockProps) {
    const enRouteStartedAt = currentMember?.en_route_at ?? null;
    const isEnRoute = !!enRouteStartedAt && !currentMember?.arrived_at;
    // We keep the "arrived" banner visible for the rest of the day — the
    // whole block unmounts on the next day via isActualDay in HomeTab.
    const hasArrived = !!currentMember?.arrived_at && !!enRouteStartedAt;

    const [modalOpen, setModalOpen] = useState(false);
    const { status, error, start, stop } = useEnRoute(slug, memberId, isEnRoute);

    const handleClickStart = () => setModalOpen(true);
    const handleConfirm = async () => {
        setModalOpen(false);
        await start();
    };

    // Compute distance + ETA from latest DB position.
    // React Compiler handles memoization automatically here.
    const liveStats = (() => {
        if (!destination || typeof currentMember?.current_lat !== 'number' || typeof currentMember?.current_lng !== 'number') {
            return null;
        }
        const dist = haversineMeters(
            { lat: currentMember.current_lat, lng: currentMember.current_lng },
            { lat: destination.lat, lng: destination.lng },
        );
        const eta = computeEtaMinutes(dist);
        return { dist, eta };
    })();

    // ── ARRIVED ──
    if (hasArrived) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-[3px] border-black bg-green-500/15 px-4 py-3 flex items-center gap-3"
                style={{ boxShadow: '4px 4px 0 #000' }}
            >
                <CheckCircle className="w-6 h-6 text-green-400 shrink-0" weight="fill" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-[0.1em] text-green-400 leading-tight">
                        Tu es arrivé
                    </p>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/45 mt-0.5">
                        Partage de position stoppé
                    </p>
                </div>
            </motion.div>
        );
    }

    // ── ACTIVE ──
    if (isEnRoute || status === 'active' || status === 'requesting') {
        return (
            <div
                className="rounded-2xl border-[3px] border-black overflow-hidden"
                style={{ boxShadow: '5px 5px 0 var(--v2-primary)' }}
            >
                {/* Header: live pulse */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0a0a0a] border-b-[3px] border-black">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--v2-primary)] opacity-70 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--v2-primary)]" />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
                        En route · Position partagée
                    </span>
                </div>

                {/* Body: ETA + distance */}
                <div className="bg-[#111] px-4 py-4 flex items-center gap-4">
                    <NavigationArrow className="w-8 h-8 text-[var(--v2-primary)] shrink-0" weight="fill" />
                    <div className="flex-1 min-w-0">
                        {liveStats ? (
                            <>
                                <p
                                    className="text-white leading-none"
                                    style={{
                                        fontFamily: 'var(--font-barlow-condensed)',
                                        fontWeight: 900,
                                        fontSize: '2rem',
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    {formatEta(liveStats.eta)}
                                </p>
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/45 mt-1">
                                    {formatDistance(liveStats.dist)}
                                    {destination?.name ? ` · ${destination.name}` : ''}
                                </p>
                            </>
                        ) : (
                            <>
                                <p
                                    className="text-white/70 leading-none"
                                    style={{
                                        fontFamily: 'var(--font-barlow-condensed)',
                                        fontWeight: 900,
                                        fontSize: '1.4rem',
                                    }}
                                >
                                    Acquisition GPS…
                                </p>
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/30 mt-1.5">
                                    Première position en cours
                                </p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={stop}
                        aria-label="Arrêter le partage"
                        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-red-500/20 active:scale-90 border border-white/10 transition-all"
                    >
                        <XCircle className="w-5 h-5 text-white/50" weight="fill" />
                    </button>
                </div>

                {error && (
                    <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 flex items-center gap-2">
                        <WarningCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" weight="fill" />
                        <span className="text-[11px] font-black text-amber-400/90">{error}</span>
                    </div>
                )}
            </div>
        );
    }

    // ── IDLE ──
    if (destinationMissingCoords) {
        return (
            <div
                className="rounded-2xl border-[3px] border-black bg-[#0c0c0c] px-4 py-3 flex items-center gap-3"
                style={{ boxShadow: '4px 4px 0 #000' }}
            >
                <WarningCircle className="w-5 h-5 text-white/30 shrink-0" weight="fill" />
                <span className="text-[12px] font-medium text-white/45 leading-snug">
                    Adresse non géolocalisée — l&apos;ETA live sera dispo une fois le lieu repéré sur la carte.
                </span>
            </div>
        );
    }

    if (!destination) return null;

    return (
        <>
            <AnimatePresence>
                {status === 'denied' && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-400/95 flex items-start gap-2"
                    >
                        <WarningCircle className="w-4 h-4 mt-0.5 shrink-0" weight="fill" />
                        <span>
                            Permission refusée. Active la géolocalisation dans les réglages du navigateur pour partager ta position.
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleClickStart}
                className="w-full rounded-2xl border-[3px] border-black bg-[#111] px-4 py-4 flex items-center gap-4 hover:bg-[#161616] active:translate-y-[2px] transition-all group"
                style={{ boxShadow: '5px 5px 0 #000' }}
            >
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-[2px] border-black bg-[var(--v2-primary)]/15"
                >
                    <NavigationArrow
                        className="w-5 h-5 text-[var(--v2-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        weight="fill"
                    />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p
                        className="text-white leading-tight uppercase"
                        style={{
                            fontFamily: 'var(--font-barlow-condensed)',
                            fontWeight: 900,
                            fontSize: '1.15rem',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Je pars maintenant
                    </p>
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/40 mt-0.5">
                        Partage ton ETA au groupe
                    </p>
                </div>
                <span className="text-white/30 group-hover:text-white/60 transition-colors text-lg">→</span>
            </button>

            <EnRoutePermissionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirm}
                destinationName={destination?.name}
            />
        </>
    );
}
