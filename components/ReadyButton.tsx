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
            className={`
                w-full h-24 text-xl font-bold tracking-wide transition-all duration-500
                ${isReady
                    ? 'bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] scale-[1.02] border-primary'
                    : 'bg-background hover:bg-accent hover:text-accent-foreground border-2'
                }
            `}
            aria-label={isReady ? "Mark as not ready" : "Mark as ready"}
            aria-pressed={isReady}
        >
            {loading ? (
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Updating...</span>
                </div>
            ) : isReady ? (
                <div className="flex items-center gap-3 animate-slide-up">
                    <div className="p-1 rounded-full bg-primary-foreground/20">
                        <Check className="w-6 h-6" />
                    </div>
                    READY
                </div>
            ) : (
                <div className="flex items-center gap-3 text-muted-foreground group">
                    <Clock className="w-6 h-6 group-hover:text-foreground transition-colors" />
                    <span>NOT READY</span>
                </div>
            )}
        </Button>
    );
}
