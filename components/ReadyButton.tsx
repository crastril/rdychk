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
            className={`w-full max-w-md px-12 py-16 text-3xl font-bold rounded-3xl transition-all transform active:scale-95 disabled:opacity-50 ${isReady
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/50'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700 shadow-lg'
                }`}
        >
            {isReady ? '✅ Je suis prêt !' : '⏳ Pas encore prêt'}
        </button>
    );
}
