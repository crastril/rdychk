import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export const alt = 'rdychk | Chaos organisé';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
    const { slug } = params;

    // Retrieve group name
    const { data: group } = await supabase
        .from('groups')
        .select('name, type')
        .eq('slug', slug)
        .single();

    const title = group?.name || 'Groupe Privé';
    const isOnline = group?.type === 'remote';

    return new ImageResponse(
        (
            <div
                style={{
                    background: isOnline ? '#0a030f' : '#2e0808',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Glow effect */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '20%',
                        width: '600px',
                        height: '600px',
                        background: isOnline ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 46, 46, 0.2)',
                        borderRadius: '50%',
                        filter: 'blur(120px)',
                    }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    <div
                        style={{
                            fontSize: 100,
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            marginBottom: 20,
                            textAlign: 'center',
                            color: 'white',
                            textShadow: isOnline ? '0 0 20px rgba(168,85,247,0.8)' : '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            fontSize: 36,
                            color: isOnline ? '#d8b4fe' : '#fca5a5',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}
                    >
                        rdychk | Chaos organisé
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
