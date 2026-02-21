import { createClient } from '@supabase/supabase-js';

// Fallback to avoid crash during build or if variables are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'implicit',
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true
    }
});


