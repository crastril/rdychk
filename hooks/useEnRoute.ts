'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    startEnRouteAction,
    updateLocationAction,
    stopEnRouteAction,
} from '@/app/actions/en-route';
import { MAX_EN_ROUTE_MS, haversineMeters } from '@/lib/geo';

/**
 * Client hook that drives the "je suis en route" live-location session.
 *
 * Contract:
 *  - Explicit opt-in: caller invokes start() after the user confirms a
 *    permission modal. Never auto-starts.
 *  - The browser's own permission prompt is the hard gate. If the user
 *    refuses, we surface an error and never retry silently.
 *  - Position updates are throttled: we only push to the server when
 *    EITHER 30s have elapsed since the last push OR the user has moved
 *    more than 150m. This keeps DB writes + battery use bounded.
 *  - Auto-stops on: arrival (server returns arrived=true), manual stop,
 *    4h deadline, or tab close.
 *
 * The hook does NOT subscribe to DB state — realtime already syncs
 * members for the rest of the app. We only own the outgoing stream.
 */

export type EnRouteStatus =
    | 'idle'         // not sharing
    | 'requesting'   // waiting for browser permission prompt
    | 'active'       // streaming positions
    | 'denied'       // user refused geolocation
    | 'unsupported'  // no geolocation API
    | 'error';       // transient failure

const MIN_UPDATE_INTERVAL_MS = 30_000;
const MIN_UPDATE_DISTANCE_M = 150;

export function useEnRoute(slug: string, memberId: string, initiallyEnRoute: boolean) {
    const [status, setStatus] = useState<EnRouteStatus>(initiallyEnRoute ? 'active' : 'idle');
    const [error, setError] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const lastPushRef = useRef<{ ts: number; lat: number; lng: number } | null>(null);
    const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Use a ref so callbacks always see the latest status without re-subscribing watchPosition.
    const statusRef = useRef<EnRouteStatus>(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const clearWatch = useCallback(() => {
        if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
        }
        lastPushRef.current = null;
    }, []);

    const stop = useCallback(async () => {
        clearWatch();
        setStatus('idle');
        setError(null);
        try {
            await stopEnRouteAction(slug, memberId);
        } catch {
            // non-fatal: state will reconcile on next refresh
        }
    }, [clearWatch, slug, memberId]);

    const handlePosition = useCallback(async (pos: GeolocationPosition) => {
        const { latitude, longitude } = pos.coords;
        const now = Date.now();
        const last = lastPushRef.current;

        if (last) {
            const elapsed = now - last.ts;
            const dist = haversineMeters(
                { lat: last.lat, lng: last.lng },
                { lat: latitude, lng: longitude },
            );
            // Throttle: skip unless enough time OR enough movement
            if (elapsed < MIN_UPDATE_INTERVAL_MS && dist < MIN_UPDATE_DISTANCE_M) {
                return;
            }
        }

        lastPushRef.current = { ts: now, lat: latitude, lng: longitude };

        try {
            const res = await updateLocationAction(slug, memberId, latitude, longitude);
            if (res.success && res.arrived) {
                // Server tells us we're within the arrival threshold — wind down.
                clearWatch();
                setStatus('idle');
            }
        } catch {
            // Transient network blip — keep watching, the next position will retry.
        }
    }, [slug, memberId, clearWatch]);

    const handleError = useCallback((err: GeolocationPositionError) => {
        if (err.code === err.PERMISSION_DENIED) {
            clearWatch();
            setStatus('denied');
            setError('Permission de géolocalisation refusée.');
            // Fire-and-forget server cleanup so other members don't see us as stuck
            stopEnRouteAction(slug, memberId).catch(() => {});
        } else {
            setError(
                err.code === err.TIMEOUT
                    ? 'Signal GPS trop faible.'
                    : 'Position indisponible.',
            );
        }
    }, [clearWatch, slug, memberId]);

    const start = useCallback(async () => {
        setError(null);

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setStatus('unsupported');
            setError("Votre navigateur ne supporte pas la géolocalisation.");
            return false;
        }

        setStatus('requesting');

        // Tell the server we're starting BEFORE the first position arrives.
        // That way the group sees "Marie est en route" immediately even if
        // GPS acquisition takes a few seconds.
        const srv = await startEnRouteAction(slug, memberId);
        if (!srv.success) {
            setStatus('error');
            setError(srv.error ?? 'Impossible de démarrer le partage.');
            return false;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                if (statusRef.current !== 'active') setStatus('active');
                handlePosition(pos);
            },
            handleError,
            {
                enableHighAccuracy: true,
                maximumAge: 10_000,
                timeout: 20_000,
            },
        );

        // Safety: hard-stop after MAX_EN_ROUTE_MS regardless of state.
        stopTimeoutRef.current = setTimeout(() => {
            stop();
        }, MAX_EN_ROUTE_MS);

        return true;
    }, [slug, memberId, handlePosition, handleError, stop]);

    // Cleanup on unmount — but do NOT call stopEnRoute on the server.
    // The member may reopen the app on another device; we only tear down
    // the browser watcher. Server state lives until an explicit stop or
    // arrival or the 4h deadline (which is enforced from startEnRoute
    // timestamp if we ever add a cron; client timer only covers this tab).
    useEffect(() => {
        return () => {
            clearWatch();
        };
    }, [clearWatch]);

    return { status, error, start, stop };
}
