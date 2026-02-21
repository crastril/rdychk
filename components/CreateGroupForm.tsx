'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { GroupTypeSelector } from '@/components/GroupTypeSelector';

export default function CreateGroupForm() {
    const { user } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState<'remote' | 'in_person'>('remote');
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

        // 1. Database Operation
        let uniqueSlug = '';
        try {
            const slug = createSlug(groupName);
            uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;

            const { error: dbError } = await supabase
                .from('groups')
                .insert({
                    name: groupName,
                    slug: uniqueSlug,
                    created_by: user?.id,
                    type: groupType
                });

            if (dbError) throw dbError;

        } catch (error: any) {
            console.error('Group creation failed:', error);
            alert("Erreur lors de la création du groupe: " + (error?.message || "Erreur inconnue"));
            setLoading(false);
            return; // Stop here if DB failed
        }

        // 2. Navigation
        try {
            router.push(`/group/${uniqueSlug}`);
        } catch (error: any) {
            // Only ignore navigation-related AbortErrors here
            if (error?.message?.includes('NEXT_REDIRECT') || error?.name === 'AbortError') {
                return;
            }
            console.error('Navigation failed:', error);
            // Even if nav fails, we stop loading so user knows. 
            // Ideally we might show a link "Click here to go to group" if auto-redirect dies.
            setLoading(false);
        }
        // Note: We don't finally{setLoading(false)} because if router.push succeeds (and yields),
        // we want the spinner to stay until the new page loads (or component unmounts).
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="groupName">Nom du groupe</Label>
                    <Input
                        id="groupName"
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Entrez le nom du groupe..."
                        required
                        className="h-12 text-lg"
                        disabled={loading}
                    />
                </div>
                <div className="space-y-4">
                    <Label>Type de groupe</Label>
                    <GroupTypeSelector
                        value={groupType}
                        onValueChange={setGroupType}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all"
                    disabled={loading || !groupName.trim()}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                        <>
                            Créer
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
