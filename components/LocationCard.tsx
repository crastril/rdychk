import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowBigUp, ArrowBigDown, Target, ArrowLeft, Pencil, ChevronDown, ChevronUp, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Group } from "@/types/database";
import { EditLocationModal } from "./EditLocationModal";

interface LocationCardProps {
    group: Group;
    slug: string;
    memberId: string | null;
    isAdmin: boolean;
    currentMemberName: string | null;
    initialEditMode?: 'edit' | 'counter' | null;
    onRemove?: () => void;
    onLocationUpdate: (location: { name?: string | null; address?: string | null; link?: string | null; image?: string | null;[key: string]: string | null | undefined }) => void;
}

export function LocationCard({ group, slug, memberId, isAdmin, currentMemberName, initialEditMode, onRemove, onLocationUpdate }: LocationCardProps) {
    const [score, setScore] = useState(0);
    const [userVote, setUserVote] = useState<number>(0); // 0, 1, or -1
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState<'edit' | 'counter' | null>(initialEditMode || null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const hasLocation = !!(group.location as { name?: string })?.name;

    useEffect(() => {
        if (initialEditMode) {
            setEditMode(initialEditMode);
        }
    }, [initialEditMode]);

    useEffect(() => {
        if (!group.id) return;
        fetchVotes();

        // Subscribe to vote changes
        const channel = supabase
            .channel(`votes:${group.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'location_votes',
                    filter: `group_id=eq.${group.id}`,
                },
                () => {
                    fetchVotes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [group.id, memberId]); // Re-fetch if memberId changes (e.g. join/leave)

    const fetchVotes = async () => {
        // 1. Get total score
        const { data: allVotes } = await supabase
            .from('location_votes')
            .select('vote')
            .eq('group_id', group.id);

        if (allVotes) {
            const total = allVotes.reduce((acc, curr) => acc + curr.vote, 0);
            setScore(total);
        }

        // 2. Get user's vote if memberId is present
        if (memberId) {
            const { data: myVote } = await supabase
                .from('location_votes')
                .select('vote')
                .eq('group_id', group.id)
                .eq('member_id', memberId)
                .single();

            if (myVote) {
                setUserVote(myVote.vote);
            } else {
                setUserVote(0);
            }
        }
    };

    const handleVote = async (newVote: 1 | -1, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card collapse when clicking vote
        if (!memberId) return;
        setLoading(true);

        // Optimistic update
        const previousVote = userVote;
        const previousScore = score;

        let nextVote: number = newVote;
        if (userVote === newVote) {
            // Toggle off
            nextVote = 0;
            setUserVote(0);
            setScore(prev => prev - newVote);
        } else {
            // Change vote
            setUserVote(newVote);
            setScore(prev => prev - userVote + newVote);
        }

        try {
            if (previousVote === newVote) {
                // Delete vote
                await supabase
                    .from('location_votes')
                    .delete()
                    .eq('group_id', group.id)
                    .eq('member_id', memberId);
            } else {
                // Upsert vote
                await supabase
                    .from('location_votes')
                    .upsert({
                        group_id: group.id,
                        member_id: memberId,
                        vote: newVote
                    });
            }
        } catch (error) {
            // Revert on error
            console.error("Vote failed", error);
            setUserVote(previousVote);
            setScore(previousScore);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 relative group/card">
                {isAdmin && hasLocation && onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-black/60 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-all flex items-center justify-center z-30 opacity-0 group-hover/card:opacity-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                <div className="flex gap-4 items-center">
                    {/* Left: Image or Icon */}
                    <div className="h-16 w-16 rounded-xl bg-white/10 shrink-0 border border-white/5 overflow-hidden relative flex items-center justify-center">
                        {group.location?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={group.location.image}
                                alt="Location preview"
                                className="w-full h-full object-cover absolute inset-0"
                                referrerPolicy="no-referrer"
                            />
                        ) : hasLocation ? (
                            <Target className="w-8 h-8 text-white/30" />
                        ) : (
                            <div className="w-8 h-8 border-2 border-dashed border-white/30 rounded-full" />
                        )}
                    </div>

                    {/* Middle: Info */}
                    <div
                        className="flex-grow min-w-0 flex flex-col justify-center cursor-pointer"
                        onClick={() => {
                            if (group.location?.link) {
                                window.open(group.location.link, '_blank', 'noopener,noreferrer');
                            }
                        }}
                    >
                        {hasLocation ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-white truncate text-lg">
                                        {group.location?.preview_title || group.location?.name || "Lieu inconnu"}
                                    </h3>
                                </div>
                                {(group.location?.description || group.location?.address) && (
                                    <p className="text-sm text-slate-400 truncate flex items-center gap-1">
                                        {group.location?.address}
                                    </p>
                                )}
                                {group.location?.proposed_by && (
                                    <div className="text-[10px] text-slate-500 italic mt-0.5">
                                        Proposé par {group.location.proposed_by}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-slate-400 italic text-sm">
                                {isAdmin ? "Aucun lieu défini. Proposez-en un !" : "Le lieu n'a pas encore été défini."}
                            </div>
                        )}
                    </div>

                    {/* Right: Voting */}
                    {hasLocation && (
                        <div className="flex flex-col items-center gap-1 shrink-0 bg-white/5 rounded-xl p-1 border border-white/5">
                            <button
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    userVote === 1 ? "text-green-400 bg-green-400/20" : "text-slate-400 hover:text-green-400 hover:bg-green-400/10"
                                )}
                                onClick={(e) => handleVote(1, e)}
                                disabled={loading}
                            >
                                <ChevronUp className="w-5 h-5 stroke-[3]" />
                            </button>
                            <span className={cn(
                                "font-bold text-sm",
                                score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : "text-white"
                            )}>
                                {score > 0 ? `+${score}` : score}
                            </span>
                            <button
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    userVote === -1 ? "text-red-400 bg-red-400/20" : "text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                )}
                                onClick={(e) => handleVote(-1, e)}
                                disabled={loading}
                            >
                                <ChevronDown className="w-5 h-5 stroke-[3]" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Actions: Edit / Counter-Proposal */}
                {(isAdmin || (hasLocation && score < 0)) && (
                    <div className="flex items-center justify-end gap-2 mt-1 border-t border-white/5 pt-2">
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-slate-400 hover:text-white hover:bg-white/10 px-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditMode('edit');
                                }}
                            >
                                <Pencil className="h-3 w-3 mr-1" />
                                Modifier
                            </Button>
                        )}

                        {hasLocation && score < 0 && (
                            <Button
                                variant="link"
                                size="sm"
                                className="h-6 text-xs text-red-400 hover:text-red-300 px-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditMode('counter');
                                }}
                            >
                                <Target className="h-3 w-3 mr-1" />
                                Faire une contre-proposition
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <EditLocationModal
                isOpen={!!editMode}
                onOpenChange={(open) => !open && setEditMode(null)}
                groupId={group.id}
                slug={slug}
                existingLocation={editMode === 'edit' && group.location && (group.location as { name?: string | null })?.name ? (group.location as { name: string; address?: string; link?: string; image?: string }) : null}
                currentMemberName={currentMemberName}
                currentMemberId={memberId}
                onLocationUpdate={onLocationUpdate}
            />
        </>
    );
}
