"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Sparkles, Loader2 } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";

interface ProfileModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill name from profile
    useEffect(() => {
        if (open) {
            if (profile?.display_name) {
                setName(profile.display_name);
            }
            setAvatarUrl(profile?.avatar_url || null);
            setError(null);
        }
    }, [open, profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    display_name: name.trim(),
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                });

            if (upsertError) throw upsertError;

            await refreshProfile();
            onOpenChange?.(false);
        } catch (err: unknown) {
            console.error('Error updating profile:', err);
            const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {profile?.is_inferred ? "Bienvenue !" : "Modifier mon profil"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {profile?.is_inferred
                                ? "Pour commencer, choisissez le nom que vous utiliserez dans les groupes."
                                : "Mettez à jour votre nom d'affichage."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        {user && (
                            <AvatarUpload
                                uid={user.id}
                                url={avatarUrl}
                                onUpload={(url) => setAvatarUrl(url)}
                            />
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="display-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Votre Prénom</Label>
                            <Input
                                id="display-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Thomas"
                                autoFocus
                                minLength={2}
                                maxLength={30}
                                className="h-12 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-[var(--v2-primary)] rounded-xl px-4"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-xs text-red-500 font-medium text-center">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={!name.trim() || isLoading}
                                className="w-full h-12 text-lg font-bold bg-[var(--v2-primary)] hover:bg-[var(--v2-primary)]/80 text-white shadow-neon-primary rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        {profile?.is_inferred ? "C'est parti !" : "Enregistrer"}
                                        {!isLoading && <Sparkles className="ml-2 h-5 w-5" />}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
