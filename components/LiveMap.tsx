'use client';

/**
 * LiveMap — inline Leaflet map for the jour-J in-person experience.
 *
 * Shows:
 *  - A radar-ping destination pin for the venue.
 *  - Pulsing dot markers for members who are en route and have a live position.
 *  - Green dot for members who have arrived.
 *
 * Aesthetic: CartoDB Dark Matter tiles + orange radar sweep + scan-line
 * overlay (matches the in-person brutalist stamp vibe, counterpart of the
 * glitch effect on the remote side).
 *
 * SSR-safe: only imported via next/dynamic with ssr:false — never server-rendered.
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Member } from '@/types/database';

// ── Icon factories ────────────────────────────────────────────────────────────

function makeDestinationIcon(): L.DivIcon {
    return L.divIcon({
        html: `
          <div class="lm-dest">
            <span class="lm-dest-ring"></span>
            <span class="lm-dest-ring"></span>
            <span class="lm-dest-ring"></span>
            <div class="lm-dest-core"><div class="lm-dest-inner"></div></div>
          </div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 38],
        popupAnchor: [0, -42],
    });
}

function makeMemberIcon(member: Member, arrived: boolean): L.DivIcon {
    const initial = (member.name || '?')[0].toUpperCase();
    const color = arrived ? '#22c55e' : '#f97316';
    return L.divIcon({
        html: `
          <div class="lm-member" style="--mc:${color}">
            ${arrived ? '' : '<span class="lm-member-ring"></span>'}
            <span class="lm-member-dot">${initial}</span>
          </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
    });
}

// ── Auto-fit bounds ───────────────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    const serialised = positions.map(p => `${p[0]},${p[1]}`).join('|');
    const prevRef = useRef('');

    useEffect(() => {
        if (serialised === prevRef.current) return;
        prevRef.current = serialised;

        if (positions.length === 0) return;
        if (positions.length === 1) {
            map.setView(positions[0], 14, { animate: true });
        } else {
            const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serialised]);

    return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export interface LiveMapProps {
    destination: { lat: number; lng: number; name?: string };
    members: Member[];
}

export function LiveMap({ destination, members }: LiveMapProps) {
    // Only plot members who have live GPS coords (en route or arrived)
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

    const destIcon = makeDestinationIcon();

    return (
        <div
            className="relative rounded-2xl overflow-hidden border-[3px] border-black"
            style={{ height: 220, boxShadow: '5px 5px 0 #000' }}
        >
            {/* Radar scan-line — visual identity for in-person live tracking */}
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

                {/* Venue pin with radar ping rings */}
                <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                    {destination.name && (
                        <Popup>
                            <span style={{ fontWeight: 700, fontSize: 12, color: '#111' }}>
                                {destination.name}
                            </span>
                        </Popup>
                    )}
                </Marker>

                {/* En-route / arrived member dots */}
                {liveMembers.map(m => (
                    <Marker
                        key={m.id}
                        position={[m.current_lat as number, m.current_lng as number]}
                        icon={makeMemberIcon(m, !!m.arrived_at)}
                    >
                        {m.name && (
                            <Popup>
                                <span style={{ fontWeight: 700, fontSize: 12, color: '#111' }}>
                                    {m.arrived_at ? '✓ ' : ''}{m.name}
                                </span>
                            </Popup>
                        )}
                    </Marker>
                ))}

                <FitBounds positions={allPositions} />
            </MapContainer>

            {/* "Live" badge */}
            <div
                className="absolute top-2.5 left-2.5 z-[500] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-sm pointer-events-none"
            >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--v2-primary)] opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--v2-primary)]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Live</span>
            </div>

            {/* Member count badge — top right */}
            {liveMembers.length > 0 && (
                <div
                    className="absolute top-2.5 right-2.5 z-[500] flex items-center gap-1 px-2 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-sm pointer-events-none"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                        {liveMembers.length} en route
                    </span>
                </div>
            )}
        </div>
    );
}
