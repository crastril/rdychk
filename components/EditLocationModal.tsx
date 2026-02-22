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
            <DialogContent className="max-w-md glass-panel border-white/10 text-white rounded-3xl p-6">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-bold">Modifier le lieu</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Indiquez où le groupe doit se retrouver.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="loc-name" className="text-slate-300 font-medium">Nom du lieu <span className="text-red-400">*</span></Label>
                        <Input
                            id="loc-name"
                            placeholder="Ex: Bar de la Plage, Chez Marco..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-[var(--v2-primary)] rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="loc-link" className="text-slate-300 font-medium">Lien Google Maps (facultatif)</Label>
                        <Input
                            id="loc-link"
                            placeholder="https://maps.google.com/..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="h-11 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-[var(--v2-primary)] rounded-xl"
                        />
                        <p className="text-xs text-slate-500">
                            Permet aux membres d&apos;ouvrir l&apos;itinéraire directement.
                        </p>

                        {/* Link Preview */}
                        {(isFetchingPreview || preview) && (
                            <div className="mt-2 border border-white/10 rounded-xl overflow-hidden bg-white/5">
                                {isFetchingPreview ? (
                                    <div className="p-3 flex items-center gap-2 text-slate-400 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Chargement de l&apos;aperçu...
                                    </div>
                                ) : preview && (
                                    <div className="flex h-20">
                                        {preview.image && (
                                            <div className="w-24 h-full shrink-0 relative border-r border-white/10">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={preview.image}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        )}
                                        <div className="p-3 flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="font-bold text-sm text-white line-clamp-1">{preview.title}</div>
                                            {preview.description && (
                                                <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight mt-1">
                                                    {preview.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 mt-2 border-t border-white/10">
                        <Button
                            onClick={handleSave}
                            disabled={saving || !name.trim() || isFetchingPreview}
                            className="w-full bg-[var(--v2-primary)] text-white hover:bg-[var(--v2-primary)]/80 font-bold h-12 rounded-xl transition-all shadow-neon-primary"
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
            </DialogContent>
        </Dialog >
    );
}
