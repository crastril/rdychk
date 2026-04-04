'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CircleNotch, MapPin, MagnifyingGlass, Check } from '@phosphor-icons/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    city?: string | null;
    baseLat?: number | null;
    baseLng?: number | null;
    onSubmit: (data: { name: string; link?: string; description?: string; image?: string | null }) => Promise<void>;
}

export function AddLocationProposalModal({ isOpen, onClose, city, baseLat, baseLng, onSubmit }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchingPlace, setIsSearchingPlace] = useState(false);
    const [placeResults, setPlaceResults] = useState<any[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [locationData, setLocationData] = useState<{
        name: string;
        address: string;
        link: string;
        image: string | null;
    }>({ name: '', address: '', link: '', image: null });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setPlaceResults([]);
            setSelectedPlaceId(null);
            setDescription('');
            setLocationData({ name: '', address: '', link: '', image: null });
        }
    }, [isOpen]);

    const handleSearchPlace = async () => {
        if (!searchQuery.trim()) return;
        setIsSearchingPlace(true);
        setPlaceResults([]);
        setSelectedPlaceId(null);

        let url = `/api/places?q=${encodeURIComponent(searchQuery)}`;
        if (city) {
            url += `&city=${encodeURIComponent(city)}`;
        }
        if (baseLat && baseLng) {
            url += `&lat=${baseLat}&lng=${baseLng}`;
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.results) {
                setPlaceResults(data.results);
            }
        } catch (err) {
            console.error("MagnifyingGlass failed", err);
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

    const handleSubmit = async () => {
        if (!locationData.name?.trim() && !searchQuery.trim()) return;
        setLoading(true);

        const finalName = locationData.name?.trim() || searchQuery.trim();

        await onSubmit({
            name: finalName,
            link: locationData.link?.trim() || undefined,
            description: description?.trim() || undefined,
            image: locationData.image || null,
        });

        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden flex flex-col" style={{ position: 'fixed', top: '5vh', left: '50%', transform: 'translateX(-50%)', maxHeight: '85dvh', width: 'calc(100% - 2rem)' }}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)] shrink-0" />

                <div className="p-6 flex flex-col h-full overflow-hidden">
                    <DialogHeader className="mb-4 shrink-0">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[var(--v2-primary)]" />
                            Proposer un lieu
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Recherchez un endroit pour votre groupe{city ? ` à ${city}` : ""}. Les résultats privilégient la ville du groupe.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto pr-1 pb-4 flex-1">
                        <div>
                            <Label htmlFor="loc-name" className="text-slate-300 font-medium text-xs tracking-wide uppercase">Rechercher *</Label>
                            <div className="flex gap-2 mt-2 items-center">
                                <Input
                                    id="loc-name"
                                    placeholder="Ex: Bar de la Plage..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSelectedPlaceId(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearchPlace();
                                        }
                                    }}
                                    className="w-full h-11 rounded-xl glass-input px-4 text-sm placeholder-slate-500 focus:border-[var(--v2-primary)] transition-all flex-1"
                                    autoFocus
                                />
                                <Button
                                    onClick={() => handleSearchPlace()}
                                    disabled={isSearchingPlace || !searchQuery.trim()}
                                    className="bg-[var(--v2-primary)]/20 hover:bg-[var(--v2-primary)]/40 text-[var(--v2-primary)] border border-[var(--v2-primary)]/30 rounded-xl w-11 h-11 transition-all p-0 flex items-center justify-center shrink-0"
                                >
                                    <MagnifyingGlass className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Results Rendering */}
                        {isSearchingPlace && (
                            <div className="flex justify-center p-6 shrink-0">
                                <CircleNotch className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        )}

                        {!isSearchingPlace && placeResults.length > 0 && (
                            <div className="space-y-2 shrink-0">
                                <p className="text-xs text-slate-500 font-medium mb-2">Sélectionnez un lieu :</p>
                                {placeResults.map((place) => (
                                    <div
                                        key={place.place_id}
                                        onClick={() => selectPlace(place)}
                                        className={`p-2 border rounded-xl flex gap-3 cursor-pointer transition-colors ${selectedPlaceId === place.place_id ? 'border-[var(--v2-primary)] bg-[var(--v2-primary)]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        {place.image ? (
                                            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={place.image} alt={place.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-slate-500" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                                            <div className="font-bold text-sm text-white line-clamp-1 flex items-center justify-between">
                                                {place.name}
                                                {selectedPlaceId === place.place_id && <Check className="w-4 h-4 text-[var(--v2-primary)] shrink-0 ml-2" />}
                                            </div>
                                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">{place.formatted_address}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isSearchingPlace && placeResults.length === 0 && searchQuery && !selectedPlaceId && (
                            <div className="text-center p-4 text-xs text-slate-400 shrink-0">
                                Aucun résultat trouvé près de votre groupe.
                            </div>
                        )}

                        {selectedPlaceId && (
                            <div className="shrink-0 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                                    Note (optionnelle)
                                </Label>
                                <textarea
                                    className="w-full rounded-xl glass-input px-4 py-3 text-sm placeholder-slate-500 focus:border-[var(--v2-primary)] transition-all resize-none"
                                    placeholder="Pourquoi ce lieu ? (Ambiance, prix...)"
                                    rows={2}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/10 shrink-0 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || (!selectedPlaceId && !searchQuery.trim())}
                            className="flex-1 h-12 rounded-xl btn-massive text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : 'Proposer'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
