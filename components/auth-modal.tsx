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
                                        brandButtonText: 'hsl(var(--primary-foreground))',
                                        defaultButtonBackground: 'hsl(var(--secondary))',
                                        defaultButtonBackgroundHover: 'hsl(var(--secondary) / 0.8)',
                                        defaultButtonBorder: 'hsl(var(--border))',
                                        defaultButtonText: 'hsl(var(--foreground))',
                                        dividerBackground: 'hsl(var(--border))',
                                        inputBackground: 'transparent',
                                        inputBorder: 'hsl(var(--input))',
                                        inputBorderHover: 'hsl(var(--ring))',
                                        inputBorderFocus: 'hsl(var(--ring))',
                                        inputText: 'hsl(var(--foreground))',
                                        inputLabelText: 'hsl(var(--muted-foreground))',
                                        inputPlaceholder: 'hsl(var(--muted-foreground))',
                                        messageText: 'hsl(var(--muted-foreground))',
                                        messageTextDanger: 'hsl(var(--destructive))',
                                        anchorTextColor: 'hsl(var(--primary))',
                                        anchorTextHoverColor: 'hsl(var(--primary) / 0.8)',
                                    },
                                    radii: {
                                        borderRadiusButton: '0.5rem',
                                        buttonBorderRadius: '0.5rem',
                                        inputBorderRadius: '0.5rem',
                                    },
                                },
                            },
                            className: {
                                container: 'w-full',
                                button: 'w-full flex justify-center items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 my-2',
                                input: 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                                label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block',
                                loader: 'animate-spin',
                                anchor: 'underline hover:text-primary transition-colors',
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
                                    loading_button_label: 'Connexion en cours...',
                                    link_text: "Vous n'avez pas de compte ? Inscrivez-vous",
                                },
                                sign_up: {
                                    email_label: 'Adresse email',
                                    password_label: 'Mot de passe',
                                    button_label: "S'inscrire",
                                    loading_button_label: 'Inscription en cours...',
                                    link_text: "Vous avez déjà un compte ? Connectez-vous",
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
            </DialogContent>
        </Dialog>
    );
}
