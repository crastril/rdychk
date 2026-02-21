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
        if (!user) return;
        setLoading(true);
        try {
            // Get membership details with joined group data
            const { data, error } = await supabase
                .from('members')
                .select('id, group_id, joined_at, groups(name, slug)')
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;

            if (!data) {
                setGroups([]);
                return;
            }

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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <History className="w-6 h-6" />
                            Historique des groupes
                        </DialogTitle>
                        <DialogDescription>
                            Retrouvez tous les groupes que vous avez rejoints.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[300px] pr-4 mt-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-full min-h-[100px]">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <p>Vous n&apos;avez rejoint aucun groupe pour le moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {groups.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                                    >
                                        <Link
                                            href={`/group/${item.groups.slug}`}
                                            className="flex-1 min-w-0 mr-4"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate block">
                                                    {item.groups.name}
                                                </span>
                                                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                Rejoint le {new Date(item.joined_at).toLocaleDateString()}
                                            </span>
                                        </Link>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setConfirmLeaveId(item.group_id)}
                                            disabled={leavingId === item.group_id}
                                        >
                                            {leavingId === item.group_id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <LogOut className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmLeaveId} onOpenChange={(open) => !open && setConfirmLeaveId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Quitter ce groupe ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous ne ferez plus partie de ce groupe. Vous pourrez toujours le rejoindre plus tard si vous avez le lien.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleLeaveGroup(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Quitter
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
