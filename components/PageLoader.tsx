"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const LETTERS = ['r', 'd', 'y', 'c', 'h', 'k'];
const MIN_SHOW_MS = 3500;

// Color constants matching the two themes
const RED    = '#ff2e2e';
const PURPLE = '#a855f7';

export function PageLoader({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = useState<'letters' | 'orbiting' | 'exit'>('letters');
    const [hidden, setHidden] = useState(false);
    const onCompleteRef = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    // Phase 1 → Phase 2: after letters animate in
    useEffect(() => {
        const t = setTimeout(() => setPhase('orbiting'), 950);
        return () => clearTimeout(t);
    }, []);

    // Phase 2 → Phase 3: once minimum time elapsed (no auth dependency)
    useEffect(() => {
        if (phase !== 'orbiting') return;
        const remaining = MIN_SHOW_MS - 950;
        const t = setTimeout(() => setPhase('exit'), Math.max(0, remaining));
        return () => clearTimeout(t);
    }, [phase]);

    // Phase 3 → done
    useEffect(() => {
        if (phase !== 'exit') return;
        const t = setTimeout(() => {
            setHidden(true);
            onCompleteRef.current();
        }, 500);
        return () => clearTimeout(t);
    }, [phase]);

    if (hidden) return null;

    const isExit    = phase === 'exit';
    const showDots  = phase !== 'letters';

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: '#000' }}
            animate={{ opacity: isExit ? 0 : 1 }}
            transition={{ duration: 0.35, delay: isExit ? 0.3 : 0 }}
        >
            {/* Logo group — shrinks toward header position on exit */}
            <motion.div
                className="flex items-center"
                animate={isExit ? {
                    scale: 0.31,
                    x: 'calc(-50vw + 76px)',
                    y: 'calc(-50vh + 40px)',
                } : {}}
                transition={isExit ? { duration: 0.52, ease: [0.4, 0, 0.2, 1] } : {}}
            >
                {/* Letters — appear one by one */}
                <div className="flex">
                    {LETTERS.map((char, i) => (
                        <motion.span
                            key={i}
                            className="font-black tracking-tighter text-white leading-none select-none"
                            style={{ fontSize: '4.5rem' }}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: i * 0.09,
                                duration: 0.38,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </div>

                {/* Dot area — aligned to text baseline */}
                {showDots && (
                    <div
                        className="relative self-end"
                        style={{ width: 18, height: 18, marginLeft: 8, marginBottom: 8 }}
                    >
                        {/* ── Orbiting phase ── */}
                        {!isExit && (
                            <motion.div
                                className="absolute inset-0"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
                            >
                                {/* Spinning container */}
                                <motion.div
                                    className="absolute inset-0"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
                                >
                                    {/* Red dot — top */}
                                    <span
                                        className="absolute rounded-full"
                                        style={{
                                            width: 9, height: 9,
                                            background: RED,
                                            boxShadow: `0 0 8px ${RED}`,
                                            top: 0,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    />
                                    {/* Purple dot — bottom */}
                                    <span
                                        className="absolute rounded-full"
                                        style={{
                                            width: 9, height: 9,
                                            background: PURPLE,
                                            boxShadow: `0 0 8px ${PURPLE}`,
                                            bottom: 0,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    />
                                </motion.div>
                            </motion.div>
                        )}

                        {/* ── Exit phase ── */}
                        {isExit && (
                            <>
                                {/* Red stays */}
                                <span
                                    className="absolute rounded-full"
                                    style={{
                                        width: 9, height: 9,
                                        background: RED,
                                        boxShadow: `0 0 8px ${RED}`,
                                        top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                />
                                {/* Purple flies right */}
                                <motion.span
                                    className="absolute rounded-full"
                                    style={{
                                        width: 9, height: 9,
                                        background: PURPLE,
                                        boxShadow: `0 0 8px ${PURPLE}`,
                                        top: '50%', left: '50%',
                                        x: '-50%',
                                        y: '-50%',
                                    }}
                                    initial={{ x: '-50%', opacity: 1 }}
                                    animate={{ x: 'calc(-50% + 120px)', opacity: 0 }}
                                    transition={{ duration: 0.48, ease: [0.4, 0, 1, 1] }}
                                />
                            </>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
