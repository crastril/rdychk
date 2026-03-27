import { useRef, useCallback } from 'react';

/**
 * Detects horizontal swipe gestures on mobile.
 * Returns event handlers to attach to a container element.
 *
 * @param onSwipeLeft - called when user swipes left (next tab)
 * @param onSwipeRight - called when user swipes right (prev tab)
 * @param threshold - minimum horizontal distance in px to register as a swipe (default: 60)
 */
export function useSwipe(
    onSwipeLeft: () => void,
    onSwipeRight: () => void,
    threshold = 60
) {
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;

        // Only register as horizontal swipe if horizontal movement > vertical (avoids interfering with scroll)
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
            if (dx < 0) {
                onSwipeLeft();
            } else {
                onSwipeRight();
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    }, [onSwipeLeft, onSwipeRight, threshold]);

    return { onTouchStart, onTouchEnd };
}
