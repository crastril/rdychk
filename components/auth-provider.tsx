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
            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
                console.error("Error fetching profile:", error);
            }

            // Fallback to user metadata if profile is missing
            if (!data || !data.display_name) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata) {
                    setProfile({
                        display_name: data?.display_name || user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || "Utilisateur",
                        avatar_url: data?.avatar_url || user.user_metadata.avatar_url,
                    });
                    return;
                }
            }
            setProfile(data);
        } catch (err) {
            console.error("Unexpected error in fetchProfile:", err);
            // Non-blocking fallback
            setProfile({ display_name: "Utilisateur", avatar_url: null });
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
