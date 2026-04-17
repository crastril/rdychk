'use server';

import { supabase } from '@/lib/supabase';
import { verifyGuestSession } from './member';
import { ARRIVAL_THRESHOLD_M, geocodeAddress, haversineMeters } from '@/lib/geo';

/**
 * Input validation — bounds check to avoid DB poisoning with junk from
 * spoofed clients.
 */
function isValidCoord(lat: number, lng: number): boolean {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
}

/**
 * Server Action: opt-in to live location sharing for this group.
 * Sets en_route_at = now; current position comes in follow-up updates.
 */
export async function startEnRouteAction(slug: string, memberId: string) {
    const ok = await verifyGuestSession(slug, memberId);
    if (!ok) return { success: false, error: 'Unauthorized' };

    const now = new Date().toISOString();
    const { error } = await supabase
        .from('members')
        .update({
            en_route_at: now,
            arrived_at: null,
            location_updated_at: null,
            current_lat: null,
            current_lng: null,
            updated_at: now,
        })
        .eq('id', memberId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/**
 * Server Action: push a new GPS position for a member who is en route.
 *
 * Also auto-detects arrival: if we have the group's destination coordinates
 * and distance < ARRIVAL_THRESHOLD_M, we stamp arrived_at so the client
 * can stop watching.
 */
export async function updateLocationAction(
    slug: string,
    memberId: string,
    lat: number,
    lng: number,
) {
    const ok = await verifyGuestSession(slug, memberId);
    if (!ok) return { success: false, error: 'Unauthorized' };

    if (!isValidCoord(lat, lng)) {
        return { success: false, error: 'Invalid coordinates' };
    }

    const now = new Date().toISOString();

    // Look up destination to check for arrival
    const { data: member } = await supabase
        .from('members')
        .select('group_id, en_route_at')
        .eq('id', memberId)
        .single();

    if (!member) return { success: false, error: 'Member not found' };
    if (!member.en_route_at) {
        // Out of contract — client is sending updates without opt-in.
        // Silently reject instead of erroring; the client will stop.
        return { success: false, error: 'Not en route' };
    }

    // Fetch destination coords (stored inside groups.location JSON)
    const { data: group } = await supabase
        .from('groups')
        .select('location')
        .eq('id', member.group_id)
        .single();

    const dest = group?.location as { lat?: number; lng?: number } | null;
    const hasDest =
        dest && typeof dest.lat === 'number' && typeof dest.lng === 'number';

    let arrived = false;
    if (hasDest) {
        const dist = haversineMeters(
            { lat, lng },
            { lat: dest.lat as number, lng: dest.lng as number },
        );
        arrived = dist <= ARRIVAL_THRESHOLD_M;
    }

    const update: Record<string, unknown> = {
        current_lat: lat,
        current_lng: lng,
        location_updated_at: now,
        updated_at: now,
    };
    if (arrived) update.arrived_at = now;

    const { error } = await supabase
        .from('members')
        .update(update)
        .eq('id', memberId);

    if (error) return { success: false, error: error.message };
    return { success: true, arrived };
}

/**
 * Server Action: stop sharing — wipes current position.
 * Called manually by the user, on arrival, or by the client-side auto-stop
 * after MAX_EN_ROUTE_MS.
 */
export async function stopEnRouteAction(slug: string, memberId: string) {
    const ok = await verifyGuestSession(slug, memberId);
    if (!ok) return { success: false, error: 'Unauthorized' };

    const now = new Date().toISOString();
    const { error } = await supabase
        .from('members')
        .update({
            en_route_at: null,
            current_lat: null,
            current_lng: null,
            location_updated_at: null,
            // keep arrived_at if set — it's useful history for post-event
            updated_at: now,
        })
        .eq('id', memberId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/**
/**
 * Extract Google Maps place_id from a maps.google.com link.
 */
function extractPlaceId(link?: string | null): string | null {
    if (!link) return null;
    try {
        return new URL(link).searchParams.get('query_place_id');
    } catch {
        return null;
    }
}

/**
 * Geocode via Google Places Details API using a place_id.
 * Exact, unambiguous — no city needed, no false positives.
 */
async function geocodeByPlaceId(placeId: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
    if (!apiKey) return null;
    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const data = await res.json() as {
            result?: { geometry?: { location?: { lat: number; lng: number } } };
            status: string;
        };
        if (data.status !== 'OK' || !data.result?.geometry?.location) return null;
        return data.result.geometry.location;
    } catch {
        return null;
    }
}

/**
 * Server Action: geocode the group's confirmed location and persist
 * lat/lng inside the location JSON. Idempotent (no-op if already present).
 *
 * Strategy (in order):
 *  1. Google Places Details via place_id extracted from Google Maps link
 *     → exact, no city needed, no false positives.
 *  2. Nominatim with city suffix (countrycodes=fr not set; city provides context)
 *  3. Nominatim with bare name as last resort.
 *
 * @param fallbackName     Display name when group.location is null (proposal source).
 * @param googleMapsLink   Google Maps link from the top proposal (has place_id).
 */
export async function geocodeGroupLocationAction(
    slug: string,
    memberId: string,
    fallbackName?: string,
    googleMapsLink?: string,
) {
    const ok = await verifyGuestSession(slug, memberId);
    if (!ok) return { success: false, error: 'Unauthorized' };

    const { data: group } = await supabase
        .from('groups')
        .select('id, location, city')
        .eq('slug', slug)
        .single();

    if (!group) return { success: false, error: 'Group not found' };

    const loc = group.location as {
        name?: string; address?: string; link?: string; lat?: number; lng?: number;
    } | null;

    // Idempotent
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        return { success: true, cached: true };
    }

    let coords: { lat: number; lng: number } | null = null;

    // Strategy 1: Google Places Details via place_id (exact)
    const placeId = extractPlaceId(googleMapsLink || loc?.link);
    if (placeId) coords = await geocodeByPlaceId(placeId);

    // Strategy 2 & 3: Nominatim fallback
    if (!coords) {
        const city = (group as { city?: string | null }).city;
        const baseName = loc?.address || loc?.name || fallbackName;
        if (!baseName) return { success: false, error: 'No location to geocode' };
        const query = city ? `${baseName} ${city}` : baseName;
        coords = await geocodeAddress(query);
        if (!coords && city) coords = await geocodeAddress(baseName);
    }

    if (!coords) return { success: false, error: 'Geocoding failed' };

    const displayName = loc?.name || fallbackName || 'Lieu';
    const updated = loc
        ? { ...loc, lat: coords.lat, lng: coords.lng }
        : { name: displayName, lat: coords.lat, lng: coords.lng };

    const { error } = await supabase
        .from('groups')
        .update({ location: updated })
        .eq('id', group.id);

    if (error) return { success: false, error: error.message };
    return { success: true, coords };
}
