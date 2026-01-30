import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowBigUp, ArrowBigDown, Target, ArrowLeft, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Group } from "@/types/database";
import { EditLocationModal } from "./EditLocationModal";

interface LocationCardProps {
    group: Group;
    memberId: string | null;
    isAdmin: boolean;
    currentMemberName: string | null;
}

export function LocationCard({ group, memberId, isAdmin, currentMemberName }: LocationCardProps) {
    const [score, setScore] = useState(0);
    const [userVote, setUserVote] = useState<number>(0); // 0, 1, or -1
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState<'edit' | 'counter' | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const hasLocation = !!(group.location as any)?.name;

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

        let nextVote = newVote;
        if (userVote === newVote) {
            // Toggle off
            nextVote = 0 as any; // logic helper
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
            <Card className="border-primary/20 bg-primary/5">
                <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-2">
                        <CardTitle className="text-sm font-bold shrink-0 flex items-center gap-1">
                            Lieu {score > 0 ? "🔥" : score < 0 ? "💩" : ""}
                        </CardTitle>
                        {hasLocation && (
                            <>
                                <span className="text-muted-foreground shrink-0">|</span>
                                <span className="text-sm font-medium truncate">{group.location?.name}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {hasLocation && score !== 0 && (
                            <span className={cn("text-xs font-bold", score > 0 ? "text-orange-600" : "text-amber-900")}>
                                {score > 0 ? `+${score}` : score}
                            </span>
                        )}
                        {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                    </div>
                </div>

                {!isCollapsed && (
                    <CardContent className="p-3 pt-0 flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex flex-col flex-1 min-w-0">
                            {!hasLocation ? (
                                <div className="text-muted-foreground italic text-xs">
                                    {isAdmin ? "Aucun lieu défini. Proposez-en un !" : "Le lieu n'a pas encore été défini par l'administrateur."}
                                </div>
                            ) : (
                                <div>
                                    {group.location?.address && (
                                        <p className="text-xs text-muted-foreground mb-1">{group.location.address}</p>
                                    )}

                                    {/* Link Preview */}
                                    {(group.location?.image || group.location?.description) && (
                                        <div className="border rounded-md overflow-hidden bg-background/50 hover:bg-background/80 transition-colors group/preview max-w-sm" onClick={(e) => e.stopPropagation()}>
                                            <a
                                                href={group.location?.link || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex h-16"
                                            >
                                                {group.location?.image && (
                                                    <div className="w-20 h-full shrink-0 relative border-r">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={group.location.image}
                                                            alt="Location preview"
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-2 flex-1 min-w-0 flex flex-col justify-center">
                                                    {group.location?.preview_title && (
                                                        <div className="font-semibold text-xs line-clamp-1 mb-0.5">
                                                            {group.location.preview_title}
                                                        </div>
                                                    )}
                                                    {group.location?.description && (
                                                        <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                                                            {group.location.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isAdmin && (
                                <div className="mt-2 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-7 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditMode('edit');
                                        }}
                                    >
                                        <Pencil className="h-3 w-3" />
                                        Modifier
                                    </Button>
                                </div>
                            )}

                            {/* Counter Proposal Button - Visible to everyone if score < 0 */}
                            {score < 0 && (
                                <div className="mt-2 pt-1 border-t border-dashed border-destructive/30">
                                    <p className="text-xs text-destructive mb-2 font-medium">Ce lieu ne semble pas convenir...</p>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full text-xs h-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditMode('counter');
                                        }}
                                    >
                                        <Target className="h-3 w-3 mr-2" />
                                        Faire une contre-proposition
                                    </Button>
                                </div>
                            )}

                            {/* Proposed By Footer */}
                            {group.location?.proposed_by && (
                                <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground text-right italic">
                                    Proposé par {group.location.proposed_by}
                                </div>
                            )}
                        </div>

                        {/* Voting Column - Only show if location exists */}
                        {hasLocation && (
                            <div className="flex flex-col justify-center items-center gap-0.5 bg-background/50 rounded-lg p-1 border shadow-sm self-start shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 hover:bg-orange-100 transition-all",
                                        userVote === 1 && "bg-orange-100 shadow-sm"
                                    )}
                                    onClick={(e) => handleVote(1, e)}
                                    disabled={loading}
                                >
                                    <span className="text-xl">🔥</span>
                                </Button>

                                <span className={cn("text-xs font-bold min-w-[20px] text-center",
                                    userVote === 1 && "text-orange-600",
                                    userVote === -1 && "text-amber-900"
                                )}>
                                    {score}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 hover:bg-amber-100 transition-all",
                                        userVote === -1 && "bg-amber-100 shadow-sm"
                                    )}
                                    onClick={(e) => handleVote(-1, e)}
                                    disabled={loading}
                                >
                                    <span className="text-xl">💩</span>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            <EditLocationModal
                isOpen={!!editMode}
                onOpenChange={(open) => !open && setEditMode(null)}
                groupId={group.id}
                existingLocation={editMode === 'edit' ? (group.location as any) : null}
                currentMemberName={currentMemberName}
                currentMemberId={memberId}
            />
        </>
    );
}
