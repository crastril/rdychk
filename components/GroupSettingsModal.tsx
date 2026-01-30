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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
}

export function GroupSettingsModal({ isOpen, onOpenChange, groupId }: GroupSettingsModalProps) {
    const [groupType, setGroupType] = useState<'remote' | 'in_person'>('remote');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen, groupId]);

    const fetchSettings = async () => {
        setLoading(true);
        const { data } = await supabase.from('groups').select('type').eq('id', groupId).single();
        if (data) {
            setGroupType(data.type as any || 'remote');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update group type. 
            // Note: We do NOT clear location data immediately here to be safe, 
            // but the UI will hide it if remote.
            // However, the previous implementation DID clear location on save if remote. 
            // Let's stick to the prompt: just select type. 
            // If switching to remote, we might want to clear location to be clean, but let's just update type for now.

            const { error } = await supabase
                .from('groups')
                .update({ type: groupType })
                .eq('id', groupId);

            if (error) throw error;
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Paramètres du groupe</DialogTitle>
                    <DialogDescription>
                        Choisissez le mode de fonctionnement du groupe.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <RadioGroup value={groupType} onValueChange={(val: any) => setGroupType(val)} className="flex flex-col gap-4">
                            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="remote" id="settings-remote" />
                                <div className="flex-1 cursor-pointer" onClick={() => setGroupType('remote')}>
                                    <Label htmlFor="settings-remote" className="cursor-pointer font-semibold text-base">À distance</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Pas de lieu physique. Idéal pour des appels vidéo ou jeux en ligne.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="in_person" id="settings-in_person" />
                                <div className="flex-1 cursor-pointer" onClick={() => setGroupType('in_person')}>
                                    <Label htmlFor="settings-in_person" className="cursor-pointer font-semibold text-base">Sur place</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Définnissez un lieu de rendez-vous pour que les membres s'y retrouvent.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    "Enregistrer"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
