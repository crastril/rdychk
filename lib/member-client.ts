import { createClient } from '@supabase/supabase-js';

export function createMemberClient(secret: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                'x-member-secret': secret
            }
        }
    });
}
