'use client';

/**
 * LiveMap — inline Leaflet map for the jour-J in-person experience.
 *
 * Markers:
 *  - Venue: red teardrop pin with a CSS glow filter.
 *  - En-route members: orange circle badge with initials.
 *  - Arrived members: green circle badge with initials.
 *
 * SSR-safe: only imported via next/dynamic with ssr:false.
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from '@phosphor-icons/react';
import type { Member } from '@/types/database';

// ── Icon factories ────────────────────────────────────────────────────────────

/** Red teardrop pin for the venue — stands out from member circles. */
function makeDestIcon(): L.DivIcon {
    return L.divIcon({
        // The filter:drop-shadow gives the red glow
        html: `<div style="filter:drop-shadow(0 0 6px rgba(239,68,68,0.8)) drop-shadow(0 0 2px rgba(239,68,68,1))">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
            <ellipse cx="14" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.4)"/>
            <path d="M14 1C7.925 1 3 5.925 3 12c0 7.875 11 23 11 23S25 19.875 25 12C25 5.925 20.075 1 14 1z"
              fill="#ef4444" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="14" cy="12" r="4" fill="#000" opacity="0.3"/>
          </svg>
        </div>`,
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 35],
        tooltipAnchor: [0, -36],
    });
}

/** Circular badge with initials for a member on the move. */
function makeMemberIcon(member: Member, arrived: boolean): L.DivIcon {
    const initials = getInitials(member.name);
    const bg = arrived ? '#22c55e' : '#f97316';
    return L.divIcon({
        html: `<div style="
          width:30px;height:30px;border-radius:50%;
          background:${bg};border:2.5px solid #000;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:900;color:#000;
          font-family:system-ui,sans-serif;letter-spacing:0.03em;
          box-shadow:1px 1px 0 #000;
        ">${initials}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        tooltipAnchor: [0, -17],
    });
}

function getInitials(name: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
    onClose: () => void;
}

export function LiveMap({ destination, members, onClose }: LiveMapProps) {
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
    const destIcon = makeDestIcon();

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

                {/* Venue pin */}
                <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                    {destination.name && (
                        <Tooltip direction="top" offset={[0, -2]}>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>{destination.name}</span>
                        </Tooltip>
                    )}
                </Marker>

                {/* Member badges */}
                {liveMembers.map(m => (
                    <Marker
                        key={m.id}
                        position={[m.current_lat as number, m.current_lng as number]}
                        icon={makeMemberIcon(m, !!m.arrived_at)}
                    >
                        {m.name && (
                            <Tooltip direction="top" offset={[0, -2]}>
                                <span style={{ fontWeight: 700, fontSize: 12 }}>
                                    {m.arrived_at ? '✓ ' : ''}{m.name}
                                </span>
                            </Tooltip>
                        )}
                    </Marker>
                ))}

                <FitBounds positions={allPositions} />
            </MapContainer>

            {/* "Live" badge — bottom left */}
            <div className="absolute bottom-2.5 left-2.5 z-[500] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-sm pointer-events-none">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--v2-primary)] opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--v2-primary)]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Live</span>
                {enRouteCount > 0 && (
                    <span className="text-[10px] font-black text-white/40">· {enRouteCount} en route</span>
                )}
            </div>

            {/* Close button — top right */}
            <button
                onClick={onClose}
                aria-label="Réduire la carte"
                className="absolute top-2 right-2 z-[500] w-7 h-7 rounded-full flex items-center justify-center bg-black/75 border border-white/15 hover:bg-black/90 active:scale-90 transition-all backdrop-blur-sm"
            >
                <X className="w-3.5 h-3.5 text-white/70" weight="bold" />
            </button>
        </div>
    );
}
