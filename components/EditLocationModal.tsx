'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateLocationAction } from '@/app/actions/group';
import { Search, MapPin, Check } from 'lucide-react';

interface EditLocationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    slug: string;
    existingLocation?: { name: string; address?: string; link?: string } | null;
    currentMemberName: string | null;
    currentMemberId: string | null;
    onLocationUpdate: (location: { name?: string | null; address?: string | null; link?: string | null; image?: string | null;[key: string]: string | null | undefined }) => void;
}

export function EditLocationModal({ isOpen, onOpenChange, groupId, slug, existingLocation, currentMemberName, currentMemberId, onLocationUpdate }: EditLocationModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

    const [locationData, setLocationData] = useState<{
        name: string;
        address: string;
        link: string;
        image: string | null;
    }>({ name: '', address: '', link: '', image: null });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setResults([]);
            setSelectedPlaceId(null);
            if (existingLocation) {
                const name = existingLocation.name || '';
                setLocationData({
                    name,
                    address: existingLocation.address || '',
                    link: existingLocation.link || '',
                    image: null
                });
                setSearchQuery(name);
            } else {
                setLocationData({ name: '', address: '', link: '', image: null });
                setSearchQuery('');
            }
        }
    }, [isOpen, existingLocation]);

    const handleSearch = async (useGeolocation = false) => {
        if (!searchQuery.trim() && !useGeolocation) return;
        setIsSearching(true);
        setResults([]);
        setSelectedPlaceId(null);

        let url = `/api/places?q=${encodeURIComponent(searchQuery)}`;

        const fetchData = async (finalUrl: string) => {
            try {
                const res = await fetch(finalUrl);
                const data = await res.json();
                if (data.results) {
                    setResults(data.results);
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }

        if (useGeolocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    url += `&lat=${position.coords.latitude}&lng=${position.coords.longitude}`;
                    fetchData(url);
                },
                (err) => {
                    console.warn("Geolocation denied or failed", err);
                    fetchData(url); // Fall back to regular search
                }
            );
        } else {
            fetchData(url);
        }
    };

    const selectPlace = (place: any) => {
        setSelectedPlaceId(place.place_id);
        setLocationData({
            name: place.name,
            address: place.formatted_address,
            link: place.url,
            image: place.image
        });
    };

    const handleSave = async () => {
        if (!locationData.name.trim() && !searchQuery.trim()) return;
        setSaving(true);

        // Use manually typed query if no place was selected
        const finalName = locationData.name.trim() || searchQuery.trim();

        const newLocation = {
            name: finalName,
            link: locationData.link.trim() || null,
            address: locationData.address.trim() || null,
            image: locationData.image || null,
            description: locationData.address.trim() || null,
            preview_title: finalName || null,
            proposed_by: currentMemberName,
            proposed_by_id: currentMemberId
        };

        try {
            if (!currentMemberId) throw new Error("Membre non identifié");
            const result = await updateLocationAction(slug, currentMemberId, groupId, newLocation);

            if (!result.success) throw new Error(result.error);

            onLocationUpdate(newLocation);
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement du lieu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>
                <div className="p-6">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-xl font-bold">Modifier le lieu</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Indiquez où le groupe doit se retrouver.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="loc-name" className="text-slate-300 font-medium">Rechercher un lieu <span className="text-red-400">*</span></Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        id="loc-name"
                                        placeholder="Ex: Bar de la Plage, Paris..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearch(false);
                                            }
                                        }}
                                        className="input-rdychk flex-1"
                                    />
                                    <Button onClick={() => handleSearch(false)} disabled={isSearching || !searchQuery.trim()} className="bg-white/10 hover:bg-white/20 px-3 border border-white/10 rounded-xl h-12">
                                        <Search className="w-5 h-5 text-white" />
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="w-full mt-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 text-xs py-1 h-8 rounded-xl justify-start"
                                    onClick={() => handleSearch(true)}
                                    disabled={isSearching}
                                >
                                    <MapPin className="w-3 h-3 mr-1.5" /> Chercher et prioriser autour de moi
                                </Button>
                            </div>

                            {/* Results Rendering */}
                            {isSearching && (
                                <div className="flex justify-center p-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            )}

                            {!isSearching && results.length > 0 && (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    <p className="text-xs text-slate-500 font-medium mb-3">Sélectionnez un lieu dans la liste :</p>
                                    {results.map((place) => (
                                        <div
                                            key={place.place_id}
                                            onClick={() => selectPlace(place)}
                                            className={`p-2 border rounded-xl flex gap-3 cursor-pointer transition-colors ${selectedPlaceId === place.place_id ? 'border-[var(--v2-primary)] bg-[var(--v2-primary)]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                        >
                                            {place.image ? (
                                                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={place.image} alt={place.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <MapPin className="w-6 h-6 text-slate-500" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                                <div className="font-bold text-sm text-white line-clamp-1 flex items-center justify-between">
                                                    {place.name}
                                                    {selectedPlaceId === place.place_id && <Check className="w-4 h-4 text-[var(--v2-primary)] shrink-0 ml-2" />}
                                                </div>
                                                <div className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-tight">{place.formatted_address}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isSearching && results.length === 0 && searchQuery && !selectedPlaceId && (
                                <div className="text-center p-4 text-xs text-slate-400">
                                    Aucun résultat. Essayez d'être plus précis ou lancez une recherche.
                                </div>
                            )}

                        </div>

                        <div className="flex justify-end pt-4 mt-2 border-t border-white/10">
                            <Button
                                onClick={handleSave}
                                disabled={saving || (!locationData.name.trim() && !searchQuery.trim())}
                                className="w-full btn-massive h-12 rounded-xl text-white font-bold"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    "Valider le lieu"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
