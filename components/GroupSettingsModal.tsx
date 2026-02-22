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
import { Loader2, LogOut } from 'lucide-react';
import { GroupTypeSelector } from '@/components/GroupTypeSelector';
import { ModeToggle } from '@/components/mode-toggle';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    onLeaveGroup?: () => void;
}

export function GroupSettingsModal({ isOpen, onOpenChange, groupId, onLeaveGroup }: GroupSettingsModalProps) {
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
            <DialogContent className="max-w-md glass-panel border-white/10 text-white p-6 rounded-3xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        Paramètres du groupe
                        <ModeToggle />
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

                        <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-[var(--v2-primary)] text-white hover:bg-[var(--v2-primary)]/80 font-bold h-12 rounded-xl transition-all shadow-neon-primary"
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
            </DialogContent>
        </Dialog>
    );
}
