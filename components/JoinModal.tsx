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
import { Sparkle, User, ArrowLeft, CircleNotch } from '@phosphor-icons/react';
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
    isRemote?: boolean;
}

export default function JoinModal({ onJoin, onReclaim, groupName, existingGuests = [], isRemote }: JoinModalProps) {
    const [name, setName] = useState('');
    const { profile, user } = useAuth();
    const [isAutoJoining, setIsAutoJoining] = useState(false);
    const [view, setView] = useState<'create' | 'reclaim'>('create');
    const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profile?.display_name && !isAutoJoining) {
            setName(profile.display_name);
            const autoJoin = async () => {
                setIsAutoJoining(true);
                try {
                    await onJoin(profile.display_name!);
                } catch (error) {
                    console.error("Auto-join failed", error);
                    setIsAutoJoining(false);
                }
            };
            autoJoin();
        }
    }, [profile, onJoin, isAutoJoining]);

    if (isAutoJoining) return null;

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
            if (guest) onReclaim(guest.id, guest.name);
        }
    };

    // ── REMOTE / CYBERPUNK VARIANT ──
    if (isRemote) {
        return (
            <Dialog open={true}>
                <DialogContent
                    className="p-0 overflow-hidden"
                    style={{
                        background: 'rgba(8,0,20,0.99)',
                        border: '1px solid rgba(168,85,247,0.35)',
                        borderRadius: '4px',
                        boxShadow: '0 0 60px rgba(168,85,247,0.2), 0 0 120px rgba(168,85,247,0.06)',
                        maxWidth: '420px',
                        width: 'calc(100% - 2rem)',
                    }}
                >
                    {/* Top neon bar */}
                    <div className="w-full h-[2px]" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />

                    {view === 'create' ? (
                        <div className="p-6 flex flex-col gap-5">
                            <DialogHeader>
                                <DialogTitle className="font-mono text-[0.85rem] uppercase tracking-[0.2em]" style={{ color: '#c4b5fd' }}>
                                    {'> JOIN_SESSION'}
                                </DialogTitle>
                                <DialogDescription className="font-mono text-[11px]" style={{ color: '#8b5cf6' }}>
                                    {`// connexion au groupe "${groupName}"`}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmitCreate} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#a78bfa' }}>
                                        PLAYER_NAME
                                    </label>
                                    <div className="relative">
                                        <div
                                            className="flex items-center gap-2 px-3 py-2.5"
                                            style={{
                                                background: 'rgba(168,85,247,0.04)',
                                                border: '1px solid rgba(168,85,247,0.25)',
                                                borderRadius: '3px',
                                            }}
                                        >
                                            <User className="w-4 h-4 shrink-0" style={{ color: '#8b5cf6' }} />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="ENTER_NAME..."
                                                autoFocus
                                                maxLength={20}
                                                required
                                                disabled={isLoading}
                                                className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:opacity-40"
                                                style={{ color: '#c4b5fd', caretColor: '#a855f7' }}
                                            />
                                            {user && !name && (
                                                <span className="font-mono text-[9px] uppercase tracking-wider animate-pulse shrink-0" style={{ color: '#a855f7' }}>
                                                    PROFILE_DETECTED
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        type="submit"
                                        disabled={!name.trim() || isLoading}
                                        className="w-full h-12 font-mono text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                        style={{
                                            background: name.trim() && !isLoading ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.05)',
                                            border: `1px solid ${name.trim() && !isLoading ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.15)'}`,
                                            borderRadius: '3px',
                                            color: name.trim() && !isLoading ? '#c4b5fd' : '#8b5cf6',
                                            boxShadow: name.trim() && !isLoading ? '0 0 16px rgba(168,85,247,0.12)' : 'none',
                                            cursor: !name.trim() || isLoading ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {isLoading
                                            ? <><CircleNotch className="w-4 h-4 animate-spin" /> CONNECTING...</>
                                            : <>{'[ CONNECT_TO_SESSION ]'}</>
                                        }
                                    </button>

                                    {existingGuests.length > 0 && (
                                        <button
                                            type="button"
                                            className="w-full text-center font-mono text-[10px] uppercase tracking-[0.15em] py-2 transition-colors"
                                            style={{ color: '#8b5cf6' }}
                                            onClick={() => setView('reclaim')}
                                            disabled={isLoading}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                                            onMouseLeave={e => (e.currentTarget.style.color = '#8b5cf6')}
                                        >
                                            {'// déjà dans ce groupe →'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="p-6 flex flex-col gap-5">
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center transition-colors"
                                        style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '2px', color: '#8b5cf6', background: 'transparent' }}
                                        onClick={() => setView('create')}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)')}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)')}
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <DialogTitle className="font-mono text-[0.85rem] uppercase tracking-[0.2em]" style={{ color: '#c4b5fd' }}>
                                        {'> SELECT_PROFILE'}
                                    </DialogTitle>
                                </div>
                                <DialogDescription className="font-mono text-[11px] mt-1" style={{ color: '#8b5cf6' }}>
                                    {'// sélectionne ton profil existant'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col gap-4">
                                <div
                                    className="h-[200px] overflow-y-auto p-1.5 space-y-1"
                                    style={{
                                        border: '1px solid rgba(168,85,247,0.15)',
                                        borderRadius: '3px',
                                        background: 'rgba(168,85,247,0.02)',
                                    }}
                                >
                                    <RadioGroup value={selectedGuestId || ''} onValueChange={setSelectedGuestId} className="gap-1">
                                        {existingGuests.map((guest) => (
                                            <div key={guest.id} className="relative">
                                                <RadioGroupItem value={guest.id} id={guest.id} className="sr-only" />
                                                <Label
                                                    htmlFor={guest.id}
                                                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all"
                                                    style={{
                                                        borderRadius: '2px',
                                                        border: `1px solid ${selectedGuestId === guest.id ? 'rgba(168,85,247,0.4)' : 'transparent'}`,
                                                        background: selectedGuestId === guest.id ? 'rgba(168,85,247,0.08)' : 'transparent',
                                                    }}
                                                >
                                                    <div
                                                        className="w-8 h-8 flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                                                        style={{
                                                            borderRadius: '2px',
                                                            border: `1px solid ${selectedGuestId === guest.id ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.15)'}`,
                                                            background: selectedGuestId === guest.id ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.04)',
                                                            color: selectedGuestId === guest.id ? '#c4b5fd' : '#8b5cf6',
                                                        }}
                                                    >
                                                        {guest.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span
                                                        className="font-mono text-sm flex-1"
                                                        style={{ color: selectedGuestId === guest.id ? '#c4b5fd' : '#a78bfa' }}
                                                    >
                                                        {guest.name}
                                                    </span>
                                                    {selectedGuestId === guest.id && (
                                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
                                                    )}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <button
                                    type="button"
                                    disabled={!selectedGuestId}
                                    onClick={handleReclaim}
                                    className="w-full h-11 font-mono text-[11px] uppercase tracking-[0.2em] transition-all"
                                    style={{
                                        background: selectedGuestId ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.04)',
                                        border: `1px solid ${selectedGuestId ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.1)'}`,
                                        borderRadius: '3px',
                                        color: selectedGuestId ? '#c4b5fd' : '#8b5cf6',
                                        boxShadow: selectedGuestId ? '0 0 12px rgba(168,85,247,0.1)' : 'none',
                                        cursor: !selectedGuestId ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {'[ CONFIRM_IDENTITY ]'}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ──
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
                                            <CircleNotch className="w-5 h-5 mr-2 animate-spin" />
                                            Connexion...
                                        </>
                                    ) : (
                                        <>
                                            Rejoindre
                                            <Sparkle className="w-5 h-5 ml-2" />
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
                                <RadioGroup value={selectedGuestId || ''} onValueChange={setSelectedGuestId} className="gap-1">
                                    {existingGuests.map((guest) => (
                                        <div key={guest.id} className="relative group">
                                            <RadioGroupItem value={guest.id} id={guest.id} className="sr-only" />
                                            <Label
                                                htmlFor={guest.id}
                                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border border-transparent ${selectedGuestId === guest.id
                                                    ? 'bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/30 text-white'
                                                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ring-1 transition-all ${selectedGuestId === guest.id
                                                    ? 'bg-[var(--v2-primary)]/20 ring-[var(--v2-primary)]/50'
                                                    : 'bg-white/5 ring-white/10'
                                                    }`}>
                                                    <User className={`w-5 h-5 ${selectedGuestId === guest.id ? 'text-white' : 'text-slate-500'}`} />
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
        </Dialog>
    );
}
