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
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nom du groupe (ex: Soirée vendredi)"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                disabled={loading}
            />
            <button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="w-full px-6 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Création...' : 'Créer le groupe'}
            </button>
        </form>
    );
}
