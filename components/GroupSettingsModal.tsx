'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { CircleNotch, SignOut, MapPin, CalendarDots, CheckSquare, GameController } from '@phosphor-icons/react';
import { GroupTypeSelector } from '@/components/GroupTypeSelector';
import { FRENCH_CITIES } from '@/lib/cities';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    slug: string;
    memberId: string | null;
    isAdmin: boolean;
    onLeaveGroup?: () => void;
    isRemote?: boolean;
}

export function GroupSettingsModal({ isOpen, onOpenChange, groupId, slug, memberId, isAdmin, onLeaveGroup, isRemote }: GroupSettingsModalProps) {
    const [groupType, setGroupType] = useState<'remote' | 'in_person'>('remote');
    const [location, setLocation] = useState('');
    const [locationSearch, setLocationSearch] = useState('');
    const [locationResults, setLocationResults] = useState<string[]>([]);
    const [calendarEnabled, setCalendarEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [phase, setPhase] = useState<'planning' | 'day-of'>('planning');
    const [confirmedDate, setConfirmedDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen, groupId]);

    const fetchSettings = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('groups')
            .select('type, city, calendar_voting_enabled, location_voting_enabled, confirmed_date')
            .eq('id', groupId)
            .single();

        if (data) {
            setGroupType((data.type as 'remote' | 'in_person') || 'remote');
            setLocation(data.city || '');
            setLocationSearch(data.city || '');
            setCalendarEnabled(data.calendar_voting_enabled ?? false);
            setLocationEnabled(data.location_voting_enabled ?? false);
            setConfirmedDate(data.confirmed_date ?? null);
            const today = new Date().toISOString().slice(0, 10);
            const isDayOf =
                (data.confirmed_date && data.confirmed_date <= today) ||
                (!data.calendar_voting_enabled && !data.location_voting_enabled);
            setPhase(isDayOf ? 'day-of' : 'planning');
        }
        setLoading(false);
    };

    const handleSearchLocation = (query: string) => {
        if (!query.trim()) {
            setLocationResults([]);
            return;
        }
        const filtered = FRENCH_CITIES.filter(city =>
            city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        setLocationResults(filtered);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (groupType === 'in_person' && !location) {
                alert("Veuillez sélectionner une ville pour un groupe en personne.");
                setSaving(false);
                return;
            }

            const dateToSave = phase === 'day-of' && !confirmedDate
                ? new Date().toISOString().slice(0, 10)
                : confirmedDate;

            const { error: typeError } = await supabase
                .from('groups')
                .update({
                    type: groupType,
                    city: groupType === 'in_person' ? location : null,
                    calendar_voting_enabled: calendarEnabled,
                    location_voting_enabled: locationEnabled,
                    confirmed_date: dateToSave,
                })
                .eq('id', groupId);

            if (typeError) throw typeError;
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const setModePlanning = () => {
        setPhase('planning');
        setCalendarEnabled(true);
        setLocationEnabled(true);
        setConfirmedDate(null);
    };

    const setModeDayOf = () => {
        setPhase('day-of');
        setCalendarEnabled(false);
        setLocationEnabled(false);
        if (!confirmedDate) {
            setConfirmedDate(new Date().toISOString().slice(0, 10));
        }
    };

    // ── CYBERPUNK TOGGLE ─────────────────────────────────────────────────────
    const CyberToggle = ({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled: boolean }) => (
        <div
            onClick={() => !disabled && onChange()}
            className="relative transition-colors shrink-0"
            style={{
                width: '36px',
                height: '20px',
                borderRadius: '2px',
                border: `1px solid ${enabled ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.15)'}`,
                background: enabled ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.04)',
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            <motion.div
                animate={{ x: enabled ? 18 : 2 }}
                className="absolute top-1"
                style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '1px',
                    background: enabled ? '#a855f7' : '#8b5cf6',
                    boxShadow: enabled ? '0 0 6px rgba(168,85,247,0.6)' : 'none',
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </div>
    );

    // ── REMOTE / CYBERPUNK VARIANT ───────────────────────────────────────────
    if (isRemote) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent
                    className="flex flex-col p-0 overflow-hidden"
                    style={{
                        maxWidth: '460px',
                        width: 'calc(100% - 2rem)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: 'rgba(8,0,20,0.99)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: '4px',
                        boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                    }}
                >
                    {/* Top neon bar */}
                    <div className="w-full h-[2px] shrink-0" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />

                    <div className="p-5 flex flex-col gap-6">
                        <DialogHeader>
                            <DialogTitle className="font-mono text-[0.85rem] uppercase tracking-[0.2em]" style={{ color: '#c4b5fd' }}>
                                {'> GROUP_SETTINGS'}
                            </DialogTitle>
                        </DialogHeader>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <CircleNotch className="w-6 h-6 animate-spin" style={{ color: '#a855f7' }} />
                            </div>
                        ) : (
                            <>
                                {/* ── GROUP TYPE ── */}
                                <div className="flex flex-col gap-3">
                                    <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: '#8b5cf6' }}>
                                        // GROUP_TYPE
                                    </p>
                                    <GroupTypeSelector
                                        value={groupType}
                                        onValueChange={(val) => setGroupType(val)}
                                        idPrefix="settings-remote-"
                                        disabled={!isAdmin}
                                        isRemote={true}
                                    />
                                </div>

                                {/* ── CITY (in_person only) ── */}
                                {groupType === 'in_person' && (
                                    <div className="flex flex-col gap-3">
                                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] flex items-center gap-1.5" style={{ color: '#8b5cf6' }}>
                                            <MapPin className="w-3 h-3" />
                                            // BASE_CITY
                                        </p>
                                        <div className="relative">
                                            <input
                                                value={locationSearch}
                                                onChange={(e) => {
                                                    setLocationSearch(e.target.value);
                                                    handleSearchLocation(e.target.value);
                                                }}
                                                placeholder="SEARCH_CITY..."
                                                disabled={!isAdmin}
                                                className="w-full bg-transparent font-mono text-sm outline-none placeholder:font-mono px-3 py-2.5"
                                                style={{
                                                    border: '1px solid rgba(168,85,247,0.2)',
                                                    borderRadius: '3px',
                                                    color: '#c4b5fd',
                                                    caretColor: '#a855f7',
                                                }}
                                                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                                                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)')}
                                            />
                                            {locationResults.length > 0 && isAdmin && (
                                                <div
                                                    className="absolute top-full left-0 w-full mt-1 overflow-hidden z-50"
                                                    style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '3px', background: 'rgba(8,0,20,0.99)' }}
                                                >
                                                    {locationResults.map((cityName) => (
                                                        <button
                                                            key={cityName}
                                                            type="button"
                                                            onClick={() => {
                                                                setLocation(cityName);
                                                                setLocationSearch(cityName);
                                                                setLocationResults([]);
                                                            }}
                                                            className="w-full text-left px-3 py-2 font-mono text-sm transition-colors"
                                                            style={{ borderBottom: '1px solid rgba(168,85,247,0.08)', color: '#a78bfa' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.08)'; e.currentTarget.style.color = '#c4b5fd'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a78bfa'; }}
                                                        >
                                                            {cityName}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {!isAdmin && (
                                            <p className="font-mono text-[10px]" style={{ color: '#8b5cf6' }}>
                                                {'// ADMIN_ONLY_SETTING'}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── SESSION PHASE ── */}
                                <div className="flex flex-col gap-3">
                                    <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: '#8b5cf6' }}>
                                        // SESSION_PHASE
                                    </p>
                                    <div
                                        className="grid grid-cols-2 gap-1.5 p-1"
                                        style={{ border: '1px solid rgba(168,85,247,0.15)', borderRadius: '3px', background: 'rgba(168,85,247,0.02)' }}
                                    >
                                        <button
                                            type="button"
                                            disabled={!isAdmin}
                                            onClick={setModePlanning}
                                            className="flex flex-col items-center gap-1.5 py-3 px-2 font-mono transition-all"
                                            style={{
                                                borderRadius: '2px',
                                                border: `1px solid ${phase === 'planning' ? 'rgba(168,85,247,0.4)' : 'transparent'}`,
                                                background: phase === 'planning' ? 'rgba(168,85,247,0.12)' : 'transparent',
                                                cursor: !isAdmin ? 'not-allowed' : 'pointer',
                                                opacity: !isAdmin ? 0.5 : 1,
                                            }}
                                        >
                                            <CalendarDots className="w-4 h-4" style={{ color: phase === 'planning' ? '#a855f7' : '#8b5cf6' }} weight="fill" />
                                            <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: phase === 'planning' ? '#c4b5fd' : '#8b5cf6' }}>PLANNING</span>
                                            <span className="text-[9px] text-center leading-tight" style={{ color: '#8b5cf6' }}>// vote en cours</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!isAdmin}
                                            onClick={setModeDayOf}
                                            className="flex flex-col items-center gap-1.5 py-3 px-2 font-mono transition-all"
                                            style={{
                                                borderRadius: '2px',
                                                border: `1px solid ${phase === 'day-of' ? 'rgba(74,222,128,0.4)' : 'transparent'}`,
                                                background: phase === 'day-of' ? 'rgba(74,222,128,0.06)' : 'transparent',
                                                cursor: !isAdmin ? 'not-allowed' : 'pointer',
                                                opacity: !isAdmin ? 0.5 : 1,
                                            }}
                                        >
                                            <CheckSquare className="w-4 h-4" style={{ color: phase === 'day-of' ? '#4ade80' : '#8b5cf6' }} weight="fill" />
                                            <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: phase === 'day-of' ? '#4ade80' : '#8b5cf6' }}>SESSION_DAY</span>
                                            <span className="text-[9px] text-center leading-tight" style={{ color: '#8b5cf6' }}>// décision finale</span>
                                        </button>
                                    </div>
                                </div>

                                {/* ── FEATURE TOGGLES ── */}
                                <div className="flex flex-col gap-3">
                                    <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: '#8b5cf6' }}>
                                        // MODULES
                                    </p>

                                    {/* Calendar toggle */}
                                    <div
                                        onClick={() => isAdmin && setCalendarEnabled(!calendarEnabled)}
                                        className="flex items-center justify-between px-3 py-2.5 transition-all"
                                        style={{
                                            border: `1px solid ${calendarEnabled ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.1)'}`,
                                            borderRadius: '3px',
                                            background: calendarEnabled ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.02)',
                                            cursor: isAdmin ? 'pointer' : 'default',
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 flex items-center justify-center shrink-0"
                                                style={{ border: `1px solid ${calendarEnabled ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.15)'}`, borderRadius: '2px', background: calendarEnabled ? 'rgba(168,85,247,0.1)' : 'transparent' }}
                                            >
                                                <CalendarDots className="w-4 h-4" style={{ color: calendarEnabled ? '#a855f7' : '#8b5cf6' }} weight="fill" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-sm" style={{ color: calendarEnabled ? '#c4b5fd' : '#a78bfa' }}>CALENDAR</p>
                                                <p className="font-mono text-[10px]" style={{ color: '#8b5cf6' }}>// vote pour des dates</p>
                                            </div>
                                        </div>
                                        <CyberToggle enabled={calendarEnabled} onChange={() => setCalendarEnabled(!calendarEnabled)} disabled={!isAdmin} />
                                    </div>

                                    {/* Game/Location toggle */}
                                    <div
                                        onClick={() => isAdmin && setLocationEnabled(!locationEnabled)}
                                        className="flex items-center justify-between px-3 py-2.5 transition-all"
                                        style={{
                                            border: `1px solid ${locationEnabled ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.1)'}`,
                                            borderRadius: '3px',
                                            background: locationEnabled ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.02)',
                                            cursor: isAdmin ? 'pointer' : 'default',
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 flex items-center justify-center shrink-0"
                                                style={{ border: `1px solid ${locationEnabled ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.15)'}`, borderRadius: '2px', background: locationEnabled ? 'rgba(168,85,247,0.1)' : 'transparent' }}
                                            >
                                                <GameController className="w-4 h-4" style={{ color: locationEnabled ? '#a855f7' : '#8b5cf6' }} />
                                            </div>
                                            <div>
                                                <p className="font-mono text-sm" style={{ color: locationEnabled ? '#c4b5fd' : '#a78bfa' }}>GAME_PROPOSALS</p>
                                                <p className="font-mono text-[10px]" style={{ color: '#8b5cf6' }}>// voter pour un jeu</p>
                                            </div>
                                        </div>
                                        <CyberToggle enabled={locationEnabled} onChange={() => setLocationEnabled(!locationEnabled)} disabled={!isAdmin} />
                                    </div>
                                </div>

                                {/* ── ACTIONS ── */}
                                <div
                                    className="flex flex-col gap-2.5 pt-4"
                                    style={{ borderTop: '1px solid rgba(168,85,247,0.12)' }}
                                >
                                    {isAdmin && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="w-full h-11 font-mono text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all"
                                            style={{
                                                border: '1px solid rgba(168,85,247,0.4)',
                                                borderRadius: '3px',
                                                background: saving ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.12)',
                                                color: saving ? '#8b5cf6' : '#c4b5fd',
                                                boxShadow: saving ? 'none' : '0 0 12px rgba(168,85,247,0.1)',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = 'rgba(168,85,247,0.2)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)'; } }}
                                            onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; } }}
                                        >
                                            {saving ? (
                                                <><CircleNotch className="w-4 h-4 animate-spin" /> SAVING...</>
                                            ) : (
                                                '[ SAVE_SETTINGS ]'
                                            )}
                                        </button>
                                    )}

                                    {onLeaveGroup && (
                                        <button
                                            onClick={() => {
                                                if (confirm("Voulez-vous vraiment quitter ce groupe ?")) {
                                                    onLeaveGroup();
                                                }
                                            }}
                                            className="w-full h-10 font-mono text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all"
                                            style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: '3px', color: 'rgba(239,68,68,0.65)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = 'rgb(239,68,68)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.65)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                                        >
                                            <SignOut className="w-4 h-4" />
                                            LEAVE_GROUP
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ────────────────────────────────────────

    // Rounded pill toggle — in_person variant
    const BrutToggle = ({ enabled, onChange, disabled: tog_disabled }: { enabled: boolean; onChange: () => void; disabled: boolean }) => (
        <div
            onClick={() => !tog_disabled && onChange()}
            className="relative shrink-0 transition-colors"
            style={{
                width: '36px',
                height: '20px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: enabled ? 'rgba(255,46,46,0.25)' : 'rgba(255,255,255,0.06)',
                cursor: tog_disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
            }}
        >
            <motion.div
                animate={{ x: enabled ? 18 : 2 }}
                className="absolute top-1"
                style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '6px',
                    background: enabled ? 'var(--v2-primary)' : 'rgba(255,255,255,0.4)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col p-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f]"
                style={{
                    maxWidth: '460px',
                    width: 'calc(100% - 2rem)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '5px 5px 0 #000',
                }}
            >
                <div className="p-6 flex flex-col gap-6">
                    <DialogHeader>
                        <DialogTitle className="font-black uppercase tracking-widest text-white text-lg">
                            Paramètres du groupe
                        </DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <CircleNotch className="w-6 h-6 animate-spin" style={{ color: 'var(--v2-primary)' }} />
                        </div>
                    ) : (
                        <>
                            {/* ── GROUP TYPE ── */}
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs text-white/40" style={{ marginBottom: '10px' }}>
                                    Mode de fonctionnement
                                </h3>
                                <GroupTypeSelector
                                    value={groupType}
                                    onValueChange={(val) => setGroupType(val)}
                                    idPrefix="settings-brut-"
                                    disabled={!isAdmin}
                                    isRemote={false}
                                />
                            </div>

                            {/* ── CITY (in_person only) ── */}
                            {groupType === 'in_person' && (
                                <div>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-white/40 flex items-center gap-2" style={{ marginBottom: '10px' }}>
                                        <MapPin className="w-3.5 h-3.5" />
                                        Ville du groupe
                                    </h3>
                                    <div className="relative">
                                        <input
                                            value={locationSearch}
                                            onChange={(e) => {
                                                setLocationSearch(e.target.value);
                                                handleSearchLocation(e.target.value);
                                            }}
                                            placeholder="Rechercher une ville..."
                                            disabled={!isAdmin}
                                            className="w-full text-white text-sm outline-none px-3 py-2.5 rounded-xl border border-white/20 bg-white/[0.03] transition-colors"
                                            style={{ caretColor: 'var(--v2-primary)' }}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--v2-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                                        />
                                        {locationResults.length > 0 && isAdmin && (
                                            <div
                                                className="absolute top-full left-0 w-full mt-1 z-50 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f]"
                                            >
                                                {locationResults.map((cityName) => (
                                                    <button
                                                        key={cityName}
                                                        type="button"
                                                        onClick={() => {
                                                            setLocation(cityName);
                                                            setLocationSearch(cityName);
                                                            setLocationResults([]);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-white/70 text-sm transition-colors"
                                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        {cityName}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {!isAdmin && (
                                        <p className="text-xs mt-2 text-white/35">
                                            Seul l'administrateur peut modifier la ville.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── PHASE TOGGLE ── */}
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs text-white/40" style={{ marginBottom: '10px' }}>
                                    Phase du groupe
                                </h3>
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-1 grid grid-cols-2 gap-1">
                                    {/* Planification */}
                                    <button
                                        type="button"
                                        disabled={!isAdmin}
                                        onClick={setModePlanning}
                                        className={cn(
                                            'flex flex-col items-center gap-1.5 py-3 px-2 text-center transition-all',
                                            phase === 'planning'
                                                ? 'rounded-xl border border-black bg-black/40 text-white'
                                                : 'rounded-lg border border-transparent bg-transparent text-white/40',
                                        )}
                                        style={{
                                            cursor: !isAdmin ? 'not-allowed' : 'pointer',
                                            opacity: !isAdmin ? 0.5 : 1,
                                        }}
                                    >
                                        <CalendarDots
                                            className="w-4 h-4"
                                            weight="fill"
                                            style={{ color: phase === 'planning' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}
                                        />
                                        <span className="font-black uppercase text-xs tracking-widest">Planification</span>
                                        <span className="text-[10px] text-white/35">On se met d'accord</span>
                                    </button>

                                    {/* Jour J */}
                                    <button
                                        type="button"
                                        disabled={!isAdmin}
                                        onClick={setModeDayOf}
                                        className={cn(
                                            'flex flex-col items-center gap-1.5 py-3 px-2 text-center transition-all',
                                            phase === 'day-of'
                                                ? 'rounded-xl border border-green-500/40 bg-green-500/[0.08] text-green-400'
                                                : 'rounded-lg border border-transparent bg-transparent text-white/40',
                                        )}
                                        style={{
                                            cursor: !isAdmin ? 'not-allowed' : 'pointer',
                                            opacity: !isAdmin ? 0.5 : 1,
                                        }}
                                    >
                                        <CheckSquare
                                            className="w-4 h-4"
                                            weight="fill"
                                            style={{ color: phase === 'day-of' ? '#4ade80' : 'rgba(255,255,255,0.3)' }}
                                        />
                                        <span className="font-black uppercase text-xs tracking-widest">Jour J</span>
                                        <span className="text-[10px] text-white/35">C'est décidé</span>
                                    </button>
                                </div>
                            </div>

                            {/* ── FEATURE TOGGLES ── */}
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-xs text-white/40" style={{ marginBottom: '10px' }}>
                                    Fonctionnalités
                                </h3>
                                <div className="flex flex-col gap-2">

                                    {/* Calendrier */}
                                    <div
                                        onClick={() => isAdmin && setCalendarEnabled(!calendarEnabled)}
                                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between transition-all"
                                        style={{
                                            border: calendarEnabled ? '1px solid color-mix(in srgb, var(--v2-primary) 30%, transparent)' : undefined,
                                            background: calendarEnabled ? 'color-mix(in srgb, var(--v2-primary) 4%, transparent)' : undefined,
                                            cursor: isAdmin ? 'pointer' : 'default',
                                        }}
                                        onMouseEnter={e => {
                                            if (!calendarEnabled) {
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!calendarEnabled) {
                                                e.currentTarget.style.borderColor = '';
                                                e.currentTarget.style.background = '';
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-xl border border-white/[0.12] bg-white/[0.04] flex items-center justify-center shrink-0"
                                                style={calendarEnabled ? {
                                                    border: '1px solid color-mix(in srgb, var(--v2-primary) 30%, transparent)',
                                                    background: 'color-mix(in srgb, var(--v2-primary) 8%, transparent)',
                                                } : undefined}
                                            >
                                                <CalendarDots
                                                    className="w-4 h-4"
                                                    weight="fill"
                                                    style={{ color: calendarEnabled ? 'var(--v2-primary)' : 'rgba(255,255,255,0.35)' }}
                                                />
                                            </div>
                                            <div>
                                                <p className={cn('font-bold text-sm', calendarEnabled ? 'text-white/80' : 'text-white/45')}>
                                                    Calendrier
                                                </p>
                                                <p className="text-[11px] text-white/35">
                                                    Voter pour des dates
                                                </p>
                                            </div>
                                        </div>
                                        <BrutToggle
                                            enabled={calendarEnabled}
                                            onChange={() => setCalendarEnabled(!calendarEnabled)}
                                            disabled={!isAdmin}
                                        />
                                    </div>

                                    {/* Lieux */}
                                    <div
                                        onClick={() => isAdmin && setLocationEnabled(!locationEnabled)}
                                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between transition-all"
                                        style={{
                                            border: locationEnabled ? '1px solid color-mix(in srgb, var(--v2-primary) 30%, transparent)' : undefined,
                                            background: locationEnabled ? 'color-mix(in srgb, var(--v2-primary) 4%, transparent)' : undefined,
                                            cursor: isAdmin ? 'pointer' : 'default',
                                        }}
                                        onMouseEnter={e => {
                                            if (!locationEnabled) {
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!locationEnabled) {
                                                e.currentTarget.style.borderColor = '';
                                                e.currentTarget.style.background = '';
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-xl border border-white/[0.12] bg-white/[0.04] flex items-center justify-center shrink-0"
                                                style={locationEnabled ? {
                                                    border: '1px solid color-mix(in srgb, var(--v2-primary) 30%, transparent)',
                                                    background: 'color-mix(in srgb, var(--v2-primary) 8%, transparent)',
                                                } : undefined}
                                            >
                                                <MapPin
                                                    className="w-4 h-4"
                                                    style={{ color: locationEnabled ? 'var(--v2-primary)' : 'rgba(255,255,255,0.35)' }}
                                                />
                                            </div>
                                            <div>
                                                <p className={cn('font-bold text-sm', locationEnabled ? 'text-white/80' : 'text-white/45')}>
                                                    Lieux
                                                </p>
                                                <p className="text-[11px] text-white/35">
                                                    Proposer et voter pour des lieux
                                                </p>
                                            </div>
                                        </div>
                                        <BrutToggle
                                            enabled={locationEnabled}
                                            onChange={() => setLocationEnabled(!locationEnabled)}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── ACTIONS ── */}
                            <div
                                className="flex flex-col gap-2 pt-5"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                {isAdmin && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full h-12 rounded-xl bg-[var(--v2-primary)] text-white border-[3px] border-black font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                        style={{
                                            boxShadow: '3px 3px 0 #000',
                                            opacity: saving ? 0.5 : 1,
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {saving ? (
                                            <><CircleNotch className="w-4 h-4 animate-spin" /> Enregistrement...</>
                                        ) : (
                                            'Enregistrer les paramètres'
                                        )}
                                    </button>
                                )}

                                {onLeaveGroup && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Voulez-vous vraiment quitter ce groupe ?')) {
                                                onLeaveGroup();
                                            }
                                        }}
                                        className="w-full h-11 rounded-xl border border-red-500/30 text-red-400/70 font-bold uppercase tracking-widest bg-transparent flex items-center justify-center gap-2 transition-all"
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
                                            e.currentTarget.style.color = 'rgb(248,113,113)';
                                            e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = '';
                                            e.currentTarget.style.color = '';
                                            e.currentTarget.style.background = '';
                                        }}
                                    >
                                        <SignOut className="w-4 h-4" />
                                        Quitter le groupe
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
