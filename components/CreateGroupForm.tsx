'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';

export default function CreateGroupForm() {
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const createSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) return;

        setLoading(true);
        try {
            const slug = createSlug(groupName);
            const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;

            const { error } = await supabase
                .from('groups')
                .insert({ name: groupName, slug: uniqueSlug });

            if (error) throw error;

            router.push(`/group/${uniqueSlug}`);
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Erreur lors de la création du groupe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                    id="group-name"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Friday Night Out"
                    disabled={loading}
                    maxLength={50}
                    required
                />
            </div>

            <Button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="w-full"
                size="lg"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
                    </>
                ) : (
                    <>
                        Create Group
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </Button>
        </form>
    );
}
