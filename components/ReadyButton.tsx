'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Icons } from './Icons';

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
            aria-label={isReady ? "Marquer comme pas prêt" : "Marquer comme prêt"}
            aria-pressed={isReady}
            className={`
        relative w-full px-8 py-8 text-2xl font-extrabold rounded-3xl
        transition-all duration-300 transform
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-2xl
        ${isReady
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                    : 'bg-slate-700 text-slate-100 border-2 border-slate-600 hover:bg-slate-600'
                }
        ${isReady ? 'animate-bounce-in' : ''}
      `}
            style={{
                boxShadow: isReady
                    ? '0 0 30px rgba(16, 185, 129, 0.5), 0 10px 25px rgba(0, 0, 0, 0.3)'
                    : '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
        >
            <div className="flex flex-col items-center gap-3">
                {loading ? (
                    <Icons.Loader className="w-12 h-12" />
                ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isReady ? 'bg-white/20' : 'bg-slate-800/50'}`}>
                        {isReady ? (
                            <Icons.Check className="w-10 h-10" />
                        ) : (
                            <Icons.Clock className="w-10 h-10" />
                        )}
                    </div>
                )}
                <span className="text-xl font-bold tracking-wide">
                    {loading ? 'Mise à jour...' : isReady ? 'Je suis prêt !' : 'Pas encore prêt'}
                </span>
            </div>
        </button>
    );
}
