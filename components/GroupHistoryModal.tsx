'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ExternalLink, LogOut, History, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface JoinedGroup {
    id: string;
    group_id: string;
    joined_at: string;
    groups: {
        name: string;
        slug: string;
    };
}

interface GroupHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GroupHistoryModal({ open, onOpenChange }: GroupHistoryModalProps) {
    const { user } = useAuth();
    const [groups, setGroups] = useState<JoinedGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [leavingId, setLeavingId] = useState<string | null>(null); // group_id to leave
    const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);

    const fetchGroups = async () => {
        if (!user) {
            console.log('GroupHistoryModal: No user in auth context, skipping fetch');
            return;
        }
        setLoading(true);
        console.log('GroupHistoryModal: Fetching history for user:', user.id);
        try {
            // Get membership details with joined group data
            const { data, error } = await supabase
                .from('members')
                .select('id, group_id, joined_at, groups!members_group_id_fkey(name, slug)')
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) {
                console.error('GroupHistoryModal: Supabase error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.log('GroupHistoryModal: No history found in DB for this user ID');
                setGroups([]);
                return;
            }

            console.log(`GroupHistoryModal: Found ${data.length} memberships, transforming...`);

            // Transform data to match JoinedGroup interface
            const joinedGroups: JoinedGroup[] = (data as unknown as any[])
                .map((member) => {
                    // Supabase join can return plural 'groups' or singular 'group' depending on relationship detection
                    const groupData = member.groups || member.group;
                    const group = Array.isArray(groupData) ? groupData[0] : groupData;

                    if (!group) {
                        console.warn('Membership found but related group data is missing (check RLS on groups table):', member);
                        return null;
                    }

                    return {
                        id: member.id,
                        group_id: member.group_id,
                        joined_at: member.joined_at,
                        groups: {
                            name: group.name,
                            slug: group.slug
                        }
                    };
                })
                .filter((item): item is JoinedGroup => item !== null);

            console.log(`GroupHistoryModal: ${joinedGroups.length} history items ready to display`);
            setGroups(joinedGroups);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchGroups();
        }
    }, [open, user]);

    const handleLeaveGroup = async () => {
        if (!user || !confirmLeaveId) return;

        setLeavingId(confirmLeaveId);
        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('group_id', confirmLeaveId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Remove from list locally
            setGroups(prev => prev.filter(g => g.group_id !== confirmLeaveId));
        } catch (error) {
            console.error('Error leaving group:', error);
            alert("Erreur lors de la tentative de quitter le groupe.");
        } finally {
            setLeavingId(null);
            setConfirmLeaveId(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>
                    <div className="p-6">
                        <DialogHeader className="border-b border-white/10 pb-4 mb-2">
                            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                                <History className="w-6 h-6 text-[var(--v2-primary)]" />
                                Historique des groupes
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Retrouvez tous les groupes que vous avez rejoints.
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="h-[300px] pr-4 mt-2 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center items-center h-full min-h-[100px]">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="text-center text-slate-400 py-8">
                                    <p>Vous n&apos;avez rejoint aucun groupe pour le moment.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {groups.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                                        >
                                            <Link
                                                href={`/group/${item.groups.slug}`}
                                                className="flex-1 min-w-0 mr-4"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-white truncate block">
                                                        {item.groups.name}
                                                    </span>
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    Rejoint le {new Date(item.joined_at).toLocaleDateString()}
                                                </span>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl w-10 h-10 shrink-0"
                                                onClick={() => setConfirmLeaveId(item.group_id)}
                                                disabled={leavingId === item.group_id}
                                            >
                                                {leavingId === item.group_id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <LogOut className="w-5 h-5" />
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmLeaveId} onOpenChange={(open) => !open && setConfirmLeaveId(null)}>
                <AlertDialogContent className="glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <div className="p-6">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">Quitter ce groupe ?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400 text-sm mt-2">
                                Vous ne ferez plus partie de ce groupe. Vous pourrez toujours le rejoindre plus tard si vous avez le lien.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 border-t border-white/10 pt-4">
                            <AlertDialogCancel className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white">Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => { e.preventDefault(); handleLeaveGroup(); }}
                                className="rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/30 font-bold"
                            >
                                Quitter
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
