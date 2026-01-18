import { useEffect, useState } from 'react';
import CreateGroupForm from '@/components/CreateGroupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, History as HistoryIcon, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GroupHistoryModal } from '@/components/GroupHistoryModal';

export default function Home() {
  const { user } = useAuth();
  const [lastGroup, setLastGroup] = useState<{ name: string; slug: string; joined_at: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    async function fetchLastGroup() {
      if (!user) return;

      const { data } = await supabase
        .from('members')
        .select(`
          joined_at,
          groups (
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.groups) {
        setLastGroup({
          name: data.groups.name,
          slug: data.groups.slug,
          joined_at: data.joined_at
        });
      }
    }

    fetchLastGroup();
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <main className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold">
            rdychk
          </h1>
          <p className="text-lg text-muted-foreground">
            Sync Status, Instantly
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Créer un groupe</CardTitle>
            <CardDescription>
              Lancez un nouveau groupe et partagez le lien avec vos amis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateGroupForm />
          </CardContent>
        </Card>

        {/* History Section */}
        {user && (
          <div className="space-y-4 animate-slide-up">
            {lastGroup && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Reprendre</h3>
                <Link href={`/group/${lastGroup.slug}`}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer group border-primary/20">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">
                            {lastGroup.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rejoint le {new Date(lastGroup.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </CardContent>
                  </Card>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => setHistoryOpen(true)}
            >
              <HistoryIcon className="w-4 h-4" />
              Voir tout l'historique
            </Button>

            <GroupHistoryModal open={historyOpen} onOpenChange={setHistoryOpen} />
          </div>
        )}

      </main>
    </div>
  );
}
