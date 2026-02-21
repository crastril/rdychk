'use client';

import { useState, useEffect, useRef } from 'react';
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
    const hasAttemptedAutoJoin = useRef(false);

    useEffect(() => {
        if (profile?.display_name && !isAutoJoining && !hasAttemptedAutoJoin.current) {
            hasAttemptedAutoJoin.current = true;
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
            <DialogContent className="sm:max-w-[425px]">
                {view === 'create' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Rejoindre le groupe {groupName}</DialogTitle>
                            <DialogDescription className="text-base">
                                Entrez votre nom pour rejoindre la session.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-muted-foreground font-medium">Votre Nom</Label>
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
                                        className="h-11"
                                        disabled={isLoading}
                                    />
                                    {user && !name && (
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground animate-pulse">
                                            Utilisation du profil...
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={!name.trim() || isLoading}
                                    className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
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
                                        className="w-full"
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
                                    className="-ml-2 h-8 w-8"
                                    onClick={() => setView('create')}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <DialogTitle className="text-xl">Qui êtes-vous ?</DialogTitle>
                            </div>
                            <DialogDescription>
                                Sélectionnez votre profil existant dans la liste.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <ScrollArea className="h-[200px] rounded-md border p-4">
                                <RadioGroup value={selectedGuestId || ""} onValueChange={setSelectedGuestId}>
                                    {existingGuests.map((guest) => (
                                        <div key={guest.id} className="flex items-center space-x-2 py-2">
                                            <RadioGroupItem value={guest.id} id={guest.id} />
                                            <Label htmlFor={guest.id} className="flex items-center gap-2 cursor-pointer w-full">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{guest.name}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </ScrollArea>

                            <Button
                                type="button"
                                disabled={!selectedGuestId}
                                onClick={handleReclaim}
                                className="w-full h-12 text-lg font-semibold"
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
