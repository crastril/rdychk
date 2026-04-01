import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';
export const alt = 'rdychk';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generates static wave paths that mirror the homepage LiquidWaves background
function buildWaves(W: number, H: number): { d: string; thick: number }[] {
    const waves: { d: string; thick: number }[] = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
        const baseY = (i / count) * (H + 500) - 200;
        const thick = 13 + Math.sin(i * 0.45) * 7;
        const dy = i * 0.18;
        const w = (2 * Math.PI) / W;
        let d = '';
        for (let x = 0; x <= W; x += 22) {
            const y =
                baseY +
                Math.sin(x * w + dy * 1.5) * 95 +
                Math.sin(x * w * 2 - dy * 0.8) * 38 +
                Math.sin(x * w * 3 + dy * 2.1) * 18;
            d += x === 0 ? `M${x},${y.toFixed(1)}` : ` L${x},${y.toFixed(1)}`;
        }
        waves.push({ d, thick });
    }
    return waves;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { data: group } = await supabase
        .from('groups')
        .select('name, type')
        .eq('slug', slug)
        .single();

    const title = group?.name ?? 'Groupe Privé';
    const isOnline = group?.type === 'remote';

    const accent = isOnline ? '#a855f7' : '#ff2e2e';
    const bgGradient = isOnline
        ? 'radial-gradient(ellipse at 65% 35%, #1e0840 0%, #0a030f 70%)'
        : 'radial-gradient(ellipse at 65% 35%, #2e0808 0%, #0a0101 70%)';
    const glowColor = isOnline ? 'rgba(168,85,247,0.28)' : 'rgba(255,46,46,0.28)';
    const glowColor2 = isOnline ? 'rgba(168,85,247,0.12)' : 'rgba(255,46,46,0.12)';

    const waves = buildWaves(1200, 630);

    // Load Geist Black — the site's typeface
    let fontData: ArrayBuffer | null = null;
    try {
        fontData = await fetch(
            'https://fonts.bunny.net/geist/files/geist-latin-900-normal.woff2'
        ).then((r) => r.arrayBuffer());
    } catch {
        // fallback to system sans-serif
    }

    const fonts = fontData
        ? [{ name: 'Geist', data: fontData, weight: 900 as const, style: 'normal' as const }]
        : [];

    const fontSize = title.length > 22 ? 64 : title.length > 14 ? 76 : 92;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: bgGradient,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'Geist, sans-serif',
                }}
            >
                {/* ── Wave texture (matches homepage LiquidWaves) ── */}
                <svg
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0.09,
                        mixBlendMode: 'overlay',
                    }}
                    viewBox="0 0 1200 630"
                    preserveAspectRatio="xMidYMid slice"
                >
                    {waves.map((w, i) => (
                        <path
                            key={i}
                            d={w.d}
                            stroke="#000"
                            strokeWidth={w.thick}
                            strokeLinecap="round"
                            fill="none"
                        />
                    ))}
                </svg>

                {/* ── Glow blobs ── */}
                <div
                    style={{
                        position: 'absolute',
                        top: -180,
                        right: -120,
                        width: 750,
                        height: 750,
                        background: glowColor,
                        borderRadius: '50%',
                        filter: 'blur(140px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -100,
                        left: -80,
                        width: 450,
                        height: 450,
                        background: glowColor2,
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                    }}
                />

                {/* ── Logo — top left ── */}
                <div
                    style={{
                        position: 'absolute',
                        top: 52,
                        left: 60,
                        display: 'flex',
                        alignItems: 'baseline',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                    }}
                >
                    <span style={{ fontSize: 52, color: '#ffffff' }}>rdychk</span>
                    <span
                        style={{
                            fontSize: 52,
                            color: accent,
                            textShadow: `0 0 24px ${accent}88`,
                        }}
                    >
                        .
                    </span>
                </div>

                {/* ── Neo-brutalist content card ── */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 48,
                        left: 56,
                        right: 56,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        border: '3px solid rgba(255,255,255,0.9)',
                        boxShadow: `7px 7px 0px ${accent}`,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(2px)',
                        padding: '26px 40px 30px',
                    }}
                >
                    {/* Group name */}
                    <div
                        style={{
                            fontWeight: 900,
                            fontSize,
                            color: '#ffffff',
                            letterSpacing: '-0.035em',
                            lineHeight: 1.0,
                            marginBottom: 18,
                        }}
                    >
                        {title}
                    </div>

                    {/* Neo-brutalist divider */}
                    <div
                        style={{
                            width: '100%',
                            height: 3,
                            background: accent,
                            marginBottom: 16,
                            boxShadow: `0 0 12px ${accent}66`,
                        }}
                    />

                    {/* Subtitle */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 900,
                                fontSize: 22,
                                color: accent,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                            }}
                        >
                            HÉ, ON T'ATTEND
                        </span>
                        <span
                            style={{
                                fontSize: 20,
                                color: 'rgba(255,255,255,0.3)',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}
                        >
                            · RDYCHK
                        </span>
                    </div>
                </div>
            </div>
        ),
        { ...size, fonts }
    );
}
