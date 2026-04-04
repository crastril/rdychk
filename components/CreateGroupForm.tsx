'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CircleNotch, ArrowRight, PencilSimple } from '@phosphor-icons/react';
import { useAuth } from '@/components/auth-provider';
import { createSlug } from '@/lib/slug';

export default function CreateGroupForm() {
    const { user } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState<'remote' | 'in_person'>('in_person');
    const [knowsWhen, setKnowsWhen] = useState(false);
    const [knowsWhere, setKnowsWhere] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Dynamically toggle body theme class based on selection
    useEffect(() => {
        if (groupType === 'remote') {
            document.body.classList.add('theme-online');
        } else {
            document.body.classList.remove('theme-online');
        }
        return () => {
            document.body.classList.remove('theme-online');
        };
    }, [groupType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) return;

        setLoading(true);

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
                    type: groupType,
                    calendar_voting_enabled: !knowsWhen,
                    location_voting_enabled: !knowsWhere,
                });

            if (dbError) throw dbError;

        } catch (error: unknown) {
            console.error('Group creation failed:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : (error as any)?.message || (typeof error === 'object' ? JSON.stringify(error) : "Erreur inconnue");
            alert("Erreur lors de la création du groupe: " + errorMessage);
            setLoading(false);
            return;
        }

        try {
            router.push(`/group/${uniqueSlug}`);
        } catch (error: unknown) {
            const isAbortError = error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.name === 'AbortError');
            if (isAbortError) {
                return;
            }
            console.error('Navigation failed:', error);
            setLoading(false);
        }
    };

    const handleNoneCheck = () => {
        setKnowsWhen(false);
        setKnowsWhere(false);
    };

    const noneChecked = !knowsWhen && !knowsWhere;

    return (
        <form onSubmit={handleSubmit} className="space-y-5 relative">
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Nom du groupe</label>
                <div className="relative">
                    <input
                        className="w-full h-12 rounded-xl glass-input px-4 pl-11 text-base placeholder-slate-500 transition-all focus:border-[var(--v2-primary)]"
                        placeholder={groupType === 'remote' ? "Ex: Raid WoW, Soirée Ranked..." : "Ex: Soirée au bar, restaurant viet..."}
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <PencilSimple className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Type d'activité</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                    <label className="cursor-pointer relative">
                        <input
                            className="peer sr-only"
                            name="group-type"
                            type="radio"
                            checked={groupType === 'remote'}
                            onChange={() => setGroupType('remote')}
                            disabled={loading}
                        />
                        <div className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-slate-400 peer-checked:bg-white/10 peer-checked:text-white transition-all">
                            <span className="text-lg">🎮</span> En Ligne
                        </div>
                    </label>
                    <label className="cursor-pointer relative">
                        <input
                            className="peer sr-only"
                            name="group-type"
                            type="radio"
                            checked={groupType === 'in_person'}
                            onChange={() => setGroupType('in_person')}
                            disabled={loading}
                        />
                        <div className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-slate-400 peer-checked:bg-white/10 peer-checked:text-white transition-all">
                            <span className="text-lg">📍</span> En Personne
                        </div>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                    Vous savez déjà…
                </label>
                <div className="space-y-2">
                    {/* On sait quand */}
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3 cursor-pointer hover:bg-white/6 transition-colors select-none">
                        <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${knowsWhen ? 'bg-[var(--v2-primary)] border-[var(--v2-primary)]' : 'border-white/20 bg-transparent'}`}
                            onClick={() => {
                                setKnowsWhen(v => !v);
                            }}
                        >
                            {knowsWhen && <span className="text-white text-[11px] font-black">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => setKnowsWhen(v => !v)}>
                            <p className="text-sm font-bold text-white/80">On sait quand</p>
                            <p className="text-[11px] text-white/35">Pas besoin de voter pour la date</p>
                        </div>
                        <span className="text-xl shrink-0">📅</span>
                    </label>

                    {/* On sait où */}
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3 cursor-pointer hover:bg-white/6 transition-colors select-none">
                        <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${knowsWhere ? 'bg-[var(--v2-primary)] border-[var(--v2-primary)]' : 'border-white/20 bg-transparent'}`}
                            onClick={() => setKnowsWhere(v => !v)}
                        >
                            {knowsWhere && <span className="text-white text-[11px] font-black">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => setKnowsWhere(v => !v)}>
                            <p className="text-sm font-bold text-white/80">On sait où</p>
                            <p className="text-[11px] text-white/35">Pas besoin de voter pour le lieu</p>
                        </div>
                        <span className="text-xl shrink-0">📍</span>
                    </label>

                    {/* Aucun des deux */}
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/8 bg-white/3 cursor-pointer hover:bg-white/6 transition-colors select-none">
                        <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${noneChecked ? 'bg-[var(--v2-primary)] border-[var(--v2-primary)]' : 'border-white/20 bg-transparent'}`}
                            onClick={handleNoneCheck}
                        >
                            {noneChecked && <span className="text-white text-[11px] font-black">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0" onClick={handleNoneCheck}>
                            <p className="text-sm font-bold text-white/80">Aucun des deux</p>
                            <p className="text-[11px] text-white/35">On va voter pour la date et le lieu</p>
                        </div>
                        <span className="text-xl shrink-0">🗳️</span>
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="w-full h-14 bg-[var(--v2-primary)] shadow-neon-primary text-white font-extrabold text-lg rounded-xl transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 group hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <CircleNotch className="w-6 h-6 animate-spin" />
                ) : (
                    <>
                        C'est parti !
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    );
}
