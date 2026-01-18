'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReadyButtonProps {
    memberId: string;
    isReady: boolean;
}

export default function ReadyButton({ memberId, isReady }: ReadyButtonProps) {
    const [loading, setLoading] = useState(false);

    const toggleReady = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('members')
                .update({ is_ready: !isReady, updated_at: new Date().toISOString() })
                .eq('id', memberId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleReady}
            disabled={loading}
            className={`
        relative w-full px-8 py-8 text-2xl font-extrabold rounded-3xl
        transition-all duration-300 transform
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-2xl
        ${isReady
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600'
                    : 'bg-white/20 text-white border-2 border-white/40 backdrop-blur-sm hover:bg-white/30'
                }
        ${isReady ? 'animate-bounce-in' : ''}
      `}
            style={{
                boxShadow: isReady
                    ? '0 0 30px rgba(16, 185, 129, 0.5), 0 10px 25px rgba(0, 0, 0, 0.2)'
                    : '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div className="flex flex-col items-center gap-2">
                <span className="text-5xl">{isReady ? '✅' : '⏳'}</span>
                <span className="text-xl font-bold tracking-wide">
                    {loading ? 'Mise à jour...' : isReady ? 'Je suis prêt !' : 'Pas encore prêt'}
                </span>
            </div>
        </button>
    );
}
