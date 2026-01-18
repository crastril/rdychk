'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nom du groupe (ex: Soirée vendredi)"
                className="w-full px-6 py-4 text-lg bg-white/20 border-2 border-white/30 rounded-2xl
                 text-white placeholder-white/50
                 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/20
                 transition-all backdrop-blur-sm"
                disabled={loading}
                maxLength={50}
            />

            <button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="w-full px-6 py-4 text-xl font-bold text-white
                 bg-gradient-to-r from-purple-500 to-blue-500
                 rounded-2xl
                 hover:from-purple-600 hover:to-blue-600
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-300 transform active:scale-95
                 shadow-lg hover:shadow-xl"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Création...
                    </span>
                ) : (
                    'Créer le groupe ✨'
                )}
            </button>
        </form>
    );
}
