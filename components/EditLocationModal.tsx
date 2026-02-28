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
import { Loader2, Search, MapPin, Check, Crosshair, Edit2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateLocationAction, updateGroupBaseLocationAction } from '@/app/actions/group';

interface EditLocationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    slug: string;
    existingLocation?: { name: string; address?: string; link?: string } | null;
    currentMemberName: string | null;
    currentMemberId: string | null;
    baseLat?: number | null;
    baseLng?: number | null;
    onLocationUpdate: (location: { name?: string | null; address?: string | null; link?: string | null; image?: string | null;[key: string]: string | null | undefined }) => void;
}

export function EditLocationModal({ isOpen, onOpenChange, groupId, slug, existingLocation, currentMemberName, currentMemberId, baseLat, baseLng, onLocationUpdate }: EditLocationModalProps) {
    // Step state
    const [step, setStep] = useState<1 | 2>(1);

    // Group base location state (city)
    const [cityQuery, setCityQuery] = useState('');
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [cityResults, setCityResults] = useState<any[]>([]);
    const [locatingUser, setLocatingUser] = useState(false);
    const [currentCityName, setCurrentCityName] = useState<string | null>(null);
    const [localBaseLat, setLocalBaseLat] = useState<number | null>(null);
    const [localBaseLng, setLocalBaseLng] = useState<number | null>(null);

    // Place state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchingPlace, setIsSearchingPlace] = useState(false);
    const [placeResults, setPlaceResults] = useState<any[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [locationData, setLocationData] = useState<{
        name: string;
        address: string;
        link: string;
        image: string | null;
    }>({ name: '', address: '', link: '', image: null });

    const [saving, setSaving] = useState(false);

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPlaceResults([]);
            setSelectedPlaceId(null);
            setCityResults([]);
            setCityQuery('');

            // Set local base coords from props initially
            setLocalBaseLat(baseLat || null);
            setLocalBaseLng(baseLng || null);

            // Determine initial step
            if (baseLat && baseLng) {
                setStep(2);
                reverseGeocode(baseLat, baseLng);
            } else {
                setStep(1);
            }

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
    }, [isOpen, existingLocation, baseLat, baseLng]);

    // Reverse geocode to get city name from lat/lng
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=nom&format=json&geometry=centre`);
            const data = await res.json();
            if (data && data.length > 0) {
                setCurrentCityName(data[0].nom);
            } else {
                setCurrentCityName("Position actuelle");
            }
        } catch (err) {
            setCurrentCityName("Position actuelle");
            console.error(err);
        }
    };

    // ------------- STEP 1: CITY SEARCH -------------
    const searchCities = async (query: string) => {
        setCityQuery(query);
        if (!query.trim() || query.length < 2) {
            setCityResults([]);
            return;
        }
        setIsSearchingCity(true);
        try {
            const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,codeDepartement,centre&boost=population&limit=5`);
            const data = await res.json();
            setCityResults(data || []);
        } catch (err) {
            console.error("City search failed", err);
        } finally {
            setIsSearchingCity(false);
        }
    };

    const handleSelectCity = async (city: any) => {
        if (city.centre && city.centre.coordinates) {
            const lng = city.centre.coordinates[0];
            const lat = city.centre.coordinates[1];
            setCurrentCityName(city.nom);
            setLocalBaseLat(lat);
            setLocalBaseLng(lng);
            setStep(2);
            if (!currentMemberId) throw new Error("Membre non identifié");
            // Save to group directly
            await updateGroupBaseLocationAction(slug, currentMemberId, groupId, lat, lng);
        }
    };

    const handleGeolocate = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }
        setLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLocalBaseLat(lat);
                setLocalBaseLng(lng);
                await reverseGeocode(lat, lng);
                setStep(2);
                if (!currentMemberId) throw new Error("Membre non identifié");
                await updateGroupBaseLocationAction(slug, currentMemberId, groupId, lat, lng);
                setLocatingUser(false);
            },
            (err) => {
                console.warn("Geolocation failed", err);
                alert("Impossible d'obtenir votre position.");
                setLocatingUser(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    // ------------- STEP 2: PLACE SEARCH -------------
    const handleSearchPlace = async () => {
        if (!searchQuery.trim()) return;
        setIsSearchingPlace(true);
        setPlaceResults([]);
        setSelectedPlaceId(null);

        let url = `/api/places?q=${encodeURIComponent(searchQuery)}`;

        if (localBaseLat && localBaseLng) {
            url += `&lat=${localBaseLat}&lng=${localBaseLng}`;
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.results) {
                setPlaceResults(data.results);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearchingPlace(false);
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
                        <DialogTitle className="text-xl font-bold">
                            {step === 1 ? "Étape 1 : Votre ville" : "Étape 2 : Le lieu"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {step === 1
                                ? "Définissons d'abord la ville où vous souhaitez chercher un lieu."
                                : "Indiquez où le groupe doit se retrouver."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {/* ------------- STEP 1 UI ------------- */}
                    {step === 1 && (
                        <div className="space-y-6 py-4">
                            <Button
                                onClick={handleGeolocate}
                                disabled={locatingUser}
                                className="w-full flex items-center justify-center gap-2 bg-[var(--v2-primary)]/20 hover:bg-[var(--v2-primary)]/30 text-[var(--v2-primary)] border border-[var(--v2-primary)]/30 h-14 rounded-2xl font-semibold transition-all"
                            >
                                {locatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
                                Utiliser ma position géographique
                            </Button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">Ou rechercher</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="city-search" className="text-slate-300 font-medium">Ville en France</Label>
                                <Input
                                    id="city-search"
                                    placeholder="Ex: Paris, Lyon, Bordeaux..."
                                    value={cityQuery}
                                    onChange={(e) => searchCities(e.target.value)}
                                    className="input-rdychk w-full"
                                    autoComplete="off"
                                />

                                {isSearchingCity && (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                    </div>
                                )}

                                {!isSearchingCity && cityResults.length > 0 && (
                                    <div className="bg-white/5 border border-white/10 text-white rounded-xl overflow-hidden mt-2">
                                        {cityResults.map((city) => (
                                            <button
                                                key={city.nom + city.codeDepartement}
                                                onClick={() => handleSelectCity(city)}
                                                className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex justify-between items-center"
                                            >
                                                <span className="font-medium">{city.nom}</span>
                                                <span className="text-slate-400 text-xs">{city.codeDepartement}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ------------- STEP 2 UI ------------- */}
                    {step === 2 && (
                        <div className="space-y-6 py-4">
                            {/* Current City display */}
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">Recherche ciblée sur :</span>
                                    <span className="text-[var(--v2-primary)] font-bold truncate block pr-2">
                                        {currentCityName || "Ville définie"}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStep(1)}
                                    className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white rounded-lg px-3"
                                >
                                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Modifier
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="loc-name" className="text-slate-300 font-medium">Rechercher un lieu <span className="text-red-400">*</span></Label>
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            id="loc-name"
                                            placeholder="Ex: Bar de la Plage, Gare..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSearchPlace();
                                                }
                                            }}
                                            className="input-rdychk flex-1"
                                        />
                                        <Button onClick={() => handleSearchPlace()} disabled={isSearchingPlace || !searchQuery.trim()} className="bg-white/10 hover:bg-white/20 px-3 border border-white/10 rounded-xl h-12">
                                            <Search className="w-5 h-5 text-white" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Results Rendering */}
                                {isSearchingPlace && (
                                    <div className="flex justify-center p-6">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                    </div>
                                )}

                                {!isSearchingPlace && placeResults.length > 0 && (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                        <p className="text-xs text-slate-500 font-medium mb-3">Sélectionnez un lieu dans la liste :</p>
                                        {placeResults.map((place) => (
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

                                {!isSearchingPlace && placeResults.length === 0 && searchQuery && !selectedPlaceId && (
                                    <div className="text-center p-4 text-xs text-slate-400">
                                        Aucun résultat pour cette ville. Essayez d'être plus précis ou lancez une recherche.
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
                    )}
                </div>
            </DialogContent>
        </Dialog >
    );
}
