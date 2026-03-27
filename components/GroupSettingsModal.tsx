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
import { CircleNotch, SignOut, MapPin } from '@phosphor-icons/react';
import { GroupTypeSelector } from '@/components/GroupTypeSelector';
import { FRENCH_CITIES } from '@/lib/cities';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    slug: string;
    memberId: string | null;
    isAdmin: boolean;
    onLeaveGroup?: () => void;
}

export function GroupSettingsModal({ isOpen, onOpenChange, groupId, slug, memberId, isAdmin, onLeaveGroup }: GroupSettingsModalProps) {
    const [groupType, setGroupType] = useState<'remote' | 'in_person'>('remote');
    const [location, setLocation] = useState('');
    const [locationSearch, setLocationSearch] = useState('');
    const [locationResults, setLocationResults] = useState<string[]>([]);
    const [calendarEnabled, setCalendarEnabled] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(false);
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
            .select('type, city, calendar_voting_enabled, location_voting_enabled')
            .eq('id', groupId)
            .single();
            
        if (data) {
            setGroupType((data.type as 'remote' | 'in_person') || 'remote');
            setLocation(data.city || '');
            setLocationSearch(data.city || '');
            setCalendarEnabled(data.calendar_voting_enabled ?? false);
            setLocationEnabled(data.location_voting_enabled ?? false);
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
            // Check if city is required but missing
            if (groupType === 'in_person' && !location) {
                alert("Veuillez sélectionner une ville pour un groupe en personne.");
                setSaving(false);
                return;
            }

            // Update group type and location
            const { error: typeError } = await supabase
                .from('groups')
                .update({ 
                    type: groupType,
                    city: groupType === 'in_person' ? location : null,
                    calendar_voting_enabled: calendarEnabled,
                    location_voting_enabled: locationEnabled
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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-bold">
                            Paramètres du groupe
                        </DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <CircleNotch className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                                    Mode de fonctionnement
                                </h3>
                                <GroupTypeSelector
                                    value={groupType}
                                    onValueChange={(val) => setGroupType(val)}
                                    idPrefix="settings-"
                                    disabled={!isAdmin}
                                />
                            </div>

                            {groupType === 'in_person' && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Ville du groupe
                                    </h3>
                                    <div className="relative">
                                        <Input
                                            value={locationSearch}
                                            onChange={(e) => {
                                                setLocationSearch(e.target.value);
                                                handleSearchLocation(e.target.value);
                                            }}
                                            placeholder="Rechercher une ville..."
                                            disabled={!isAdmin}
                                            className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-[var(--v2-primary)]/50"
                                        />
                                        
                                        {locationResults.length > 0 && isAdmin && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-black border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-48 overflow-y-auto">
                                                {locationResults.map((cityName) => (
                                                    <button
                                                        key={cityName}
                                                        type="button"
                                                        onClick={() => {
                                                            setLocation(cityName);
                                                            setLocationSearch(cityName);
                                                            setLocationResults([]);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        {cityName}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {!isAdmin && (
                                        <p className="text-xs text-slate-500 italic">
                                            Seul l'administrateur peut modifier la ville.
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    Fonctionnalités
                                </h3>
                                <div className="space-y-3">
                                    <div 
                                        onClick={() => isAdmin && setCalendarEnabled(!calendarEnabled)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                                            calendarEnabled 
                                                ? "bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/40 shadow-[0_0_15px_rgba(var(--v2-primary-rgb),0.1)]" 
                                                : "bg-white/5 border-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "size-10 rounded-xl flex items-center justify-center transition-colors",
                                                calendarEnabled ? "bg-[var(--v2-primary)]/20 text-[var(--v2-primary)]" : "bg-white/5 text-slate-400"
                                            )}>
                                                <CircleNotch className={cn("size-5", calendarEnabled && "animate-spin[slow]")} />
                                            </div>
                                            <div>
                                                <p className={cn("font-bold text-sm", calendarEnabled ? "text-white" : "text-slate-300")}>Calendrier</p>
                                                <p className="text-[11px] text-slate-500">Voter pour des dates</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            calendarEnabled ? "border-[var(--v2-primary)] bg-[var(--v2-primary)]" : "border-white/20"
                                        )}>
                                            {calendarEnabled && <div className="size-2 bg-white rounded-full shadow-[0_0_8px_white]" />}
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => isAdmin && setLocationEnabled(!locationEnabled)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                                            locationEnabled 
                                                ? "bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/40 shadow-[0_0_15px_rgba(var(--v2-primary-rgb),0.1)]" 
                                                : "bg-white/5 border-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "size-10 rounded-xl flex items-center justify-center transition-colors",
                                                locationEnabled ? "bg-[var(--v2-primary)]/20 text-[var(--v2-primary)]" : "bg-white/5 text-slate-400"
                                            )}>
                                                <MapPin className="size-5" />
                                            </div>
                                            <div>
                                                <p className={cn("font-bold text-sm", locationEnabled ? "text-white" : "text-slate-300")}>Lieux</p>
                                                <p className="text-[11px] text-slate-500">Proposer et voter pour des lieux</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            locationEnabled ? "border-[var(--v2-primary)] bg-[var(--v2-primary)]" : "border-white/20"
                                        )}>
                                            {locationEnabled && <div className="size-2 bg-white rounded-full shadow-[0_0_8px_white]" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                                {isAdmin && (
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full btn-massive h-12 rounded-xl text-white font-bold"
                                    >
                                        {saving ? (
                                            <>
                                                <CircleNotch className="mr-2 h-5 w-5 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            "Enregistrer les paramètres"
                                        )}
                                    </Button>
                                )}

                                {onLeaveGroup && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (confirm("Voulez-vous vraiment quitter ce groupe ?")) {
                                                onLeaveGroup();
                                            }
                                        }}
                                        className="w-full bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400 font-bold h-12 rounded-xl transition-all"
                                    >
                                        <SignOut className="mr-2 h-4 w-4" />
                                        Quitter le groupe
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
