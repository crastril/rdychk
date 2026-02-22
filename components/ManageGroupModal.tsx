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
import { kickMemberAction } from '@/app/actions/member';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { Member } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface ManageGroupModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    slug: string;
    members: Member[];
    loading?: boolean;
    onRefresh?: () => Promise<void>;
    currentMemberId: string | null;
}

export function ManageGroupModal({ isOpen, onOpenChange, slug, members, loading, onRefresh, currentMemberId }: ManageGroupModalProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteMember = async (targetId: string) => {
        if (!currentMemberId) return;
        if (!confirm('Voulez-vous vraiment exclure ce membre du groupe ?')) return;

        setDeletingId(targetId);
        try {
            const result = await kickMemberAction(slug, currentMemberId, targetId);
            if (!result.success) {
                console.error('Kick failed:', result.error);
                return;
            }
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Error kicking member:', error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-lg h-[80vh] flex flex-col p-0 glass-panel border-white/10 text-white rounded-3xl overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-white/10 bg-black/20">
                    <DialogTitle className="text-xl font-bold">Gérer les membres</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Liste des membres du groupe.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 pt-4">
                    <div className="space-y-3 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {loading && members.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Aucun membre trouvé.</p>
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--v2-primary)]/20 to-transparent border border-[var(--v2-primary)]/30 flex items-center justify-center text-sm font-bold shadow-neon-primary text-white">
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
                                                {member.name}
                                                <span className="flex items-center gap-1">
                                                    {member.id === currentMemberId && <Badge variant="secondary" className="text-[10px] h-4 bg-white/10 text-white hover:bg-white/20 border-white/20">Vous</Badge>}
                                                    {member.role === 'admin' && <Badge variant="outline" className="text-[10px] h-4 border-[var(--v2-primary)] text-[var(--v2-primary)] bg-[var(--v2-primary)]/10">Admin</Badge>}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {member.id !== currentMemberId ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                                            onClick={() => handleDeleteMember(member.id)}
                                            disabled={deletingId === member.id}
                                        >
                                            {deletingId === member.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-5 h-5" />
                                            )}
                                        </Button>
                                    ) : (
                                        <div className="h-10 w-10 flex items-center justify-center">
                                            <ShieldAlert className="w-5 h-5 text-slate-600" />
                                        </div>
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
