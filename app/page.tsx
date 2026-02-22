'use client';

import { useEffect, useState } from 'react';
import CreateGroupForm from '@/components/CreateGroupForm';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { GroupHistoryModal } from '@/components/GroupHistoryModal';
import { ChevronRight, Clock, Gamepad2, MapPin } from 'lucide-react';
import { AuthButton } from '@/components/auth-button';

const HERO_MESSAGES = [
  "Go ?",
  "On y va à quelle heure ?",
  "T'es déjà parti ?",
  "On se retrouve à quelle heure ?",
  "On avait pas dit 19h ?",
  "T'es où ?",
  "T'as vu mon message ?",
  "Je peux partir ?",
  "T'as lu les message sur le groupe ?",
  "T'es loin ?",
  "T'arrives à quelle heure ?",
  "T'es en route ?",
];

export default function Home() {
  const { user } = useAuth();
  const [lastGroup, setLastGroup] = useState<{ name: string; slug: string; joined_at: string; type: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [heroText, setHeroText] = useState("T'es prêt ?");

  useEffect(() => {
    // Randomize hero text on mount to avoid hydration mismatch
    const randomMessage = HERO_MESSAGES[Math.floor(Math.random() * HERO_MESSAGES.length)];
    setHeroText(randomMessage);
  }, []);

  useEffect(() => {
    async function fetchLastGroup() {
      if (!user) return;
      const { data } = await supabase
        .from('members')
        .select(`
          joined_at,
          groups (
            name,
            slug,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.groups) {
        const groupData = Array.isArray(data.groups) ? data.groups[0] : data.groups;
        if (groupData) {
          setLastGroup({
            name: groupData.name,
            slug: groupData.slug,
            type: groupData.type,
            joined_at: data.joined_at
          });
        }
      }
    }
    fetchLastGroup();
  }, [user]);

  return (
    <div className="bg-background-dark text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-[var(--v2-primary)]/30 relative">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-[var(--v2-primary)]/5 rounded-full blur-[150px] transition-colors duration-700"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--v2-primary)]/5 rounded-full blur-[120px] transition-colors duration-700"></div>
      </div>

      <nav className="w-full flex justify-between items-center py-6 px-6 md:px-12 relative z-20">
        <div className="flex items-center gap-1 group cursor-pointer">
          <span className="text-2xl font-black tracking-tighter text-white">rdychk</span>
          <div className="w-2 h-2 rounded-full bg-[var(--v2-primary)] mt-2 shadow-[0_0_10px_var(--v2-primary)] transition-all duration-500"></div>
        </div>
        <div className="flex items-center gap-6">
          <a className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block" href="#">Fonctionnalités</a>
          <a className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block" href="#">À propos</a>
          <AuthButton className="text-sm font-medium border-white/10 hover:bg-white/5 transition-all" />
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 py-12">
        <div className="text-center max-w-4xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--v2-primary)]/10 border border-[var(--v2-primary)]/20 text-[var(--v2-primary)] text-xs font-bold uppercase tracking-widest mb-6 transition-all duration-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-primary)] animate-pulse"></span>
            Beta Publique
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Arrêtez de demander<br />
            <span className="text-theme-gradient">"{heroText}"</span>
          </h1>
        </div>

        <div className="w-full max-w-[480px]">
          <div className="glass-panel rounded-3xl p-8 shadow-2xl flex flex-col gap-6 transform hover:scale-[1.01] transition-transform duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Créer un groupe</h2>
            </div>

            <CreateGroupForm />

          </div>
        </div>

        {/* History Section */}
        {user && (
          <div className="mt-16 w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Groupes Récents</h3>
              <button onClick={() => setHistoryOpen(true)} className="text-xs text-slate-400 hover:text-white transition-colors">Tout voir</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastGroup ? (
                <Link href={`/group/${lastGroup.slug}`} className="block">
                  <div className="glass-panel p-4 rounded-xl flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-colors border-l-4 border-l-transparent hover:border-l-[var(--v2-primary)]">
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 ring-1 ring-white/10 group-hover:ring-[var(--v2-primary)] transition-all">
                      {lastGroup.type === 'remote' ? <Gamepad2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm group-hover:text-white transition-colors">{lastGroup.name}</h4>
                      <p className="text-slate-500 text-xs">Rejoint le {new Date(lastGroup.joined_at).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-all" />
                  </div>
                </Link>
              ) : (
                <div className="text-slate-500 text-sm px-2">Aucun groupe récent.</div>
              )}
            </div>
          </div>
        )}

      </main>

      <footer className="w-full py-8 text-center text-slate-600 text-sm relative z-10">
        <p>© 2024 ReadyCheck. Designed for chaos coordination.</p>
      </footer>

      <GroupHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
