"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AuthModal({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: AuthModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [origin, setOrigin] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    useEffect(() => { setOrigin(window.location.origin); }, []);

    useEffect(() => {
        if (user && open) setOpen(false);
    }, [user, open, setOpen]);

    // Reset form on close
    useEffect(() => {
        if (!open) {
            setEmail('');
            setPassword('');
            setError('');
            setIsSignUp(false);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Demo mode
        if (email.trim().toLowerCase() === 'admin' && password === 'admin') {
            try {
                const res = await fetch('/api/demo', { method: 'POST' });
                const data = await res.json();
                if (data.slug && data.memberId) {
                    localStorage.setItem(`member_${data.slug}`, data.memberId);
                    localStorage.setItem(`member_name_${data.slug}`, 'Toi (Admin)');
                    setOpen(false);
                    router.push(`/group/${data.slug}`);
                    return;
                }
                setError('Impossible de démarrer le mode démo');
            } catch {
                setError('Impossible de démarrer le mode démo');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Real Supabase auth
        if (isSignUp) {
            const { error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) setError(authError.message);
        } else {
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) setError('Email ou mot de passe incorrect');
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        if (!origin) return;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${origin}/auth/callback` },
        });
    };

    if (!origin) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[400px] glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]" />
                <div className="p-6">
                    <DialogHeader className="mb-5">
                        <DialogTitle className="text-2xl font-black text-center tracking-tight">
                            {isSignUp ? "Créer un compte" : "Connexion"}
                        </DialogTitle>
                        <VisuallyHidden>
                            <DialogDescription>Connectez-vous à votre compte rdychk</DialogDescription>
                        </VisuallyHidden>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="text-sm font-semibold text-slate-400 mb-1.5 block ml-1">
                                Adresse email
                            </label>
                            <input
                                type="text"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="email@exemple.com"
                                autoComplete="email"
                                required
                                className="input-rdychk w-full"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-400 mb-1.5 block ml-1">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                required
                                className="input-rdychk w-full"
                            />
                        </div>

                        {error && (
                            <p className="text-xs font-medium text-center text-red-400 py-1">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-massive w-full flex justify-center items-center rounded-xl text-md font-bold h-12 px-4 py-2 text-white disabled:opacity-60"
                        >
                            {loading
                                ? <CircleNotch className="w-5 h-5 animate-spin" />
                                : isSignUp ? "S'inscrire" : "Se connecter"
                            }
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-slate-500 font-medium">ou</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogle}
                        className="btn-massive w-full flex justify-center items-center gap-3 rounded-xl text-md font-bold h-12 px-4 py-2 text-white"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Se connecter avec Google
                    </button>

                    <p className="text-center text-sm text-slate-500 mt-4">
                        {isSignUp ? "Déjà un compte ? " : "Pas encore de compte ? "}
                        <button
                            type="button"
                            onClick={() => { setIsSignUp(v => !v); setError(''); }}
                            className="text-[var(--v2-primary)] font-medium hover:text-white transition-colors"
                        >
                            {isSignUp ? "Se connecter" : "S'inscrire"}
                        </button>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
