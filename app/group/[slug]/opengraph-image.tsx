import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export const alt = 'rdychk';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { data: group } = await supabase
        .from('groups')
        .select('name, type')
        .eq('slug', slug)
        .single();

    const title = group?.name || 'Groupe Privé';
    const isOnline = group?.type === 'remote';

    const bg = isOnline ? '#07020e' : '#0a0101';
    const glowColor = isOnline ? 'rgba(168,85,247,0.35)' : 'rgba(255,46,46,0.35)';
    const accent = isOnline ? '#a855f7' : '#ff2e2e';
    const dotShadow = isOnline ? '0 0 18px #a855f7' : '0 0 18px #ff2e2e';

    return new ImageResponse(
        (
            <div
                style={{
                    background: bg,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '72px 80px',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background glow */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '700px',
                        height: '700px',
                        background: glowColor,
                        borderRadius: '50%',
                        filter: 'blur(140px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-80px',
                        left: '-80px',
                        width: '400px',
                        height: '400px',
                        background: glowColor,
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                        opacity: 0.5,
                    }}
                />

                {/* Logo — top left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, zIndex: 10 }}>
                    <span
                        style={{
                            fontSize: 52,
                            fontWeight: 900,
                            color: 'white',
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                        }}
                    >
                        rdychk
                    </span>
                    <span
                        style={{
                            fontSize: 52,
                            fontWeight: 900,
                            color: accent,
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                            textShadow: dotShadow,
                        }}
                    >
                        .
                    </span>
                </div>

                {/* Group name — center bottom */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        zIndex: 10,
                        maxWidth: '900px',
                    }}
                >
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: accent,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            opacity: 0.9,
                        }}
                    >
                        {isOnline ? 'EN LIGNE' : 'EN PERSONNE'}
                    </div>
                    <div
                        style={{
                            fontSize: title.length > 20 ? 72 : 88,
                            fontWeight: 900,
                            color: 'white',
                            letterSpacing: '-0.03em',
                            lineHeight: 1.05,
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            color: 'rgba(255,255,255,0.45)',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                        }}
                    >
                        Rejoins le groupe et indique quand tu es prêt →
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
