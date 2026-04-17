/**
 * Geo helpers for the "je suis en route" feature.
 *
 * We deliberately avoid paid routing APIs for the MVP — Haversine (great-circle
 * distance) combined with observed speed gives a "good enough" ETA for the
 * small urban trajectories our users will do (< 30 km, typically < 10 km).
 * If accuracy becomes a real complaint, swap for Mapbox / OSRM directions.
 */

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;

/**
 * Great-circle distance between two points, in meters.
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Rough ETA in minutes.
 *
 * @param distanceMeters  straight-line remaining distance
 * @param observedKmh     observed avg speed since departure (if available)
 *
 * Strategy:
 *  - If we have ≥ 2 km/h observed (i.e. member is actually moving), use it.
 *    Cap between 2 km/h (snail) and 80 km/h (motorway) to avoid noisy GPS.
 *  - Otherwise default to 20 km/h (urban average — mix of walk / transit / car).
 *  - Add 20% to straight-line distance to compensate for road winding.
 */
export function computeEtaMinutes(distanceMeters: number, observedKmh?: number | null): number {
    const roadDistanceKm = (distanceMeters / 1000) * 1.2;
    let speedKmh = 20;
    if (observedKmh && observedKmh >= 2 && observedKmh <= 80) {
        speedKmh = observedKmh;
    }
    return Math.max(1, Math.round((roadDistanceKm / speedKmh) * 60));
}

/**
 * Distance threshold below which a member is considered "arrived".
 * 100m tolerates GPS noise and venue footprint without false positives.
 */
export const ARRIVAL_THRESHOLD_M = 100;

/**
 * Max en-route session duration. After this, auto-stop kicks in
 * (safety for battery / privacy if the user forgets to toggle off).
 */
export const MAX_EN_ROUTE_MS = 1 * 60 * 60 * 1000; // 1h

/**
 * Formats a distance for UI display.
 *   850   → "850 m"
 *   1500  → "1,5 km"
 *   12400 → "12 km"
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    const km = meters / 1000;
    if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
    return `${Math.round(km)} km`;
}

/**
 * Formats an ETA in minutes for UI display.
 *   2  → "2 min"
 *   45 → "45 min"
 *   75 → "1h15"
 */
export function formatEta(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`;
}

/**
 * Geocode a free-text address via Nominatim (OSM, free, no API key).
 * Returns null on failure — callers should degrade gracefully (no ETA displayed).
 *
 * Nominatim usage policy requires a valid User-Agent and <= 1 req/s.
 * Call this server-side only, on meaningful events (location confirmation),
 * NOT on every render.
 */
export async function geocodeAddress(query: string): Promise<LatLng | null> {
    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '1');

        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': 'rdychk/1.0 (https://rdychk.app)' },
            // 5s max — we never want to block a user flow on geocoding
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (!data.length) return null;
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
        return null;
    }
}
