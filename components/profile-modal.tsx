"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Sparkles, Loader2 } from "lucide-react";

interface ProfileModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Pre-fill name from profile
    useEffect(() => {
        if (open) {
            if (profile?.display_name) {
                setName(profile.display_name);
            }
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
                    avatar_url: profile?.avatar_url,
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {profile?.is_inferred ? "Bienvenue !" : "Modifier mon profil"}
                    </DialogTitle>
                    <DialogDescription>
                        {profile?.is_inferred
                            ? "Pour commencer, choisissez le nom que vous utiliserez dans les groupes."
                            : "Mettez à jour votre nom d'affichage."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="display-name">Votre Prénom</Label>
                        <Input
                            id="display-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Thomas"
                            autoFocus
                            minLength={2}
                            maxLength={30}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium animate-pulse">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="bg-primary text-primary-foreground"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    {profile?.is_inferred ? "C'est parti !" : "Enregistrer"}
                                    {!isLoading && <Sparkles className="ml-2 h-4 w-4" />}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
