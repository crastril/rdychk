'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icons } from './Icons';

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
            <label htmlFor="group-name-input" className="sr-only">
                Nom du groupe
            </label>
            <input
                id="group-name-input"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nom du groupe (ex: Soirée vendredi)"
                className="w-full px-6 py-4 text-lg bg-slate-700 border-2 border-slate-600 rounded-2xl
                 text-slate-50 placeholder-slate-400
                 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50
                 transition-all"
                disabled={loading}
                maxLength={50}
                required
            />

            <button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="w-full px-6 py-4 text-xl font-bold text-white
                 bg-gradient-to-r from-violet-500 to-blue-500
                 rounded-2xl
                 hover:from-violet-600 hover:to-blue-600
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-300 transform active:scale-95
                 shadow-lg hover:shadow-xl hover:shadow-violet-500/30
                 flex items-center justify-center gap-2"
                aria-label="Créer le groupe"
            >
                {loading ? (
                    <>
                        <Icons.Loader className="w-5 h-5" />
                        Création...
                    </>
                ) : (
                    <>
                        Créer le groupe
                        <Icons.Sparkles className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>
    );
}
