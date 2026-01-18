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

interface JoinModalProps {
    onJoin: (name: string) => void;
    groupName?: string;
}

export default function JoinModal({ onJoin, groupName }: JoinModalProps) {
    const [name, setName] = useState('');

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
