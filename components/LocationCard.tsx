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
    onLocationUpdate: (location: { name?: string | null; address?: string | null; link?: string | null; image?: string | null;[key: string]: string | null | undefined }) => void;
}

export function LocationCard({ group, memberId, isAdmin, currentMemberName, onLocationUpdate }: LocationCardProps) {
    const [score, setScore] = useState(0);
    const [userVote, setUserVote] = useState<number>(0); // 0, 1, or -1
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState<'edit' | 'counter' | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const hasLocation = !!(group.location as { name?: string })?.name;

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
                    <CardContent className="p-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Main Location Content - Unified Layout */}
                        <div className="flex gap-3 border rounded-lg bg-card/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-default" onClick={(e) => {
                            // If there is a link, open it? Or just let the link inside handle it?
                            // Let's make the whole card clickable if there is a link, except for buttons
                            if (group.location?.link && !(e.target as HTMLElement).closest('button')) {
                                window.open(group.location.link, '_blank');
                            }
                        }}>
                            {/* Left: Image or Icon */}
                            <div className="w-24 bg-muted shrink-0 flex items-center justify-center relative border-r">
                                {group.location?.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={group.location.image}
                                        alt="Location preview"
                                        className="w-full h-full object-cover absolute inset-0"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <Target className="w-8 h-8 text-muted-foreground/30" />
                                )}
                            </div>

                            {/* Middle: Info */}
                            <div className="flex-1 py-2 min-w-0 flex flex-col justify-center gap-1">
                                {hasLocation ? (
                                    <>
                                        <div className="font-semibold text-sm line-clamp-1 leading-tight">
                                            {group.location?.preview_title || group.location?.name || "Lieu inconnu"}
                                        </div>
                                        {(group.location?.description || group.location?.address) ? (
                                            <div className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                                                {group.location?.description || group.location?.address}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic">Aucune description disponible</div>
                                        )}

                                        {/* Proposed By Footer */}
                                        {group.location?.proposed_by && (
                                            <div className="text-[10px] text-muted-foreground italic mt-1">
                                                Proposé par {group.location.proposed_by}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-muted-foreground italic text-xs">
                                        {isAdmin ? "Aucun lieu défini. Proposez-en un !" : "Le lieu n'a pas encore été défini par l'administrateur."}
                                    </div>
                                )}
                            </div>

                            {/* Right: Voting & Actions */}
                            <div className="flex flex-col items-center justify-center border-l bg-muted/20 px-1 py-1 gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {hasLocation && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-7 w-7 hover:bg-orange-100 hover:text-orange-600 transition-all rounded-full",
                                                userVote === 1 && "bg-orange-100 text-orange-600"
                                            )}
                                            onClick={(e) => handleVote(1, e)}
                                            disabled={loading}
                                        >
                                            <ArrowBigUp className={cn("h-5 w-5", userVote === 1 && "fill-current")} />
                                        </Button>

                                        <span className={cn("text-xs font-bold w-full text-center py-0.5",
                                            score > 0 ? "text-orange-600" : score < 0 ? "text-blue-600" : "text-muted-foreground"
                                        )}>
                                            {score}
                                        </span>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-7 w-7 hover:bg-blue-100 hover:text-blue-600 transition-all rounded-full",
                                                userVote === -1 && "bg-blue-100 text-blue-600"
                                            )}
                                            onClick={(e) => handleVote(-1, e)}
                                            disabled={loading}
                                        >
                                            <ArrowBigDown className={cn("h-5 w-5", userVote === -1 && "fill-current")} />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Bottom Actions: Edit / Counter-Proposal */}
                        <div className="flex items-center justify-end gap-2 mt-2">
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-primary px-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditMode('edit');
                                    }}
                                >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Modifier
                                </Button>
                            )}

                            {/* Counter Proposal - Only show if score < 0 or if explicitly requested (but sticking to score < 0 rule for now) */}
                            {hasLocation && score < 0 && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-6 text-xs text-destructive hover:text-destructive/80 px-2"
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
                    </CardContent>
                )}
            </Card>

            <EditLocationModal
                isOpen={!!editMode}
                onOpenChange={(open) => !open && setEditMode(null)}
                groupId={group.id}
                existingLocation={editMode === 'edit' && group.location && (group.location as { name?: string | null })?.name ? (group.location as { name: string; address?: string; link?: string; image?: string }) : null}
                currentMemberName={currentMemberName}
                currentMemberId={memberId}
                onLocationUpdate={onLocationUpdate}
            />
        </>
    );
}
