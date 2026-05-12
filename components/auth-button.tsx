import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOut, CircleNotch, User as UserIcon, PencilSimple, ClockCounterClockwise } from '@phosphor-icons/react';
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AuthModal } from "./auth-modal";
import { ProfileModal } from "./profile-modal";
import { GroupHistoryModal } from "./GroupHistoryModal";
import { useEffect, useState } from "react";

interface AuthButtonProps {
    view?: 'default' | 'icon';
    className?: string;
    isRemote?: boolean;
}

export function AuthButton({ view = 'default', className, isRemote }: AuthButtonProps) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Auto-open profile modal if profile is inferred (not saved in DB)
    useEffect(() => {
        if (profile?.is_inferred) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowProfileModal(true);
        }
    }, [profile]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    if (loading) {
        return <Button variant="ghost" size="icon" disabled><CircleNotch className="w-4 h-4 animate-spin" /></Button>;
    }

    if (!user) {
        // Group context — themed connexion button
        if (isRemote !== undefined) {
            const trigger = isRemote ? (
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
                    style={{ border: '1px solid rgba(168,85,247,0.25)', borderRadius: '3px', background: 'transparent', color: '#a78bfa', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}
                >
                    Connexion
                </button>
            ) : (
                <button
                    className="font-black uppercase transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    style={{
                        fontFamily: 'var(--font-barlow-condensed)',
                        fontSize: '0.9rem',
                        letterSpacing: '0.05em',
                        background: 'transparent',
                        border: '2px solid rgba(255,255,255,0.18)',
                        borderRadius: '12px',
                        color: 'rgba(255,255,255,0.6)',
                        padding: '6px 16px',
                        boxShadow: '3px 3px 0 #000',
                        cursor: 'pointer',
                    }}
                >
                    Connexion
                </button>
            );
            return <AuthModal open={open} onOpenChange={setOpen} trigger={trigger} />;
        }

        // Default (home page)
        return (
            <AuthModal
                open={open}
                onOpenChange={setOpen}
                trigger={
                    <Button variant="outline" className={className}>
                        Connexion
                    </Button>
                }
            />
        );
    }

    const avatarContent = (
        <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name || "User"} />
            <AvatarFallback>{profile?.display_name?.slice(0, 2).toUpperCase() || <UserIcon className="w-4 h-4" />}</AvatarFallback>
        </Avatar>
    );

    return (
        <>
            <ProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} />
            <GroupHistoryModal open={showHistory} onOpenChange={setShowHistory} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {isRemote !== undefined ? (
                        <button
                            className="relative flex items-center justify-center transition-all p-0"
                            style={{
                                width: 36, height: 36, borderRadius: '50%',
                                border: isRemote ? '1px solid rgba(168,85,247,0.3)' : '2px solid rgba(255,255,255,0.18)',
                                background: 'transparent',
                                boxShadow: isRemote ? undefined : '2px 2px 0 #000',
                                cursor: 'pointer',
                            }}
                        >
                            {avatarContent}
                        </button>
                    ) : (
                        <Button variant="ghost" className={`relative h-9 w-9 rounded-full ${className}`}>
                            {avatarContent}
                        </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Bonjour {profile?.display_name?.split(' ')[0] || "!"}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="cursor-pointer">
                        <PencilSimple className="mr-2 h-4 w-4" />
                        <span>Modifier mon profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowHistory(true)} className="cursor-pointer">
                        <ClockCounterClockwise className="mr-2 h-4 w-4" />
                        <span>Historique</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 cursor-pointer">
                        <SignOut className="mr-2 h-4 w-4" />
                        <span>Se déconnecter</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
