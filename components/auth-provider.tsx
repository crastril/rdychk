"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: { display_name: string | null; avatar_url: string | null; is_inferred?: boolean } | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null; is_inferred?: boolean } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            } catch (error) {
                console.error("Auth change error:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            // 1. Try to get existing profile
            const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', userId)
                .single();

            // 2. Identify if we need to sync from metadata
            const { data: { user } } = await supabase.auth.getUser();
            const meta = user?.user_metadata;

            const metaName = meta?.full_name || meta?.name || user?.email?.split('@')[0] || "Utilisateur";
            const metaAvatar = meta?.avatar_url;

            // If profile exists and has a name, we're good
            if (existingProfile?.display_name) {
                setProfile(existingProfile);
                return;
            }

            // 3. Auto-creation / Sync logic
            // If we have metadata but no profile (or profile has no name), upsert it
            if (metaName) {
                const newProfile = {
                    id: userId,
                    display_name: metaName,
                    avatar_url: metaAvatar,
                    updated_at: new Date().toISOString()
                };

                const { data: savedProfile, error: upsertError } = await supabase
                    .from('profiles')
                    .upsert(newProfile)
                    .select('display_name, avatar_url')
                    .single();

                if (!upsertError && savedProfile) {
                    setProfile(savedProfile);
                } else {
                    // Fallback to local state if DB update fails but we have meta
                    setProfile({ display_name: metaName, avatar_url: metaAvatar, is_inferred: true });
                }
            }
        } catch (err) {
            console.error("Unexpected error in fetchProfile:", err);
            setProfile({ display_name: "Utilisateur", avatar_url: null, is_inferred: true });
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
