'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CircleNotch, MapPin, MagnifyingGlass, Check } from '@phosphor-icons/react';

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
    const [inputFocused, setInputFocused] = useState(false);
    const [noteFocused, setNoteFocused] = useState(false);

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
            <DialogContent
                className="flex flex-col overflow-hidden"
                style={{
                    position: 'fixed',
                    top: '5vh',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxHeight: '85dvh',
                    width: 'calc(100% - 2rem)',
                    maxWidth: 460,
                    background: '#0d0d0d',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 0,
                    boxShadow: '6px 6px 0 #000',
                    padding: 0,
                }}
            >
                {/* Top amber bar */}
                <div style={{ height: 4, background: '#fbbf24', flexShrink: 0 }} />

                {/* Inner wrapper */}
                <div className="flex flex-col overflow-hidden" style={{ padding: 24, height: '100%' }}>
                    <DialogHeader style={{ marginBottom: 16, flexShrink: 0 }}>
                        <DialogTitle
                            className="font-black uppercase tracking-widest flex items-center gap-2"
                            style={{ color: 'white' }}
                        >
                            <MapPin className="w-5 h-5" style={{ color: '#fbbf24' }} />
                            Proposer un lieu
                        </DialogTitle>
                        <DialogDescription style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                            Recherchez un endroit pour votre groupe{city ? ` à ${city}` : ""}. Les résultats privilégient la ville du groupe.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col overflow-y-auto flex-1" style={{ gap: 16, paddingBottom: 4 }}>
                        {/* Search field */}
                        <div>
                            <div
                                className="font-black uppercase tracking-widest text-xs"
                                style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}
                            >
                                Rechercher *
                            </div>
                            <div className="flex gap-2 items-stretch">
                                <div
                                    className="flex-1 flex items-center"
                                    style={{
                                        border: `2px solid ${inputFocused ? '#fbbf24' : 'rgba(255,255,255,0.4)'}`,
                                        borderRadius: 0,
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '8px 12px',
                                        transition: 'border-color 0.15s',
                                    }}
                                >
                                    <input
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
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        autoFocus
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            color: 'white',
                                            fontFamily: 'inherit',
                                            fontSize: 14,
                                            width: '100%',
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => handleSearchPlace()}
                                    disabled={isSearchingPlace || !searchQuery.trim()}
                                    className="flex items-center justify-center shrink-0 transition-transform"
                                    style={{
                                        width: 44,
                                        height: 44,
                                        background: '#fbbf24',
                                        color: '#000',
                                        border: '2px solid #000',
                                        borderRadius: 0,
                                        boxShadow: '2px 2px 0 #000',
                                        cursor: isSearchingPlace || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isSearchingPlace || !searchQuery.trim() ? 0.5 : 1,
                                    }}
                                    onMouseEnter={e => { if (!isSearchingPlace && searchQuery.trim()) e.currentTarget.style.transform = 'translate(-1px,-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                                >
                                    <MagnifyingGlass className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Loading */}
                        {isSearchingPlace && (
                            <div className="flex justify-center" style={{ padding: '16px 0' }}>
                                <CircleNotch className="w-6 h-6 animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />
                            </div>
                        )}

                        {/* Results */}
                        {!isSearchingPlace && placeResults.length > 0 && (
                            <div className="flex flex-col" style={{ gap: 6 }}>
                                {placeResults.map((place) => {
                                    const isSelected = selectedPlaceId === place.place_id;
                                    return (
                                        <div
                                            key={place.place_id}
                                            onClick={() => selectPlace(place)}
                                            className="flex gap-3 cursor-pointer transition-colors"
                                            style={{
                                                border: isSelected ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.12)',
                                                borderRadius: 0,
                                                padding: 8,
                                                background: isSelected ? 'rgba(251,191,36,0.06)' : 'transparent',
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) {
                                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.4)';
                                                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isSelected) {
                                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)';
                                                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            {place.image ? (
                                                <div
                                                    className="shrink-0 overflow-hidden"
                                                    style={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.15)', borderRadius: 0 }}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={place.image} alt={place.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                </div>
                                            ) : (
                                                <div
                                                    className="shrink-0 flex items-center justify-center"
                                                    style={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.15)', borderRadius: 0 }}
                                                >
                                                    <MapPin className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="font-bold text-sm flex items-center justify-between gap-2 line-clamp-1" style={{ color: 'white' }}>
                                                    <span className="truncate">{place.name}</span>
                                                    {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color: '#fbbf24' }} />}
                                                </div>
                                                <div className="line-clamp-1 mt-0.5" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                                                    {place.formatted_address}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* No results */}
                        {!isSearchingPlace && placeResults.length === 0 && searchQuery && !selectedPlaceId && (
                            <div className="text-center" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', padding: '8px 0' }}>
                                Aucun résultat trouvé près de votre groupe.
                            </div>
                        )}

                        {/* Note textarea */}
                        {selectedPlaceId && (
                            <div className="shrink-0">
                                <div
                                    className="font-black uppercase tracking-widest text-xs"
                                    style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}
                                >
                                    Note (optionnelle)
                                </div>
                                <textarea
                                    placeholder="Pourquoi ce lieu ? (Ambiance, prix...)"
                                    rows={2}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    onFocus={() => setNoteFocused(true)}
                                    onBlur={() => setNoteFocused(false)}
                                    className="w-full resize-none"
                                    style={{
                                        border: `2px solid ${noteFocused ? '#fbbf24' : 'rgba(255,255,255,0.3)'}`,
                                        borderRadius: 0,
                                        background: 'rgba(255,255,255,0.03)',
                                        color: 'white',
                                        padding: '10px 12px',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                        outline: 'none',
                                        transition: 'border-color 0.15s',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 shrink-0" style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 font-bold uppercase tracking-widest transition-colors"
                            style={{
                                height: 48,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderRadius: 0,
                                color: 'rgba(255,255,255,0.6)',
                                background: 'transparent',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || (!selectedPlaceId && !searchQuery.trim())}
                            className="flex-1 font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                            style={{
                                height: 48,
                                background: '#fbbf24',
                                color: '#000',
                                border: '2px solid #000',
                                borderRadius: 0,
                                boxShadow: '3px 3px 0 #000',
                                opacity: loading || (!selectedPlaceId && !searchQuery.trim()) ? 0.45 : 1,
                                cursor: loading || (!selectedPlaceId && !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={e => {
                                if (!loading && (selectedPlaceId || searchQuery.trim())) {
                                    e.currentTarget.style.transform = 'translate(-1px,-1px)';
                                    e.currentTarget.style.boxShadow = '4px 4px 0 #000';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '3px 3px 0 #000';
                            }}
                        >
                            {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : 'Proposer'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
