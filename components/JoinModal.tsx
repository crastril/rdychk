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
            <DialogContent
                className="p-0 overflow-hidden"
                style={{
                    background: '#0d0d0d',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: '0',
                    maxWidth: '420px',
                    width: 'calc(100% - 2rem)',
                }}
            >
                {/* Top amber accent bar */}
                <div className="w-full" style={{ height: '4px', background: '#fbbf24' }} />

                {view === 'create' ? (
                    <div className="p-6 flex flex-col gap-5">
                        <DialogHeader>
                            <DialogTitle
                                className="text-2xl font-black uppercase tracking-widest leading-tight"
                                style={{ color: '#ffffff' }}
                            >
                                Rejoindre{' '}
                                <span style={{ color: '#fbbf24' }}>{groupName}</span>
                            </DialogTitle>
                            <DialogDescription
                                className="text-sm mt-1"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                            >
                                Entrez votre nom pour rejoindre la session.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitCreate} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="nb-name"
                                    className="text-xs font-black uppercase tracking-widest"
                                    style={{ color: 'rgba(255,255,255,0.6)' }}
                                >
                                    Votre Nom
                                </label>
                                <div className="relative">
                                    <div
                                        data-nb-input
                                        className="flex items-center gap-2 px-3 py-2.5"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '2px solid rgba(255,255,255,0.4)',
                                            borderRadius: '0',
                                        }}
                                    >
                                        <User className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                                        <input
                                            id="nb-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Comment tu t'appelles ?"
                                            autoFocus
                                            maxLength={20}
                                            required
                                            disabled={isLoading}
                                            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-30"
                                            style={{
                                                color: '#ffffff',
                                                caretColor: '#fbbf24',
                                                fontFamily: 'inherit',
                                            }}
                                            onFocus={e => {
                                                const wrapper = e.currentTarget.closest('[data-nb-input]') as HTMLElement | null;
                                                if (wrapper) wrapper.style.borderColor = '#fbbf24';
                                            }}
                                            onBlur={e => {
                                                const wrapper = e.currentTarget.closest('[data-nb-input]') as HTMLElement | null;
                                                if (wrapper) wrapper.style.borderColor = 'rgba(255,255,255,0.4)';
                                            }}
                                        />
                                        {user && !name && (
                                            <span
                                                className="text-[9px] font-black uppercase tracking-widest animate-pulse shrink-0"
                                                style={{ color: '#fbbf24' }}
                                            >
                                                Profil détecté
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="submit"
                                    disabled={!name.trim() || isLoading}
                                    className="w-full h-13 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-all"
                                    style={{
                                        background: '#fbbf24',
                                        color: '#000000',
                                        border: '2px solid #000000',
                                        borderRadius: '0',
                                        boxShadow: '3px 3px 0 #000000',
                                        cursor: !name.trim() || isLoading ? 'not-allowed' : 'pointer',
                                        opacity: !name.trim() || isLoading ? 0.5 : 1,
                                        padding: '0.75rem 1rem',
                                    }}
                                    onMouseEnter={e => {
                                        if (!name.trim() || isLoading) return;
                                        e.currentTarget.style.transform = 'translate(-1px,-1px)';
                                        e.currentTarget.style.boxShadow = '4px 4px 0 #000000';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translate(0,0)';
                                        e.currentTarget.style.boxShadow = '3px 3px 0 #000000';
                                    }}
                                >
                                    {isLoading ? (
                                        <><CircleNotch className="w-4 h-4 animate-spin" /> Connexion...</>
                                    ) : (
                                        <>Rejoindre <Sparkle className="w-4 h-4" /></>
                                    )}
                                </button>

                                {existingGuests.length > 0 && (
                                    <button
                                        type="button"
                                        className="w-full text-center text-sm py-2 transition-colors"
                                        style={{ color: 'rgba(255,255,255,0.45)', background: 'transparent', border: 'none' }}
                                        onClick={() => setView('reclaim')}
                                        disabled={isLoading}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                                    >
                                        Déjà dans ce groupe →
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
                                    className="w-9 h-9 flex items-center justify-center transition-colors"
                                    style={{
                                        border: '2px solid rgba(255,255,255,0.4)',
                                        borderRadius: '0',
                                        color: 'rgba(255,255,255,0.6)',
                                        background: 'transparent',
                                    }}
                                    onClick={() => setView('create')}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <DialogTitle
                                    className="text-xl font-black uppercase tracking-widest"
                                    style={{ color: '#ffffff' }}
                                >
                                    Qui êtes-vous ?
                                </DialogTitle>
                            </div>
                            <DialogDescription
                                className="text-sm mt-1"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                            >
                                Sélectionnez votre profil existant dans la liste.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4">
                            <div
                                className="h-[200px] overflow-y-auto p-1.5 space-y-1"
                                style={{
                                    border: '2px solid rgba(255,255,255,0.12)',
                                    borderRadius: '0',
                                    background: 'transparent',
                                }}
                            >
                                <RadioGroup value={selectedGuestId || ''} onValueChange={setSelectedGuestId} className="gap-1">
                                    {existingGuests.map((guest) => (
                                        <div key={guest.id} className="relative">
                                            <RadioGroupItem value={guest.id} id={`nb-${guest.id}`} className="sr-only" />
                                            <Label
                                                htmlFor={`nb-${guest.id}`}
                                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all"
                                                style={{
                                                    borderRadius: '0',
                                                    border: `2px solid ${selectedGuestId === guest.id ? '#fbbf24' : 'rgba(255,255,255,0.12)'}`,
                                                    background: selectedGuestId === guest.id ? 'rgba(251,191,36,0.06)' : 'transparent',
                                                }}
                                            >
                                                <div
                                                    className="w-8 h-8 flex items-center justify-center text-xs font-black uppercase shrink-0"
                                                    style={{
                                                        borderRadius: '0',
                                                        border: `2px solid ${selectedGuestId === guest.id ? '#fbbf24' : 'rgba(255,255,255,0.3)'}`,
                                                        background: 'transparent',
                                                        color: selectedGuestId === guest.id ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                                                    }}
                                                >
                                                    {guest.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span
                                                    className="text-sm font-black uppercase tracking-widest flex-1"
                                                    style={{ color: selectedGuestId === guest.id ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}
                                                >
                                                    {guest.name}
                                                </span>
                                                {selectedGuestId === guest.id && (
                                                    <div
                                                        className="w-2 h-2 shrink-0"
                                                        style={{ background: '#fbbf24' }}
                                                    />
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
                                className="w-full flex items-center justify-center font-black uppercase tracking-widest text-sm transition-all"
                                style={{
                                    background: '#fbbf24',
                                    color: '#000000',
                                    border: '2px solid #000000',
                                    borderRadius: '0',
                                    boxShadow: '3px 3px 0 #000000',
                                    cursor: !selectedGuestId ? 'not-allowed' : 'pointer',
                                    opacity: !selectedGuestId ? 0.4 : 1,
                                    padding: '0.75rem 1rem',
                                }}
                                onMouseEnter={e => {
                                    if (!selectedGuestId) return;
                                    e.currentTarget.style.transform = 'translate(-1px,-1px)';
                                    e.currentTarget.style.boxShadow = '4px 4px 0 #000000';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translate(0,0)';
                                    e.currentTarget.style.boxShadow = '3px 3px 0 #000000';
                                }}
                            >
                                Valider et Rejoindre
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
