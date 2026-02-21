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
import { GroupTypeSelector } from '@/components/GroupTypeSelector';

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
            setGroupType((data.type as 'remote' | 'in_person') || 'remote');
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
                        <GroupTypeSelector
                            value={groupType}
                            onValueChange={(val) => setGroupType(val)}
                            idPrefix="settings-"
                        />

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
