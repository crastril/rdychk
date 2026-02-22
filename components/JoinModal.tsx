'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, User, ArrowLeft, Loader2 } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuth } from '@/components/auth-provider';
import type { Member } from '@/types/database';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JoinModalProps {
    onJoin: (name: string) => Promise<void>;
    onReclaim?: (memberId: string, name: string) => void;
    groupName?: string;
    existingGuests?: Member[];
}

export default function JoinModal({ onJoin, onReclaim, groupName, existingGuests = [] }: JoinModalProps) {
    const [name, setName] = useState('');
    const { profile, user } = useAuth();
    const [isAutoJoining, setIsAutoJoining] = useState(false);
    const [view, setView] = useState<'create' | 'reclaim'>('create');
    const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profile?.display_name && !isAutoJoining && !user) { // Only auto-fill if not logged in (handled by parent otherwise)
            // Actually, parent handles auto-login for matched users. 
            // If we are here, it means we are either a guest or a new user.
            // Let's just pre-fill if available but NOT auto-submit to give choice?
            // The original logic auto-submitted. Let's keep it for now if it's a known profile.
        }
        if (profile?.display_name && !isAutoJoining) {
            setName(profile.display_name);
            // Auto-join if we have a name from the profile
            const autoJoin = async () => {
                setIsAutoJoining(true); // Keep this for the specific "joining as..." screen
                try {
                    await onJoin(profile.display_name!);
                } catch (error) {
                    console.error("Auto-join failed", error);
                    setIsAutoJoining(false); // Fallback to manual if failed
                }
            };
            autoJoin();
        }
    }, [profile, onJoin, isAutoJoining]); // Be careful with deps here


    if (isAutoJoining) {
        return (
            <Dialog open={true}>
                <DialogContent>
                    <VisuallyHidden>
                        <DialogTitle>Rejoindre le groupe</DialogTitle>
                    </VisuallyHidden>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Rejoindre en tant que {profile?.display_name}...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const handleSubmitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setIsLoading(true);
            try {
                await onJoin(name.trim());
            } catch (error) {
                console.error("Join failed", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleReclaim = () => {
        if (selectedGuestId && onReclaim) {
            const guest = existingGuests.find(g => g.id === selectedGuestId);
            if (guest) {
                onReclaim(guest.id, guest.name);
            }
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 text-white p-6 rounded-3xl">
                {view === 'create' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Rejoindre le groupe {groupName}</DialogTitle>
                            <DialogDescription className="text-base text-slate-400">
                                Entrez votre nom pour rejoindre la session.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-300 font-medium">Votre Nom</Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Entrez votre nom..."
                                        autoFocus
                                        maxLength={20}
                                        required
                                        className="h-11 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-[var(--v2-primary)] rounded-xl"
                                        disabled={isLoading}
                                    />
                                    {user && !name && (
                                        <span className="absolute right-3 top-2.5 text-xs text-slate-500 animate-pulse">
                                            Utilisation du profil...
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={!name.trim() || isLoading}
                                    className="w-full h-12 text-lg font-bold bg-[var(--v2-primary)] hover:bg-[var(--v2-primary)]/80 text-white shadow-neon-primary rounded-xl transition-all duration-300 hover:scale-[1.02]"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Connexion...
                                        </>
                                    ) : (
                                        <>
                                            Rejoindre
                                            <Sparkles className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>

                                {existingGuests.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-11 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white"
                                        onClick={() => setView('reclaim')}
                                        disabled={isLoading}
                                    >
                                        Je fais déjà partie de ce groupe
                                    </Button>
                                )}
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="-ml-2 h-8 w-8 text-slate-400 hover:text-white"
                                    onClick={() => setView('create')}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <DialogTitle className="text-xl font-bold">Qui êtes-vous ?</DialogTitle>
                            </div>
                            <DialogDescription className="text-slate-400 pt-2 border-t border-white/10">
                                Sélectionnez votre profil existant dans la liste.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <ScrollArea className="h-[200px] rounded-xl border border-white/10 bg-black/20 p-4">
                                <RadioGroup value={selectedGuestId || ""} onValueChange={setSelectedGuestId}>
                                    {existingGuests.map((guest) => (
                                        <div key={guest.id} className="flex items-center space-x-2 py-3 border-b border-white/5 last:border-0">
                                            <RadioGroupItem value={guest.id} id={guest.id} className="border-slate-500 text-[var(--v2-primary)] data-[state=checked]:border-[var(--v2-primary)]" />
                                            <Label htmlFor={guest.id} className="flex items-center gap-2 cursor-pointer w-full text-slate-300">
                                                <User className="w-4 h-4 text-[var(--v2-accent)]" />
                                                <span className="font-medium text-white">{guest.name}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </ScrollArea>

                            <Button
                                type="button"
                                disabled={!selectedGuestId}
                                onClick={handleReclaim}
                                className="w-full h-12 text-lg font-bold bg-[var(--v2-primary)] hover:bg-[var(--v2-primary)]/80 text-white rounded-xl shadow-neon-primary transition-all"
                            >
                                Valider et Rejoindre
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog >
    );
}
