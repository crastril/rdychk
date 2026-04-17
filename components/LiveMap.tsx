'use client';

/**
 * LiveMap — inline Leaflet map for the jour-J in-person experience.
 *
 * Markers:
 *  - Venue: orange filled circle (larger), tooltip with name.
 *  - En-route members: orange circle, tooltip with name.
 *  - Arrived members: green circle, tooltip with name + ✓.
 *
 * No DivIcon, no ring animations — plain CircleMarker keeps the map
 * readable even with many members active at once.
 *
 * SSR-safe: only imported via next/dynamic with ssr:false.
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Member } from '@/types/database';

// ── Auto-fit bounds ───────────────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    const serialised = positions.map(p => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join('|');
    const prevRef = useRef('');

    useEffect(() => {
        if (serialised === prevRef.current) return;
        prevRef.current = serialised;
        if (positions.length === 0) return;
        if (positions.length === 1) {
            map.setView(positions[0], 14, { animate: true });
        } else {
            const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
            map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serialised]);

    return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface LiveMapProps {
    destination: { lat: number; lng: number; name?: string };
    members: Member[];
}

export function LiveMap({ destination, members }: LiveMapProps) {
    const liveMembers = members.filter(
        m =>
            (m.en_route_at || m.arrived_at) &&
            typeof m.current_lat === 'number' &&
            typeof m.current_lng === 'number',
    );

    const allPositions: [number, number][] = [
        [destination.lat, destination.lng],
        ...liveMembers.map(m => [m.current_lat as number, m.current_lng as number] as [number, number]),
    ];

    const enRouteCount = liveMembers.filter(m => !m.arrived_at).length;

    return (
        <div
            className="relative rounded-2xl overflow-hidden border-[3px] border-black"
            style={{ height: 220, boxShadow: '5px 5px 0 #000' }}
        >
            {/* Scan-line radar sweep */}
            <div className="lm-scanline-wrap" aria-hidden="true">
                <div className="lm-scanline" />
            </div>

            <MapContainer
                center={[destination.lat, destination.lng]}
                zoom={13}
                zoomControl={false}
                attributionControl={true}
                style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={20}
                />

                {/* Venue pin — larger orange circle */}
                <CircleMarker
                    center={[destination.lat, destination.lng]}
                    radius={9}
                    pathOptions={{
                        fillColor: '#f97316',
                        fillOpacity: 1,
                        color: '#000',
                        weight: 2.5,
                    }}
                >
                    {destination.name && (
                        <Tooltip permanent={false} direction="top" offset={[0, -12]}>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>{destination.name}</span>
                        </Tooltip>
                    )}
                </CircleMarker>

                {/* Member dots */}
                {liveMembers.map(m => {
                    const arrived = !!m.arrived_at;
                    return (
                        <CircleMarker
                            key={m.id}
                            center={[m.current_lat as number, m.current_lng as number]}
                            radius={6}
                            pathOptions={{
                                fillColor: arrived ? '#22c55e' : '#f97316',
                                fillOpacity: 0.9,
                                color: '#000',
                                weight: 2,
                            }}
                        >
                            {m.name && (
                                <Tooltip direction="top" offset={[0, -9]}>
                                    <span style={{ fontWeight: 700, fontSize: 12 }}>
                                        {arrived ? '✓ ' : ''}{m.name}
                                    </span>
                                </Tooltip>
                            )}
                        </CircleMarker>
                    );
                })}

                <FitBounds positions={allPositions} />
            </MapContainer>

            {/* "Live" badge */}
            <div className="absolute top-2.5 left-2.5 z-[500] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-sm pointer-events-none">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--v2-primary)] opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--v2-primary)]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Live</span>
            </div>

            {/* En-route count badge */}
            {enRouteCount > 0 && (
                <div className="absolute top-2.5 right-2.5 z-[500] px-2 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-sm pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                        {enRouteCount} en route
                    </span>
                </div>
            )}
        </div>
    );
}
