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
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Connexion</DialogTitle>
                    <VisuallyHidden>
                        <DialogDescription>
                            Connectez-vous à votre compte rdychk
                        </DialogDescription>
                    </VisuallyHidden>
                </DialogHeader>
                <div className="mt-4">
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: 'hsl(var(--primary))',
                                        brandAccent: 'hsl(var(--primary) / 0.9)',
                                    },
                                },
                            },
                        }}
                        theme={theme === 'dark' ? 'dark' : 'default'}
                        providers={[]}
                        redirectTo={`${origin}/`}
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: 'Adresse email',
                                    password_label: 'Mot de passe',
                                    button_label: 'Se connecter',
                                },
                                sign_up: {
                                    email_label: 'Adresse email',
                                    password_label: 'Mot de passe',
                                    button_label: "S'inscrire",
                                },
                            },
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
