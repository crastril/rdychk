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
                    <DialogTitle className="text-2xl">Join Group</DialogTitle>
                    {groupName && (
                        <DialogDescription className="text-base">
                            {groupName}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            autoFocus
                            maxLength={20}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full"
                        size="lg"
                    >
                        Continue
                        <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
