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
import { Loader2, LogOut, MapPin, Search, Check } from 'lucide-react';
import { GroupTypeSelector } from '@/components/GroupTypeSelector';
import { updateGroupBaseLocationAction } from '@/app/actions/group';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    slug: string;
    memberId: string | null;
    onLeaveGroup?: () => void;
}

export function GroupSettingsModal({ isOpen, onOpenChange, groupId, slug, memberId, onLeaveGroup }: GroupSettingsModalProps) {
    const [groupType, setGroupType] = useState<'remote' | 'in_person'>('remote');
    const [baseLat, setBaseLat] = useState<number | null>(null);
    const [baseLng, setBaseLng] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen, groupId]);

    const fetchSettings = async () => {
        setLoading(true);
        const { data } = await supabase.from('groups').select('type, base_lat, base_lng').eq('id', groupId).single();
        if (data) {
            setGroupType((data.type as 'remote' | 'in_person') || 'remote');
            setBaseLat(data.base_lat);
            setBaseLng(data.base_lng);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update group type
            const { error: typeError } = await supabase
                .from('groups')
                .update({ type: groupType })
                .eq('id', groupId);

            if (typeError) throw typeError;

            // Update base location if memberId exists
            if (memberId) {
                await updateGroupBaseLocationAction(slug, memberId, groupId, baseLat, baseLng);
            }

            onOpenChange(false);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        setSaving(true); // Reusing saving state for loading visual
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setBaseLat(position.coords.latitude);
                setBaseLng(position.coords.longitude);
                setSaving(false);
            },
            (error) => {
                console.error("Erreur de géolocalisation:", error);
                alert("Impossible d'obtenir votre position. Veuillez l'autoriser dans votre navigateur.");
                setSaving(false);
            }
        );
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const url = `/api/places?q=${encodeURIComponent(searchQuery)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.results) {
                setSearchResults(data.results);
            } else {
                console.error('Search failed:', data);
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
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
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
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
                                />
                            </div>

                            {groupType === 'in_person' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        Zone de recherche (Ville / Position)
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-2">
                                        Définissez une zone pour que les recherches de lieux du groupe (ex: "Gare") soient priorisées ici.
                                    </p>

                                    {baseLat && baseLng ? (
                                        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-green-500/20 bg-green-500/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">Position définie</p>
                                                    <p className="text-xs text-slate-400">{baseLat.toFixed(4)}, {baseLng.toFixed(4)}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => { setBaseLat(null); setBaseLng(null); }} className="text-red-400 hover:text-red-300">
                                                Retirer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Button
                                                onClick={handleGeolocation}
                                                className="w-full h-12 rounded-xl bg-[var(--v2-primary)]/10 hover:bg-[var(--v2-primary)]/20 text-[var(--v2-primary)] font-bold border border-[var(--v2-primary)]/20"
                                            >
                                                <MapPin className="w-4 h-4 mr-2" />
                                                Me localiser
                                            </Button>

                                            <div className="flex items-center gap-2">
                                                <div className="h-[1px] flex-1 bg-white/10" />
                                                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">OU</span>
                                                <div className="h-[1px] flex-1 bg-white/10" />
                                            </div>

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Chercher une ville..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary)]/50 focus:border-transparent transition-all"
                                                />
                                                <Button
                                                    onClick={handleSearch}
                                                    disabled={isSearching}
                                                    className="h-12 w-12 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0"
                                                >
                                                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                                </Button>
                                            </div>

                                            {searchResults.length > 0 && (
                                                <div className="space-y-2 mt-4">
                                                    {searchResults.map((place) => (
                                                        <div
                                                            key={place.place_id}
                                                            onClick={() => {
                                                                if (place.lat && place.lng) {
                                                                    setBaseLat(place.lat);
                                                                    setBaseLng(place.lng);
                                                                    setSearchResults([]);
                                                                    setSearchQuery('');
                                                                }
                                                            }}
                                                            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-3"
                                                        >
                                                            <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                                                            <div className="overflow-hidden">
                                                                <h4 className="font-bold text-white text-sm truncate">{place.name}</h4>
                                                                <p className="text-xs text-slate-400 truncate">{place.formatted_address}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full btn-massive h-12 rounded-xl text-white font-bold"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        "Enregistrer les paramètres"
                                    )}
                                </Button>

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
                                        <LogOut className="mr-2 h-4 w-4" />
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
