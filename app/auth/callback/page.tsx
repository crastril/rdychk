'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // The Supabase client initialized in @/lib/supabase will automatically
        // detect the ?code= or #access_token= in the URL and process it.
        // We just need to wait for onAuthStateChange to fire SIGNED_IN.

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || session) {
                // Successfully processed the auth redirect
                router.push('/');
            } else if (event === 'USER_UPDATED') {
                router.push('/');
            }
        });

        // Fallback timeout: if after 3 seconds we still haven't redirected,
        // it either failed or there was no session.
        const timer = setTimeout(async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                router.push('/');
            } else {
                setError("La connexion a pris trop de temps ou a échoué. Veuillez réessayer.");
            }
        }, 3000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <div className="flex flex-col items-center space-y-4 text-center">
                {!error ? (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <h1 className="text-2xl font-bold">Connexion en cours...</h1>
                        <p className="text-muted-foreground">
                            Veuillez patienter pendant que nous finalisons votre inscription.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-destructive">Erreur</h1>
                        <p className="text-muted-foreground">{error}</p>
                        <button
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                            onClick={() => router.push('/')}
                        >
                            Retourner à l'accueil
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
