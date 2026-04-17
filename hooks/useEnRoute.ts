'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    startEnRouteAction,
    updateLocationAction,
    stopEnRouteAction,
} from '@/app/actions/en-route';
import { MAX_EN_ROUTE_MS, haversineMeters, isEnRouteActive } from '@/lib/geo';

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

/**
 * @param enRouteAt  The raw en_route_at timestamp from the DB (or null).
 *                   Used to detect stale sessions that survived tab closes.
 */
export function useEnRoute(slug: string, memberId: string, enRouteAt: string | null) {
    const activeOnMount = isEnRouteActive(enRouteAt, null);
    const [status, setStatus] = useState<EnRouteStatus>(activeOnMount ? 'active' : 'idle');
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
            setError('Permission de géolocalisation refusée. Active-la dans les réglages du navigateur.');
            stopEnRouteAction(slug, memberId).catch(() => {});
        } else if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
            // Non-fatal: GPS couldn't get a fix this time. Keep watching but
            // surface a message so the user knows something went wrong.
            setError(
                err.code === err.TIMEOUT
                    ? 'Acquisition GPS trop longue — toujours en attente…'
                    : 'Signal GPS indisponible — toujours en attente…',
            );
            // watchPosition continues running; next successful fix clears the error.
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
        let srv: { success: boolean; error?: string };
        try {
            srv = await startEnRouteAction(slug, memberId);
        } catch (e) {
            // Network error, missing server action, etc.
            setStatus('error');
            setError('Impossible de démarrer le partage (erreur réseau).');
            console.error('[useEnRoute] startEnRouteAction threw:', e);
            return false;
        }
        if (!srv.success) {
            setStatus('error');
            setError(srv.error ?? 'Impossible de démarrer le partage.');
            return false;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                if (statusRef.current !== 'active') setStatus('active');
                setError(null); // clear any previous timeout/unavailable error
                handlePosition(pos);
            },
            handleError,
            {
                // enableHighAccuracy: false lets the browser use WiFi/cell
                // positioning immediately instead of waiting for GPS lock.
                // For urban ETAs (< 30 km) the extra precision is not needed.
                enableHighAccuracy: false,
                maximumAge: 60_000,  // accept a cached position up to 1 min old
                timeout: 30_000,
            },
        );

        // Safety: hard-stop after MAX_EN_ROUTE_MS regardless of state.
        stopTimeoutRef.current = setTimeout(() => {
            stop();
        }, MAX_EN_ROUTE_MS);

        return true;
    }, [slug, memberId, handlePosition, handleError, stop]);

    // Self-healing: if the DB has a stale en_route_at (session survived a tab
    // close or crash past the time limit), silently reset it so the UI clears.
    useEffect(() => {
        if (enRouteAt && !isEnRouteActive(enRouteAt, null)) {
            stopEnRouteAction(slug, memberId).catch(() => {});
        }
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cleanup on unmount — but do NOT call stopEnRoute on the server.
    // The member may reopen the app on another device; we only tear down
    // the browser watcher. Server state lives until an explicit stop or arrival.
    useEffect(() => {
        return () => {
            clearWatch();
        };
    }, [clearWatch]);

    return { status, error, start, stop };
}
