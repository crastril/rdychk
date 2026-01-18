'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Check, Clock, Loader2 } from 'lucide-react';

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
        <Button
            onClick={toggleReady}
            disabled={loading}
            variant={isReady ? "default" : "outline"}
            size="lg"
            className={`w-full h-24 text-lg font-semibold ${isReady ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                }`}
            aria-label={isReady ? "Marquer comme pas prêt" : "Marquer comme prêt"}
            aria-pressed={isReady}
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                </>
            ) : isReady ? (
                <>
                    <Check className="w-5 h-5 mr-2" />
                    I'm Ready
                </>
            ) : (
                <>
                    <Clock className="w-5 h-5 mr-2" />
                    Not Ready Yet
                </>
            )}
        </Button>
    );
}
