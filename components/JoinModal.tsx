'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useEffect } from 'react';

interface JoinModalProps {
    onJoin: (name: string) => void;
    groupName?: string;
}

export default function JoinModal({ onJoin, groupName }: JoinModalProps) {
    const [name, setName] = useState('');
    const { profile, user } = useAuth();

    const [isAutoJoining, setIsAutoJoining] = useState(false);

    useEffect(() => {
        if (profile?.display_name && !isAutoJoining) {
            setName(profile.display_name);
            // Auto-join if we have a name from the profile
            setIsAutoJoining(true);
            onJoin(profile.display_name);
        }
    }, [profile, onJoin, isAutoJoining]);

    if (isAutoJoining) {
        return (
            <Dialog open={true}>
                <DialogContent>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <Sparkles className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Rejoindre en tant que {profile?.display_name}...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onJoin(name.trim());
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Rejoindre le groupe {groupName}</DialogTitle>
                    <DialogDescription className="text-base">
                        Entrez votre nom pour rejoindre la session.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-muted-foreground font-medium">Votre Nom</Label>
                        <div className="relative">
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Entrez votre nom..."
                                autoFocus
                                maxLength={20}
                                required
                                className="h-11"
                            />
                            {user && !name && (
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground animate-pulse">
                                    Utilisation du profil...
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
                            size="lg"
                        >
                            Rejoindre
                            <Sparkles className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
}
