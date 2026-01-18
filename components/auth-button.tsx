"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Loader2, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AuthModal } from "./auth-modal";
import { useState } from "react";

interface AuthButtonProps {
    view?: 'default' | 'icon';
    className?: string;
}

export function AuthButton({ view = 'default', className }: AuthButtonProps) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    if (loading) {
        return <Button variant="ghost" size="icon" disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>;
    }

    if (!user) {
        // Always show connection button if not logged in
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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative h-9 w-9 rounded-full ${className}`}>
                    <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name || "User"} />
                        <AvatarFallback>{profile?.display_name?.slice(0, 2).toUpperCase() || <UserIcon className="w-4 h-4" />}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.display_name || "Utilisateur"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
