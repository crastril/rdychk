'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { Member } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface ManageGroupModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    members: Member[];
    loading?: boolean;
    onRefresh?: () => Promise<void>;
    currentMemberId: string | null;
}

export function ManageGroupModal({ isOpen, onOpenChange, groupId, members, loading, onRefresh, currentMemberId }: ManageGroupModalProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteMember = async (memberId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce membre du groupe ?")) return;

        setDeletingId(memberId);
        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Error deleting member:', error);
            alert("Erreur lors de la suppression.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-lg h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Gérer les membres</DialogTitle>
                    <DialogDescription>
                        Liste des membres du groupe.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 pt-4">
                    <div className="space-y-4 h-full overflow-y-auto pr-2">
                        {loading && members.length === 0 ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Aucun membre trouvé.</p>
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm flex items-center gap-2">
                                                {member.name}
                                                {member.id === currentMemberId && <Badge variant="secondary" className="text-[10px] h-4">Vous</Badge>}
                                                {member.role === 'admin' && <Badge variant="outline" className="text-[10px] h-4 border-primary text-primary">Admin</Badge>}
                                            </p>
                                        </div>
                                    </div>

                                    {member.id !== currentMemberId ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteMember(member.id)}
                                            disabled={deletingId === member.id}
                                        >
                                            {deletingId === member.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    ) : (
                                        <ShieldAlert className="w-4 h-4 text-muted-foreground/30" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
