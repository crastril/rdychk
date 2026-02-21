'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    useEffect(() => {
        let isMounted = true;

        if (typeof window !== 'undefined') {
            const hash = window.location.hash;
            const search = window.location.search;

            // Extract potential errors directly from URL parameters (Support both hash and query)
            const searchParams = new URLSearchParams(search);
            const hashParams = new URLSearchParams(hash.substring(1));

            const errCode = searchParams.get('error') || hashParams.get('error');
            const errDesc = searchParams.get('error_description') || hashParams.get('error_description');

            if (errCode) {
                setDebugInfo(`Code: ${errCode} | Desc: ${errDesc}`);
                setError(errDesc || "Une erreur d'authentification est survenue.");
                return;
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth event in callback:", event, !!session);
            if (event === 'SIGNED_IN' && session) {
                if (isMounted) router.push('/');
            }
        });

        // Trigger session fetch immediately
        const checkSession = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                if (data.session && isMounted) {
                    router.push('/');
                }
            } catch (err: any) {
                console.error("Session check failed:", err);
            }
        };

        checkSession();

        // 4 seconds fallback for safety
        const timer = setTimeout(async () => {
            if (!isMounted) return;
            try {
                const { data, error: sessionErr } = await supabase.auth.getSession();
                if (data.session) {
                    router.push('/');
                } else {
                    setError(sessionErr?.message || "La connexion a expiré ou le jeton de sécurité est invalide. Veuillez réessayer.");
                    setDebugInfo("Timeout 4s sans session trouvée.");
                }
            } catch (err: any) {
                if (isMounted) {
                    setError("Le traitement de la connexion a échoué.");
                    setDebugInfo(err.message);
                }
            }
        }, 4000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <div className="flex flex-col items-center space-y-6 text-center max-w-md">
                {!error ? (
                    <>
                        <div className="bg-primary/10 p-4 rounded-full">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Connexion en cours...</h1>
                            <p className="text-muted-foreground">
                                Veuillez patienter pendant que nous sécurisons votre session.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-destructive/10 p-4 rounded-full">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight text-destructive">Échec de la connexion</h1>
                            <p className="text-foreground">{error}</p>
                            {debugInfo && (
                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md mt-2 break-all text-left font-mono">
                                    [Debug] {debugInfo}
                                </p>
                            )}
                        </div>
                        <Button
                            className="w-full mt-4"
                            onClick={() => router.push('/')}
                        >
                            Retourner à l'accueil
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
