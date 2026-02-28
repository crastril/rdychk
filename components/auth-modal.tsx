"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/auth-provider';
import { useEffect, useState } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AuthModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AuthModal({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: AuthModalProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);
    const [origin, setOrigin] = useState('');

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        if (user && open) {
            setOpen?.(false);
        }
    }, [user, open, setOpen]);

    if (!origin) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[400px] glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-black text-center tracking-tight">Connexion</DialogTitle>
                        <VisuallyHidden>
                            <DialogDescription>
                                Connectez-vous à votre compte rdychk
                            </DialogDescription>
                        </VisuallyHidden>
                    </DialogHeader>
                    <div className="mt-2">
                        <Auth
                            supabaseClient={supabase}
                            appearance={{
                                theme: ThemeSupa,
                                variables: {
                                    default: {
                                        colors: {
                                            brand: 'var(--v2-primary)',
                                            brandAccent: 'var(--v2-accent)',
                                            brandButtonText: 'white',
                                            defaultButtonBackground: 'rgba(255, 255, 255, 0.05)',
                                            defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.1)',
                                            defaultButtonBorder: 'rgba(255, 255, 255, 0.1)',
                                            defaultButtonText: 'white',
                                            dividerBackground: 'rgba(255, 255, 255, 0.1)',
                                            inputBackground: 'rgba(0, 0, 0, 0.2)',
                                            inputBorder: 'rgba(255, 255, 255, 0.1)',
                                            inputBorderHover: 'var(--v2-primary)',
                                            inputBorderFocus: 'var(--v2-primary)',
                                            inputText: 'white',
                                            inputLabelText: '#94a3b8',
                                            inputPlaceholder: '#475569',
                                            messageText: '#94a3b8',
                                            messageTextDanger: '#ef4444',
                                            anchorTextColor: 'var(--v2-primary)',
                                            anchorTextHoverColor: 'var(--v2-accent)',
                                        },
                                        radii: {
                                            borderRadiusButton: '0.75rem',
                                            buttonBorderRadius: '0.75rem',
                                            inputBorderRadius: '0.75rem',
                                        },
                                    },
                                },
                                className: {
                                    container: 'w-full space-y-4',
                                    button: 'btn-massive w-full flex justify-center items-center rounded-xl text-md font-bold h-12 px-4 py-2 text-white',
                                    input: 'input-rdychk',
                                    label: 'text-sm font-semibold text-slate-400 mb-1.5 block ml-1',
                                    loader: 'animate-spin text-white',
                                    anchor: 'text-sm font-medium transition-colors hover:text-white',
                                    divider: 'bg-white/10',
                                    message: 'text-xs font-medium text-center py-2',
                                },
                            }}
                            theme="dark"
                            providers={['google']}
                            redirectTo={`${origin}/auth/callback`}
                            localization={{
                                variables: {
                                    sign_in: {
                                        email_label: 'Adresse email',
                                        password_label: 'Mot de passe',
                                        button_label: 'Se connecter',
                                        loading_button_label: 'Connexion en cours...',
                                        link_text: "Pas encore de compte ? S'inscrire",
                                    },
                                    sign_up: {
                                        email_label: 'Adresse email',
                                        password_label: 'Mot de passe',
                                        button_label: "S'inscrire",
                                        loading_button_label: 'Inscription en cours...',
                                        link_text: "Déjà un compte ? Se connecter",
                                    },
                                    forgotten_password: {
                                        link_text: 'Mot de passe oublié ?',
                                        button_label: 'Envoyer les instructions',
                                        loading_button_label: 'Envoi en cours...',
                                        email_label: 'Adresse email',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
