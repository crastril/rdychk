'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface NotificationManagerProps {
    readyCount: number;
    totalCount: number;
    groupName: string;
}

export function NotificationManager({ readyCount, totalCount, groupName }: NotificationManagerProps) {
    const prevReadyCountRef = useRef(readyCount);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio('/sounds/success.mp3');
    }, []);

    // Request notification permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        // Trigger only when we reach 100% ready (and we weren't already there or just starting)
        // We also want to ensure we have at least 2 people for it to be a "group" event worth celebrating
        const isComplete = totalCount > 1 && readyCount === totalCount;
        const wasComplete = totalCount > 1 && prevReadyCountRef.current === totalCount;

        if (isComplete && !wasComplete) {
            triggerCompletionEffects();
        }

        prevReadyCountRef.current = readyCount;
    }, [readyCount, totalCount, groupName]);

    const triggerCompletionEffects = () => {
        // 1. Confetti
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // 2. Sound
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed (user interaction needed first)", e));
        }

        // 3. Browser Notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`Tout le monde est prêt ! 🎉`, {
                body: `C'est parti pour ${groupName} !`,
                icon: '/icon.png' // Ensure you have an icon or remove this line
            });
        }
    };

    return null; // Headless component
}
