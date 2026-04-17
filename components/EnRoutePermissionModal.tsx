'use client';

import { MapPin, Shield, ClockCountdown, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnRoutePermissionModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    destinationName?: string;
}

/**
 * Consent modal shown before starting live-location sharing.
 *
 * Explicit by design — we want users to *understand* what they're
 * sharing, with whom, and for how long. Anything fuzzy here erodes
 * trust and kills the feature.
 */
export function EnRoutePermissionModal({
    open,
    onClose,
    onConfirm,
    destinationName,
}: EnRoutePermissionModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-md bg-[#111] rounded-2xl border-[3px] border-black overflow-hidden"
                        style={{ boxShadow: '6px 6px 0 var(--v2-primary)' }}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[var(--v2-primary)]" weight="fill" />
                                <h2
                                    className="uppercase leading-none text-white"
                                    style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.06em' }}
                                >
                                    Je pars maintenant
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="w-4 h-4 text-white/50" weight="bold" />
                            </button>
                        </div>

                        <div className="px-5 pb-2">
                            <p className="text-sm text-white/60 leading-snug">
                                Partage ta position live avec le groupe{destinationName ? ` jusqu'à ${destinationName}` : ''} — les autres voient ton ETA au lieu de te harceler sur WhatsApp.
                            </p>
                        </div>

                        <ul className="px-5 py-3 space-y-2.5">
                            <li className="flex items-start gap-3">
                                <Shield className="w-4 h-4 text-green-400 mt-0.5 shrink-0" weight="fill" />
                                <span className="text-[13px] text-white/75 leading-snug">
                                    Uniquement les membres du groupe voient ta position.
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ClockCountdown className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" weight="fill" />
                                <span className="text-[13px] text-white/75 leading-snug">
                                    Arrêt automatique quand tu arrives (ou après 4 h).
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <X className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" weight="bold" />
                                <span className="text-[13px] text-white/75 leading-snug">
                                    Tu peux stopper à tout moment d&apos;un clic.
                                </span>
                            </li>
                        </ul>

                        <div className="px-5 pt-2 pb-5 flex flex-col gap-2">
                            <button
                                onClick={onConfirm}
                                className="w-full h-12 rounded-xl bg-[var(--v2-primary)] text-black font-black uppercase tracking-[0.14em] text-sm border-[3px] border-black active:translate-y-[2px] transition-transform"
                                style={{ boxShadow: '4px 4px 0 #000' }}
                            >
                                Partager ma position
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full h-10 text-[12px] font-black uppercase tracking-[0.14em] text-white/45 hover:text-white/70 transition-colors"
                            >
                                Pas maintenant
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
