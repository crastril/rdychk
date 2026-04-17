'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowClockwise, Warning, X } from '@phosphor-icons/react';

interface NextEventModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    currentDate?: string | null;     // formatted date string
    currentLocation?: string | null;
    memberCount: number;
    isRemote: boolean;
}

export function NextEventModal({
    open,
    onClose,
    onConfirm,
    currentDate,
    currentLocation,
    memberCount,
    isRemote,
}: NextEventModalProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    const accent = isRemote ? '#a855f7' : 'var(--v2-primary)';
    const borderColor = isRemote ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.15)';

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, y: 32, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-2xl border-[3px] border-black overflow-hidden"
                        style={{
                            background: '#0e0e0e',
                            boxShadow: `6px 6px 0 ${accent}`,
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b-[3px] border-black"
                            style={{ background: '#0a0a0a' }}
                        >
                            <div className="flex items-center gap-2">
                                <ArrowClockwise
                                    className="w-4 h-4 shrink-0"
                                    style={{ color: accent }}
                                    weight="bold"
                                />
                                <span
                                    className="text-[13px] font-black uppercase tracking-[0.12em] text-white"
                                    style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                                >
                                    Prochaine sortie
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-white/50" weight="bold" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4 flex flex-col gap-3">
                            {/* What gets archived */}
                            {(currentDate || currentLocation) && (
                                <div
                                    className="rounded-xl px-3 py-2.5 border"
                                    style={{ background: 'rgba(255,255,255,0.03)', borderColor }}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35 mb-1.5">
                                        Archivé
                                    </p>
                                    {currentDate && (
                                        <p className="text-[13px] font-black text-white/70 capitalize">
                                            {currentDate}
                                        </p>
                                    )}
                                    {currentLocation && (
                                        <p className="text-[12px] font-black text-white/45 mt-0.5">
                                            {currentLocation}
                                        </p>
                                    )}
                                    <p className="text-[11px] text-white/30 mt-1">
                                        {memberCount} membre{memberCount !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}

                            {/* Warning */}
                            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 bg-amber-500/8 border border-amber-500/20">
                                <Warning className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" weight="fill" />
                                <p className="text-[12px] font-medium text-amber-400/90 leading-snug">
                                    Les votes, la date et le lieu seront remis à zéro. Les membres restent dans le groupe.
                                </p>
                            </div>

                            {/* Confirm button */}
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="w-full rounded-xl border-[3px] border-black py-3 flex items-center justify-center gap-2 transition-all active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: accent,
                                    boxShadow: loading ? 'none' : '4px 4px 0 #000',
                                    color: isRemote ? '#fff' : '#000',
                                }}
                            >
                                <ArrowClockwise
                                    className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`}
                                    weight="bold"
                                />
                                <span
                                    className="text-[13px] font-black uppercase tracking-[0.1em]"
                                    style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                                >
                                    {loading ? 'Réinitialisation…' : 'Planifier la prochaine sortie'}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
