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
            <div className="fixed inset-0 z-[100] bg-[#050505] text-slate-100 flex flex-col items-center overflow-y-auto">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--v2-primary)] opacity-10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--v2-accent)] opacity-10 rounded-full blur-[100px]"></div>
                </div>

                <nav className="w-full border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tighter text-white">
                                rdychk<span className="text-[var(--v2-primary)]">.</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-10 h-10 rounded-md skeleton" />
                        </div>
                    </div>
                </nav>

                <div className="w-full max-w-xl mx-auto flex flex-col gap-6 relative z-10 p-4 mt-2">
                    <div className="flex items-center justify-between -mb-2">
                        <div className="flex-1 w-full">
                            <div className="h-8 w-[200px] sm:w-[250px] rounded-lg skeleton mb-2" />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full skeleton"></span>
                                <div className="h-3 w-20 rounded-lg skeleton" />
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl skeleton" />
                    </div>

                    <div className="flex justify-center mb-2">
                        <div className="relative w-48 h-48 flex items-center justify-center -my-2 overflow-visible">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                                <circle className="text-white/5 stroke-current" cx="50" cy="50" r={45} fill="none" strokeWidth="8" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="h-10 w-24 skeleton rounded-lg mb-2" />
                                <div className="h-3 w-12 skeleton rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="h-16 w-full rounded-xl skeleton" />
                    </div>

                    <div className="flex flex-col items-end w-full mt-2">
                        <div className="w-full space-y-3 relative mb-8">
                            <h2 className="h-4 w-24 rounded skeleton mb-4" />
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass-panel p-3 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl skeleton shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="h-5 w-32 rounded skeleton mb-2" />
                                        <div className="h-3 w-20 rounded skeleton" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
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
            <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>

                {view === 'create' ? (
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tight leading-tight">
                                Rejoindre le groupe <span className="text-theme-gradient">{groupName}</span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-base mt-2">
                                Entrez votre nom pour rejoindre la session.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Votre Nom</Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Comment tu t'appelles ?"
                                        autoFocus
                                        maxLength={20}
                                        required
                                        className="h-12 input-rdychk !pl-10 !py-2"
                                        disabled={isLoading}
                                    />
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    {user && !name && (
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-tighter text-[var(--v2-primary)] animate-pulse">
                                            Profil détecté
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    type="submit"
                                    disabled={!name.trim() || isLoading}
                                    className="w-full h-14 btn-massive text-lg font-black text-white rounded-xl border-0"
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
                                    <button
                                        type="button"
                                        className="w-full text-center text-sm font-medium text-slate-400 hover:text-white transition-colors py-2"
                                        onClick={() => setView('reclaim')}
                                        disabled={isLoading}
                                    >
                                        Je fais déjà partie de ce groupe
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-3">
                                <button
                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
                                    onClick={() => setView('create')}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <DialogTitle className="text-xl font-black tracking-tight">Qui êtes-vous ?</DialogTitle>
                            </div>
                            <DialogDescription className="text-slate-400 mt-2">
                                Sélectionnez votre profil existant dans la liste.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <ScrollArea className="h-[240px] rounded-2xl border border-white/10 bg-black/20 p-2">
                                <RadioGroup value={selectedGuestId || ""} onValueChange={setSelectedGuestId} className="gap-1">
                                    {existingGuests.map((guest) => (
                                        <div key={guest.id} className="relative group">
                                            <RadioGroupItem
                                                value={guest.id}
                                                id={guest.id}
                                                className="sr-only"
                                            />
                                            <Label
                                                htmlFor={guest.id}
                                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border border-transparent ${selectedGuestId === guest.id
                                                    ? "bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/30 text-white"
                                                    : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ring-1 transition-all ${selectedGuestId === guest.id
                                                    ? "bg-[var(--v2-primary)]/20 ring-[var(--v2-primary)]/50"
                                                    : "bg-white/5 ring-white/10"
                                                    }`}>
                                                    <User className={`w-5 h-5 ${selectedGuestId === guest.id ? "text-white" : "text-slate-500"
                                                        }`} />
                                                </div>
                                                <span className="font-bold text-base flex-1">{guest.name}</span>
                                                {selectedGuestId === guest.id && (
                                                    <div className="w-2 h-2 rounded-full bg-[var(--v2-primary)] shadow-[0_0_10px_var(--v2-primary)]" />
                                                )}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </ScrollArea>

                            <Button
                                type="button"
                                disabled={!selectedGuestId}
                                onClick={handleReclaim}
                                className="w-full h-12 text-lg font-bold bg-[var(--v2-primary)] hover:bg-[var(--v2-primary)]/80 text-white rounded-xl shadow-neon-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Valider et Rejoindre
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog >
    );
}
