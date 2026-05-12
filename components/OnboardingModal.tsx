'use client';

import { useState, useRef } from 'react';
import { X, ArrowRight } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const SLIDES = [
    {
        image: '/onboarding/slide-1.jpg',
        title: 'Où et quand ?',
        description: 'Vote avec tes amis pour choisir une date et un lieu. Chacun propose, tout le monde décide — fini les boucles de messages infinies.',
    },
    {
        image: '/onboarding/slide-2.jpg',
        title: 'Tout le monde dans la boucle',
        description: 'Partage le lien du groupe. Dès que tes amis rejoignent, vous pouvez vous coordonner en temps réel sans avoir à vous appeler.',
    },
    {
        image: '/onboarding/slide-3.jpg',
        title: 'On y va !',
        description: 'Quand c\'est décidé, chacun clique "Prêt". Tu vois en direct qui est partant. Plus d\'excuse pour annuler au dernier moment.',
    },
];

interface OnboardingModalProps {
    onClose: () => void;
    isRemote?: boolean;
}

export function OnboardingModal({ onClose, isRemote }: OnboardingModalProps) {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const touchStartX = useRef<number | null>(null);

    const goTo = (next: number, dir: number) => {
        setDirection(dir);
        setIndex(next);
    };

    const handleNext = () => {
        if (index < SLIDES.length - 1) {
            goTo(index + 1, 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (index > 0) goTo(index - 1, -1);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            if (diff > 0 && index < SLIDES.length - 1) goTo(index + 1, 1);
            else if (diff < 0 && index > 0) goTo(index - 1, -1);
        }
        touchStartX.current = null;
    };

    const isLast = index === SLIDES.length - 1;
    const slide = SLIDES[index];

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="relative w-full max-w-sm mx-auto overflow-hidden"
                style={isRemote ? {
                    background: 'rgba(8,0,20,0.99)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: '8px 8px 0 0',
                    boxShadow: '0 -8px 40px rgba(168,85,247,0.15)',
                } : {
                    background: '#111',
                    border: '3px solid #000',
                    borderBottom: 'none',
                    borderRadius: '20px 20px 0 0',
                    boxShadow: '0 -8px 0 #000',
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                    style={isRemote ? {
                        border: '1px solid rgba(168,85,247,0.2)',
                        borderRadius: '2px',
                        background: 'rgba(168,85,247,0.05)',
                    } : {
                        border: '2px solid rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)',
                    }}
                >
                    <X className="w-3.5 h-3.5 text-white/50" />
                </button>

                {/* Image area */}
                <div className="relative w-full overflow-hidden" style={{ height: 280 }}>
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={index}
                            custom={direction}
                            variants={{
                                enter: (d: number) => ({ x: d * 60, opacity: 0 }),
                                center: { x: 0, opacity: 1 },
                                exit: (d: number) => ({ x: d * -60, opacity: 0 }),
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Gradient fade at bottom */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                        style={{ background: isRemote
                            ? 'linear-gradient(to bottom, transparent, rgba(8,0,20,0.99))'
                            : 'linear-gradient(to bottom, transparent, #111)'
                        }}
                    />
                </div>

                {/* Dots */}
                <div className="flex items-center justify-center gap-2 pt-3 pb-1">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i, i > index ? 1 : -1)}
                            className="transition-all duration-300"
                            style={isRemote ? {
                                width: i === index ? 20 : 6,
                                height: 6,
                                borderRadius: 3,
                                background: i === index ? '#a855f7' : 'rgba(168,85,247,0.2)',
                            } : {
                                width: i === index ? 20 : 6,
                                height: 6,
                                borderRadius: 3,
                                background: i === index ? 'var(--v2-primary)' : 'rgba(255,255,255,0.15)',
                            }}
                        />
                    ))}
                </div>

                {/* Text content */}
                <div className="px-6 pt-3 pb-6">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={index}
                            custom={direction}
                            variants={{
                                enter: (d: number) => ({ x: d * 30, opacity: 0 }),
                                center: { x: 0, opacity: 1 },
                                exit: (d: number) => ({ x: d * -30, opacity: 0 }),
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {isRemote ? (
                                <>
                                    <p className="font-mono text-[0.9rem] uppercase tracking-[0.15em] mb-2" style={{ color: '#c4b5fd' }}>
                                        {'> '}{slide.title}
                                    </p>
                                    <p className="font-mono text-[12px] leading-relaxed" style={{ color: 'rgba(196,181,253,0.6)' }}>
                                        {slide.description}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2
                                        className="font-black uppercase text-white mb-1.5"
                                        style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '1.6rem', letterSpacing: '-0.01em', lineHeight: 1 }}
                                    >
                                        {slide.title}
                                    </h2>
                                    <p className="text-[13px] leading-relaxed text-white/50">
                                        {slide.description}
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center gap-3 mt-5">
                        {index > 0 && (
                            <button
                                onClick={handlePrev}
                                className="h-12 px-4 font-black uppercase tracking-wide text-sm transition-all"
                                style={isRemote ? {
                                    border: '1px solid rgba(168,85,247,0.2)',
                                    borderRadius: '3px',
                                    color: 'rgba(196,181,253,0.5)',
                                    background: 'transparent',
                                } : {
                                    border: '2.5px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'rgba(255,255,255,0.35)',
                                    background: 'transparent',
                                    fontFamily: 'var(--font-barlow-condensed)',
                                }}
                            >
                                ←
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 h-12 flex items-center justify-center gap-2 font-black uppercase tracking-wide transition-all active:scale-[0.98]"
                            style={isRemote ? {
                                background: isLast ? 'rgba(74,222,128,0.15)' : 'rgba(168,85,247,0.15)',
                                border: isLast ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(168,85,247,0.4)',
                                borderRadius: '3px',
                                color: isLast ? '#4ade80' : '#c4b5fd',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                letterSpacing: '0.15em',
                            } : {
                                background: isLast ? 'rgba(74,222,128,0.9)' : 'var(--v2-primary)',
                                border: '3px solid #000',
                                borderRadius: '14px',
                                color: '#fff',
                                boxShadow: '3px 3px 0 #000',
                                fontFamily: 'var(--font-barlow-condensed)',
                                fontSize: '1rem',
                            }}
                        >
                            {isLast ? (
                                isRemote ? '[ COMMENCER ]' : 'Commencer'
                            ) : (
                                <>
                                    {isRemote ? 'SUIVANT >' : 'Suivant'}
                                    {!isRemote && <ArrowRight className="w-4 h-4" weight="bold" />}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
