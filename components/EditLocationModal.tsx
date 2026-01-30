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

interface EditLocationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    existingLocation?: { name: string; address?: string; link?: string } | null;
    currentMemberName: string | null;
    currentMemberId: string | null;
}

export function EditLocationModal({ isOpen, onOpenChange, groupId, existingLocation, currentMemberName, currentMemberId }: EditLocationModalProps) {
    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [saving, setSaving] = useState(false);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);
    const [preview, setPreview] = useState<{ title?: string; description?: string; image?: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (existingLocation) {
                setName(existingLocation.name || '');
                setLink(existingLocation.link || '');
            } else {
                setName('');
                setLink('');
            }
        }
    }, [isOpen, existingLocation]);

    // Debounced preview fetch
    useEffect(() => {
        const fetchPreview = async () => {
            if (!link || !link.startsWith('http')) {
                setPreview(null);
                return;
            }

            setIsFetchingPreview(true);
            try {
                const res = await fetch(`/api/og?url=${encodeURIComponent(link)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.title || data.image) { // Only set if we got meaningful data
                        setPreview(data);
                        if (data.title) {
                            // Clean up Google Maps title: remove " - Google Maps" and unwanted separators like " · "
                            let cleanName = data.title.replace(/ - Google Maps$/, '');
                            cleanName = cleanName.split(' · ')[0];
                            setName(cleanName);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch preview", error);
            } finally {
                setIsFetchingPreview(false);
            }
        };

        const timer = setTimeout(fetchPreview, 1000);
        return () => clearTimeout(timer);
    }, [link]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);

        const newLocation = {
            name: name.trim(),
            link: link.trim() || null,
            address: '', // We are simplifying to just name + link per user request
            image: preview?.image || null,
            description: preview?.description || null,
            preview_title: preview?.title || null,
            proposed_by: currentMemberName,
            proposed_by_id: currentMemberId
        };

        try {
            const { error } = await supabase
                .from('groups')
                .update({ location: newLocation })
                .eq('id', groupId);

            if (error) throw error;

            // Reset votes when location changes
            await supabase.from('location_votes').delete().eq('group_id', groupId);

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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Modifier le lieu</DialogTitle>
                    <DialogDescription>
                        Indiquez où le groupe doit se retrouver.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="loc-name">Nom du lieu <span className="text-destructive">*</span></Label>
                        <Input
                            id="loc-name"
                            placeholder="Ex: Bar de la Plage, Chez Marco..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="loc-link">Lien Google Maps (facultatif)</Label>
                        <Input
                            id="loc-link"
                            placeholder="https://maps.google.com/..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Permet aux membres d'ouvrir l'itinéraire directement.
                        </p>

                        {/* Link Preview */}
                        {(isFetchingPreview || preview) && (
                            <div className="mt-2 border rounded-md overflow-hidden bg-muted/30">
                                {isFetchingPreview ? (
                                    <div className="p-3 flex items-center gap-2 text-muted-foreground text-sm">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Chargement de l'aperçu...
                                    </div>
                                ) : preview && (
                                    <div className="flex h-16">
                                        {preview.image && (
                                            <div className="w-20 h-full shrink-0 relative border-r">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={preview.image}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        )}
                                        <div className="p-2 flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="font-semibold text-xs line-clamp-1">{preview.title}</div>
                                            {preview.description && (
                                                <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                                                    {preview.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={saving || !name.trim() || isFetchingPreview}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                "Valider le lieu"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
