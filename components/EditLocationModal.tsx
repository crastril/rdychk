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
import { usePlacesWidget } from 'react-google-autocomplete';

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
    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [address, setAddress] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (existingLocation) {
                setName(existingLocation.name || '');
                setLink(existingLocation.link || '');
                setAddress(existingLocation.address || ''); // Might be available if previously saved
            } else {
                setName('');
                setLink('');
                setAddress('');
                setImage(null);
            }
        }
    }, [isOpen, existingLocation]);

    const { ref: autocompleteRef } = usePlacesWidget({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        onPlaceSelected: (place: any) => {
            if (place.name) setName(place.name);
            if (place.formatted_address) setAddress(place.formatted_address);
            if (place.url) setLink(place.url);
            if (place.photos && place.photos.length > 0 && typeof place.photos[0].getUrl === 'function') {
                setImage(place.photos[0].getUrl({ maxWidth: 400 }));
            } else {
                setImage(null);
            }
        },
        options: {
            types: ["establishment", "geocode"],
        },
    });

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);

        const newLocation = {
            name: name.trim(),
            link: link.trim() || null,
            address: address.trim() || null,
            image: image || null,
            description: address.trim() || null,
            preview_title: name.trim() || null,
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
                        <div className="space-y-2">
                            <Label htmlFor="loc-name" className="text-slate-300 font-medium">Rechercher un lieu <span className="text-red-400">*</span></Label>
                            <Input
                                id="loc-name"
                                ref={autocompleteRef as any}
                                placeholder="Ex: Bar de la Plage, Paris..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-rdychk"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Sélectionnez une suggestion Google Maps pour ajouter automatiquement l&apos;adresse et l&apos;itinéraire.
                            </p>

                            {/* Link Preview */}
                            {(address || link || image) && (
                                <div className="mt-4 border border-white/10 rounded-xl overflow-hidden bg-white/5 flex h-24">
                                    {image && (
                                        <div className="w-24 h-full shrink-0 relative border-r border-white/10 bg-slate-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                    )}
                                    <div className="p-3 flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="font-bold text-sm text-white line-clamp-1">{name}</div>
                                        {address && (
                                            <div className="text-xs text-slate-400 line-clamp-2 leading-tight mt-1">
                                                {address}
                                            </div>
                                        )}
                                        {link && (
                                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1 line-clamp-1">
                                                Voir sur Google Maps
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 mt-2 border-t border-white/10">
                            <Button
                                onClick={handleSave}
                                disabled={saving || !name.trim()}
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
